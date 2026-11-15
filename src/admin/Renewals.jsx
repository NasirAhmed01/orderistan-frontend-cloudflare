import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api, { errMsg } from "../api";
import { METHOD, KIND, STATE } from "../pricing";
import { Meter } from "../charts";
import { AuthImage, Avatar, Badge, Empty, Field, Icon, Modal, PageHead, Pager, Spinner, confirmBox, fmtDate, fmtTime, money, toast, useGet } from "../ui";

// Admin > Renewals: sellers pay Orderistan, upload a screenshot, the owner verifies it here. Approving extends / re-opens the store at once.
const TABS = [["pending", "Waiting"], ["approved", "Approved"], ["rejected", "Rejected"], ["cancelled", "Cancelled"], ["", "All"]];

export function Renewals() {
  const [sp] = useSearchParams(); const [tab, setTab] = useState("requests");
  const ps = useGet("/admin/payment-settings"); const noPay = ps.data?.settings && !PAY.some(([m]) => ps.data.settings[m]?.enabled);
  return (
    <>
      <PageHead title="Renewals" sub="Verify seller payments and manage where sellers pay you.">
        <div className="seg"><button className={tab === "requests" ? "on" : ""} onClick={() => setTab("requests")}>Requests</button><button className={tab === "pay" ? "on" : ""} onClick={() => setTab("pay")}>Payment details</button></div></PageHead>
      {noPay && tab === "requests" && <div className="banner warn"><Icon n="alert" /><div><b>Sellers cannot see where to pay you yet.</b> Add your bank / JazzCash / Easypaisa number once and every seller sees it on their Subscription page. <button className="btn sm" onClick={() => setTab("pay")}>Add my payment details</button></div></div>}
      {tab === "requests" ? <Requests initialQ={sp.get("q") || ""} /> : <PaymentDetails />}
    </>
  );
}

function Requests({ initialQ }) {
  const [f, setF] = useState({ status: "pending", q: initialQ }); const [page, setPage] = useState(1); const [open, setOpen] = useState(null);
  const d = useGet("/admin/sub-requests", { ...f, page });
  return (
    <>
      <div className="chips tabs">{TABS.map(([v, l]) => <button key={v} className={"chip" + (f.status === v ? " on" : "")} onClick={() => { setF({ ...f, status: v }); setPage(1); }}>{l}</button>)}</div>
      <div className="toolbar"><div className="input-ico grow"><Icon n="search" /><input placeholder="Search store name or link" value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setPage(1); }} /></div></div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="award">{f.status === "pending" ? "No payments are waiting. You are all caught up." : "No requests found."}</Empty> : (
        <div className="card table-wrap"><table className="table"><thead><tr><th>Store</th><th>Type</th><th>Plan</th><th>Amount</th><th>Paid via</th><th>Status</th><th>Sent</th></tr></thead><tbody>
          {d.data.items.map((x) => (
            <tr key={x._id} className="click" onClick={() => setOpen(x._id)}>
              <td><div className="who"><Avatar name={x.store?.name} /><div><b>{x.store?.name}</b><br /><small className="muted">{x.owner?.email}</small></div></div></td>
              <td>{KIND[x.kind]}</td><td><b>{x.plan}</b><br /><small className="muted">{x.months} month(s)</small></td><td><b>{money(x.amount)}</b>{x.discount > 0 && <><br /><small className="muted">{x.discount}% off</small></>}</td>
              <td>{METHOD[x.method]}{x.reference && <><br /><small className="muted">{x.reference}</small></>}</td><td><Badge v={STATE[x.status]}>{x.status === "pending" ? "waiting" : x.status}</Badge></td><td className="nowrap">{fmtTime(x.createdAt)}</td></tr>))}
        </tbody></table></div>)}
      <Pager data={d.data} onPage={setPage} />
      {open && <Review id={open} onClose={() => setOpen(null)} done={() => { setOpen(null); d.reload(); window.dispatchEvent(new Event("chat:read")); }} />}
    </>
  );
}

function Review({ id, onClose, done }) {
  const { data, loading, error } = useGet("/admin/sub-requests/" + id);
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const x = data?.request;
  const act = async (action) => {
    if (action === "approve" && !(await confirmBox({ title: "Approve and activate?", body: `Confirm that you received ${money(x.amount)} from ${x.store?.name}. Their store will be extended right away.`, ok: "Approve" }))) return;
    setBusy(true);
    try { await api.patch("/admin/sub-requests/" + id, { action, note }); toast(action === "approve" ? "Approved. Subscription updated." : "Request rejected."); done(); }
    catch (e) { toast(errMsg(e), "err"); } finally { setBusy(false); }
  };
  const cur = data?.current; const base = cur?.live && cur.endsAt ? new Date(cur.endsAt) : new Date();
  const newEnd = x ? new Date(+base + x.days * 864e5) : null;
  return (
    <Modal title={x ? `${KIND[x.kind]}: ${x.store?.name}` : "Request"} onClose={onClose} wide>
      {loading && !x ? <Spinner /> : !x ? <Empty icon="alert">{error || "Request not found."}</Empty> : <>
        <div className="row wrap-gap" style={{ marginBottom: 12 }}><Badge v={STATE[x.status]}>{x.status === "pending" ? "waiting" : x.status}</Badge><span className="muted">sent {fmtTime(x.createdAt)}</span></div>
        <dl className="kv"><dt>Seller</dt><dd>{x.owner?.name} · {x.owner?.email}{x.owner?.phone ? ` · ${x.owner.phone}` : ""}</dd>
          <dt>Request</dt><dd>{x.plan} plan × {x.months} month(s) ({x.days} days)</dd>
          <dt>Amount</dt><dd><b>{money(x.amount)}</b>{x.discount > 0 && <small className="muted"> ({x.discount}% discount on {money(x.planPrice * x.months)})</small>}</dd>
          <dt>Paid via</dt><dd>{METHOD[x.method]}{x.reference && <> · ref <b>{x.reference}</b></>}</dd>{x.note && <><dt>Seller note</dt><dd>{x.note}</dd></>}
          <dt>Now</dt><dd>{cur ? <>{cur.plan || "No plan"} · {cur.live ? `active until ${fmtDate(cur.endsAt)}` : cur.status}</> : "-"}</dd>
          {x.status === "pending" && newEnd && <><dt>After approval</dt><dd><b>{x.plan}</b> until <b>{fmtDate(newEnd)}</b></dd></>}
          {x.status === "approved" && x.endsAtAfter && <><dt>Active until</dt><dd>{fmtDate(x.endsAtAfter)}</dd></>}
          {x.adminNote && <><dt>Your note</dt><dd>{x.adminNote}</dd></>}</dl>
        {data.usage && <div className="card flat"><Meter value={data.usage.products} max={data.usage.productCap} label="Items used (current plan)" sub={`${data.usage.products}/${data.usage.productCap}`} /></div>}
        {data.fit && x.status === "pending" && <div className="banner warn"><Icon n="alert" /><div><b>Cannot approve this plan yet.</b> {data.fit} Reject with this reason or ask the seller to choose another plan.</div></div>}
        {x.hasProof ? <><h4>Payment screenshot</h4><AuthImage url={`/sub-requests/${x._id}/proof`} alt="Seller payment screenshot" /></> : <div className="banner warn"><div>No screenshot was sent. Confirm the payment with the seller (chat) before you approve.</div></div>}
        {x.status === "pending" && <div className="card flat"><b>Check the screenshot against your bank / JazzCash / Easypaisa app, then:</b>
          <Field label="Note to seller (shown with the notification; needed to explain a rejection)"><input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Amount received is Rs 500 short" /></Field>
          <div className="row wrap-gap"><button className="btn primary" disabled={busy || !!data.fit} onClick={() => act("approve")}><Icon n="check" /> Payment received - approve</button>
            <button className="btn danger" disabled={busy} onClick={() => act("reject")}>Reject</button>
            <Link className="btn" to={`/admin/chat?store=${x.store?._id}`}><Icon n="chat" /> Open chat</Link></div></div>}
        {x.status !== "pending" && <Link className="btn" to={`/admin/chat?store=${x.store?._id}`}><Icon n="chat" /> Open chat</Link>}
      </>}
    </Modal>
  );
}

const PAY = [["bank", "Bank account", "card"], ["jazzcash", "JazzCash", "phone"], ["easypaisa", "Easypaisa", "phone"]];
export function PaymentPage() { return <><PageHead title="My payment details" sub="Set the accounts where sellers send their subscription money. They appear on every seller's Subscription page." /><PaymentDetails /></>; }
function PaymentDetails() {
  const d = useGet("/admin/payment-settings");
  if (d.loading && !d.data) return <Spinner />;
  if (!d.data?.settings) return <Empty icon="alert">{d.error || "Could not load payment details."}</Empty>;
  return <PayForm init={d.data.settings} />;
}
function PayForm({ init }) {
  const [f, setF] = useState(init); const [busy, setBusy] = useState(false);
  // typing a number turns the method on by itself; clearing it turns it off (no hidden toggle to forget)
  const pay = (m, k) => (e) => { const v = e.target.type === "checkbox" ? e.target.checked : e.target.value; setF({ ...f, [m]: { ...f[m], [k]: v, ...(k === "number" ? { enabled: !!String(v).trim() } : {}) } }); };
  const disc = (n) => (e) => setF({ ...f, discounts: { ...f.discounts, [n]: e.target.value } });
  const save = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.put("/admin/payment-settings", f); setF(data.settings); toast("Payment details saved."); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save}>
      <div className="card"><div className="card-h"><h3>Where sellers pay you</h3><button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save"}</button></div>
        <p className="muted">Sellers see these accounts on their Subscription page. Only turned-on methods are shown.</p>
        {PAY.map(([m, label, ic]) => { const x = f[m] || {}; return (
          <div className="pay" key={m}><label className="check"><input type="checkbox" checked={!!x.enabled} onChange={pay(m, "enabled")} /> <Icon n={ic} /> <b>{label}</b> <small className="muted">{x.enabled ? "shown to sellers" : "off - fill the number to turn on"}</small></label>
            <div className="grid2" style={{ marginTop: 12 }}>
              {m === "bank" && <Field label="Bank name"><input value={x.bankName || ""} onChange={pay(m, "bankName")} /></Field>}
              <Field label="Account title"><input value={x.title || ""} onChange={pay(m, "title")} /></Field>
              <Field label={m === "bank" ? "Account number" : "Mobile number"}><input value={x.number || ""} onChange={pay(m, "number")} /></Field>
              {m === "bank" && <Field label="IBAN (optional)"><input value={x.iban || ""} onChange={pay(m, "iban")} /></Field>}</div></div>); })}
        <Field label="Extra instructions for sellers (optional)" hint="Shown under the account details, e.g. “Write your store link in the payment note.”"><textarea rows={2} maxLength={500} value={f.instructions || ""} onChange={(e) => setF({ ...f, instructions: e.target.value })} /></Field></div>
      <div className="card"><div className="card-h"><h3>Discount for longer plans</h3></div><p className="muted">Percent off the monthly price when a seller pays for several months at once. Use 0 for no discount.</p>
        <div className="grid3">{[[3, "3 months"], [6, "6 months"], [12, "1 year"]].map(([n, l]) => <Field key={n} label={`${l} (%)`}><input type="number" min="0" max="90" value={f.discounts?.[n] ?? 0} onChange={disc(n)} /></Field>)}</div>
        <small className="muted">Plan prices and limits are edited under Subscriptions.</small></div>
      <div className="card"><h3>What sellers will see</h3>
        {PAY.filter(([m]) => f[m]?.enabled && f[m]?.number).length === 0 ? <p className="muted" style={{ marginBottom: 0 }}>Nothing yet. Add at least one account above.</p> :
          PAY.filter(([m]) => f[m]?.enabled && f[m]?.number).map(([m, label]) => <div className="paybox" key={m}><b>{label}</b>{f[m].bankName && <div>Bank: {f[m].bankName}</div>}<div>Account title: {f[m].title || "-"}</div><div>{m === "bank" ? "Account no" : "Mobile no"}: <b>{f[m].number}</b></div>{f[m].iban && <div>IBAN: {f[m].iban}</div>}</div>)}
        {f.instructions && <p className="muted pre">{f.instructions}</p>}
        <div className="row wrap-gap" style={{ marginTop: 12 }}><button className="btn primary lg" disabled={busy}>{busy ? "Saving..." : "Save payment details"}</button></div></div>
    </form>
  );
}
