import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import { AreaChart, BarChart, Donut, Meter } from "../charts";
import { Badge, Empty, Field, Icon, PageHead, Spinner, Stat, confirmBox, fmtDate, fmtTime, money, toast, useGet } from "../ui";
import { CATS, bytes } from "../pricing";

const CAT_COLOR = { food: "#f97316", clothing: "#8b5cf6", services: "#0ea5e9", unset: "#94a3b8" };
const catName = (k) => (k === "unset" ? "Not chosen yet" : CATS[k] || k);

export function Dashboard() {
  const { data, loading, reload } = useGet("/admin/stats");
  const cloud = useGet("/admin/cloudinary");
  const sys = useGet("/admin/system");   // System Overview: failure here never blocks the rest of the page
  if (loading && !data) return <Spinner />;
  if (!data) return <Empty icon="alert">Could not load the dashboard.</Empty>;
  const s = data.stores, c = cloud.data?.cloud, L = cloud.data?.local;
  const check = async () => { try { const { data: r } = await api.post("/admin/run-expiry-check"); toast(`Checked: ${r.warned} warned, ${r.expired} expired.`); reload(); } catch (e) { toast(errMsg(e), "err"); } };
  const cats = Object.entries(data.categories || {}).map(([k, v]) => ({ label: catName(k), value: v, color: CAT_COLOR[k] }));
  const total30 = data.days.reduce((a, d) => a + d.total, 0);
  return (
    <>
      <PageHead title="Overview" sub="Everything happening across Orderistan, live from your database.">
        <button className="btn" onClick={() => { reload(); cloud.reload(); sys.reload(); }}><Icon n="refresh" /> Refresh</button>
        <button className="btn primary" onClick={check}><Icon n="shield" /> Run subscription check</button>
      </PageHead>
      {cloud.data?.level >= 70 && <div className="banner warn"><Icon n="alert" /><div><b>Cloudinary is at {cloud.data.cloud.percent.toFixed(0)}% of its plan.</b> <Link to="/admin/cloudinary">Open Cloudinary monitoring</Link></div></div>}
      {sys.data?.storage && sys.data.storage.level !== "ok" && <div className={"banner " + (sys.data.storage.level === "critical" ? "crit" : "warn")}><Icon n="alert" /><div><b>MongoDB storage is at {sys.data.storage.percent.toFixed(1)}% of {sys.data.storage.capacityMB} MB{sys.data.storage.level === "critical" ? " - critical" : ""}.</b> Only {fmtMB(sys.data.storage.remainingMB)} is left. See System Overview below.</div></div>}
      <div className="stats k6">
        <Stat icon="store" label="Registered sellers" value={data.sellers} tone="blue" />
        <Stat icon="check" label="Active subscriptions" value={s.active || 0} tone="green" />
        <Stat icon="alert" label="Expired subscriptions" value={s.expired || 0} tone="red" />
        <Stat icon="users" label="Total customers" value={data.customers} />
        <Stat icon="file" label="Total orders" value={data.orders} />
        <Stat icon="dollar" label="Total revenue" value={money(data.gmv)} tone="green" />
        <Stat icon="trending" label="Monthly recurring revenue" value={money(data.mrr)} tone="green" />
        <Stat icon="cloud" label="Cloudinary storage" value={c ? bytes(c.storage.usage) : "-"} tone="amber" />
        <Stat icon="globe" label="Cloudinary bandwidth" value={c ? bytes(c.bandwidth.usage) : "-"} tone="amber" />
        <Stat icon="image" label="Images uploaded" value={L ? L.total : data.images} />
        <Stat icon="clock" label="Pending approval" value={s.pending || 0} tone="amber" />
        <Stat icon="card" label="Payments to verify" value={data.awaiting} tone="amber" />
      </div>
      <div className="dash-grid">
        <div className="card"><div className="card-h"><h3>Revenue &amp; orders - last 14 days</h3><span className="muted">{money(total30)} · {data.days.reduce((a, d) => a + d.n, 0)} orders</span></div>
          <AreaChart data={data.days.map((d) => ({ day: d.day, value: d.total }))} x="day" y="value" format={(n) => "Rs " + (n >= 1000 ? Math.round(n / 1000) + "k" : n)} label="Revenue per day" /></div>
        <div className="card"><div className="card-h"><h3>Business categories</h3><Link className="btn sm" to="/admin/industries">Details</Link></div>
          {cats.length ? <Donut parts={cats} center={data.sellers} /> : <p className="muted">No sellers yet.</p>}</div>
      </div>
      <div className="dash-grid eq">
        <div className="card"><div className="card-h"><h3>Orders by status</h3><Link className="btn sm" to="/admin/orders">All orders</Link></div>
          <BarChart data={["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map((k) => ({ label: k === "preparing" ? "processing" : k.replace(/_/g, " "), value: data.orderStatus?.[k] || 0 }))} /></div>
        <div className="card"><div className="card-h"><h3>Needs attention</h3></div>
          {data.expiring.length === 0 && !data.awaiting && !(s.pending > 0) ? <p className="muted">Nothing needs attention right now.</p> : <>
            {s.pending > 0 && <div className="list-row"><div><b>{s.pending} store(s) waiting for activation</b></div><Link className="btn sm" to="/admin/sellers">Review</Link></div>}
            {data.expiring.map((x) => <div className="list-row" key={x._id}><div><b>{x.name}</b><small className="muted">{x.slug}</small></div><Badge v={x.daysLeft <= 1 ? "rejected" : "pending"}>{x.daysLeft} day(s) left</Badge></div>)}</>}
          <div className="quick" style={{ marginTop: 12 }}><Link to="/admin/subscriptions"><Icon n="award" />Plans</Link><Link to="/admin/cloudinary"><Icon n="cloud" />Cloudinary</Link><Link to="/admin/notify"><Icon n="send" />Notify sellers</Link></div></div>
      </div>
      {L && <div className="card"><div className="card-h"><h3>Image uploads - new product photos, last 30 days</h3><span className="muted">{L.gallery} gallery · {L.color} colour · {L.logos + L.banners} branding</span></div>
        <BarChart height={140} data={L.perDay.map((d) => ({ label: d.day.slice(8), value: d.images }))} /></div>}
      <SystemOverview sys={sys} />
    </>
  );
}

// ---- System Overview: every value comes from GET /admin/system (cached 60 s on the server). Missing data shows "Not Available", never a guess.
const NA = "Not Available";
const num = (n) => (typeof n === "number" && Number.isFinite(n) ? n.toLocaleString("en-PK") : NA);
const fmtMB = (n) => (typeof n === "number" && Number.isFinite(n) ? (n >= 1024 ? (n / 1024).toFixed(2) + " GB" : n.toFixed(n >= 100 ? 0 : 1) + " MB") : NA);
const DB_TONE = { connected: "green", connecting: "amber", disconnecting: "amber", disconnected: "red", unreachable: "red" };
const LEVEL = { ok: ["green", "Healthy"], warning: ["amber", "Warning - 80% reached"], critical: ["red", "Critical - 95% reached"] };

function SystemOverview({ sys }) {
  const d = sys.data, em = d?.email, st = d?.storage, db = d?.database;
  const [force, setForce] = useState(false);
  const refresh = async () => { setForce(true); try { await api.get("/admin/system", { params: { refresh: 1 } }); await sys.reload(); } catch (e) { toast(errMsg(e), "err"); } setForce(false); };
  return (
    <section className="sys" aria-label="System Overview">
      <div className="page-h sys-h"><div><h2>System Overview</h2><p className="sub">{d ? <>Updated {fmtTime(d.generatedAt)} (your local time); "today" and "this month" follow {d.timezone}{d.cached ? " · cached up to 1 minute" : ""}.</> : "Email delivery, database storage and connection health."}</p></div>
        <button className="btn sm" onClick={refresh} disabled={force || sys.loading}><Icon n="refresh" /> {force ? "Refreshing..." : "Refresh"}</button></div>
      {!d ? (sys.loading ? <Spinner /> : <Empty icon="alert">System Overview is not available right now.</Empty>) : <>
        <div className="card sys-card">
          <div className="card-h"><h3>Brevo OTP emails</h3>{em && <Badge v={em.configured ? "active" : "rejected"}>{em.configured ? "Brevo configured" : "Brevo not configured"}</Badge>}</div>
          <div className="stats k6">
            <Stat icon="mail" label="Sent today" value={em ? num(em.today) : NA} tone="blue" />
            <Stat icon="mail" label="Sent this month" value={em ? num(em.month) : NA} tone="blue" />
            <Stat icon="check" label="Sent in total" value={em ? num(em.total) : NA} tone="green" />
            <Stat icon="alert" label="Failed" value={em ? num(em.failed) : NA} tone={em?.failed ? "red" : "green"} />
          </div>
          {!em && <p className="muted sys-note">Email statistics: {NA}{d.errors?.email ? <> - {d.errors.email}.</> : ""}</p>}
          {em && <p className="muted sys-note">Failed: {num(em.failedToday)} today · {num(em.failedMonth)} this month. Counts only OTP emails (sign-up, password reset, Gmail link, owner sign-in) {em.trackingSince ? <>recorded since {fmtDate(em.trackingSince)}</> : "- none recorded yet"}. “Sent” means Brevo accepted the email.{em.lastFailedAt ? <> Last failure: {fmtTime(em.lastFailedAt)}.</> : ""}</p>}
        </div>
        <div className="dash-grid eq">
          <div className="card sys-card">
            <div className="card-h"><h3>MongoDB Atlas storage</h3>{st && <Badge v={st.level === "ok" ? "active" : st.level === "warning" ? "pending" : "rejected"}>{LEVEL[st.level][1]}</Badge>}</div>
            {!st ? <p className="muted">Storage usage: {NA}{d.errors?.storage ? <> - {d.errors.storage}.</> : ""}</p> : <>
              <div className={"meter " + (st.level === "critical" ? "crit" : st.level === "warning" ? "warn" : "")}>
                <div className="meter-h"><span>{fmtMB(st.usedMB)} of {fmtMB(st.capacityMB)} configured limit</span><b>{st.percent.toFixed(1)}%</b></div>
                <div className="meter-t" role="progressbar" aria-valuenow={Math.round(st.percent)} aria-valuemin={0} aria-valuemax={100} aria-label="MongoDB storage used"><i style={{ width: st.percent + "%" }} /><u className="mk" style={{ left: "80%" }} title="80% warning" /><u className="mk" style={{ left: "95%" }} title="95% critical" /></div>
              </div>
              <div className="list-row"><div>Used</div><b>{fmtMB(st.usedMB)}</b></div>
              <div className="list-row"><div>Remaining</div><b>{fmtMB(st.remainingMB)}</b></div>
              <div className="list-row"><div>Configured capacity</div><b>{fmtMB(st.capacityMB)}</b></div>
              <div className="list-row"><div>Usage</div><b>{st.percent.toFixed(1)}%</b></div>
              <p className="muted sys-note">Data {fmtMB(st.dataMB)} + indexes {fmtMB(st.indexMB)} · {num(st.collections)} collections · {num(st.objects)} documents. Warning at {d.thresholds.warning}%, critical at {d.thresholds.critical}%. The {fmtMB(st.capacityMB)} limit is a {st.capacitySource === "configured" ? "setting (DB_CAPACITY_MB)" : "default threshold (Atlas free-tier size)"}, not read from Atlas - set DB_CAPACITY_MB if your cluster differs.</p></>}
          </div>
          <div className="card sys-card">
            <div className="card-h"><h3>Database connection</h3>{db && <Badge v={DB_TONE[db.status] === "green" ? "active" : DB_TONE[db.status] === "amber" ? "pending" : "rejected"}>{db.status}</Badge>}</div>
            {!db ? <p className="muted">Connection status: {NA}</p> : <>
              <div className="list-row"><div>Status</div><b>{db.connected ? "Connected" : db.status[0].toUpperCase() + db.status.slice(1)}</b></div>
              <div className="list-row"><div>Response time</div><b>{db.latencyMs != null ? db.latencyMs + " ms" : NA}</b></div>
              <div className="list-row"><div>Last successful health check</div><b>{db.lastHealthCheckAt ? fmtTime(db.lastHealthCheckAt) : NA}</b></div>
              <div className="list-row"><div>Last successful sync</div><b>{NA}</b></div>
              {d.errors?.database && <div className="list-row"><div>Monitoring error</div><b>{d.errors.database}</b></div>}
              <p className="muted sys-note">Health check = a live ping to MongoDB, repeated every 5 minutes in the background. {db.sync?.reason}</p></>}
          </div>
        </div>
      </>}
    </section>
  );
}

export function Subscriptions() {
  const { data, loading, reload } = useGet("/admin/plans");
  const sellers = useGet("/admin/sellers", { page: 1 });
  const [edit, setEdit] = useState(null);
  if (loading && !data) return <Spinner />;
  return (
    <>
      <PageHead title="Subscriptions" sub="Plans, prices and the limits enforced on every seller account." />
      <div className="plans">
        {(data?.items || []).map((p, i) => (
          <div className={"plan" + (i === 1 ? " pop" : "") + (p.active ? "" : " off")} key={p._id}>
            {i === 1 && <span className="plan-tag">Most popular</span>}
            <h3>{p.name}</h3>
            <div className="plan-price"><b>Rs {p.price.toLocaleString("en-PK")}</b><small>/month</small></div>
            <ul><li><Icon n="check" /> <b>{p.maxProducts}</b> products / services</li><li><Icon n="check" /> <b>{p.maxImages}</b> images per product</li>
              <li><Icon n="check" /> <b>{p.maxProducts * p.maxImages}</b> images in total</li></ul>
            <div className="plan-foot"><span className="muted">{p.live} live · {p.stores} stores</span><button className="btn sm" onClick={() => setEdit(p)}><Icon n="edit" /> Edit</button></div>
            {!p.active && <Badge v="inactive">hidden</Badge>}
          </div>))}
      </div>
      <div className="card"><div className="card-h"><h3>Seller subscriptions</h3><Link className="btn sm" to="/admin/sellers">Manage sellers</Link></div>
        {!sellers.data?.items?.length ? <p className="muted">No sellers yet.</p> : (
          <div className="table-wrap"><table className="table"><thead><tr><th>Store</th><th>Plan</th><th>Status</th><th>Ends</th><th>Products</th><th>Images</th></tr></thead><tbody>
            {sellers.data.items.map((s) => <tr key={s._id}><td><b>{s.name}</b><br /><small className="muted">{s.slug}</small></td><td>{s.subscription?.plan}</td><td><Badge v={s.status} /></td>
              <td>{fmtDate(s.subscription?.endsAt)}</td><td>{s.products}/{s.limits?.maxProducts ?? "-"}</td><td>{s.images}/{s.limits?.imageCap ?? "-"}</td></tr>)}</tbody></table></div>)}</div>
      {edit && <PlanForm p={edit} onClose={() => setEdit(null)} done={() => { setEdit(null); reload(); }} />}
    </>
  );
}
function PlanForm({ p, onClose, done }) {
  const [f, setF] = useState({ price: p.price, maxProducts: p.maxProducts, maxImages: p.maxImages, active: p.active }); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const save = async (e) => {
    e.preventDefault();
    if ((f.maxProducts < p.maxProducts || f.maxImages < p.maxImages) && p.stores > 0 && !(await confirmBox({ title: "Lower the limits?", body: `${p.stores} store(s) are on ${p.name}. Their existing items stay, but they cannot add new ones above the new limit.`, ok: "Lower limits" }))) return;
    setBusy(true);
    try { await api.patch("/admin/plans/" + p._id, f); toast("Plan updated."); done(); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={save}>
      <div className="modal-h"><h3>Edit {p.name} plan</h3><button type="button" className="x" onClick={onClose}>&times;</button></div>
      <div className="modal-b"><Field label="Price per month (Rs)"><input type="number" min="0" required value={f.price} onChange={set("price")} /></Field>
        <div className="grid2"><Field label="Products / services allowed"><input type="number" min="1" required value={f.maxProducts} onChange={set("maxProducts")} /></Field>
          <Field label="Images per product"><input type="number" min="1" max="50" required value={f.maxImages} onChange={set("maxImages")} /></Field></div>
        <label className="check"><input type="checkbox" checked={f.active} onChange={set("active")} /> Offer this plan to sellers</label>
        <p className="muted" style={{ marginTop: 12 }}>Limits are read from the database every time a seller adds a product or image, so changes apply immediately.</p>
        <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save plan"}</button></div></form></div>
  );
}

export function Industries() {
  const { data, loading } = useGet("/admin/industries");
  if (loading && !data) return <Spinner />;
  const items = data?.items || [], icon = { food: "utensils", clothing: "shirt", services: "briefcase", "": "help" };
  return (
    <>
      <PageHead title="Industries" sub="Each business category gets its own seller tools and its own storefront layout." />
      <div className="inds">{items.filter((x) => x.key || x.sellers).map((x) => (
        <div className="card ind" key={x.key || "none"} style={{ "--c": CAT_COLOR[x.key || "unset"] }}>
          <div className="ind-ico"><Icon n={icon[x.key]} /></div><h3>{x.label}</h3>
          <div className="ind-n"><b>{x.sellers}</b> seller{x.sellers === 1 ? "" : "s"} <span className="muted">· {x.active} live</span></div>
          <dl className="kv"><dt>{x.key === "services" ? "Services" : "Products"}</dt><dd>{x.products}</dd><dt>{x.key === "services" ? "Orders (legacy)" : "Orders"}</dt><dd>{x.orders}</dd><dt>Delivered sales</dt><dd>{money(x.revenue)}</dd></dl>
          {x.key && <Link className="btn sm" to={`/admin/sellers?category=${x.key}`}>View sellers</Link>}
        </div>))}</div>
      <div className="card"><div className="card-h"><h3>Seller distribution</h3></div>
        <Donut parts={items.filter((x) => x.sellers).map((x) => ({ label: x.label, value: x.sellers, color: CAT_COLOR[x.key || "unset"] }))} /></div>
    </>
  );
}

export function Cloudinary() {
  const { data, loading, reload } = useGet("/admin/cloudinary");
  const [busy, setBusy] = useState(false);
  if (loading && !data) return <Spinner />;
  if (!data) return <Empty icon="alert">Could not load monitoring data.</Empty>;
  const c = data.cloud, L = data.local;
  const refresh = async () => { setBusy(true); try { await api.get("/admin/cloudinary", { params: { refresh: 1 } }); await reload(); toast("Usage refreshed."); } catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); } };
  const pct = c?.percent;
  const alertTone = data.level >= 95 ? "crit" : data.level >= 85 ? "high" : data.level >= 70 ? "warn" : "ok";
  return (
    <>
      <PageHead title="Cloudinary monitoring" sub="Image storage, bandwidth and transformations for the whole platform."><button className="btn" onClick={refresh} disabled={busy}><Icon n="refresh" /> {busy ? "Refreshing..." : "Refresh from Cloudinary"}</button></PageHead>
      {data.error && <div className="banner warn"><Icon n="alert" /><div>{data.error} Image counts below still come from your own database.</div></div>}
      {pct != null && <div className={"alert-box " + alertTone}>
        <Icon n={alertTone === "ok" ? "check" : "alert"} /><div><b>{alertTone === "ok" ? "Usage is healthy" : data.level >= 95 ? "Critical: 95% of the plan is used" : data.level >= 85 ? "High: 85% of the plan is used" : "Warning: 70% of the plan is used"}</b>
          <span>{pct.toFixed(1)}% of your Cloudinary {c.plan || ""} plan is used this period. Alerts are sent to the notification bell at 70%, 85% and 95%.</span></div></div>}
      <div className="stats">
        <Stat icon="image" label="Total uploaded images" value={L.total} tone="blue" /><Stat icon="cloud" label="Total storage" value={c ? bytes(c.storage.usage) : "-"} tone="amber" />
        <Stat icon="globe" label="Bandwidth" value={c ? bytes(c.bandwidth.usage) : "-"} tone="amber" /><Stat icon="layers" label="Monthly transformations" value={c ? c.transformations.usage.toLocaleString("en-PK") : "-"} />
        <Stat icon="chart" label="Usage" value={pct != null ? pct.toFixed(1) + "%" : "-"} tone={pct >= 85 ? "red" : pct >= 70 ? "amber" : "green"} /><Stat icon="box" label="Files in Cloudinary" value={c ? (c.objects.usage || c.resources).toLocaleString("en-PK") : "-"} /></div>
      <div className="dash-grid eq">
        <div className="card"><div className="card-h"><h3>Usage against plan</h3><span className="muted">{c?.plan}</span></div>
          {!c ? <p className="muted">Cloudinary usage is not available.</p> : <>
            {c.credits && <Meter value={c.credits.usage} max={c.credits.limit} label="Credits" sub={`${c.credits.usage.toFixed(1)} / ${c.credits.limit}`} />}
            <Meter value={c.storage.percent ?? 0} max={100} label={`Storage (${bytes(c.storage.usage)}${c.storage.limit ? " of " + bytes(c.storage.limit) : ""})`} />
            <Meter value={c.bandwidth.percent ?? 0} max={100} label={`Bandwidth (${bytes(c.bandwidth.usage)}${c.bandwidth.limit ? " of " + bytes(c.bandwidth.limit) : ""})`} />
            <Meter value={c.transformations.percent ?? 0} max={100} label={`Transformations (${c.transformations.usage.toLocaleString("en-PK")}${c.transformations.limit ? " of " + c.transformations.limit.toLocaleString("en-PK") : ""})`} />
            <p className="muted" style={{ fontSize: ".8rem" }}>Last updated by Cloudinary: {c.updated || "-"}. Values are cached for 5 minutes.</p></>}
          <div className="thr"><span className="t70">70%</span><span className="t85">85%</span><span className="t95">95%</span><small className="muted">alert levels</small></div></div>
        <div className="card"><div className="card-h"><h3>Images by type</h3></div>
          <Donut center={L.total} parts={[{ label: "Product gallery", value: L.gallery, color: "#6366f1" }, { label: "Colour photos", value: L.color, color: "#ec4899" }, { label: "Store logos", value: L.logos, color: "#14b8a6" }, { label: "Store banners", value: L.banners, color: "#f59e0b" }].filter((x) => x.value)} />
          {L.total === 0 && <p className="muted">No images uploaded yet.</p>}</div>
      </div>
      <div className="dash-grid eq">
        <div className="card"><div className="card-h"><h3>Biggest image users</h3></div>{L.topStores.length === 0 ? <p className="muted">No data yet.</p> :
          L.topStores.map((s) => <div className="list-row" key={s.slug}><div><b>{s.store}</b><small className="muted">{s.slug}</small></div><b>{s.images} images</b></div>)}</div>
        <div className="card"><div className="card-h"><h3>Gallery images by category</h3></div>
          <BarChart height={160} data={Object.entries(L.byCategory).map(([k, v]) => ({ label: catName(k), value: v, color: CAT_COLOR[k] }))} /></div>
      </div>
    </>
  );
}

export function NotificationCenter() {
  const { data, loading, reload } = useGet("/notifications");
  const read = async () => { try { await api.post("/notifications/read"); reload(); } catch (e) { toast(errMsg(e), "err"); } };
  return (
    <>
      <PageHead title="Notification center" sub="Signups, expiring subscriptions, Cloudinary alerts and payment reminders."><button className="btn" onClick={read} disabled={!data?.unread}><Icon n="check" /> Mark all as read</button></PageHead>
      {loading && !data ? <Spinner /> : !data?.items?.length ? <Empty icon="bell">You're all caught up.</Empty> :
        <div className="card">{data.items.map((n) => <div className={"list-row note-row" + (n.read ? "" : " new")} key={n._id}><div><b>{n.title}</b><small className="muted" style={{ display: "block" }}>{n.body}</small></div>
          <div className="row">{n.link && n.link.startsWith("/") && <Link className="btn sm" to={n.link}>Open</Link>}<small className="muted nowrap">{fmtTime(n.createdAt)}</small></div></div>)}</div>}
    </>
  );
}
