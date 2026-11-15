import axios from "axios";

export const ROOT = import.meta.env.VITE_ROOT_DOMAIN || "orderistan.site";
// Company details used everywhere (footer, contact, legal pages, emails link). Change here once.
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || "orderistan@gmail.com";
export const SITE_URL = `https://${ROOT}`;
// nasirkitchen.orderistan.site -> "nasirkitchen"; also nasirkitchen.localhost for local testing
export function hostSlug() {
  const h = location.hostname.toLowerCase();
  if (h.endsWith("." + ROOT)) { const s = h.slice(0, -ROOT.length - 1); return s !== "www" && !s.includes(".") ? s : null; }
  if (h.endsWith(".localhost")) return h.split(".")[0];
  return null;
}
export const storeUrl = (slug) => `https://${slug}.${ROOT}`;

let storeSlug = null;
export const setStoreSlug = (s) => { storeSlug = s; };

const api = axios.create({ baseURL: (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "") + "/api" }) // VITE_API_URL = your Vercel backend, e.g. https://orderistan-api.vercel.app;
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("orderistan_token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  if (storeSlug) c.headers["X-Store-Slug"] = storeSlug;
  return c;
});
api.interceptors.response.use(
  (r) => {
    // password change revokes old sessions and returns a fresh token for this one
    if (r.config.url === "/auth/password" && r.data?.token) localStorage.setItem("orderistan_token", r.data.token);
    return r;
  },
  (e) => {
    const url = e.config?.url || "";
    if (e.response?.status === 401 && !url.startsWith("/auth/login") && localStorage.getItem("orderistan_token")) {
      localStorage.removeItem("orderistan_token");
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(e);
  }
);
// Cloudinary delivers the full 2000px photo by default. Ask for a smaller copy in lists/cards (saves mobile data and Cloudinary credits).
// Works on URLs stored by the backend (".../upload/f_auto,q_auto/..."); anything else is returned unchanged.
export const thumb = (u, w = 400) => (typeof u === "string" ? u.replace("/upload/f_auto,q_auto/", `/upload/f_auto,q_auto,w_${w},c_limit/`) : u);
export const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong.";
export default api;
