import { useMemo } from "react";
import { Field, Icon } from "../ui";

// Category-specific parts of the product form. Each editor edits one plain `o` object that is sent to the server as JSON.
const Tog = ({ on, set, label }) => <label className="tog" title={label}><input type="checkbox" checked={on !== false} onChange={(e) => set(e.target.checked)} /><i /><span className="sr">{label}</span></label>;
const upd = (arr, i, patch) => arr.map((x, k) => (k === i ? { ...x, ...patch } : x));
const del = (arr, i) => arr.filter((_, k) => k !== i);

export function DealEditor({ o, set, percentOnly }) {
  const d = o.deal || { kind: "" };
  const put = (patch) => set({ ...o, deal: { ...d, ...patch } });
  return (
    <div className="card flat"><h4 style={{ marginTop: 0 }}><Icon n="gift" /> Deals &amp; discounts</h4>
      <div className="grid2">
        <Field label="Deal type"><select value={d.kind || ""} onChange={(e) => put({ kind: e.target.value })}><option value="">No deal</option><option value="percent">Percentage discount</option>
          {!percentOnly && <><option value="bogo">Buy 1 Get 1 Free</option><option value="combo">Combo offer</option></>}</select></Field>
        {d.kind === "percent" && <Field label="Discount (%)"><input type="number" min="1" max="90" value={d.value || ""} onChange={(e) => put({ value: e.target.value })} /></Field>}
        {d.kind && <Field label="Badge text (optional)"><input maxLength={40} value={d.label || ""} placeholder={d.kind === "bogo" ? "Buy 1 Get 1 Free" : d.kind === "combo" ? "Family combo" : "Weekend sale"} onChange={(e) => put({ label: e.target.value })} /></Field>}
      </div>
      {d.kind === "combo" && <Field label="What is included? (one item per line)"><textarea rows={3} value={(d.items || []).join("\n")} onChange={(e) => put({ items: e.target.value.split("\n") })} placeholder={"1 Large pizza\n2 Drinks\nFries"} /></Field>}
    </div>
  );
}

export function FoodEditor({ o, set }) {
  const sizes = o.sizes || [], addons = o.addons || [];
  const quick = ["Small", "Medium", "Large", "XL"].filter((n) => !sizes.some((s) => s.name === n));
  return (
    <>
      <div className="card flat"><div className="card-h"><h4 style={{ margin: 0 }}><Icon n="utensils" /> Sizes &amp; prices</h4>
        <div className="row wrap-gap">{quick.map((n) => <button type="button" key={n} className="chip" onClick={() => set({ ...o, sizes: [...sizes, { name: n, price: "", enabled: true }] })}>+ {n}</button>)}
          <button type="button" className="chip" onClick={() => set({ ...o, sizes: [...sizes, { name: "", price: "", enabled: true }] })}>+ Custom</button></div></div>
        {sizes.length === 0 ? <p className="muted">No sizes: customers order the item at its base price.</p> : sizes.map((s, i) => (
          <div className="erow" key={i}><input aria-label="Size name" placeholder="Size" value={s.name} onChange={(e) => set({ ...o, sizes: upd(sizes, i, { name: e.target.value }) })} />
            <input aria-label="Price" type="number" min="0" placeholder="Price" value={s.price} onChange={(e) => set({ ...o, sizes: upd(sizes, i, { price: e.target.value }) })} />
            <Tog on={s.enabled} label="Available" set={(v) => set({ ...o, sizes: upd(sizes, i, { enabled: v }) })} />
            <button type="button" className="btn sm danger ghost" aria-label="Remove size" onClick={() => set({ ...o, sizes: del(sizes, i) })}><Icon n="trash" /></button></div>))}</div>
      <div className="card flat"><div className="card-h"><h4 style={{ margin: 0 }}>Toppings &amp; add-ons</h4>
        <button type="button" className="chip" onClick={() => set({ ...o, addons: [...addons, { name: "", price: 0, group: "Toppings", enabled: true }] })}>+ Add option</button></div>
        {addons.length === 0 ? <p className="muted">Extra cheese, sauces, drinks... customers can tick these and the extra charge is added.</p> : addons.map((a, i) => (
          <div className="erow a3" key={i}><select aria-label="Group" value={a.group} onChange={(e) => set({ ...o, addons: upd(addons, i, { group: e.target.value }) })}>{["Toppings", "Add-ons", "Sauces", "Drinks", "Sides"].map((g) => <option key={g}>{g}</option>)}</select>
            <input aria-label="Option name" placeholder="e.g. Extra cheese" value={a.name} onChange={(e) => set({ ...o, addons: upd(addons, i, { name: e.target.value }) })} />
            <input aria-label="Extra charge" type="number" min="0" placeholder="+ Rs" value={a.price} onChange={(e) => set({ ...o, addons: upd(addons, i, { price: e.target.value }) })} />
            <Tog on={a.enabled} label="Available" set={(v) => set({ ...o, addons: upd(addons, i, { enabled: v }) })} />
            <button type="button" className="btn sm danger ghost" aria-label="Remove option" onClick={() => set({ ...o, addons: del(addons, i) })}><Icon n="trash" /></button></div>))}</div>
      <DealEditor o={o} set={set} />
    </>
  );
}

// ---- clothing --------------------------------------------------------------------------------------------------------------------------
// Keeps one variant row for every enabled size x colour, keeping what the seller already typed.
export function syncVariants(o) {
  const sizes = (o.sizeChart?.rows || []).map((r) => r.size).filter(Boolean), colors = (o.colors || []).map((c) => c.name).filter(Boolean);
  const S = sizes.length ? sizes : [""], C = colors.length ? colors : [""], old = new Map((o.variants || []).map((v) => [v.size + "|" + v.color, v]));
  if (!sizes.length && !colors.length) return [];
  return S.flatMap((s) => C.map((c) => old.get(s + "|" + c) || { size: s, color: c, sku: "", stock: "", price: "", enabled: true }));
}
export function ClothingEditor({ o, set, colorFiles, setColorFiles }) {
  const chart = o.sizeChart || { unit: "in", columns: [], rows: [] }, colors = o.colors || [];
  const put = (patch) => { const n = { ...o, ...patch }; n.variants = syncVariants(n); set(n); };
  const setChart = (c) => put({ sizeChart: { ...chart, ...c } });
  const setCols = (columns, rows) => setChart({ columns, rows: rows || chart.rows });
  const preset = () => setChart({ columns: ["Chest", "Length", "Shoulder"], rows: [["S", 36, 27, 16], ["M", 38, 28, 17], ["L", 40, 29, 18], ["XL", 42, 30, 19]].map(([size, ...v]) => ({ size, enabled: true, values: v.map(String) })) });
  const variants = useMemo(() => o.variants || [], [o.variants]);
  const setVar = (v, patch) => set({ ...o, variants: variants.map((x) => (x.size === v.size && x.color === v.color ? { ...x, ...patch } : x)) });
  const pickFile = (i, f) => { if (!f) return; setColorFiles({ ...colorFiles, [i]: f }); };
  return (
    <>
      <Field label="SKU (optional)"><input value={o.sku || ""} maxLength={40} onChange={(e) => set({ ...o, sku: e.target.value })} /></Field>
      <div className="card flat"><div className="card-h"><h4 style={{ margin: 0 }}><Icon n="ruler" /> Size chart for this product</h4>
        <div className="row wrap-gap"><div className="seg" role="group" aria-label="Unit">{[["in", "Inches"], ["cm", "Centimetres"]].map(([u, l]) => <button type="button" key={u} className={chart.unit === u ? "on" : ""} onClick={() => setChart({ unit: u })}>{l}</button>)}</div>
          <button type="button" className="chip" onClick={preset}>Use sample (S-XL)</button></div></div>
        <div className="table-wrap"><table className="table sc-edit"><thead><tr><th>On</th><th>Size</th>
          {chart.columns.map((c, ci) => <th key={ci}><div className="row"><input aria-label="Measurement name" value={c} onChange={(e) => setCols(chart.columns.map((x, k) => (k === ci ? e.target.value : x)))} /><button type="button" className="x" aria-label="Remove column" onClick={() => setCols(del(chart.columns, ci), chart.rows.map((r) => ({ ...r, values: del(r.values, ci) })))}>&times;</button></div></th>)}
          <th><button type="button" className="chip" disabled={chart.columns.length >= 8} onClick={() => setCols([...chart.columns, "New"], chart.rows.map((r) => ({ ...r, values: [...r.values, ""] })))}>+ Column</button></th></tr></thead>
          <tbody>{chart.rows.map((r, ri) => <tr key={ri}><td><Tog on={r.enabled} label="Size available" set={(v) => setChart({ rows: upd(chart.rows, ri, { enabled: v }) })} /></td>
            <td><input className="w60" aria-label="Size" value={r.size} onChange={(e) => setChart({ rows: upd(chart.rows, ri, { size: e.target.value }) })} /></td>
            {chart.columns.map((c, ci) => <td key={ci}><input className="w60" inputMode="decimal" aria-label={c} value={r.values[ci] || ""} onChange={(e) => setChart({ rows: upd(chart.rows, ri, { values: chart.columns.map((_, k) => (k === ci ? e.target.value : r.values[k] || "")) }) })} /></td>)}
            <td><button type="button" className="btn sm danger ghost" aria-label="Remove size" onClick={() => setChart({ rows: del(chart.rows, ri) })}><Icon n="trash" /></button></td></tr>)}</tbody></table></div>
        <button type="button" className="chip" disabled={chart.rows.length >= 16} onClick={() => setChart({ rows: [...chart.rows, { size: "", enabled: true, values: chart.columns.map(() => "") }] })}>+ Add size</button></div>
      <div className="card flat"><div className="card-h"><h4 style={{ margin: 0 }}><Icon n="palette" /> Colours</h4>
        <button type="button" className="chip" disabled={colors.length >= 12} onClick={() => put({ colors: [...colors, { name: "", hex: "#222222", image: "", enabled: true }] })}>+ Add colour</button></div>
        {colors.length === 0 ? <p className="muted">Add colours so customers can pick one. Each colour can have its own photo.</p> : colors.map((c, i) => (
          <div className="erow c5" key={i}><input type="color" aria-label="Colour" value={c.hex} onChange={(e) => put({ colors: upd(colors, i, { hex: e.target.value }) })} />
            <input aria-label="Colour name" placeholder="e.g. Midnight blue" value={c.name} onChange={(e) => put({ colors: upd(colors, i, { name: e.target.value }) })} />
            <label className="filebtn">{colorFiles[i] || c.image ? <img alt="" src={colorFiles[i] ? URL.createObjectURL(colorFiles[i]) : c.image} /> : <Icon n="image" />}<input type="file" accept="image/*" onChange={(e) => pickFile(i, e.target.files[0])} /></label>
            <Tog on={c.enabled} label="Colour available" set={(v) => put({ colors: upd(colors, i, { enabled: v }) })} />
            <button type="button" className="btn sm danger ghost" aria-label="Remove colour" onClick={() => { const f = { ...colorFiles }; delete f[i]; setColorFiles(Object.fromEntries(Object.entries(f).map(([k, v]) => [+k > i ? +k - 1 : k, v]))); put({ colors: del(colors, i) }); }}><Icon n="trash" /></button></div>))}</div>
      {variants.length > 0 && <div className="card flat"><h4 style={{ marginTop: 0 }}><Icon n="layers" /> Stock &amp; SKU for every size / colour</h4>
        <p className="muted" style={{ marginTop: 0 }}>Leave stock empty if you do not track it. A price above 0 overrides the product price for that combination.</p>
        <div className="table-wrap"><table className="table"><thead><tr><th>On</th><th>Size</th><th>Colour</th><th>SKU</th><th>Stock</th><th>Price</th></tr></thead><tbody>
          {variants.map((v) => <tr key={v.size + "|" + v.color}><td><Tog on={v.enabled} label="Combination available" set={(x) => setVar(v, { enabled: x })} /></td><td>{v.size || "-"}</td><td>{v.color || "-"}</td>
            <td><input className="w90i" aria-label="SKU" value={v.sku || ""} onChange={(e) => setVar(v, { sku: e.target.value })} /></td>
            <td><input className="w60" type="number" min="0" aria-label="Stock" value={v.stock ?? ""} onChange={(e) => setVar(v, { stock: e.target.value })} /></td>
            <td><input className="w60" type="number" min="0" aria-label="Price override" value={v.price || ""} onChange={(e) => setVar(v, { price: e.target.value })} /></td></tr>)}</tbody></table></div></div>}
      <DealEditor o={o} set={set} percentOnly />
    </>
  );
}

export function ServiceEditor({ o, set }) {
  const packs = o.packages || [], addons = o.addons || [];
  return (
    <>
      <div className="card flat"><h4 style={{ marginTop: 0 }}><Icon n="calendar" /> Booking</h4>
        <div className="grid2"><Field label="How do customers get this service?"><select value={o.bookingMode || "booking"} onChange={(e) => set({ ...o, bookingMode: e.target.value })}>
          <option value="booking">Booking enabled - customers pick a date and time</option><option value="request">Request only - customers send a request form</option></select></Field>
          <Field label="Duration (minutes)"><input type="number" min="0" value={o.duration ?? ""} onChange={(e) => set({ ...o, duration: e.target.value })} /></Field></div></div>
      <div className="card flat"><div className="card-h"><h4 style={{ margin: 0 }}>Packages</h4><button type="button" className="chip" onClick={() => set({ ...o, packages: [...packs, { name: "", price: "", duration: "", description: "", enabled: true }] })}>+ Add package</button></div>
        {packs.length === 0 ? <p className="muted">Optional: offer Basic / Standard / Premium versions of this service.</p> : packs.map((p, i) => (
          <div className="pack-row" key={i}><div className="erow a4"><input aria-label="Package name" placeholder="Package name" value={p.name} onChange={(e) => set({ ...o, packages: upd(packs, i, { name: e.target.value }) })} />
            <input aria-label="Price" type="number" min="0" placeholder="Price" value={p.price} onChange={(e) => set({ ...o, packages: upd(packs, i, { price: e.target.value }) })} />
            <input aria-label="Minutes" type="number" min="0" placeholder="Minutes" value={p.duration} onChange={(e) => set({ ...o, packages: upd(packs, i, { duration: e.target.value }) })} />
            <Tog on={p.enabled} label="Available" set={(v) => set({ ...o, packages: upd(packs, i, { enabled: v }) })} />
            <button type="button" className="btn sm danger ghost" aria-label="Remove package" onClick={() => set({ ...o, packages: del(packs, i) })}><Icon n="trash" /></button></div>
            <input aria-label="Description" placeholder="What is included?" value={p.description} onChange={(e) => set({ ...o, packages: upd(packs, i, { description: e.target.value }) })} /></div>))}</div>
      <div className="card flat"><div className="card-h"><h4 style={{ margin: 0 }}>Add-ons</h4><button type="button" className="chip" onClick={() => set({ ...o, addons: [...addons, { name: "", price: 0, enabled: true }] })}>+ Add-on</button></div>
        {addons.length === 0 ? <p className="muted">Optional extras customers can add to their booking.</p> : addons.map((a, i) => (
          <div className="erow" key={i}><input aria-label="Add-on name" placeholder="e.g. Home visit" value={a.name} onChange={(e) => set({ ...o, addons: upd(addons, i, { name: e.target.value }) })} />
            <input aria-label="Price" type="number" min="0" placeholder="+ Rs" value={a.price} onChange={(e) => set({ ...o, addons: upd(addons, i, { price: e.target.value }) })} />
            <Tog on={a.enabled} label="Available" set={(v) => set({ ...o, addons: upd(addons, i, { enabled: v }) })} />
            <button type="button" className="btn sm danger ghost" aria-label="Remove add-on" onClick={() => set({ ...o, addons: del(addons, i) })}><Icon n="trash" /></button></div>))}</div>
    </>
  );
}
