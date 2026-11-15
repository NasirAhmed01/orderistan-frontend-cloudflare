import { useState } from "react";
import { Link } from "react-router-dom";
import api, { ROOT, errMsg, thumb } from "../api";
import { AreaChart, BarChart, Donut, Meter } from "../charts";
import { Empty, Icon, PageHead, Spinner, Stat, confirmBox, fmtTime, money, toast, useGet, waLink } from "../ui";
import { catLabel } from "../pricing";

export function Customers() {
  const [q, setQ] = useState(""); const d = useGet("/seller/customers", { q });
  return (
    <>
      <PageHead title="Customers" sub="Everyone who ordered or booked with you." />
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="users">No customers yet.</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Customer</th><th>Orders</th><th>Bookings</th><th>Spent</th><th>Last activity</th><th /></tr></thead><tbody>
          {d.data.items.map((c) => <tr key={c.id}><td><b>{c.name}</b><br /><small className="muted">{c.phone}</small></td><td>{c.orders}</td><td>{c.bookings}</td><td><b>{money(c.spent)}</b></td><td className="nowrap">{fmtTime(c.last)}</td>
            <td>{waLink(c.phone, `Hello ${c.name}!`) && <a className="btn sm" href={waLink(c.phone, `Hello ${c.name}!`)} target="_blank" rel="noreferrer"><Icon n="chat" /> WhatsApp</a>}</td></tr>)}</tbody></table></div>)}
    </>
  );
}

export function Analytics() {
  const [days, setDays] = useState(30); const d = useGet("/seller/analytics", { days });
  if (d.loading && !d.data) return <Spinner />;
  const a = d.data; if (!a) return <Empty icon="alert">Could not load analytics.</Empty>;
  const stat = [["pending", "#f59e0b"], ["confirmed", "#3b82f6"], ["preparing", "#8b5cf6"], ["out_for_delivery", "#06b6d4"], ["delivered", "#16a34a"], ["cancelled", "#ef4444"]];
  return (
    <>
      <PageHead title="Sales analytics" sub="Revenue and orders excluding cancelled orders."><div className="seg">{[7, 30, 90].map((n) => <button key={n} className={days === n ? "on" : ""} onClick={() => setDays(n)}>{n} days</button>)}</div></PageHead>
      <div className="stats"><Stat icon="dollar" label="Revenue" value={money(a.revenue)} tone="green" /><Stat icon="bag" label="Orders" value={a.orders} tone="blue" /><Stat icon="trending" label="Average order" value={money(a.avgOrder)} /></div>
      <div className="card"><div className="card-h"><h3>Revenue per day</h3></div><AreaChart data={a.series.map((x) => ({ day: x.day, value: x.revenue }))} format={(n) => (n >= 1000 ? Math.round(n / 1000) + "k" : n)} label="Revenue per day" /></div>
      <div className="dash-grid eq">
        <div className="card"><div className="card-h"><h3>Best sellers</h3></div>{a.top.length === 0 ? <p className="muted">No sales in this period.</p> : a.top.map((t, i) => <div className="list-row" key={t._id || i}><div><b>{t.name}</b><small className="muted">{t.qty} sold</small></div><b>{money(t.revenue)}</b></div>)}</div>
        <div className="card"><div className="card-h"><h3>Orders by status</h3></div><Donut parts={stat.map(([k, c]) => ({ label: k === "preparing" ? "processing" : k.replace(/_/g, " "), value: a.byStatus[k] || 0, color: c })).filter((x) => x.value)} />{!Object.keys(a.byStatus).length && <p className="muted">No orders yet.</p>}</div>
      </div>
      <div className="card"><div className="card-h"><h3>Orders per day</h3></div><BarChart height={150} data={a.series.slice(-Math.min(a.series.length, 31)).map((x) => ({ label: x.day.slice(8), value: x.orders }))} /></div>
    </>
  );
}

export function Images() {
  const d = useGet("/seller/images");
  const rm = async (i) => {
    if (!(await confirmBox({ title: "Remove this image?", body: `It will be deleted from “${i.name}”.`, ok: "Remove", danger: true }))) return;
    try { await api.delete("/seller/images", { data: { product: i.product, url: i.url } }); toast("Image removed."); d.reload(); } catch (e) { toast(errMsg(e), "err"); }
  };
  if (d.loading && !d.data) return <Spinner />;
  const u = d.data?.usage;
  return (
    <>
      <PageHead title="Image management" sub="All photos in your store. Replace or add photos from each item's editor." />
      {u && <div className="card"><Meter value={u.images} max={u.imageCap} label={`${u.plan.name} plan images`} sub={`${u.images} / ${u.imageCap}`} /><small className="muted">Remaining capacity: {u.imagesLeft} images · {u.plan.maxImages} per item.</small></div>}
      {!d.data?.items?.length ? <Empty icon="image">No images uploaded yet. Add photos when you create an item.</Empty> : <div className="img-grid">{d.data.items.map((i) => (
        <figure key={i.url}><img src={thumb(i.url, 300)} alt={i.name} loading="lazy" /><figcaption><b>{i.name}</b><small className="muted">{i.kind === "color" ? "Colour: " + i.color : "Gallery"}</small></figcaption><button className="btn sm danger ghost" onClick={() => rm(i)} aria-label="Remove image"><Icon n="trash" /></button></figure>))}</div>}
    </>
  );
}

export function Preview() {
  const st = useGet("/seller/stats"); const s = st.data?.store;
  if (!s) return <Spinner />;
  const path = `/s/${s.slug}`, link = `https://${s.slug}.${ROOT}`;
  return (
    <>
      <PageHead title="Store preview" sub="Exactly what your customers see on their phone."><a className="btn primary" href={path} target="_blank" rel="noreferrer"><Icon n="link" /> Open in new tab</a></PageHead>
      {!s.live && <div className="banner warn"><Icon n="alert" /><div>Your store is not live yet, so customers see a “closed” page. The preview below shows the same.</div></div>}
      <div className="preview-wrap"><div className="phone"><iframe title="Store preview" src={path} /></div>
        <div className="card"><h3>Share your store</h3><p className="muted">Put this link in your Instagram bio and stories.</p><code style={{ wordBreak: "break-all" }}>{link}</code>
          <div className="row wrap-gap" style={{ marginTop: 12 }}><button className="btn" onClick={() => navigator.clipboard?.writeText(link).then(() => toast("Link copied."))}><Icon n="copy" /> Copy link</button><Link className="btn" to="/seller/settings"><Icon n="sliders" /> Branding</Link></div>
          <p className="muted" style={{ marginBottom: 0 }}>Layout: <b>{catLabel(s.category)}</b></p></div></div>
    </>
  );
}
