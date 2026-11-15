import { useEffect, useMemo, useState } from "react";
import { Icon, Modal, money } from "../ui";
import { dealText, lineOf, stockOf, unitOf, variantOf } from "../pricing";

// The customer-facing "choose your options" panels. They are used by the real storefronts AND by the seller's live preview
// (preview = true turns the add button into a harmless demo), so what the seller sees is exactly what customers get.
export function Qty({ value, onChange, max = 99 }) {
  return (
    <div className="qtyb" role="group" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => onChange(Math.max(1, value - 1))}>-</button>
      <b aria-live="polite">{value}</b>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

export function FoodConfigurator({ p, onAdd, preview, cta = "Add to cart" }) {
  const sizes = p.sizes || [], addons = p.addons || [];
  const [size, setSize] = useState(sizes[0]?.name || ""); const [picked, setPicked] = useState([]); const [qty, setQty] = useState(1);
  useEffect(() => { if (!sizes.some((s) => s.name === size)) setSize(sizes[0]?.name || ""); setPicked((x) => x.filter((n) => addons.some((a) => a.name === n))); }, [p.sizes, p.addons]); // eslint-disable-line
  const sel = { size, addons: picked }, total = lineOf(p, sel, qty), plain = unitOf(p, sel) * qty;
  const groups = useMemo(() => { const g = {}; addons.forEach((a) => { (g[a.group || "Toppings"] ||= []).push(a); }); return Object.entries(g); }, [addons]);
  const toggle = (n) => setPicked((x) => (x.includes(n) ? x.filter((i) => i !== n) : [...x, n]));
  const dt = dealText(p);
  return (
    <div className="cfg">
      {dt && <div className="deal-note"><Icon n="gift" /> <b>{dt}</b>{p.deal?.kind === "bogo" && <span> - add 2 or more, every second one is free</span>}{p.deal?.kind === "combo" && (p.deal.items || []).length > 0 && <span> - includes {(p.deal.items || []).join(", ")}</span>}</div>}
      {sizes.length > 0 && <fieldset className="cfg-sec"><legend>Choose size</legend>
        <div className="opt-grid">{sizes.map((s) => <button type="button" key={s.name} className={"opt" + (size === s.name ? " on" : "")} aria-pressed={size === s.name} onClick={() => setSize(s.name)}><b>{s.name}</b><span>{money(s.price)}</span></button>)}</div></fieldset>}
      {groups.map(([g, list]) => <fieldset className="cfg-sec" key={g}><legend>{g} <small>optional</small></legend>
        <div className="chk-list">{list.map((a) => <label key={a.name} className={"chk" + (picked.includes(a.name) ? " on" : "")}><input type="checkbox" checked={picked.includes(a.name)} onChange={() => toggle(a.name)} /><span>{a.name}</span><em>{a.price > 0 ? "+" + money(a.price) : "Free"}</em></label>)}</div></fieldset>)}
      <div className="cfg-buy"><Qty value={qty} onChange={setQty} />
        <button type="button" className="btn brand lg grow" onClick={() => (preview ? null : onAdd(sel, qty))} disabled={p.inStock === false}>
          <Icon n="cart" /> {cta} · {money(total)}{total < plain && <s>{money(plain)}</s>}</button></div>
      {preview && <small className="muted">Preview only - this is how customers will see it.</small>}
    </div>
  );
}

// Which sizes / colours can still be bought, given the other choice and the stock the seller entered.
function availability(p, size, color) {
  const vs = p.variants || [];
  const ok = (v) => v && v.enabled !== false && (v.stock === null || v.stock === undefined || v.stock > 0);
  const sizeOk = (s) => !vs.length || vs.some((v) => v.size === s && (!color || v.color === color) && ok(v));
  const colorOk = (c) => !vs.length || vs.some((v) => v.color === c && (!size || v.size === size) && ok(v));
  return { sizeOk, colorOk };
}
export function ClothingConfigurator({ p, onAdd, preview, onColor, cta = "Add to cart" }) {
  const rows = p.sizeChart?.rows || [], colors = p.colors || [];
  const [size, setSize] = useState(""); const [color, setColor] = useState(""); const [qty, setQty] = useState(1); const [chart, setChart] = useState(false); const [err, setErr] = useState("");
  useEffect(() => { if (size && !rows.some((r) => r.size === size)) setSize(""); if (color && !colors.some((c) => c.name === color)) setColor(""); }, [p.sizeChart, p.colors]); // eslint-disable-line
  const { sizeOk, colorOk } = availability(p, size, color);
  const pick = (c) => { setColor(c); setErr(""); onColor?.(c); };
  const v = variantOf(p, size, color), left = stockOf(p, size, color);
  const need = (rows.length && !size) ? "Please choose a size." : (colors.length && !color) ? "Please choose a colour." : "";
  const soldOut = (p.variants || []).length ? (v ? v.stock === 0 : false) : left === 0;
  const total = lineOf(p, { size, color }, qty);
  const add = () => { if (preview) return; if (need) return setErr(need); onAdd({ size, color }, qty); };
  return (
    <div className="cfg">
      {rows.length > 0 && <fieldset className="cfg-sec"><legend>Size {size && <small>{size}</small>}<button type="button" className="linkish" onClick={() => setChart(true)}><Icon n="ruler" /> View size chart</button></legend>
        <div className="size-grid">{rows.map((r) => { const dis = !sizeOk(r.size); return <button type="button" key={r.size} disabled={dis} className={"sz" + (size === r.size ? " on" : "")} aria-pressed={size === r.size} onClick={() => { setSize(r.size); setErr(""); }}>{r.size}</button>; })}</div></fieldset>}
      {colors.length > 0 && <fieldset className="cfg-sec"><legend>Colour {color && <small>{color}</small>}</legend>
        <div className="sw-grid">{colors.map((c) => { const dis = !colorOk(c.name); return <button type="button" key={c.name} disabled={dis} title={c.name + (dis ? " - unavailable" : "")} aria-label={c.name} aria-pressed={color === c.name} className={"sw" + (color === c.name ? " on" : "")} onClick={() => pick(c.name)}><i style={{ background: c.hex }} /></button>; })}</div></fieldset>}
      <div className="avail">{soldOut ? <span className="red-t"><Icon n="x" /> Out of stock</span> : left !== null && left !== undefined && left <= 5 ? <span className="amber-t"><Icon n="alert" /> Only {left} left</span> : <span className="green-t"><Icon n="check" /> In stock</span>}</div>
      {err && <div className="banner warn" role="alert"><Icon n="alert" /><div>{err}</div></div>}
      <div className="cfg-buy"><Qty value={qty} onChange={setQty} max={left !== null && left !== undefined && left > 0 ? left : 99} />
        <button type="button" className="btn brand lg grow" disabled={soldOut || p.inStock === false} onClick={add}><Icon n="cart" /> {cta} · {money(total)}</button></div>
      {preview && <small className="muted">Preview only - this is how customers will see it.</small>}
      {chart && <SizeChartModal p={p} onClose={() => setChart(false)} />}
    </div>
  );
}

export function SizeChartModal({ p, onClose }) {
  const c = p.sizeChart || {}, rows = c.rows || [];
  return (
    <Modal title={`Size chart - ${p.name}`} onClose={onClose} wide>
      {rows.length === 0 ? <p className="muted">The seller has not added a size chart for this item.</p> : <>
        <div className="table-wrap"><table className="table sc"><thead><tr><th>Size</th>{(c.columns || []).map((h) => <th key={h}>{h} ({c.unit === "cm" ? "cm" : "in"})</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.size}><td><b>{r.size}</b></td>{(c.columns || []).map((h, i) => <td key={h}>{r.values?.[i] || "-"}</td>)}</tr>)}</tbody></table></div>
        <p className="muted" style={{ marginBottom: 0 }}>Measurements are in {c.unit === "cm" ? "centimetres" : "inches"}. If you are between sizes, choose the larger one.</p></>}
    </Modal>
  );
}
