import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import api, { ROOT, errMsg } from "../api";
import { AuthImage, Badge, Empty, Field, Icon, Modal, PageHead, Pager, Shell, Spinner, Stat, fmtDate, fmtTime, money, toast, useBadges, useGet, waLink, copyText } from "../ui";
import { useAuth } from "../auth";
import { Meter } from "../charts";
import { CATS, lineAmt, lineLabel } from "../pricing";
import Profile from "../pages/Profile";
import Products from "./Products";
import { Availability, BookingList, Calendar } from "./Bookings";
import { Analytics, Customers, Images, Preview } from "./Extras";
import Subscription from "./Subscription";
import { SellerChat } from "../chat/Chat";

// Seller dashboard - the menu, wording and tools change with the seller's business category
const WORD = { food: ["Food items", "Menu"], clothing: ["Clothing", "Collection"], services: ["Services", "Services"], "": ["Products", "Products"] };
function links(cat, chat = 0) {
  const [pw] = WORD[cat] || WORD[""], svc = cat === "services";
  return [
    { heading: "Store" },
    { to: "/seller", label: "Dashboard", icon: "grid", end: true },
    { to: "/seller/products", label: pw, icon: cat === "food" ? "utensils" : cat === "clothing" ? "shirt" : cat === "services" ? "briefcase" : "box" },
    { to: "/seller/orders", label: "Orders", icon: "bag", hidden: svc },
    ...(svc ? [{ to: "/seller/bookings", label: "Bookings", icon: "calendar" }, { to: "/seller/calendar", label: "Appointment calendar", icon: "clock" }, { to: "/seller/requests", label: "Customer requests", icon: "chat" }, { to: "/seller/availability", label: "Availability", icon: "sliders" }] : []),
    { to: "/seller/customers", label: "Customers", icon: "users" },
    { heading: "Insights" },
    { to: "/seller/analytics", label: "Sales analytics", icon: "chart" },
    { to: "/seller/images", label: "Image management", icon: "image" },
    { heading: "Account" },
    { to: "/seller/subscription", label: "Subscription", icon: "award" }, { to: "/seller/chat", label: "Chat with admin", icon: "chat", badge: chat }, { to: "/seller/preview", label: "Store preview", icon: "eye" },
    { to: "/seller/settings", label: "Store settings", icon: "sliders" }, { to: "/seller/profile", label: "Profile", icon: "user" }
  ];
}
export default function Seller() {
  const { store } = useAuth(); const info = useGet("/seller/stats"); const badges = useBadges(); const cat = info.data?.store?.category ?? store?.category ?? "";
  return (
    <Shell theme="seller" links={links(cat, badges.chat)}>
      <Routes>
        <Route index element={<Dashboard />} /><Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products category={cat} />} /><Route path="settings" element={<Settings />} />
        <Route path="bookings" element={<BookingList type="booking" />} /><Route path="requests" element={<BookingList type="request" />} />
        <Route path="calendar" element={<Calendar />} /><Route path="availability" element={<Availability />} />
        <Route path="customers" element={<Customers />} /><Route path="analytics" element={<Analytics />} /><Route path="images" element={<Images />} />
        <Route path="subscription" element={<Subscription />} /><Route path="chat" element={<SellerChat />} /><Route path="preview" element={<Preview />} /><Route path="profile" element={<Profile />} />
      </Routes>
    </Shell>
  );
}

const copy = (t) => copyText(t, "Link copied");

function Dashboard() {
  const { data, loading } = useGet("/seller/stats");
  if (loading && !data) return <Spinner />;
  if (!data) return <Empty icon="alert">Could not load your dashboard.</Empty>;
  const s = data.store, link = `https://${s.slug}.${ROOT}`;
  return (
    <>
      <PageHead title={s.name} sub="Here is how your store is doing today." />
      {!s.live && (
        <div className="banner warn"><Icon n="alert" /><div>
          {s.status === "pending" && <>Your store is waiting for activation. Once the admin activates your subscription it goes live for customers.</>}
          {s.status === "expired" && <>Your subscription has expired. Your store is closed to customers and you cannot process orders until it is renewed.</>}
          {s.status === "inactive" && <>Your store was deactivated by the administrator. Please contact Orderistan.</>}
          {s.status === "active" && <>Your subscription is not valid. Please contact Orderistan.</>}
          <br /><Link to="/seller/subscription">Open the Subscription page</Link> to pay and activate, or <Link to="/seller/chat">chat with the admin</Link>. You can still set up products and store settings meanwhile.
        </div></div>)}
      {s.live && s.daysLeft <= 7 && <div className="banner warn"><Icon n="clock" /><div>Your subscription ends in {s.daysLeft} day(s) ({fmtDate(s.subscription.endsAt)}). <Link to="/seller/subscription">Renew now</Link> or <Link to="/seller/chat">chat with the admin</Link>.</div></div>}
      <div className="card hero-card"><div><b style={{ fontSize: "1.05rem" }}>Your store link</b><br /><a href={link} target="_blank" rel="noreferrer">{link}</a>
        <br /><small className="muted">Preview without DNS: {location.origin}/s/{s.slug}</small></div>
        <div className="row wrap-gap"><button className="btn" onClick={() => copy(link)}><Icon n="copy" /> Copy link</button><a className="btn primary" href={link} target="_blank" rel="noreferrer"><Icon n="link" /> Open store</a></div></div>
      {!s.category && <div className="banner warn"><Icon n="alert" /><div><b>Choose your business category.</b> It unlocks the right tools (menu, size charts or bookings) and the matching storefront. <Link to="/seller/settings">Choose now</Link></div></div>}
      {data.usage && <div className="card usage-bar"><div className="card-h"><h3>{data.usage.plan.name} plan usage</h3><Link className="btn sm" to="/seller/subscription">Details</Link></div><div className="grid2">
        <Meter value={data.usage.products} max={data.usage.productCap} label={`${data.usage.plan.name} Plan - ${s.category === "services" ? "services" : "products"}`} sub={`${data.usage.products}/${data.usage.productCap}`} />
        <Meter value={data.usage.images} max={data.usage.imageCap} label="Images" sub={`${data.usage.images}/${data.usage.imageCap}`} /></div>
        <small className="muted">{data.usage.productsLeft} {s.category === "services" ? "services" : "products"} and {data.usage.imagesLeft} images remaining.</small></div>}
      <div className="stats">
        <Stat icon="shield" label="Subscription" value={<Badge v={s.status} />} /><Stat icon="award" label="Plan" value={s.subscription?.plan || "-"} />
        <Stat icon="clock" label="Ends on" value={fmtDate(s.subscription?.endsAt)} /><Stat icon="alert" label="Days left" value={s.live ? s.daysLeft : 0} tone={s.live && s.daysLeft > 7 ? "green" : "red"} />
        {s.category === "services" ? <><Stat icon="calendar" label="Bookings today" value={data.bookingsToday} tone="blue" /><Stat icon="clock" label="Waiting for you" value={data.bookingsPending} tone="amber" /></>
          : <><Stat icon="card" label="Payments to verify" value={data.toVerify} tone="amber" /><Stat icon="bag" label="New orders" value={data.newOrders} tone="blue" /><Stat icon="file" label="All orders" value={data.orders} /><Stat icon="dollar" label="Delivered sales" value={money(data.revenue)} tone="green" /></>}
        <Stat icon="box" label={s.category === "services" ? "Services" : "Products"} value={data.products} />
      </div>
      <div className="dash-grid">
        <div className="card"><div className="card-h"><h3>Recent orders</h3><Link className="btn sm" to="/seller/orders">View all</Link></div>
          {data.recent.length === 0 ? <p className="muted">No orders yet. Share your store link to get started.</p> :
            data.recent.map((o) => <div key={o._id} className="list-row"><div><b>{o.orderNo}</b><small className="muted">{o.info?.name}</small></div><div className="row"><b>{money(o.total)}</b><Badge v={o.status} /></div></div>)}</div>
        <div className="card"><div className="card-h"><h3>Quick actions</h3></div>
          <div className="quick">
            <Link to="/seller/products"><Icon n="plus" />Add {s.category === "services" ? "service" : "product"}</Link>{s.category === "services" ? <Link to="/seller/bookings"><Icon n="calendar" />Bookings</Link> : <Link to="/seller/orders"><Icon n="bag" />Manage orders</Link>}
            <Link to="/seller/settings"><Icon n="sliders" />Store settings</Link><Link to="/seller/profile"><Icon n="user" />My profile</Link>
          </div></div>
      </div>
    </>
  );
}

const STATUS_FLOW = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
const SLABEL = (s) => (s === "preparing" ? "processing" : s.replace(/_/g, " "));
function Orders() {
  const [f, setF] = useState({ q: "", status: "", paymentStatus: "" }); const [page, setPage] = useState(1); const [open, setOpen] = useState(null);
  const d = useGet("/seller/orders", { ...f, page });
  const upd = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  return (
    <>
      <PageHead title="Orders" sub="Verify payments and move orders through delivery." />
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Order no, name or phone" value={f.q} onChange={upd("q")} /></div>
        <select value={f.status} onChange={upd("status")}><option value="">All statuses</option>{["pending", ...STATUS_FLOW].map((s) => <option key={s} value={s}>{SLABEL(s)}</option>)}</select>
        <select value={f.paymentStatus} onChange={upd("paymentStatus")}><option value="">All payments</option><option value="submitted">Needs verification</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="cod">Cash on delivery</option></select></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="bag">No orders found.</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>
          {d.data.items.map((o) => (
            <tr key={o._id} className="click" onClick={() => setOpen(o._id)}><td><b>{o.orderNo}</b></td><td>{o.info?.name}<br /><small className="muted">{o.info?.phone}</small></td>
              <td><b>{money(o.total)}</b></td><td><Badge v={o.paymentStatus} /><br /><small className="muted">{o.paymentMethod}</small></td><td><Badge v={o.status} /></td><td className="nowrap">{fmtTime(o.createdAt)}</td></tr>))}
        </tbody></table></div>)}
      <Pager data={d.data} onPage={setPage} />
      {open && <OrderModal id={open} onClose={() => setOpen(null)} changed={d.reload} />}
    </>
  );
}

function OrderModal({ id, onClose, changed }) {
  const { data, reload } = useGet("/seller/orders/" + id); const o = data?.order;
  const [note, setNote] = useState(""); const [status, setStatus] = useState("confirmed"); const [busy, setBusy] = useState(false);
  const act = async (body, msg) => {
    setBusy(true);
    try { await api.patch("/seller/orders/" + id, { ...body, note }); toast(msg); setNote(""); await reload(); changed(); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const closed = o && ["delivered", "cancelled"].includes(o.status);
  return (
    <Modal title={o ? o.orderNo : "Order"} onClose={onClose} wide>
      {!o ? <Spinner /> : <>
        <div className="row wrap-gap" style={{ marginBottom: 12 }}><Badge v={o.status} /><Badge v={o.paymentStatus} /><span className="muted">via {o.paymentMethod} - {fmtTime(o.createdAt)}</span></div>
        <div className="card flat row between wrap-gap"><div><b>{o.info.name}</b> <span className="muted">- {o.info.phone}</span>
          <br />{o.info.address}{o.info.note && <><br /><i>Note: {o.info.note}</i></>}</div>
          {o.info.phone && <a className="btn sm" target="_blank" rel="noreferrer" href={waLink(o.info.phone, `Hello ${o.info.name}, this is regarding your order ${o.orderNo}.`)}><Icon n="chat" /> WhatsApp</a>}</div>
        <div className="card table-wrap flat"><table className="table"><tbody>{o.items.map((i, k) => <tr key={k}><td>{i.name}{lineLabel(i) && <><br /><small className="muted">{lineLabel(i)}</small></>}{i.deal && <> <Badge v="confirmed">{i.deal}</Badge></>}</td><td>x{i.qty}</td><td>{money(lineAmt(i))}</td></tr>)}
          <tr><td colSpan={2}>Delivery</td><td>{money(o.deliveryFee)}</td></tr>{o.codFee > 0 && <tr><td colSpan={2}>Cash on delivery fee</td><td>{money(o.codFee)}</td></tr>}<tr><td colSpan={2}><b>Total</b></td><td><b>{money(o.total)}</b></td></tr></tbody></table></div>
        {o.hasScreenshot && <><h4>Payment screenshot</h4><AuthImage url={`/orders/${o._id}/screenshot`} /></>}
        {o.paymentStatus === "submitted" && <div className="card flat"><b>Check the screenshot against your bank / JazzCash app, then:</b>
          <Field label="Note to customer (needed if rejecting)"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Amount does not match" /></Field>
          <div className="row wrap-gap"><button className="btn primary" disabled={busy} onClick={() => act({ action: "verify" }, "Payment verified.")}><Icon n="check" /> Payment received - verify</button>
            <button className="btn danger" disabled={busy} onClick={() => act({ action: "reject" }, "Payment rejected.")}>Reject</button></div></div>}
        {o.paymentStatus === "rejected" && <div className="banner warn"><Icon n="alert" /><div>Payment rejected{o.paymentNote ? `: ${o.paymentNote}` : ""}. Waiting for the customer to upload a new screenshot.</div></div>}
        {!closed && <div className="row wrap-gap"><select style={{ width: "auto" }} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_FLOW.map((s) => <option key={s} value={s}>{SLABEL(s)}</option>)}</select>
          <button className="btn" disabled={busy} onClick={() => act({ action: "status", status }, "Order updated.")}><Icon n="truck" /> Update status</button></div>}
        <h4>History</h4><ul className="timeline">{o.history.map((h, i) => <li key={i}><b>{h.status.replace(/_/g, " ")}</b> {h.note && <span className="muted">({h.note})</span>}<br /><small className="muted">{fmtTime(h.at)}</small></li>)}</ul></>}
    </Modal>
  );
}

const PAY = [["bank", "Bank account", "card"], ["jazzcash", "JazzCash", "phone"], ["easypaisa", "Easypaisa", "phone"], ["cod", "Cash on delivery", "wallet"]];
function Settings() {
  const { data, loading, reload } = useGet("/seller/store");
  if (loading && !data) return <Spinner />;
  if (!data?.store) return <Empty icon="alert">Could not load settings.</Empty>;
  return <SettingsForm s={data.store} reload={reload} />;
}
function SettingsForm({ s, reload }) {
  const [f, setF] = useState({ category: s.category || "", name: s.name, tagline: s.tagline, description: s.description, phone: s.phone, whatsapp: s.whatsapp, address: s.address, city: s.city,
    themeColor: s.themeColor, deliveryFee: s.deliveryFee, freeDeliveryOver: s.freeDeliveryOver, payment: s.payment || {} });
  const [imgs, setImgs] = useState({}); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const pay = (m, k) => (e) => setF({ ...f, payment: { ...f.payment, [m]: { ...(f.payment[m] || {}), [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value } } });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      await api.put("/seller/store", f);
      if (imgs.logo || imgs.banner) { const fd = new FormData(); if (imgs.logo) fd.append("logo", imgs.logo); if (imgs.banner) fd.append("banner", imgs.banner); await api.post("/seller/store/images", fd); setImgs({}); }
      toast("Store settings saved."); if (f.category !== (s.category || "")) { setTimeout(() => location.reload(), 600); return; } reload();
    } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save}>
      <PageHead title="Store settings" sub="Branding, delivery and how customers pay you."><button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button></PageHead>
      <div className="card"><div className="card-h"><h3>Store details</h3></div><div className="grid2">
        <Field label="Store name"><input required value={f.name} onChange={set("name")} /></Field><Field label="Tagline"><input value={f.tagline} onChange={set("tagline")} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set("phone")} /></Field><Field label="WhatsApp number" hint="Customers message this number after paying"><input value={f.whatsapp} onChange={set("whatsapp")} placeholder="03xx xxxxxxx" /></Field>
        <Field label="City"><input value={f.city} onChange={set("city")} /></Field><Field label="Address"><input value={f.address} onChange={set("address")} /></Field></div>
        <Field label="About your store"><textarea rows={3} value={f.description} onChange={set("description")} /></Field></div>
      <div className="card"><div className="card-h"><h3>Business category</h3></div>
        <div className="cat-pick">{Object.entries(CATS).map(([k, l]) => <button type="button" key={k} disabled={!!s.category && s.category !== k} className={"cat-opt" + (f.category === k ? " on" : "")} onClick={() => setF({ ...f, category: k })} aria-pressed={f.category === k}>
          <Icon n={k === "food" ? "utensils" : k === "clothing" ? "shirt" : "briefcase"} /><b>{l}</b><small>{k === "food" ? "Menu, sizes, toppings, deals" : k === "clothing" ? "Size charts, colours, variants" : "Services, packages, bookings"}</small></button>)}</div>
        {s.category && <p className="muted" style={{ marginBottom: 0 }}>Your category is locked once chosen. Contact Orderistan support to change it.</p>}</div>
      <div className="card"><div className="card-h"><h3>Look &amp; branding</h3></div><div className="grid3">
        <Field label="Logo"><input type="file" accept="image/*" onChange={(e) => setImgs({ ...imgs, logo: e.target.files[0] })} /></Field>
        <Field label="Banner"><input type="file" accept="image/*" onChange={(e) => setImgs({ ...imgs, banner: e.target.files[0] })} /></Field>
        <Field label="Brand colour"><input type="color" value={f.themeColor} onChange={set("themeColor")} /></Field></div>
        <div className="row wrap-gap">{s.logo && <img className="mini" src={s.logo} alt="logo" />}{s.banner && <img className="mini wide" src={s.banner} alt="banner" />}</div></div>
      <div className="card"><div className="card-h"><h3>Delivery</h3></div><div className="grid2">
        <Field label="Delivery fee (Rs)"><input type="number" min="0" value={f.deliveryFee} onChange={set("deliveryFee")} /></Field>
        <Field label="Free delivery over (Rs, 0 = never)"><input type="number" min="0" value={f.freeDeliveryOver} onChange={set("freeDeliveryOver")} /></Field></div></div>
      <div className="card"><div className="card-h"><h3>How customers pay you</h3></div><p className="muted">There is no payment gateway. Customers send money to the accounts below, upload the screenshot at checkout, and you verify it from the Orders page.</p>
        {PAY.map(([m, label, ic]) => { const x = f.payment[m] || {}; return (
          <div className="pay" key={m}><label className="check"><input type="checkbox" checked={!!x.enabled} onChange={pay(m, "enabled")} /> <Icon n={ic} /> <b>{label}</b></label>
            {x.enabled && m === "cod" && <div style={{ marginTop: 12 }}><Field label="Cash on delivery fee (Rs)" hint="Extra amount a customer pays when they choose cash on delivery, e.g. 50 or 100. Use 0 for no fee."><input type="number" min="0" max="100000" step="1" value={x.fee ?? 0} onChange={pay(m, "fee")} /></Field>
              {Number(x.fee) > 0 && <p className="muted" style={{ margin: 0 }}>Example: a Rs 1,000 order paid in cash on delivery becomes <b>{money(1000 + Number(f.deliveryFee || 0) + Number(x.fee))}</b>{Number(f.deliveryFee) > 0 ? " with delivery" : ""}.</p>}</div>}
            {x.enabled && m !== "cod" && <div className="grid2" style={{ marginTop: 12 }}>
              {m === "bank" && <Field label="Bank name"><input value={x.bankName || ""} onChange={pay(m, "bankName")} /></Field>}
              <Field label="Account title"><input value={x.title || ""} onChange={pay(m, "title")} /></Field>
              <Field label={m === "bank" ? "Account number" : "Mobile number"}><input value={x.number || ""} onChange={pay(m, "number")} /></Field>
              {m === "bank" && <Field label="IBAN (optional)"><input value={x.iban || ""} onChange={pay(m, "iban")} /></Field>}</div>}</div>); })}</div>
    </form>
  );
}
