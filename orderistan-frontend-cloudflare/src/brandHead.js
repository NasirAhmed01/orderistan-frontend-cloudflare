import { useEffect } from "react";

// Per-store browser identity.
//  * On orderistan.site the tab shows the Orderistan logo + favicon (set in index.html).
//  * Inside a seller store (name.orderistan.site or /s/name) the tab, "add to home screen" icon, theme colour and share card
//    use THAT store's own logo and name. A store with no logo gets a clean letter icon in its theme colour.
//  * Leaving the store restores the Orderistan defaults.

const ICON_SEL = 'link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"],link[rel="manifest"]';
let defaults = null;
const meta = (key, attr = "name") => document.head.querySelector(`meta[${attr}="${key}"]`);
const setMeta = (key, val, attr = "name") => {
  let m = meta(key, attr);
  if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); }
  m.setAttribute("content", val || "");
};

const snapshot = () => {
  if (defaults) return;
  defaults = {
    title: document.title,
    links: [...document.head.querySelectorAll(ICON_SEL)].map((l) => l.cloneNode(true)),
    metas: ["theme-color", "description"].map((k) => [k, "name", meta(k)?.content]).concat(["og:title", "og:description", "og:image", "og:site_name", "og:url"].map((k) => [k, "property", meta(k, "property")?.content]))
  };
};

// Square PNG of the seller's logo from Cloudinary (padded, never cropped). Other hosts are used as they are.
const square = (u, n) => (typeof u === "string" ? u.replace("/upload/f_auto,q_auto/", `/upload/f_png,q_auto,w_${n},h_${n},c_pad/`) : u);

const letterIcon = (name, color) => {
  const ch = (String(name || "S").trim()[0] || "S").toUpperCase().replace(/[<>&"']/g, "S");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${color || "#e4572e"}"/><text x="32" y="44" font-family="Arial,Helvetica,sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="#fff">${ch}</text></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
};

const addLink = (rel, href, extra = {}) => {
  const l = document.createElement("link"); l.rel = rel; l.href = href; l.setAttribute("data-store-brand", "1");
  Object.entries(extra).forEach(([k, v]) => l.setAttribute(k, v)); document.head.appendChild(l); return l;
};

const restore = () => {
  if (!defaults) return;
  document.head.querySelectorAll(ICON_SEL).forEach((l) => l.remove());
  defaults.links.forEach((l) => document.head.appendChild(l.cloneNode(true)));
  defaults.metas.forEach(([k, a, v]) => { if (v !== undefined) setMeta(k, v, a); });
  document.title = defaults.title;
};

export function useBrandHead(store, base = "") {
  useEffect(() => {
    if (!store) return undefined;
    snapshot();
    let manifestUrl = null; let dead = false;
    const color = store.themeColor || "#e4572e";
    const fallback = letterIcon(store.name, color);
    const apply = (icon, touch) => {
      document.head.querySelectorAll(ICON_SEL).forEach((l) => l.remove());
      addLink("icon", icon, { type: icon.startsWith("data:image/svg") ? "image/svg+xml" : "image/png" });
      addLink("apple-touch-icon", touch || icon);
      try {
        const mf = { name: store.name, short_name: String(store.name).slice(0, 12), start_url: location.origin + (base || "/"), scope: location.origin + (base || "/"), display: "standalone", background_color: "#ffffff", theme_color: color, icons: [{ src: touch || icon, sizes: "192x192", type: "image/png" }] };
        manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(mf)], { type: "application/manifest+json" }));
        addLink("manifest", manifestUrl);
      } catch { /* manifest is optional */ }
    };
    document.title = store.tagline ? `${store.name} - ${store.tagline}` : store.name;
    setMeta("theme-color", color);
    setMeta("description", store.tagline || store.description?.slice(0, 150) || `${store.name} - order online on Orderistan.`);
    setMeta("og:title", store.name, "property"); setMeta("og:site_name", store.name, "property");
    setMeta("og:description", store.tagline || `Order from ${store.name} on Orderistan.`, "property");
    setMeta("og:url", location.origin + (base || "/"), "property");
    const share = store.logo || store.banner; if (share) setMeta("og:image", share, "property");
    if (store.logo) {
      // use the seller's logo; if the image cannot load, fall back to the letter icon
      const probe = new Image();
      probe.onload = () => { if (!dead) apply(square(store.logo, 64), square(store.logo, 192)); };
      probe.onerror = () => { if (!dead) apply(fallback); };
      probe.src = square(store.logo, 64);
      apply(fallback); // shown instantly while the logo loads
    } else apply(fallback);
    return () => { dead = true; if (manifestUrl) URL.revokeObjectURL(manifestUrl); restore(); };
  }, [store?.slug, store?.name, store?.logo, store?.themeColor, store?.tagline, base]); // eslint-disable-line react-hooks/exhaustive-deps
}
