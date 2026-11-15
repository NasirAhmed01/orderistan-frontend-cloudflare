import { useRef, useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../auth";
import { PasswordInput } from "../kit";
import { Avatar, Badge, Field, Icon, PageHead, confirmBox, fmtTime, toast } from "../ui";

// Personal details form (customer, seller and admin all use the same API: PUT /auth/me)
export function ProfileDetails() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, phone: user.phone || "" }); const [busy, setBusy] = useState(false);
  const save = async (e) => { e.preventDefault(); setBusy(true); try { const { data } = await api.put("/auth/me", f); setUser(data.user); toast("Profile saved."); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); } };
  return (
    <form className="card" onSubmit={save}>
      <div className="card-h"><h3>Personal details</h3></div>
      <Field label="Full name"><div className="input-ico"><Icon n="user" /><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div></Field>
      <Field label="Phone / WhatsApp"><div className="input-ico"><Icon n="phone" /><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="03xx xxxxxxx" /></div></Field>
      {user.role !== "customer" && <Field label="Email" hint="Your email is your login and cannot be changed here."><div className="input-ico"><Icon n="mail" /><input value={user.email} disabled /></div></Field>}
      <button className="btn primary" disabled={busy}>{busy ? "Saving..." : "Save changes"}</button>
    </form>
  );
}

// Change password (PUT /auth/password). The API returns a fresh token, handled in api.js.
export function PasswordForm() {
  const [pw, setPw] = useState({ current: "", next: "" }); const [busy, setBusy] = useState(false);
  const save = async (e) => { e.preventDefault(); setBusy(true); try { await api.put("/auth/password", pw); toast("Password updated."); setPw({ current: "", next: "" }); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); } };
  const strength = Math.min(4, (pw.next.length >= 8) + /[A-Z]/.test(pw.next) + /\d/.test(pw.next) + /[^A-Za-z0-9]/.test(pw.next));
  return (
    <form className="card" onSubmit={save}>
      <div className="card-h"><h3>Change password</h3></div>
      <Field label="Current password"><PasswordInput required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
      <Field label="New password" hint="At least 8 characters. Other devices will be signed out.">
        <PasswordInput required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
      {pw.next && <div className={"meter s" + strength} aria-label="Password strength"><i /><i /><i /><i /><span>{["Too short", "Weak", "Okay", "Good", "Strong"][strength]}</span></div>}
      <button className="btn primary" disabled={busy}>{busy ? "Updating..." : "Update password"}</button>
    </form>
  );
}

// Customer only: link a Gmail to this account. A code goes TO that Gmail, so only its owner can link it.
export function GmailCard() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [code, setCode] = useState(""); const [step, setStep] = useState("form"); const [sentTo, setSentTo] = useState(""); const [busy, setBusy] = useState(false);
  const sendCode = async (e) => {
    e?.preventDefault(); setBusy(true);
    try { const { data } = await api.post("/me/gmail", { email: email.trim(), ...(user.email ? { password } : {}) }); setSentTo(data.email); setCode(""); setStep("code"); toast(data.message); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const verify = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const { data } = await api.post("/me/gmail/verify", { email: sentTo, code }); setUser(data.user); setStep("form"); setEmail(""); setPassword(""); setCode(""); toast("Gmail linked to your account."); }
    catch (x) { toast(errMsg(x), "err"); setCode(""); } finally { setBusy(false); }
  };
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-h"><h3>Gmail</h3></div>
      {user.email
        ? <p className="muted">Linked: <b>{user.email}</b>. You can log in with it or with your username.</p>
        : <p className="muted">Link a Gmail to log in with it and to recover your password. We send a code to that Gmail to confirm it is yours.</p>}
      {step === "form" ? (
        <form onSubmit={sendCode}>
          <Field label={user.email ? "New Gmail address" : "Gmail address"}><div className="input-ico"><Icon n="mail" /><input type="email" required placeholder="name@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div></Field>
          {user.email && <Field label="Current password" hint="Needed to change a linked Gmail."><PasswordInput required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>}
          <button className="btn primary" disabled={busy}>{busy ? "Sending code..." : "Send code to this Gmail"}</button>
        </form>
      ) : (
        <form onSubmit={verify}>
          <p className="muted">Enter the 6-digit code sent to <b>{sentTo}</b>. It expires in 10 minutes and works once.</p>
          <Field label="Verification code"><input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} style={{ letterSpacing: ".4em", fontSize: "1.2rem", textAlign: "center" }} /></Field>
          <div className="row wrap-gap"><button className="btn primary" disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify and link"}</button><button type="button" className="btn ghost" onClick={() => setStep("form")}>Change address</button></div>
        </form>
      )}
    </div>
  );
}

export const ProfileForms = () => <div className="grid2"><ProfileDetails /><PasswordForm /></div>;

// Center-crops the chosen photo to a 512x512 JPEG in the browser (small upload, works with phone photos). Falls back to the original file.
async function squarePhoto(file) {
  try {
    const bmp = await createImageBitmap(file); const side = Math.min(bmp.width, bmp.height), out = Math.min(512, side);
    const c = document.createElement("canvas"); c.width = c.height = out;
    c.getContext("2d").drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
    return blob ? new File([blob], "avatar.jpg", { type: "image/jpeg" }) : file;
  } catch { return file; }
}

// Identity card shown at the top of every profile screen
export function IdentityCard() {
  const { user, store, setUser } = useAuth(); const input = useRef(); const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files[0]; e.target.value = ""; if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return toast("Choose a JPG, PNG, WEBP or GIF photo.", "err");
    if (file.size > 15 * 1024 * 1024) return toast("That photo is too large.", "err");
    setBusy(true);
    try { const fd = new FormData(); fd.append("avatar", await squarePhoto(file)); const { data } = await api.put("/auth/me/avatar", fd); setUser(data.user); toast("Profile picture updated."); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!(await confirmBox({ title: "Remove profile picture?", body: "Your initials will be shown instead.", ok: "Remove", danger: true }))) return;
    setBusy(true);
    try { const { data } = await api.delete("/auth/me/avatar"); setUser(data.user); toast("Profile picture removed."); } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <div className="card row wrap-gap id-card" style={{ gap: 18 }}>
      <div style={{ textAlign: "center" }}>
        <Avatar name={user.name} src={user.avatar} size="lg" solid />
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pick} />
        <div className="row wrap-gap" style={{ marginTop: 8, justifyContent: "center" }}>
          <button type="button" className="btn sm" disabled={busy} onClick={() => input.current.click()}><Icon n="image" /> {busy ? "Uploading..." : user.avatar ? "Change" : "Add photo"}</button>
          {user.avatar && !busy && <button type="button" className="btn sm danger ghost" onClick={remove}>Remove</button>}
        </div></div>
      <div className="grow"><h3 style={{ margin: 0 }}>{user.name}</h3>
        <div className="muted">{user.email || (user.username ? "@" + user.username : "")}{user.phone ? ` - ${user.phone}` : ""}</div>
        <div className="row wrap-gap" style={{ marginTop: 8 }}>
          <Badge v="active">{user.role === "admin" ? "Platform owner" : user.role}</Badge>
          {store?.name && <span className="muted"><Icon n="store" /> {store.name}</span>}
          {user.lastLoginAt && <span className="muted"><Icon n="clock" /> Last login {fmtTime(user.lastLoginAt)}</span>}
        </div></div>
    </div>
  );
}

// Full page used inside the admin and seller dashboards
export default function ProfilePage() {
  return (<><PageHead title="My profile" sub="Manage your personal details and password." /><IdentityCard /><ProfileForms /></>);
}
