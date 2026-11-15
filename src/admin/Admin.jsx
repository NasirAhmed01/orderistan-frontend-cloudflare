import { useState } from "react";
import { Link, Route, Routes, useSearchParams } from "react-router-dom";
import api, { ROOT, errMsg } from "../api";
import { AuthImage, Avatar, Badge, Empty, Field, Icon, Modal, PageHead, Pager, Shell, Spinner, confirmBox, fmtDate, fmtTime, money, toast, useBadges, useGet } from "../ui";
import { CATS, catLabel, lineAmt, lineLabel } from "../pricing";
import { Meter } from "../charts";
import Profile from "../pages/Profile";
import { Cloudinary, Dashboard, Industries, NotificationCenter, Subscriptions } from "./Insights";
import { PaymentPage, Renewals } from "./Renewals";
import { AdminChat } from "../chat/Chat";

// Admin (platform owner) panel
const LINKS = [
  { heading: "Overview" },
  { to: "/admin", label: "Dashboard", icon: "grid", end: true },
  { heading: "Platform" },
  { to: "/admin/sellers", label: "Sellers", icon: "store" }, { to: "/admin/subscriptions", label: "Subscriptions", icon: "award" },
  { to: "/admin/renewals", label: "Renewals", icon: "wallet", badgeKey: "renewals" }, { to: "/admin/payment-details", label: "My payment details", icon: "card" }, { to: "/admin/chat", label: "Seller chat", icon: "chat", badgeKey: "chat" },
  { to: "/admin/industries", label: "Industries", icon: "layers" }, { to: "/admin/cloudinary", label: "Cloudinary", icon: "cloud" },
  { heading: "Commerce" },
  { to: "/admin/orders", label: "All orders", icon: "file" }, { to: "/admin/users", label: "Users", icon: "users" },
  { heading: "System" },
  { to: "/admin/notifications", label: "Notifications", icon: "bell" }, { to: "/admin/notify", label: "Notify sellers", icon: "send" },
  { to: "/admin/logs", label: "Activity log", icon: "activity" }, { to: "/admin/profile", label: "My profile", icon: "user" }
];
export default function Admin() {
  const b = useBadges();
  return (
    <Shell theme="admin" links={LINKS.map((l) => (l.badgeKey ? { ...l, badge: b[l.badgeKey] } : l))}>
      <Routes>
        <Route index element={<Dashboard />} /><Route path="sellers" element={<Sellers />} /><Route path="subscriptions" element={<Subscriptions />} />
        <Route path="industries" element={<Industries />} /><Route path="cloudinary" element={<Cloudinary />} /><Route path="orders" element={<Orders />} />
        <Route path="users" element={<Users />} /><Route path="logs" element={<Logs />} /><Route path="notify" element={<Notify />} />
        <Route path="renewals" element={<Renewals />} /><Route path="payment-details" element={<PaymentPage />} /><Route path="chat" element={<AdminChat />} /><Route path="notifications" element={<NotificationCenter />} /><Route path="profile" element={<Profile />} />
      </Routes>
    </Shell>
  );
}

const TABS = [["", "All"], ["pending", "Pending"], ["active", "Active"], ["expiring", "Expiring"], ["expired", "Expired"], ["inactive", "Suspended"]];
function Sellers() {
  const [sp] = useSearchParams();
  const [f, setF] = useState({ status: "", q: "", category: sp.get("category") || "", plan: "" }); const [page, setPage] = useState(1);
  const [sel, setSel] = useState(null); const [adding, setAdding] = useState(false);
  const plans = useGet("/admin/plans");
  const d = useGet("/admin/sellers", { ...f, page });
  const upd = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  return (
    <>
      <PageHead title="Sellers" sub="Approve stores, manage subscriptions, categories and accounts."><button className="btn primary" onClick={() => setAdding(true)}><Icon n="plus" /> Add seller</button></PageHead>
      <div className="toolbar">
        <div className="chips">{TABS.map(([v, l]) => <button key={v} className={"chip" + (f.status === v ? " on" : "")} onClick={() => { setF({ ...f, status: v }); setPage(1); }}>{l}</button>)}</div>
      </div>
      <div className="toolbar">
        <div className="input-ico grow"><Icon n="search" /><input placeholder="Search store or link" value={f.q} onChange={upd("q")} /></div>
        <select value={f.category} onChange={upd("category")} aria-label="Category"><option value="">All categories</option>{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}<option value="unset">Not chosen</option></select>
        <select value={f.plan} onChange={upd("plan")} aria-label="Plan"><option value="">All plans</option>{(plans.data?.items || []).map((p) => <option key={p._id}>{p.name}</option>)}</select>
      </div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="store">No sellers found.</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Store</th><th>Category</th><th>Plan</th><th>Status</th><th>Ends</th><th>Items</th><th>Images</th><th>Orders</th><th /></tr></thead><tbody>
          {d.data.items.map((s) => (
            <tr key={s._id}><td><div className="who"><Avatar name={s.name} /><div><b>{s.name}</b><br /><small className="muted">{s.owner?.email}</small></div></div></td>
              <td><span className={"cat-pill " + (s.category || "none")}>{catLabel(s.category)}</span></td>
              <td><b>{s.subscription?.plan}</b></td><td><Badge v={s.status} />{s.owner?.status === "suspended" && <><br /><Badge v="suspended" /></>}</td>
              <td>{fmtDate(s.subscription?.endsAt)}{s.daysLeft != null && s.status === "active" && <><br /><small className={s.daysLeft <= 7 ? "red-t" : "muted"}>{s.daysLeft} day(s) left</small></>}</td>
              <td className="usage-cell"><Meter value={s.products} max={s.limits?.maxProducts || 0} label="" sub={`${s.products}/${s.limits?.maxProducts ?? "-"}`} /></td>
              <td className="usage-cell"><Meter value={s.images} max={s.limits?.imageCap || 0} label="" sub={`${s.images}/${s.limits?.imageCap ?? "-"}`} /></td>
              <td>{s.orders}</td>
              <td className="nowrap"><div className="row"><a className="btn sm" href={`/s/${s.slug}`} target="_blank" rel="noreferrer" title="View storefront"><Icon n="eye" /></a><button className="btn sm" onClick={() => setSel(s)}>Manage</button></div></td></tr>))}
        </tbody></table></div>
      )}
      <Pager data={d.data} onPage={setPage} />
      {sel && <Manage s={sel} plans={plans.data?.items || []} onClose={() => setSel(null)} done={() => { setSel(null); d.reload(); }} />}
      {adding && <AddSeller plans={plans.data?.items || []} onClose={() => setAdding(false)} done={() => { setAdding(false); d.reload(); }} />}
    </>
  );
}

function Manage({ s, plans, onClose, done }) {
  const [days, setDays] = useState(30); const [plan, setPlan] = useState(s.subscription?.plan || "Basic");
  const [name, setName] = useState(s.name); const [slug, setSlug] = useState(s.slug); const [category, setCategory] = useState(s.category || ""); const [busy, setBusy] = useState(false);
  const act = async (body, msg) => {
    setBusy(true);
    try { await api.patch("/admin/sellers/" + s._id, body); toast(msg); done(); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const suspend = async (on) => {
    if (on && !(await confirmBox({ title: "Suspend this account?", body: `${s.owner?.name} will be logged out and ${s.name} will close immediately.`, ok: "Suspend", danger: true }))) return;
    setBusy(true);
    try { await api.patch("/admin/users/" + s.owner._id, { status: on ? "suspended" : "active" }); toast(on ? "Account suspended." : "Account restored. Re-activate the subscription to reopen the store."); done(); }
    catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const del = async () => {
    if (prompt(`This permanently deletes the store, products, bookings and orders.\nType "${s.slug}" to confirm:`) !== s.slug) return;
    try { await api.delete("/admin/sellers/" + s._id); toast("Seller deleted."); done(); } catch (e) { toast(errMsg(e), "err"); }
  };
  const lim = s.limits;
  return (
    <Modal title={s.name} onClose={onClose} wide>
      <dl className="kv">
        <dt>Owner</dt><dd>{s.owner?.name} - {s.owner?.email} - {s.owner?.phone || "no phone"}</dd>
        <dt>Category</dt><dd>{catLabel(s.category)}</dd>
        <dt>Status</dt><dd><Badge v={s.status} /> {s.owner?.status === "suspended" && <Badge v="suspended">account suspended</Badge>}</dd>
        <dt>Subscription ends</dt><dd>{fmtDate(s.subscription?.endsAt)}</dd>
        <dt>Last login</dt><dd>{fmtTime(s.owner?.lastLoginAt)}</dd>
      </dl>
      {lim && <div className="card flat"><Meter value={s.products} max={lim.maxProducts} label={s.category === "services" ? "Services used" : "Products used"} sub={`${s.products} / ${lim.maxProducts}`} />
        <Meter value={s.images} max={lim.imageCap} label="Images used" sub={`${s.images} / ${lim.imageCap}`} /></div>}
      <div className="card flat"><h4 style={{ marginTop: 0 }}>{s.status === "active" ? "Extend subscription" : "Activate subscription"}</h4>
        <div className="grid3">
          <Field label="Days to add"><select value={days} onChange={(e) => setDays(e.target.value)}>{[7, 30, 90, 180, 365].map((n) => <option key={n} value={n}>{n} days</option>)}</select></Field>
          <Field label="Plan"><select value={plan} onChange={(e) => setPlan(e.target.value)}>{plans.map((p) => <option key={p._id} value={p.name}>{p.name} - Rs {p.price}</option>)}</select></Field>
          <div className="end"><button className="btn primary block" disabled={busy} onClick={() => act({ action: "activate", days, plan }, "Subscription updated.")}>{s.status === "active" ? "Extend" : "Activate"}</button></div></div></div>
      <div className="card flat"><h4 style={{ marginTop: 0 }}>Store details</h4>
        <div className="grid2"><Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Store link"><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} /></Field>
          <Field label="Business category" hint="Changes the seller tools and the storefront layout."><select value={category} onChange={(e) => setCategory(e.target.value)}><option value="">Not chosen</option>{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <div className="end"><button className="btn block" disabled={busy} onClick={() => act({ action: "update", name, slug, plan, category }, "Saved.")}>Save</button></div></div></div>
      <div className="row between wrap-gap">
        <div className="row wrap-gap"><a className="btn" href={`/s/${s.slug}`} target="_blank" rel="noreferrer"><Icon n="link" /> View storefront</a><Link className="btn" to={`/admin/chat?store=${s._id}`}><Icon n="chat" /> Chat</Link></div>
        <div className="row wrap-gap">{s.status === "active" && <button className="btn" disabled={busy} onClick={async () => { if (await confirmBox({ title: "Deactivate store?", body: "Customers will see the store as closed.", ok: "Deactivate", danger: true })) act({ action: "deactivate" }, "Store deactivated."); }}>Deactivate store</button>}
          <button className="btn danger" disabled={busy} onClick={() => suspend(s.owner?.status !== "suspended")}>{s.owner?.status === "suspended" ? "Restore account" : "Suspend account"}</button>
          <button className="btn danger ghost" onClick={del}><Icon n="trash" /> Delete</button></div></div>
    </Modal>
  );
}

function AddSeller({ plans = [], onClose, done }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", storeName: "", slug: "", days: 30, plan: "Basic", category: "food" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => { e.preventDefault(); try { await api.post("/admin/sellers", f); toast("Seller created."); done(); } catch (x) { toast(errMsg(x), "err"); } };
  return (
    <Modal title="Add seller" onClose={onClose} wide>
      <form onSubmit={save}><div className="grid2">
        <Field label="Owner name"><input required value={f.name} onChange={set("name")} /></Field><Field label="Phone"><input value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={set("email")} /></Field><Field label="Password"><input required minLength={8} value={f.password} onChange={set("password")} /></Field>
        <Field label="Store name"><input required value={f.storeName} onChange={set("storeName")} /></Field><Field label="Store link" hint={`${f.slug || "name"}.${ROOT}`}><input required value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase() })} /></Field>
        <Field label="Active days (0 = leave pending)"><input type="number" min="0" value={f.days} onChange={set("days")} /></Field><Field label="Plan"><select value={f.plan} onChange={set("plan")}>{plans.map((p) => <option key={p._id} value={p.name}>{p.name} - Rs {p.price}</option>)}</select></Field>
        <Field label="Business category"><select value={f.category} onChange={set("category")}>{Object.entries(CATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      </div><button className="btn primary"><Icon n="plus" /> Create seller</button></form>
    </Modal>
  );
}

const ORDER_TABS = [["", "All orders"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["preparing", "Processing"], ["out_for_delivery", "Out for delivery"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
function Orders() {
  const [f, setF] = useState({ q: "", status: "", paymentStatus: "" }); const [page, setPage] = useState(1); const [open, setOpen] = useState(null);
  const d = useGet("/admin/orders", { ...f, page }); const st = useGet("/admin/stats");
  const upd = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const count = (k) => (k ? st.data?.orderStatus?.[k] : st.data?.orders) ?? "";
  return (
    <>
      <PageHead title="All orders" sub="Every order placed across all stores." />
      <div className="chips tabs">{ORDER_TABS.map(([v, l]) => <button key={v} className={"chip" + (f.status === v ? " on" : "")} onClick={() => { setF({ ...f, status: v }); setPage(1); }}>{l}{count(v) !== "" && <em>{count(v) || 0}</em>}</button>)}</div>
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Order no, name or phone" value={f.q} onChange={upd("q")} /></div>
        <select value={f.paymentStatus} onChange={upd("paymentStatus")}><option value="">All payments</option>{["submitted", "verified", "rejected", "cod", "unpaid"].map((s) => <option key={s}>{s}</option>)}</select></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="file">No orders.</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Order</th><th>Store</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead><tbody>
          {d.data.items.map((o) => (
            <tr key={o._id} className="click" onClick={() => setOpen(o._id)}><td><b>{o.orderNo}</b></td><td>{o.store?.name}</td><td>{o.info?.name}<br /><small className="muted">{o.info?.phone}</small></td>
              <td><b>{money(o.total)}</b></td><td><Badge v={o.paymentStatus} /> <small className="muted">{o.paymentMethod}</small></td><td><Badge v={o.status} /></td><td className="nowrap">{fmtTime(o.createdAt)}</td></tr>))}
        </tbody></table></div>)}
      <Pager data={d.data} onPage={setPage} />
      {open && <OrderModal id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
function OrderModal({ id, onClose }) {
  const { data } = useGet("/admin/orders/" + id); const o = data?.order;
  return (
    <Modal title={o ? o.orderNo : "Order"} onClose={onClose} wide>
      {!o ? <Spinner /> : <>
        <div className="row wrap-gap" style={{ marginBottom: 12 }}><b>{o.store?.name}</b><Badge v={o.status} /><Badge v={o.paymentStatus} /><span className="muted">({o.paymentMethod})</span></div>
        <dl className="kv"><dt>Customer</dt><dd>{o.info.name}, {o.info.phone}</dd><dt>Address</dt><dd>{o.info.address}</dd>{o.info.note && <><dt>Note</dt><dd>{o.info.note}</dd></>}</dl>
        <div className="card table-wrap flat"><table className="table"><tbody>{o.items.map((i, k) => <tr key={k}><td>{i.name}{lineLabel(i) && <><br /><small className="muted">{lineLabel(i)}</small></>}{i.deal && <> <Badge v="confirmed">{i.deal}</Badge></>}</td><td>x{i.qty}</td><td>{money(lineAmt(i))}</td></tr>)}
          <tr><td colSpan={2}>Delivery</td><td>{money(o.deliveryFee)}</td></tr>{o.codFee > 0 && <tr><td colSpan={2}>Cash on delivery fee</td><td>{money(o.codFee)}</td></tr>}<tr><td colSpan={2}><b>Total</b></td><td><b>{money(o.total)}</b></td></tr></tbody></table></div>
        {o.hasScreenshot && <AuthImage url={`/orders/${o._id}/screenshot`} />}
        <h4>History</h4><ul className="timeline">{o.history.map((h, i) => <li key={i}><b>{h.status.replace(/_/g, " ")}</b> {h.note && <span className="muted">({h.note})</span>}<br /><small className="muted">{fmtTime(h.at)}</small></li>)}</ul></>}
    </Modal>
  );
}

function Users() {
  const [f, setF] = useState({ q: "", role: "" }); const [page, setPage] = useState(1);
  const d = useGet("/admin/users", { ...f, page });
  const patch = async (u, body, msg) => { try { await api.patch("/admin/users/" + u._id, body); toast(msg); d.reload(); } catch (e) { toast(errMsg(e), "err"); } };
  const reset = (u) => { const p = prompt(`New password for ${u.email} (min 8 characters):`); if (p) patch(u, { password: p }, "Password reset."); };
  const del = async (u) => { if (!confirm(`Delete ${u.email || "@" + u.username}?`)) return; try { await api.delete("/admin/users/" + u._id); toast("Deleted."); d.reload(); } catch (e) { toast(errMsg(e), "err"); } };
  return (
    <>
      <PageHead title="Users" sub="Customers, sellers and administrators." />
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Search name, email, phone" value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setPage(1); }} /></div>
        <select value={f.role} onChange={(e) => { setF({ ...f, role: e.target.value }); setPage(1); }}><option value="">All roles</option><option value="customer">Customers</option><option value="seller">Sellers</option><option value="admin">Admin</option></select></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="users">No users.</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Status</th><th>Last login</th><th /></tr></thead><tbody>
          {d.data.items.map((u) => (
            <tr key={u._id}><td><div className="who"><Avatar name={u.name} /><div><b>{u.name}</b><br /><small className="muted">{u.email || (u.username ? "@" + u.username : "")}</small></div></div></td><td>{u.phone}</td>
              <td><Badge v={u.role === "admin" ? "verified" : u.role === "seller" ? "confirmed" : "inactive"}>{u.role}</Badge></td><td><Badge v={u.status} /></td><td className="nowrap">{fmtTime(u.lastLoginAt)}</td>
              <td className="nowrap">{u.role !== "admin" && <div className="row">
                <button className="btn sm" onClick={() => patch(u, { status: u.status === "active" ? "suspended" : "active" }, "Updated.")}>{u.status === "active" ? "Suspend" : "Restore"}</button>
                <button className="btn sm" onClick={() => reset(u)}>Reset pw</button>
                {u.role === "customer" && <button className="btn sm danger ghost" onClick={() => del(u)} aria-label="Delete user"><Icon n="trash" /></button>}</div>}</td></tr>))}
        </tbody></table></div>)}
      <Pager data={d.data} onPage={setPage} />
    </>
  );
}

const GROUPS = [["", "All activity"], ["auth", "Logins & signups"], ["order", "Orders"], ["subscription", "Subscriptions"], ["seller", "Seller changes"], ["admin", "Admin actions"], ["product", "Products"]];
function Logs() {
  const [f, setF] = useState({ q: "", action: "", role: "" }); const [page, setPage] = useState(1);
  const d = useGet("/admin/logs", { ...f, page });
  const upd = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  return (
    <>
      <PageHead title="Activity log" sub="Security and audit trail of everything happening on the platform." />
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Search name, action or IP" value={f.q} onChange={upd("q")} /></div>
        <select value={f.action} onChange={upd("action")}>{GROUPS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select value={f.role} onChange={upd("role")}><option value="">All roles</option><option value="customer">Customer</option><option value="seller">Seller</option><option value="admin">Admin</option></select></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="activity">No activity yet.</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Store</th><th>Details</th><th>IP</th></tr></thead><tbody>
          {d.data.items.map((l) => (
            <tr key={l._id}><td className="nowrap">{fmtTime(l.createdAt)}</td><td>{l.actorName || "-"}<br /><small className="muted">{l.role}</small></td>
              <td><code>{l.action}</code></td><td>{l.store?.name || "-"}</td><td className="small">{l.meta && Object.keys(l.meta).length ? JSON.stringify(l.meta) : ""}</td><td className="small">{l.ip}</td></tr>))}
        </tbody></table></div>)}
      <Pager data={d.data} onPage={setPage} />
    </>
  );
}

function Notify() {
  const sellers = useGet("/admin/sellers", { page: 1 });
  const [f, setF] = useState({ target: "sellers", title: "", body: "" });
  const send = async (e) => { e.preventDefault(); try { const { data } = await api.post("/admin/notify", f); toast(`Sent to ${data.sent} seller(s).`); setF({ ...f, title: "", body: "" }); } catch (x) { toast(errMsg(x), "err"); } };
  return (
    <>
      <PageHead title="Notify sellers" sub="Send an in-app notification to one seller or all of them." />
      <form className="card narrow" onSubmit={send}>
        <Field label="Send to"><select value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })}><option value="sellers">All sellers</option>
          {(sellers.data?.items || []).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field>
        <Field label="Title"><input required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Message"><textarea rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></Field>
        <button className="btn primary"><Icon n="send" /> Send notification</button>
      </form>
    </>
  );
}
