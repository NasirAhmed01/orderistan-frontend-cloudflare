import { lineAmt, lineLabel } from "../pricing";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import api, { ROOT } from "../api";
import { useAuth } from "../auth";
import { Accordion, CountUp, Progress, Reveal, useAddresses } from "../kit";
import { Avatar, Badge, Empty, Field, Icon, Spinner, fmtTime, money, toast, useGet, waLink } from "../ui";
import { IdentityCard, PasswordForm, ProfileDetails } from "../pages/Profile";
import { useStore } from "./ctx";

const STEPS = [["pending", "Order placed", "bag"], ["confirmed", "Confirmed", "check"], ["preparing", "Preparing", "box"], ["out_for_delivery", "Out for delivery", "truck"], ["delivered", "Delivered", "home"]];
export const Timeline = ({ status }) => {
  if (status === "cancelled") return <div className="banner warn"><Icon n="alert" /><div>This order was cancelled.</div></div>;
  const idx = STEPS.findIndex((s) => s[0] === status);
  return <ol className="track">{STEPS.map(([k, l, ic], i) => <li key={k} className={i < idx ? "done" : i === idx ? "now" : ""}><span><Icon n={i < idx ? "check" : ic} /></span><b>{l}</b></li>)}</ol>;
};

// Standard page frame for all the storefront info pages
const Page = ({ title, sub, children, narrow }) => (
  <div className={"sf-page" + (narrow ? " narrow" : "")}><div className="sf-page-h"><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children}</div>
);
const needLogin = (user, sp, loc) => user?.role === "customer" ? null : <Navigate to={sp("/login")} state={{ from: loc.pathname }} replace />;

// ===================== PROFILE (store side) =====================
const TABS = [["overview", "Overview", "grid"], ["details", "Details", "user"], ["security", "Password", "lock"], ["addresses", "Addresses", "pin"], ["notifications", "Notifications", "bell"]];
export function StoreProfile() {
  const { user, logout } = useAuth(); const { sp, wish } = useStore(); const loc = useLocation(); const [q, setQ] = useSearchParams();
  const tab = TABS.some((t) => t[0] === q.get("tab")) ? q.get("tab") : "overview";
  if (!user) return <Navigate to={sp("/login")} state={{ from: loc.pathname }} replace />;
  if (user.role !== "customer") return <Page title="My profile" narrow><div className="card"><p>You are signed in as a {user.role}. Seller and admin accounts are managed at <a href={`https://${ROOT}/login`}>{ROOT}</a>.</p><button className="btn" onClick={logout}>Log out</button></div></Page>;
  return (
    <div className="sf-page">
      <div className="prof-cover"><div className="prof-cover-in"><Avatar name={user.name} src={user.avatar} size="lg" solid /><div><h1>{user.name}</h1><p>{user.email}{user.phone ? ` - ${user.phone}` : ""}</p></div></div></div>
      <div className="prof-tabs" role="tablist">{TABS.map(([k, l, ic]) => <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setQ(k === "overview" ? {} : { tab: k })}><Icon n={ic} /> {l}</button>)}</div>
      <div className="prof-body" key={tab}>
        {tab === "overview" && <Overview user={user} wishCount={wish.size} />}
        {tab === "details" && <><IdentityCard /><ProfileDetails /></>}
        {tab === "security" && <div className="narrow-form"><PasswordForm /></div>}
        {tab === "addresses" && <Addresses user={user} />}
        {tab === "notifications" && <NotificationList />}
      </div>
    </div>
  );
}

function Overview({ user, wishCount }) {
  const { sp, store } = useStore(); const d = useGet("/store/orders"); const [addrs] = useAddresses(user._id || user.id);
  const items = d.data?.items || []; const open = items.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;
  const done = [!!user.name, !!user.phone, addrs.length > 0, items.length > 0]; const pct = (done.filter(Boolean).length / done.length) * 100;
  return (
    <>
      <div className="stats prof-stats">
        <div className="stat"><div className="stat-ico"><Icon n="bag" /></div><div><span>Orders here</span><b><CountUp to={d.data?.total ?? items.length} /></b></div></div>
        <div className="stat amber"><div className="stat-ico"><Icon n="truck" /></div><div><span>In progress</span><b><CountUp to={open} /></b></div></div>
        <div className="stat red"><div className="stat-ico"><Icon n="heart" /></div><div><span>Wishlist</span><b><CountUp to={wishCount} /></b></div></div>
      </div>
      <div className="grid2 prof-grid">
        <div className="card"><div className="card-h"><h3>Recent orders</h3><Link to={sp("/orders")}>View all</Link></div>
          {d.loading && !d.data ? <Spinner /> : !items.length ? <Empty icon="bag">No orders at {store.name} yet. <Link to={sp("/")}>Start shopping</Link></Empty> :
            items.slice(0, 3).map((o) => <div className="list-row" key={o._id}><span><b>{o.orderNo}</b> <small className="muted">{fmtTime(o.createdAt)}</small></span><span className="row"><Badge v={o.status} /><b>{money(o.total)}</b></span></div>)}</div>
        <div className="card"><div className="card-h"><h3>Profile completeness</h3><b>{Math.round(pct)}%</b></div>
          <Progress value={pct} label="Profile completeness" />
          <ul className="todo">{[["Add your name", done[0]], ["Add a phone / WhatsApp number", done[1]], ["Save a delivery address", done[2]], ["Place your first order", done[3]]].map(([t, ok]) => <li key={t} className={ok ? "ok" : ""}><Icon n={ok ? "check" : "plus"} />{t}</li>)}</ul>
          <div className="row wrap-gap"><Link className="btn sm" to={sp("/profile?tab=details")}>Edit details</Link><Link className="btn sm" to={sp("/profile?tab=addresses")}>Addresses</Link><Link className="btn sm" to={sp("/track")}>Track an order</Link></div></div>
      </div>
    </>
  );
}

// Saved delivery addresses live on this device (no server change needed) and are offered at checkout.
export function Addresses({ user }) {
  const [list, save] = useAddresses(user._id || user.id); const [f, setF] = useState({ label: "Home", text: "" });
  const add = (e) => { e.preventDefault(); save([...list, { id: Date.now(), ...f }]); setF({ label: "Home", text: "" }); toast("Address saved."); };
  return (
    <div className="grid2 prof-grid">
      <div>{!list.length ? <Empty icon="pin">No saved addresses yet. Add one and pick it at checkout.</Empty> : list.map((a) => (
        <div className="card addr" key={a.id}><div className="row between"><b><Icon n="pin" /> {a.label}</b><button className="btn sm danger ghost" onClick={() => save(list.filter((x) => x.id !== a.id))}><Icon n="trash" /> Remove</button></div><p className="pre">{a.text}</p></div>))}</div>
      <form className="card" onSubmit={add}><div className="card-h"><h3>Add an address</h3></div>
        <Field label="Label"><select value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })}>{["Home", "Office", "Family", "Other"].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Full address"><textarea required rows={3} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="House no, street, area, city" /></Field>
        <button className="btn brand">Save address</button><small className="muted block-note">Saved on this device only.</small></form>
    </div>
  );
}

export function NotificationList({ base = "" }) {
  const ctx = useStore(); const sp = ctx ? ctx.sp : (p) => base + p; const d = useGet("/notifications");
  useEffect(() => { if (d.data?.unread) api.post("/notifications/read").catch(() => {}); }, [d.data?.unread]);
  if (d.loading && !d.data) return <Spinner />;
  if (!d.data?.items?.length) return <Empty icon="bell">You're all caught up. Order updates will show up here.</Empty>;
  return <div className="card nlist">{d.data.items.map((n) => (
    <Link key={n._id} className={"nrow" + (n.read ? "" : " new")} to={n.link ? (n.link.startsWith("store:") ? sp(n.link.slice(6)) : n.link) : sp("/orders")}>
      <span className="perk-ico"><Icon n="bell" /></span><div><b>{n.title}</b><span>{n.body}</span><small>{fmtTime(n.createdAt)}</small></div></Link>))}</div>;
}
export function NotificationsPage() {
  const { user } = useAuth(); const { sp } = useStore(); const loc = useLocation(); const r = needLogin(user, sp, loc);
  return r || <Page title="Notifications" sub="Updates on your orders and payments." narrow><NotificationList /></Page>;
}

// ===================== TRACK ORDER =====================
export function TrackOrder() {
  const { user } = useAuth(); const { sp, store } = useStore(); const loc = useLocation(); const d = useGet(user?.role === "customer" ? "/store/orders" : null);
  const [no, setNo] = useState(""); const [hit, setHit] = useState(null); const [miss, setMiss] = useState(false);
  const r = needLogin(user, sp, loc); if (r) return r;
  const items = d.data?.items || [];
  const find = (e) => { e?.preventDefault(); const o = items.find((x) => x.orderNo?.toLowerCase() === no.trim().toLowerCase()); setHit(o || null); setMiss(!o); };
  const wa = hit && waLink(store.whatsapp || store.phone, `Assalam o Alaikum! About my order ${hit.orderNo} - please share an update.`);
  return (
    <Page title="Track your order" sub="Enter your order number or pick a recent order." narrow>
      <form className="card track-form" onSubmit={find}><div className="input-ico grow"><Icon n="search" /><input required placeholder="Order number" value={no} onChange={(e) => { setNo(e.target.value); setMiss(false); }} /></div><button className="btn brand">Track</button></form>
      {d.loading && !d.data ? <Spinner /> : <div className="chips">{items.slice(0, 6).map((o) => <button key={o._id} className={"chip" + (hit?._id === o._id ? " on" : "")} onClick={() => { setNo(o.orderNo); setHit(o); setMiss(false); }}>{o.orderNo}</button>)}</div>}
      {miss && <div className="banner warn"><Icon n="alert" /><div>No order with that number in your account at {store.name}. Check the number in your order confirmation.</div></div>}
      {hit && <div className="card order fresh"><div className="row between wrap-gap"><div><b>{hit.orderNo}</b> <small className="muted">{fmtTime(hit.createdAt)}</small></div><div><Badge v={hit.status} /> <Badge v={hit.paymentStatus} /></div></div>
        <Timeline status={hit.status} />
        {hit.items.map((i, k) => <div className="list-row" key={k}><span>{i.name} <span className="muted">x{i.qty}{lineLabel(i) ? " · " + lineLabel(i) : ""}</span></span><span>{money(lineAmt(i))}</span></div>)}
        <div className="row between big-t"><b>Total</b><b>{money(hit.total)}</b></div>
        <div className="row wrap-gap"><Link className="btn sm" to={sp("/orders")}>Manage this order</Link>{wa && <a className="btn sm" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> Ask the seller</a>}</div></div>}
    </Page>
  );
}

// ===================== INFO PAGES =====================
export function AboutStore() {
  const { store, sp } = useStore(); const cats = useGet("/store/categories"); const p = useGet("/store/products", { limit: 1 });
  const wa = waLink(store.whatsapp || store.phone, "Assalam o Alaikum! I found your store on Orderistan.");
  return (
    <Page title={`About ${store.name}`} sub={store.tagline}>
      <div className="about-grid">
        <Reveal className="card about-story"><h3>Our story</h3><p className="pre">{store.description || `${store.name} is a local seller on Orderistan. Browse the catalogue, order online and pay the way that suits you.`}</p>
          <div className="about-stats"><div><b><CountUp to={p.data?.total || 0} /></b><span>Products</span></div><div><b><CountUp to={cats.data?.items?.length || 0} /></b><span>Categories</span></div>{store.city && <div><b>{store.city}</b><span>Based in</span></div>}</div></Reveal>
        <Reveal delay={90} className="card"><h3>Find us</h3>
          {store.address && <p><Icon n="pin" /> {store.address}{store.city && `, ${store.city}`}</p>}{store.phone && <p><Icon n="phone" /> <a href={"tel:" + store.phone}>{store.phone}</a></p>}
          {wa && <a className="btn brand block" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> Chat on WhatsApp</a>}</Reveal>
      </div>
      {cats.data?.items?.length > 0 && <><h2 className="sf-h2">Shop by category</h2><div className="cat-tiles">{cats.data.items.map((c, i) => <Reveal key={c} delay={i * 50}><Link className="cat-tile" to={sp("/")}><span>{c.slice(0, 1).toUpperCase()}</span><b>{c}</b><Icon n="right" /></Link></Reveal>)}</div></>}
    </Page>
  );
}

export function ContactStore() {
  const { store } = useStore(); const { user } = useAuth(); const [f, setF] = useState({ name: user?.name || "", phone: user?.phone || "", msg: "" });
  const num = store.whatsapp || store.phone;
  const send = (e) => { e.preventDefault(); const l = waLink(num, `Assalam o Alaikum! I am ${f.name}${f.phone ? ` (${f.phone})` : ""}. ${f.msg}`); if (!l) return toast("This store has not added a WhatsApp number yet.", "err"); window.open(l, "_blank", "noopener"); };
  return (
    <Page title="Contact us" sub={`We usually reply on WhatsApp. Send ${store.name} a message.`}>
      <div className="about-grid">
        <form className="card" onSubmit={send}>
          <Field label="Your name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone (optional)"><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Message"><textarea required rows={5} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} placeholder="Ask about a product, delivery or your order" /></Field>
          <button className="btn brand"><Icon n="send" /> Send on WhatsApp</button><small className="muted block-note">Opens WhatsApp with your message ready to send.</small>
        </form>
        <div className="contact-cards">
          {store.phone && <a className="card contact-c" href={"tel:" + store.phone}><span className="perk-ico"><Icon n="phone" /></span><div><b>Call</b><span>{store.phone}</span></div></a>}
          {num && <a className="card contact-c" href={waLink(num, "Assalam o Alaikum!")} target="_blank" rel="noreferrer"><span className="perk-ico"><Icon n="chat" /></span><div><b>WhatsApp</b><span>Fastest way to reach us</span></div></a>}
          {store.address && <div className="card contact-c"><span className="perk-ico"><Icon n="pin" /></span><div><b>Address</b><span>{store.address}{store.city && `, ${store.city}`}</span></div></div>}
        </div>
      </div>
    </Page>
  );
}

export function Policies() {
  const { store, sp } = useStore();
  const blocks = [
    ["truck", "Delivery", store.deliveryFee > 0 ? `Delivery costs ${money(store.deliveryFee)}${store.freeDeliveryOver > 0 ? ` and is free on orders over ${money(store.freeDeliveryOver)}` : ""}. The delivery fee is shown in your cart before you pay.` : "Delivery is free on every order. You will see the final total in your cart before you pay."],
    ["wallet", "Payment", "Pay by bank transfer, JazzCash or Easypaisa and upload your payment screenshot at checkout, or choose cash on delivery where the store offers it. Available methods are shown at checkout."],
    ["shield", "Payment verification", `${store.name} checks each screenshot and confirms your order. If a payment cannot be verified you will see the reason in My orders and can upload a new screenshot.`],
    ["x", "Cancelling an order", "You can cancel from My orders while the order is still pending and the payment has not been verified. After that, message the seller on WhatsApp."],
    ["refresh", "Returns and refunds", `Return and refund terms are set by ${store.name}. Message the seller on WhatsApp with your order number and a photo of the item and they will help.`]
  ];
  return (
    <Page title="Delivery & returns" sub={`How ordering from ${store.name} works.`} narrow>
      {blocks.map(([i, t, d], k) => <Reveal key={t} delay={k * 40} className="card policy"><span className="perk-ico"><Icon n={i} /></span><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}
      <p className="muted center">Still unsure? <Link to={sp("/contact")}>Contact the seller</Link></p>
    </Page>
  );
}

export function StoreFaq() {
  const { store, sp } = useStore();
  return (
    <Page title="Frequently asked questions" sub={`Quick answers about ordering from ${store.name}.`} narrow>
      <Accordion items={[
        ["How do I place an order?", "Add products to your cart, go to checkout, enter your delivery details and choose a payment method. You need a free account to check out."],
        ["How do I pay?", "Send the total to the account shown at checkout (bank, JazzCash or Easypaisa) and upload the screenshot. If cash on delivery is offered, pay the rider when your order arrives."],
        ["My payment was marked as not verified. What now?", "Open My orders, read the note from the seller and upload a clearer or corrected screenshot on the same order."],
        ["How can I see where my order is?", "Use Track an order or open My orders. Each order shows its progress from placed to delivered."],
        ["Can I cancel or change my order?", "You can cancel while it is pending and the payment is not verified. To change items or the address, message the seller on WhatsApp."],
        ["Who do I contact about a problem?", "Use the Contact page or the WhatsApp button on any order. Sellers handle delivery and returns for their own store."]
      ]} />
      <p className="muted center">More questions? <Link to={sp("/contact")}>Contact us</Link></p>
    </Page>
  );
}
