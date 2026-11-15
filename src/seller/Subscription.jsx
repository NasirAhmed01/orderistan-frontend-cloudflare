import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api, { errMsg } from "../api";
import { METHOD, KIND, STATE } from "../pricing";
import { Meter } from "../charts";
import { AuthImage, Badge, Empty, Field, Icon, PageHead, Spinner, confirmBox, fmtDate, fmtTime, money, toast, useGet, copyText as copy } from "../ui";

// Seller > Subscription. Flow: choose plan -> choose duration -> see price + new end date -> pay Orderistan (bank / JazzCash / Easypaisa)
// -> upload the payment screenshot -> admin verifies in Admin > Renewals -> store is extended / re-opened automatically.
// All prices are recalculated on the server; this page only displays them.
const STATE_LABEL = { pending: "Waiting for admin", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" };
const DAY = 864e5;

function Copyable({ label, value }) {
  return value ? <div className="copy-row"><span className="muted">{label}</span><b className="sel">{value}</b><button type="button" className="btn sm" onClick={() => copy(value, label + " copied")} aria-label={`Copy ${label}`}><Icon n="copy" /></button></div> : null;
}

export default function Subscription() {
  const d = useGet("/seller/subscription");
  if (d.loading && !d.data) return <Spinner />;
  if (!d.data?.store) return <Empty icon="alert">{d.error || "Could not load your subscription."}</Empty>;
  return <Body d={d.data} reload={d.reload} />;
}

function Body({ d, reload }) {
  const { store: s, usage: u, plans, months, pay, pending, history, footprint: fp } = d;
  const noun = s.category === "services" ? "services" : "products";
  const anyPay = Object.keys(pay.methods).length > 0;          // has the owner published payment accounts yet?
  const methods = anyPay ? Object.keys(pay.methods) : Object.keys(METHOD);   // if not, the seller can still choose a method and send the request
  const blocked = (p) => fp.products > p.maxProducts || fp.maxItemImages > p.maxImages;
  const why = (p) => (fp.products > p.maxProducts ? `You have ${fp.products} ${noun}; this plan allows ${p.maxProducts}.` : `One item has ${fp.maxItemImages} photos; this plan allows ${p.maxImages}.`);
  const start = plans.find((p) => p.name === s.subscription?.plan && !blocked(p)) || plans.find((p) => !blocked(p)) || plans[0];

  const [planName, setPlanName] = useState(start?.name || ""); const [mo, setMo] = useState(1);
  const [method, setMethod] = useState(methods[0] || ""); const [f, setF] = useState({ reference: "", note: "" });
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false); const [showProof, setShowProof] = useState("");
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  const plan = plans.find((p) => p.name === planName); const dur = months.find((x) => x.months === mo) || months[0];
  const amount = plan ? Math.round(plan.price * dur.months * (1 - dur.discount / 100)) : 0;
  const base = s.live && s.subscription?.endsAt ? new Date(s.subscription.endsAt) : new Date();
  const newEnd = new Date(+base + dur.days * DAY);
  const kind = !s.live ? "activate" : plan?.name === s.subscription?.plan ? "renew" : (plan?.price || 0) > (plans.find((p) => p.name === s.subscription?.plan)?.price || 0) ? "upgrade" : "downgrade";
  const det = pay.methods[method];

  const submit = async (e) => {
    e.preventDefault();
    if (!plan || blocked(plan)) return toast("Choose a plan that fits your store.", "err");
    if (!method) return toast("Choose how you paid.", "err");
    if (anyPay && !file) return toast("Upload the screenshot of your payment.", "err");
    if (!(await confirmBox({ title: "Send request to admin?", body: `${plan.name} plan × ${dur.months} month(s) · ${money(amount)} via ${METHOD[method]}. The admin will verify it and activate your plan until ${fmtDate(newEnd)}.`, ok: "Send request" }))) return;
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("plan", plan.name); fd.append("months", dur.months); fd.append("method", method); fd.append("reference", f.reference); fd.append("note", f.note); if (file) fd.append("screenshot", file);
      await api.post("/seller/subscription/requests", fd); toast("Request sent to the admin. You will be notified when it is approved."); setFile(null); setF({ reference: "", note: "" }); reload();
    } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const cancel = async () => {
    if (!(await confirmBox({ title: "Cancel this request?", body: "Your payment proof is removed. You can send a new request any time.", ok: "Cancel request", danger: true }))) return;
    try { await api.delete("/seller/subscription/requests/" + pending._id); toast("Request cancelled."); reload(); } catch (x) { toast(errMsg(x), "err"); }
  };
  const lastRejected = history[0]?.status === "rejected" ? history[0] : null;

  return (
    <>
      <PageHead title="Subscription" sub="Renew or change your plan, pay Orderistan and track every request."><Link className="btn primary" to="/seller/chat"><Icon n="chat" /> Chat with admin{d.chatUnread > 0 && <em className="nav-badge solid">{d.chatUnread}</em>}</Link></PageHead>

      <div className="card hero-card"><div><b style={{ fontSize: "1.2rem" }}>{u.plan.name} plan</b><br />
        <span className="muted">Rs {u.plan.price.toLocaleString("en-PK")}/month · {s.live ? `${s.daysLeft} day(s) left` : "not active"}</span></div>
        <div className="row wrap-gap"><Badge v={s.live ? "active" : s.status} /><span className="muted">{s.subscription?.endsAt ? `Ends ${fmtDate(s.subscription.endsAt)}` : "Not started"}</span></div></div>

      {!s.live && <div className="banner warn"><Icon n="alert" /><div>
        {s.status === "pending" && <>Your store is not active yet. Choose a plan below, pay, and upload the screenshot. It opens as soon as the admin confirms.</>}
        {s.status === "expired" && <>Your subscription expired, so customers cannot see your store. Renew below to open it again.</>}
        {s.status === "inactive" && <>Your store was deactivated by the administrator. Send a renewal request or chat with the admin to open it again.</>}
        {s.status === "active" && <>Your subscription is not valid. Renew below or chat with the admin.</>}</div></div>}
      {s.live && s.daysLeft <= 7 && !pending && <div className="banner warn"><Icon n="clock" /><div>Your plan ends in {s.daysLeft} day(s) ({fmtDate(s.subscription.endsAt)}). Renew now: the new days are added after your current end date, so you lose nothing.</div></div>}
      {lastRejected && !pending && <div className="banner warn"><Icon n="alert" /><div><b>Your last payment was not confirmed.</b> {lastRejected.adminNote} You can send a new request below or chat with the admin.</div></div>}

      <div className="grid2">
        <div className="card"><h3>Usage</h3>
          <Meter value={u.products} max={u.productCap} label={`${u.plan.name} Plan - ${noun}`} sub={`${u.products}/${u.productCap}`} />
          <Meter value={u.images} max={u.imageCap} label="Images" sub={`${u.images}/${u.imageCap}`} />
          <p className="muted" style={{ marginBottom: 0 }}>{u.productsLeft} {noun} and {u.imagesLeft} images left · {u.plan.maxImages} photos per item.</p></div>
        <div className="card"><h3>How renewal works</h3>
          <ol className="steps"><li>Pick a plan and how many months.</li><li>Send the amount to Orderistan and upload the screenshot.</li><li>The admin checks it. You get a notification and your store is extended or re-opened.</li></ol>
          <p className="muted" style={{ marginBottom: 0 }}>Renewing while active adds days after your current end date. Changing plan applies the new plan straight away.</p></div>
      </div>

      {pending ? (
        <div className="card"><div className="card-h"><h3>Request waiting for the admin</h3><Badge v="pending">Waiting for admin</Badge></div>
          <dl className="kv"><dt>Type</dt><dd>{KIND[pending.kind]}</dd><dt>Plan</dt><dd>{pending.plan} × {pending.months} month(s)</dd><dt>Amount</dt><dd>{money(pending.amount)}{pending.discount > 0 && <small className="muted"> ({pending.discount}% off)</small>}</dd>
            <dt>Paid via</dt><dd>{METHOD[pending.method]}{pending.reference && <> · ref {pending.reference}</>}</dd><dt>Sent</dt><dd>{fmtTime(pending.createdAt)}</dd>{pending.note && <><dt>Your note</dt><dd>{pending.note}</dd></>}</dl>
          {showProof === pending._id && <AuthImage url={`/sub-requests/${pending._id}/proof`} alt="Your payment screenshot" />}
          <div className="row wrap-gap"><button className="btn" onClick={() => setShowProof(showProof === pending._id ? "" : pending._id)}><Icon n="image" /> {showProof === pending._id ? "Hide" : "View"} my screenshot</button>
            <Link className="btn" to="/seller/chat"><Icon n="chat" /> Message admin</Link><button className="btn danger ghost" onClick={cancel}>Cancel request</button></div>
        </div>
      ) : (
        <form className="card" onSubmit={submit}>
          <div className="card-h"><h3>{s.live ? "Renew or change plan" : "Activate your store"}</h3></div>
          <h4 className="step-h"><i>1</i> Choose a plan</h4>
          <div className="plan-pick">{plans.map((p) => { const bad = blocked(p), cur = p.name === s.subscription?.plan; return (
            <button type="button" key={p._id} disabled={bad} className={"plan-opt" + (planName === p.name ? " on" : "")} onClick={() => setPlanName(p.name)} aria-pressed={planName === p.name}>
              <span className="tag">{cur ? "Current plan" : bad ? "Too small" : "\u00a0"}</span><b>{p.name}</b><strong>Rs {p.price.toLocaleString("en-PK")}<small>/month</small></strong>
              <small>{p.maxProducts} {noun}</small><small>{p.maxImages} photos per item</small>{bad && <small className="red-t">{why(p)}</small>}</button>); })}</div>

          <h4 className="step-h"><i>2</i> How long?</h4>
          <div className="dur-pick">{months.map((x) => (
            <button type="button" key={x.months} className={mo === x.months ? "on" : ""} onClick={() => setMo(x.months)} aria-pressed={mo === x.months}>
              <b>{x.months === 12 ? "1 year" : x.months + (x.months === 1 ? " month" : " months")}</b><small>{x.days} days</small>{x.discount > 0 && <em>Save {x.discount}%</em>}</button>))}</div>

          {plan && <div className="sum-box">
            <div className="row between"><span>{plan.name} × {dur.months} month(s)</span><span>{money(plan.price * dur.months)}</span></div>
            {dur.discount > 0 && <div className="row between"><span>Discount ({dur.discount}%)</span><span className="green-t">- {money(plan.price * dur.months - amount)}</span></div>}
            <div className="row between big-t"><b>Amount to pay</b><b>{money(amount)}</b></div>
            <small className="muted">{KIND[kind]}: {s.live ? "your store stays open and" : "your store opens and"} runs until <b>{fmtDate(newEnd)}</b> after the admin confirms.</small></div>}

          <h4 className="step-h"><i>3</i> Payment method</h4>
          <div className="chips">{methods.map((m) => <button type="button" key={m} className={"chip" + (method === m ? " on" : "")} aria-pressed={method === m} onClick={() => setMethod(m)}>{METHOD[m]}</button>)}</div>
          {anyPay ? <>
            {det && <div className="paybox"><p>Send <b>{money(amount)}</b> to:</p>
              {det.bankName && <Copyable label="Bank" value={det.bankName} />}<Copyable label="Account title" value={det.title} />
              <Copyable label={method === "bank" ? "Account no" : "Mobile no"} value={det.number} />{det.iban && <Copyable label="IBAN" value={det.iban} />}</div>}
            {pay.instructions && <p className="muted pre">{pay.instructions}</p>}</>
            : <div className="banner"><Icon n="alert" /><div>Orderistan's {METHOD[method]} account details are not listed yet. Send your request now: the admin will message you the account details in <Link to="/seller/chat">chat</Link> and approve the request after your payment.</div></div>}

          <h4 className="step-h"><i>4</i> Payment proof {!anyPay && <small className="muted">(optional for now)</small>}</h4>
          <div className="grid2"><Field label="Payment screenshot" hint={anyPay ? "Required. JPG, PNG or WEBP, up to 5 MB" : "You can also send it later in chat"}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files[0] || null)} /></Field>
            <Field label="Transaction ID (optional)"><input value={f.reference} maxLength={60} onChange={(e) => setF({ ...f, reference: e.target.value })} placeholder="e.g. TID 123456" /></Field></div>
          {preview && <img className="shot" src={preview} alt="Screenshot preview" />}
          <Field label="Note for the admin (optional)"><input value={f.note} maxLength={300} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>

          {plan && <div className="sum-box"><b>Request summary</b>
            <dl className="kv"><dt>Request</dt><dd>{KIND[kind]}</dd><dt>Plan</dt><dd>{plan.name} · {plan.maxProducts} {noun}, {plan.maxImages} photos per item</dd><dt>Duration</dt><dd>{dur.months} month(s) · {dur.days} days</dd>
              <dt>Method</dt><dd>{METHOD[method]}</dd><dt>Amount</dt><dd><b>{money(amount)}</b></dd><dt>Active until</dt><dd>{fmtDate(newEnd)}</dd></dl></div>}
          <div className="row wrap-gap"><button className="btn primary lg" disabled={busy || !plan || blocked(plan) || (anyPay && !file)}>{busy ? "Sending..." : <><Icon n="send" /> Send request to admin</>}</button>
            <Link className="btn lg" to="/seller/chat"><Icon n="chat" /> Chat with admin</Link></div>
        </form>
      )}

      <div className="card"><div className="card-h"><h3>Request history</h3></div>
        {!history.length ? <p className="muted" style={{ marginBottom: 0 }}>No requests yet.</p> : (
          <div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Type</th><th>Plan</th><th>Amount</th><th>Status</th><th /></tr></thead><tbody>
            {history.map((h) => (<tr key={h._id}><td className="nowrap">{fmtTime(h.createdAt)}</td><td>{KIND[h.kind]}</td><td>{h.plan} × {h.months} mo</td><td><b>{money(h.amount)}</b><br /><small className="muted">{METHOD[h.method]}</small></td>
              <td><Badge v={STATE[h.status]}>{STATE_LABEL[h.status]}</Badge>{h.adminNote && <><br /><small className="muted">{h.adminNote}</small></>}{h.status === "approved" && h.endsAtAfter && <><br /><small className="muted">Active until {fmtDate(h.endsAtAfter)}</small></>}</td>
              <td>{h.hasProof && <button className="btn sm" onClick={() => setShowProof(showProof === h._id ? "" : h._id)}><Icon n="image" /></button>}</td></tr>))}
          </tbody></table>
            {history.filter((h) => h._id === showProof && h._id !== pending?._id).map((h) => <AuthImage key={h._id} url={`/sub-requests/${h._id}/proof`} alt="Payment screenshot" />)}</div>)}
      </div>
    </>
  );
}
