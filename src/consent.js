// Cookie consent engine (no UI here - the banner and preference centre are in CookieConsent.jsx).
//
//  * The visitor's choice is kept in ONE first-party cookie, "orderistan_consent". On orderistan.site it is set for the whole
//    domain (.orderistan.site) so a choice made on the main site also applies to every seller store (nasirkitchen.orderistan.site).
//  * Nothing optional is switched on before the visitor says yes. Every choice is also logged on the server as proof (POST /api/consent).
//  * The choice expires after 12 months, or sooner when CONSENT_VERSION changes (for example when you add a new category).
//
// How to add a real analytics / marketing tool later (Google Analytics, Meta Pixel ...): load its script ONLY through runWhenAllowed:
//
//    import { runWhenAllowed } from "./consent";
//    runWhenAllowed("analytics", () => { const s = document.createElement("script"); s.async = true; s.src = "https://..."; document.head.appendChild(s); });
//
// It runs right away if the visitor already agreed, otherwise the moment they agree, and never if they refuse.
import { useEffect, useState } from "react";
import api, { ROOT } from "./api";

export const CONSENT_VERSION = "1";
export const COOKIE_NAME = "orderistan_consent";
const MAX_AGE = 60 * 60 * 24 * 365;   // seconds (12 months)
const EVT = "orderistan:consent", EVT_OPEN = "orderistan:cookie-settings";

export const CATEGORIES = [
  { key: "necessary", locked: true, title: "Strictly necessary",
    desc: "Needed for the website to work: keeping you signed in, remembering your cart, keeping your saved delivery addresses and remembering your cookie choice. These cannot be switched off.",
    examples: ["Sign-in session", "Shopping cart", "Saved delivery addresses", "Your cookie choice"] },
  { key: "preferences", title: "Preferences",
    desc: "Remember how you like the website to look, such as light or dark mode, so you do not have to set it again on every visit.",
    examples: ["Light / dark mode"] },
  { key: "analytics", title: "Analytics and performance",
    desc: "Help us understand how visitors use Orderistan (pages visited, speed, errors) so we can fix problems and improve your shopping experience. Data is used in aggregated form wherever possible.",
    examples: ["Traffic and page statistics", "Error and speed monitoring"] },
  { key: "marketing", title: "Marketing and personalization",
    desc: "Used to personalize content and show offers, products and stores that are more relevant to you, and to measure how well they work.",
    examples: ["Personalized recommendations", "Offer and campaign measurement"] }
];

// ---- cookie helpers
const readCookie = (n) => { const m = document.cookie.split("; ").find((x) => x.startsWith(n + "=")); return m ? m.slice(n.length + 1) : ""; };
const domainAttr = () => { const h = location.hostname.toLowerCase(); return h === ROOT || h.endsWith("." + ROOT) ? `; Domain=.${ROOT}` : ""; };
const writeCookie = (n, v) => { document.cookie = `${n}=${v}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}${domainAttr()}`; };
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

let mem = null;   // fallback when the browser blocks cookies: the choice then lasts until the tab is closed
const valid = (o) => o && o.v === CONSENT_VERSION && o.ts && Date.now() - o.ts < MAX_AGE * 1000 && o.c;

export function getConsent() {
  try { const raw = readCookie(COOKIE_NAME); if (raw) { const o = JSON.parse(decodeURIComponent(raw)); if (valid(o)) return o; } } catch { /* fall through */ }
  return valid(mem) ? mem : null;
}
export const allows = (cat) => cat === "necessary" || !!getConsent()?.c?.[cat];

// Removes data that belongs to a category the visitor has switched off.
function cleanup(c) {
  if (!c.preferences) { try { localStorage.removeItem("orderistan_mode"); } catch { /* ignore */ } }
}

export function setConsent(choices, action = "custom") {
  const prev = getConsent();
  const c = { preferences: !!choices.preferences, analytics: !!choices.analytics, marketing: !!choices.marketing };
  const rec = { v: CONSENT_VERSION, ts: Date.now(), id: prev?.id || newId(), c };
  mem = rec; writeCookie(COOKIE_NAME, encodeURIComponent(JSON.stringify(rec)));
  cleanup(c);
  window.dispatchEvent(new CustomEvent(EVT, { detail: rec }));
  api.post("/consent", { cid: rec.id, version: rec.v, choices: c, action }).catch(() => { /* the proof log must never block the visitor */ });
  return rec;
}
export const acceptAll = () => setConsent({ preferences: true, analytics: true, marketing: true }, "accept_all");
export const rejectAll = () => setConsent({ preferences: false, analytics: false, marketing: false }, "reject_all");

export const openCookieSettings = () => window.dispatchEvent(new Event(EVT_OPEN));
export const onOpenSettings = (fn) => { window.addEventListener(EVT_OPEN, fn); return () => window.removeEventListener(EVT_OPEN, fn); };

export function useConsent() {
  const [c, setC] = useState(getConsent);
  useEffect(() => { const h = () => setC(getConsent()); window.addEventListener(EVT, h); return () => window.removeEventListener(EVT, h); }, []);
  return c;
}

// Run fn now if the category is allowed, otherwise as soon as it becomes allowed. Returns an "unsubscribe" function.
export function runWhenAllowed(cat, fn) {
  if (allows(cat)) { fn(); return () => {}; }
  const h = () => { if (allows(cat)) { window.removeEventListener(EVT, h); fn(); } };
  window.addEventListener(EVT, h); return () => window.removeEventListener(EVT, h);
}

// localStorage for the "preferences" category: reads nothing and writes nothing unless the visitor allowed it.
export const prefGet = (k) => { if (!allows("preferences")) return null; try { return localStorage.getItem(k); } catch { return null; } };
export const prefSet = (k, v) => { if (!allows("preferences")) return; try { localStorage.setItem(k, v); } catch { /* ignore */ } };
