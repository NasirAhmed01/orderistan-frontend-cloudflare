// Price helpers shared by the three storefronts and the seller live previews.
// The server recalculates every price at checkout with the same rules (backend/shop.js), so this is for display only.
export const CATS = { food: "Food & Restaurant", clothing: "Clothing & Fashion", services: "Services" };
export const catLabel = (c) => CATS[c] || "Not chosen yet";
export const itemWord = (c) => (c === "services" ? "service" : "product");

// Unit price BEFORE any deal: base price, chosen size price, add-ons, variant override.
export function unitOf(p, sel = {}) {
  let unit = p.price;
  if (p.sizes?.length && sel.size) { const s = p.sizes.find((x) => x.name === sel.size); if (s) unit = s.price; }
  const v = (p.variants || []).find((x) => x.size === (sel.size || "") && x.color === (sel.color || ""));
  if (v && v.price > 0) unit = v.price;
  for (const n of sel.addons || []) { const a = (p.addons || []).find((x) => x.name === n); if (a) unit += a.price; }
  return unit;
}
// Total for qty units with the product's deal applied.
export function lineOf(p, sel = {}, qty = 1) {
  const unit = unitOf(p, sel), d = p.deal || {};
  if (d.kind === "percent" && d.value > 0) return Math.round(unit * qty * (1 - d.value / 100));
  if (d.kind === "bogo") return unit * (qty - Math.floor(qty / 2));
  return unit * qty;
}
export const dealText = (p) => {
  const d = p.deal || {};
  if (d.kind === "percent" && d.value > 0) return d.label || `${d.value}% OFF`;
  if (d.kind === "bogo") return d.label || "Buy 1 Get 1 Free";
  if (d.kind === "combo") return d.label || "Combo deal";
  return "";
};
// "% off" shown on cards: seller's percent deal, otherwise the old-price discount
export const offPct = (p) => (p.deal?.kind === "percent" && p.deal.value > 0 ? p.deal.value : p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0);
// cheapest sellable price for "from Rs X" labels
export const fromPrice = (p) => {
  const base = [p.price, ...(p.sizes || []).map((s) => s.price)].filter((x) => x > 0);
  const lo = base.length ? Math.min(...base) : p.price;
  return p.deal?.kind === "percent" && p.deal.value > 0 ? Math.round(lo * (1 - p.deal.value / 100)) : lo;
};
// "Large, Extra cheese" style label of a cart / order line
export const lineLabel = (i) => [i.size, i.color, ...(i.addons || [])].filter(Boolean).join(" · ");
export const lineAmt = (i) => (i.lineTotal != null ? i.lineTotal : i.price * i.qty);
// stock helpers
export const variantOf = (p, size, color) => (p.variants || []).find((v) => v.size === (size || "") && v.color === (color || ""));
export const stockOf = (p, size, color) => { const v = variantOf(p, size, color); return v ? v.stock : p.stock ?? null; };
export const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fmtMins = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? " " + (m % 60) + "m" : ""}` : `${m} min`);
export const bytes = (n) => { n = Number(n) || 0; const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++; } return `${n.toFixed(n >= 100 || i === 0 ? 0 : 1)} ${u[i]}`; };
// ---- cart lines (storefront) --------------------------------------------------------------------------------------------------------------
// A cart line stores the unit price before the deal and the deal itself, so changing the quantity re-prices it correctly.
export const cartKey = (id, sel = {}) => [id, sel.size || "", sel.color || "", [...(sel.addons || [])].sort().join(",")].join("|");
export function cartTotal(i) {
  const unit = i.unit ?? i.price, d = i.deal || {};
  if (d.kind === "percent" && d.value > 0) return Math.round(unit * i.qty * (1 - d.value / 100));
  if (d.kind === "bogo") return unit * (i.qty - Math.floor(i.qty / 2));
  return unit * i.qty;
}
export const normCart = (list) => (Array.isArray(list) ? list : []).filter((i) => i && i.id).map((i) => ({ ...i, key: i.key || i.id, unit: i.unit ?? i.price }));

// Subscription request labels, shared by Seller > Subscription and Admin > Renewals
export const METHOD = { bank: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa" };
export const KIND = { activate: "Activation", renew: "Renewal", upgrade: "Upgrade", downgrade: "Plan change" };
export const STATE = { pending: "pending", approved: "verified", rejected: "rejected", cancelled: "cancelled" };
