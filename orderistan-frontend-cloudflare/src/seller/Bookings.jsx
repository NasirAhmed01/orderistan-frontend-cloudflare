import { useState } from "react";
import api, { errMsg } from "../api";
import { Badge, Empty, Field, Icon, PageHead, Pager, Spinner, confirmBox, fmtTime, money, toast, useGet, waLink } from "../ui";
import { DAYS, fmtMins, ymd } from "../pricing";

const NEXT = { pending: [["confirmed", "Confirm", "primary"], ["rejected", "Decline", "danger ghost"]], confirmed: [["completed", "Mark done", "primary"], ["cancelled", "Cancel", "danger ghost"]] };

function Actions({ b, reload }) {
  const go = async (st) => {
    let note = "";
    if (st === "rejected" || st === "cancelled") { if (!(await confirmBox({ title: st === "rejected" ? "Decline this request?" : "Cancel this booking?", body: "The customer is notified.", ok: st === "rejected" ? "Decline" : "Cancel booking", danger: true }))) return; }
    try { await api.patch("/seller/bookings/" + b._id, { status: st, note }); toast("Updated."); reload(); } catch (e) { toast(errMsg(e), "err"); }
  };
  const wa = waLink(b.info?.phone, `Hello ${b.info?.name}, this is regarding your ${b.serviceName} ${b.type}${b.date ? " on " + b.date + " " + b.time : ""}.`);
  return <div className="row wrap-gap">{(NEXT[b.status] || []).map(([st, l, c]) => <button key={st} className={"btn sm " + c} onClick={() => go(st)}>{l}</button>)}{wa && <a className="btn sm" href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Icon n="chat" /></a>}</div>;
}
const When = ({ b }) => b.date ? <><b>{b.date}</b>{b.time && <> · {b.time}</>}</> : <span className="muted">Flexible</span>;

export function BookingList({ type }) {
  const [f, setF] = useState({ status: "", q: "" }); const [page, setPage] = useState(1);
  const d = useGet("/seller/bookings", { type, ...f, page });
  const isReq = type === "request";
  return (
    <>
      <PageHead title={isReq ? "Customer requests" : "Bookings"} sub={isReq ? "Quote and service requests from customers." : "Appointments customers booked online."} />
      <div className="chips tabs">{[["", "All"], ["pending", "Pending"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["rejected", "Declined"]].map(([v, l]) => <button key={v} className={"chip" + (f.status === v ? " on" : "")} onClick={() => { setF({ ...f, status: v }); setPage(1); }}>{l}</button>)}</div>
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Customer, phone or service" value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setPage(1); }} /></div></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="calendar">{isReq ? "No requests yet." : "No bookings yet. Share your store link so customers can book."}</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Service</th><th>Customer</th><th>{isReq ? "Preferred" : "When"}</th><th>Price</th><th>Status</th><th /></tr></thead><tbody>
          {d.data.items.map((b) => <tr key={b._id}><td><b>{b.serviceName}</b>{b.packageName && <><br /><small className="muted">{b.packageName}{b.duration ? " · " + fmtMins(b.duration) : ""}</small></>}{b.addons?.length > 0 && <><br /><small className="muted">+ {b.addons.join(", ")}</small></>}</td>
            <td>{b.info?.name}<br /><small className="muted">{b.info?.phone}</small>{b.info?.note && <><br /><small className="muted pre">“{b.info.note}”</small></>}</td><td><When b={b} /><br /><small className="muted">{fmtTime(b.createdAt)}</small></td><td>{money(b.price)}</td><td><Badge v={b.status} /></td><td><Actions b={b} reload={d.reload} /></td></tr>)}</tbody></table></div>)}
      <Pager data={d.data} onPage={setPage} />
    </>
  );
}

export function Calendar() {
  const [m, setM] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [sel, setSel] = useState(ymd(new Date()));
  const from = ymd(m), to = ymd(new Date(m.getFullYear(), m.getMonth() + 1, 0));
  const d = useGet("/seller/bookings", { type: "booking", from, to, limit: 300 });
  const by = {}; (d.data?.items || []).filter((b) => !["cancelled", "rejected"].includes(b.status)).forEach((b) => (by[b.date] ||= []).push(b));
  const lead = m.getDay(), days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate(), today = ymd(new Date());
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => ymd(new Date(m.getFullYear(), m.getMonth(), i + 1)))];
  const list = (by[sel] || []).sort((a, b) => a.time.localeCompare(b.time));
  return (
    <>
      <PageHead title="Appointment calendar" sub="Pending and confirmed appointments by day." />
      <div className="dash-grid">
        <div className="card"><div className="card-h"><button className="btn sm" aria-label="Previous month" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() - 1, 1))}><Icon n="left" /></button>
          <h3>{m.toLocaleString("en", { month: "long", year: "numeric" })}</h3><button className="btn sm" aria-label="Next month" onClick={() => setM(new Date(m.getFullYear(), m.getMonth() + 1, 1))}><Icon n="right" /></button></div>
          <div className="cal"><div className="cal-h">{DAYS.map((x) => <span key={x}>{x.slice(0, 3)}</span>)}</div>
            <div className="cal-g">{cells.map((c, i) => c ? <button key={c} className={"cal-d" + (c === sel ? " on" : "") + (c === today ? " today" : "")} onClick={() => setSel(c)}><span>{+c.slice(8)}</span>{by[c] && <em>{by[c].length}</em>}</button> : <i key={"e" + i} />)}</div></div></div>
        <div className="card"><div className="card-h"><h3>{new Date(sel + "T00:00:00").toLocaleDateString("en", { weekday: "long", day: "numeric", month: "short" })}</h3></div>
          {d.loading && !d.data ? <Spinner /> : list.length === 0 ? <p className="muted">No appointments this day.</p> : list.map((b) => <div className="appt" key={b._id}><div className="appt-t">{b.time}</div><div className="grow"><b>{b.serviceName}</b><small className="muted" style={{ display: "block" }}>{b.info?.name} · {b.info?.phone}</small><Badge v={b.status} /></div><Actions b={b} reload={d.reload} /></div>)}</div>
      </div>
    </>
  );
}

export function Availability() {
  const { data, loading, reload } = useGet("/seller/store");
  if (loading && !data) return <Spinner />;
  if (!data?.store) return <Empty icon="alert">Could not load your settings.</Empty>;
  return <AvailabilityForm s={data.store} reload={reload} />;
}
function AvailabilityForm({ s, reload }) {
  const base = s.availability?.days?.length ? s.availability : { days: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: d !== 0, from: "10:00", to: "18:00" })), slotMinutes: 60, capacity: 1, leadHours: 2 };
  const [a, setA] = useState({ ...base, days: [0, 1, 2, 3, 4, 5, 6].map((d) => base.days.find((x) => x.day === d) || { day: d, open: false, from: "10:00", to: "18:00" }) });
  const [busy, setBusy] = useState(false);
  const day = (i, patch) => setA({ ...a, days: a.days.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { await api.put("/seller/store", { ...s, availability: a, payment: s.payment }); toast("Availability saved."); reload(); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save}>
      <PageHead title="Availability" sub="Opening hours used to create the booking slots customers see."><button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save availability"}</button></PageHead>
      <div className="card"><div className="card-h"><h3>Weekly hours</h3></div>
        {a.days.map((d, i) => <div className="avail-row" key={d.day}><label className="check"><input type="checkbox" checked={d.open} onChange={(e) => day(i, { open: e.target.checked })} /> <b>{DAYS[d.day]}</b></label>
          {d.open ? <div className="row"><input type="time" aria-label="Opens" value={d.from} onChange={(e) => day(i, { from: e.target.value })} /><span className="muted">to</span><input type="time" aria-label="Closes" value={d.to} onChange={(e) => day(i, { to: e.target.value })} /></div> : <span className="muted">Closed</span>}</div>)}</div>
      <div className="card"><div className="card-h"><h3>Slots</h3></div><div className="grid3">
        <Field label="Slot length (minutes)"><select value={a.slotMinutes} onChange={(e) => setA({ ...a, slotMinutes: +e.target.value })}>{[15, 30, 45, 60, 90, 120, 180].map((n) => <option key={n} value={n}>{n} min</option>)}</select></Field>
        <Field label="Bookings per slot" hint="How many customers you can serve at the same time"><input type="number" min="1" max="50" value={a.capacity} onChange={(e) => setA({ ...a, capacity: +e.target.value })} /></Field>
        <Field label="Minimum notice (hours)"><input type="number" min="0" max="720" value={a.leadHours} onChange={(e) => setA({ ...a, leadHours: +e.target.value })} /></Field></div></div>
    </form>
  );
}
