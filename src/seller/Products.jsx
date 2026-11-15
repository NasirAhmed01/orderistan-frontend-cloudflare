import { useEffect, useMemo, useState } from "react";
import api, { errMsg, thumb } from "../api";
import { Badge, Empty, Field, Icon, Modal, PageHead, Pager, Spinner, confirmBox, money, toast, useGet } from "../ui";
import { Meter } from "../charts";
import { dealText, fmtMins, fromPrice, offPct } from "../pricing";
import { ClothingConfigurator, FoodConfigurator } from "../store/configurators";
import { ClothingEditor, FoodEditor, ServiceEditor, syncVariants } from "./editors";

const WORDS = { food: ["Food item", "Food items", "Menu"], clothing: ["Clothing item", "Clothing items", "Collection"], services: ["Service", "Services", "Services"], "": ["Product", "Products", "Products"] };

export default function Products({ category = "" }) {
  const [q, setQ] = useState(""); const [page, setPage] = useState(1); const [edit, setEdit] = useState(null);
  const d = useGet("/seller/products", { q, page }); const use = useGet("/seller/usage");
  const [one, many] = WORDS[category] || WORDS[""], u = use.data, full = u && u.products >= u.productCap;
  const del = async (p) => {
    if (!(await confirmBox({ title: `Delete "${p.name}"?`, body: "Its photos are removed too. Past orders keep their own copy of the item.", ok: "Delete", danger: true }))) return;
    try { await api.delete("/seller/products/" + p._id); toast("Deleted."); d.reload(); use.reload(); } catch (e) { toast(errMsg(e), "err"); }
  };
  const refresh = () => { d.reload(); use.reload(); };
  return (
    <>
      <PageHead title={many} sub={category === "services" ? "Everything customers can book or request." : "Everything customers can buy from your store."}>
        <button className="btn primary" disabled={full} onClick={() => setEdit({})}><Icon n="plus" /> Add {one.toLowerCase()}</button></PageHead>
      {u && <div className="card usage-bar"><div className="grid2">
        <Meter value={u.products} max={u.productCap} label={`${u.plan.name} plan - ${many.toLowerCase()}`} sub={`${u.products} / ${u.productCap}`} />
        <Meter value={u.images} max={u.imageCap} label={`Images (${u.plan.maxImages} per item)`} sub={`${u.images} / ${u.imageCap}`} /></div>
        {full && <div className="banner warn" style={{ margin: "12px 0 0" }}><Icon n="alert" /><div>You have used all {u.productCap} {many.toLowerCase()} in your {u.plan.name} plan. Contact Orderistan to upgrade.</div></div>}</div>}
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder={`Search ${many.toLowerCase()}`} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="box">{q ? "Nothing matches your search." : `No ${many.toLowerCase()} yet. Add your first one.`}</Empty> : (
        <div className="pgrid">{d.data.items.map((p) => (
          <div className="pcard" key={p._id}><div className="pimg">{p.images[0] ? <img src={thumb(p.images[0], 300)} alt="" loading="lazy" decoding="async" /> : <span><Icon n="image" /> No image</span>}
            {dealText(p) && <span className="pbadge">{dealText(p)}</span>}</div>
            <div className="pinfo"><b>{p.name}</b><span className="price">{p.sizes?.length ? "from " : ""}{money(fromPrice(p))}{p.comparePrice > p.price && <s>{money(p.comparePrice)}</s>}</span>
              <small className="muted">{[p.category, category === "services" && p.duration ? fmtMins(p.duration) : "", category === "clothing" && p.sizeChart?.rows?.length ? p.sizeChart.rows.length + " sizes" : "", p.colors?.length ? p.colors.length + " colours" : "", p.stock != null ? p.stock + " in stock" : ""].filter(Boolean).join(" · ")}</small>
              <div className="row wrap-gap" style={{ gap: 6 }}>{!p.active && <Badge v="inactive">hidden</Badge>} {!p.inStock && <Badge v="rejected">{category === "services" ? "unavailable" : "out of stock"}</Badge>}{p.active && p.inStock && <Badge v="active">live</Badge>}{category === "services" && <Badge v={p.bookingMode === "request" ? "request" : "booking"}>{p.bookingMode === "request" ? "request only" : "bookable"}</Badge>}</div>
              <div className="row" style={{ marginTop: 6 }}><button className="btn sm grow" onClick={() => setEdit(p)}><Icon n="edit" /> Edit</button><button className="btn sm danger ghost" onClick={() => del(p)} aria-label="Delete"><Icon n="trash" /></button></div></div></div>))}</div>)}
      <Pager data={d.data} onPage={setPage} />
      {edit && <ProductForm p={edit} category={category} use={u} onClose={() => setEdit(null)} done={() => { setEdit(null); refresh(); }} />}
    </>
  );
}

const blankChart = { unit: "in", columns: [], rows: [] };
function initOptions(p, category) {
  return { stock: p.stock ?? "", sku: p.sku || "", sizes: p.sizes || [], addons: p.addons || [], deal: p.deal || { kind: "" }, sizeChart: p.sizeChart?.rows ? { unit: p.sizeChart.unit, columns: p.sizeChart.columns || [], rows: p.sizeChart.rows } : blankChart,
    colors: p.colors || [], variants: p.variants || [], duration: p.duration || "", bookingMode: p.bookingMode || "booking", packages: p.packages || [] };
}
const nz = (v) => (v === "" || v == null ? 0 : Number(v) || 0);

function ProductForm({ p, category, use, onClose, done }) {
  const [f, setF] = useState({ name: p.name || "", price: p.price ?? "", comparePrice: p.comparePrice || "", category: p.category || (category === "services" ? "General services" : "General"), description: p.description || "", inStock: p.inStock ?? true, active: p.active ?? true });
  const [o, setO] = useState(() => initOptions(p, category)); const [colorFiles, setColorFiles] = useState({});
  const [keep, setKeep] = useState(p.images || []); const [files, setFiles] = useState([]); const [busy, setBusy] = useState(false);
  const cats = useGet("/seller/categories");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const maxImg = use?.plan?.maxImages || 5;
  const colorImgs = (o.colors || []).filter((c, i) => c.image || colorFiles[i]).length;
  const room = Math.max(0, maxImg - keep.length - colorImgs);
  useEffect(() => { if (files.length > room) setFiles((x) => x.slice(0, room)); }, [room]); // eslint-disable-line
  const urls = useMemo(() => files.map((x) => URL.createObjectURL(x)), [files]);
  const preview = { ...p, name: f.name || "Item name", price: nz(f.price), comparePrice: nz(f.comparePrice), description: f.description, inStock: f.inStock, images: [...keep, ...urls],
    stock: o.stock === "" ? null : nz(o.stock), deal: { ...o.deal, value: nz(o.deal?.value) },
    sizes: (o.sizes || []).filter((s) => s.enabled !== false && s.name).map((s) => ({ ...s, price: nz(s.price) })), addons: (o.addons || []).filter((a) => a.enabled !== false && a.name).map((a) => ({ ...a, price: nz(a.price) })),
    sizeChart: { ...o.sizeChart, rows: (o.sizeChart?.rows || []).filter((r) => r.enabled !== false && r.size) },
    colors: (o.colors || []).filter((c) => c.enabled !== false && c.name).map((c, i) => ({ ...c, image: colorFiles[i] ? URL.createObjectURL(colorFiles[i]) : c.image })),
    variants: (o.variants || []).filter((v) => v.enabled !== false).map((v) => ({ ...v, stock: v.stock === "" || v.stock == null ? null : nz(v.stock), price: nz(v.price) })), packages: (o.packages || []).filter((x) => x.enabled !== false && x.name).map((x) => ({ ...x, price: nz(x.price) })) };
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.append(k, v)); fd.append("keepImages", JSON.stringify(keep));
      const colors = (o.colors || []).map((c, i) => ({ ...c, newImage: !!colorFiles[i] }));
      colors.forEach((c, i) => { if (colorFiles[i]) fd.append("colorImages", colorFiles[i]); });
      fd.append("options", JSON.stringify({ ...o, colors, variants: syncVariants({ ...o, colors }) }));
      files.slice(0, room).forEach((x) => fd.append("images", x));
      p._id ? await api.put("/seller/products/" + p._id, fd) : await api.post("/seller/products", fd);
      toast("Saved."); done();
    } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const [one] = WORDS[category] || WORDS[""];
  return (
    <Modal title={p._id ? `Edit ${one.toLowerCase()}` : `Add ${one.toLowerCase()}`} onClose={onClose} xl>
      <form onSubmit={save} className="pf">
        <div className="pf-main">
          <div className="grid2"><Field label="Name"><input required maxLength={120} value={f.name} onChange={set("name")} /></Field>
            <Field label={category === "services" ? "Service category" : "Category"}><input list="cats" maxLength={40} value={f.category} onChange={set("category")} /><datalist id="cats">{(cats.data?.items || []).map((c) => <option key={c} value={c} />)}</datalist></Field>
            <Field label={category === "food" ? "Base price (Rs, used when no sizes)" : category === "services" ? "Starting price (Rs)" : "Price (Rs)"}><input type="number" min="0" required value={f.price} onChange={set("price")} /></Field>
            <Field label="Old price (optional, shows discount)"><input type="number" min="0" value={f.comparePrice} onChange={set("comparePrice")} /></Field></div>
          <Field label="Description"><textarea rows={3} maxLength={2000} value={f.description} onChange={set("description")} /></Field>
          <Field label={`Photos - ${keep.length + files.length} of ${Math.max(0, maxImg - colorImgs)} (${use?.plan?.name || "plan"} allows ${maxImg} per item, colour photos included)`}>
            <input type="file" accept="image/*" multiple disabled={room === 0} onChange={(e) => setFiles([...e.target.files].slice(0, room))} /></Field>
          {(keep.length > 0 || urls.length > 0) && <div className="thumbs">{keep.map((i) => <div key={i}><img src={i} alt="" /><button type="button" className="x" aria-label="Remove photo" onClick={() => setKeep(keep.filter((k) => k !== i))}>&times;</button></div>)}{urls.map((u) => <div key={u}><img src={u} alt="" /></div>)}</div>}
          {category === "food" && <FoodEditor o={o} set={setO} />}
          {category === "clothing" && <ClothingEditor o={o} set={setO} colorFiles={colorFiles} setColorFiles={setColorFiles} />}
          {category === "services" && <ServiceEditor o={o} set={setO} />}
          <div className="grid2"><Field label={category === "services" ? "Capacity (optional)" : "Stock quantity (empty = not tracked)"}><input type="number" min="0" disabled={category === "clothing" && (o.variants || []).length > 0} value={o.stock} onChange={(e) => setO({ ...o, stock: e.target.value })} /></Field>
            <div className="end row wrap-gap" style={{ gap: 22 }}><label className="check"><input type="checkbox" checked={f.inStock} onChange={set("inStock")} /> {category === "services" ? "Available" : "In stock"}</label>
              <label className="check"><input type="checkbox" checked={f.active} onChange={set("active")} /> Visible in store</label></div></div>
          <div className="row wrap-gap"><button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button><button type="button" className="btn" onClick={onClose}>Cancel</button></div>
        </div>
        <aside className="pf-prev"><div className="prev-h"><Icon n="eye" /> Live preview <small className="muted">what customers see</small></div>
          <div className="prev-card">
            <div className="prev-img">{preview.images[0] ? <img src={preview.images[0].startsWith("blob:") ? preview.images[0] : thumb(preview.images[0], 600)} alt="" /> : <span><Icon n="image" /></span>}
              {(offPct(preview) > 0 || dealText(preview)) && <span className="pbadge">{dealText(preview) || `-${offPct(preview)}%`}</span>}</div>
            <div className="prev-b"><h3>{preview.name}</h3><div className="price lg">{money(fromPrice(preview))}{preview.comparePrice > preview.price && <s>{money(preview.comparePrice)}</s>}</div>
              {preview.description && <p className="muted pre">{preview.description.slice(0, 140)}</p>}
              {category === "food" && <FoodConfigurator p={preview} preview />}
              {category === "clothing" && <ClothingConfigurator p={preview} preview />}
              {category === "services" && <div className="cfg"><div className="svc-meta"><span><Icon n="clock" /> {o.duration ? fmtMins(+o.duration) : "Flexible"}</span><Badge v={o.bookingMode === "request" ? "request" : "booking"}>{o.bookingMode === "request" ? "Request a quote" : "Instant booking"}</Badge></div>
                {preview.packages.map((x) => <div className="pk" key={x.name}><div><b>{x.name}</b><small>{x.description}</small></div><span>{money(x.price)}</span></div>)}
                <button type="button" className="btn brand lg block">{o.bookingMode === "request" ? "Send request" : "Book now"}</button><small className="muted">Preview only</small></div>}
            </div></div></aside>
      </form>
    </Modal>
  );
}
