import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import api, { ROOT, errMsg, hostSlug } from "../api";
import { useAuth } from "../auth";
import { Field, Icon, Logo, toast } from "../ui";
import { PasswordInput } from "../kit";
import { TermsConsent } from "./Legal";


// Split-screen layout: brand panel on the left, form on the right
function AuthLayout({ seller, title, points, children }) {
  return (
    <div className="auth-page">
      <aside className={"auth-art" + (seller ? " seller" : "")}>
        <Logo />
        <div><h2>{title}</h2><ul>{points.map((p) => <li key={p}><Icon n="check" />{p}</li>)}</ul></div>
        <small>&copy; {new Date().getFullYear()} Orderistan - Karachi, Pakistan</small>
      </aside>
      <main className="auth-main">{children}</main>
    </div>
  );
}

const home = (u) => (u.role === "admin" ? "/admin" : u.role === "seller" ? "/seller" : "/account");

// Step 2 of sign-up: the 6-digit code that was e-mailed. Resend is allowed once per 60 s (the server enforces it too).
function VerifyStep({ email, onVerify, onResend, onBack, busy }) {
  const [code, setCode] = useState(""); const [wait, setWait] = useState(60);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  const resend = async () => { try { await onResend(); setWait(60); toast("A new code was sent."); } catch (x) { toast(errMsg(x), "err"); } };
  return (
    <form className="card auth" onSubmit={(e) => { e.preventDefault(); onVerify(code.replace(/\D/g, "")); }}>
      <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
      <h2>Check your email</h2>
      <p className="muted">We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.</p>
      <Field label="Verification code"><input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" autoFocus placeholder="123456" style={{ letterSpacing: ".4em", fontSize: "1.4rem", textAlign: "center" }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
      <button className="btn primary block" disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify and create account"}</button>
      <p className="muted center">{wait > 0 ? `Resend code in ${wait}s` : <a href="#" onClick={(e) => { e.preventDefault(); resend(); }}>Resend code</a>} &middot; <a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>Change email</a></p>
    </form>
  );
}

// Step 2 for the owner account only: the 6-digit code e-mailed after a correct password.
function OwnerCodeStep({ email, onBack }) {
  const { verifyAdminLogin } = useAuth(); const nav = useNavigate();
  const [code, setCode] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const u = await verifyAdminLogin(email, code); nav(home(u), { replace: true }); }
    catch (x) { toast(errMsg(x), "err"); setCode(""); }
    finally { setBusy(false); }
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
      <h2>Owner verification</h2>
      <p className="muted">Password accepted. We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes and works once.</p>
      <Field label="Verification code"><input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" autoFocus placeholder="123456" style={{ letterSpacing: ".4em", fontSize: "1.4rem", textAlign: "center" }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
      <button className="btn primary block" disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify and log in"}</button>
      <p className="muted center"><a href="#" onClick={(e) => { e.preventDefault(); onBack(); }}>Back to log in</a></p>
    </form>
  );
}

// Login for everyone on the root domain: customers, sellers and the owner
export function Login() {
  const { user, login } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ email: "", password: "" }); const [busy, setBusy] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  if (user) return <Navigate to={loc.state?.from && user.role === "customer" ? loc.state.from : home(user)} replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const u = await login(f.email, f.password);
      if (u.otpRequired) { setOwnerEmail(u.email); setF({ ...f, password: "" }); return; }
      nav(loc.state?.from && u.role === "customer" ? loc.state.from : home(u), { replace: true });
    } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  if (ownerEmail) return <AuthLayout title="Owner sign-in" points={["Two steps: password, then a code sent to your e-mail", "The code works once and expires in 10 minutes"]}><OwnerCodeStep email={ownerEmail} onBack={() => setOwnerEmail("")} /></AuthLayout>;
  return (
    <AuthLayout title="Welcome back to Orderistan." points={["Track every order in one place", "Manage your store or the whole platform", "Customers, sellers and the owner all log in here"]}>
    <form className="card auth" onSubmit={submit}>
      <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
      <h2>Log in</h2><p className="muted">Log in to your account.</p>
      <Field label="Email or username" hint="Sellers and the owner use their email. Customers can use email or username."><input required autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Password"><PasswordInput required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      <p className="muted" style={{ textAlign: "right", margin: "-4px 0 10px" }}><Link to="/forgot-password">Forgot password?</Link></p>
      <button className="btn primary block" disabled={busy}>{busy ? "Please wait..." : "Log in"}</button>
      <p className="muted center">New customer? <Link to="/signup">Create an account</Link> &middot; Seller? <Link to="/seller-signup">Open your store</Link></p>
    </form></AuthLayout>
  );
}

export function CustomerSignup() {
  const { user, register } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [f, setF] = useState({ name: "", username: "", phone: "", password: "" }); const [busy, setBusy] = useState(false); const [agree, setAgree] = useState(false);
  if (user) return <Navigate to={loc.state?.from && user.role === "customer" ? loc.state.from : home(user)} replace />;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: k === "username" ? e.target.value.toLowerCase().replace(/\s/g, "") : e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); if (!agree) return toast("Please accept the Terms of Use and Privacy Policy to continue.", "err"); setBusy(true);
    try { await register({ ...f, acceptTerms: true }); toast("Account created. Happy shopping!"); nav(loc.state?.from || "/stores", { replace: true }); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Shop from local sellers with one account." points={["Save favourites to your wishlist", "Pay by bank, JazzCash or Easypaisa", "Follow your delivery from order to doorstep"]}>
    <form className="card auth" onSubmit={submit}>
      <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
      <h2>Create your account</h2><p className="muted">Buy from any Orderistan store with one account.</p>
      <Field label="Full name"><input required value={f.name} onChange={set("name")} /></Field>
      <Field label="Username" hint="3-20 characters: letters, numbers, _ or . You can add your Gmail later from your profile."><input required minLength={3} maxLength={20} autoComplete="username" value={f.username} onChange={set("username")} /></Field>
      <Field label="Phone / WhatsApp"><input required placeholder="03xx xxxxxxx" value={f.phone} onChange={set("phone")} /></Field>
      <Field label="Password" hint="At least 8 characters, with a letter and a number"><PasswordInput required minLength={8} autoComplete="new-password" value={f.password} onChange={set("password")} /></Field>
      <TermsConsent checked={agree} onChange={setAgree} />
      <button className="btn primary block" disabled={busy || !agree}>{busy ? "Creating account..." : "Agree and create account"}</button>
      <p className="muted center">Already have an account? <Link to="/login">Log in</Link></p>
    </form></AuthLayout>
  );
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
export function SellerSignup() {
  const { user, registerSeller, verifySignup, resendSignup } = useAuth(); const nav = useNavigate(); const [step, setStep] = useState("form");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", storeName: "", slug: "", category: "" });
  const [touched, setTouched] = useState(false); const [busy, setBusy] = useState(false); const [agree, setAgree] = useState(false);
  if (user && step === "form") return <Navigate to={home(user)} replace />;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value, ...(k === "storeName" && !touched ? { slug: slugify(e.target.value) } : {}) }));
  const submit = async (e) => {
    e.preventDefault(); if (!f.category) return toast("Choose your business category.", "err"); if (!agree) return toast("Please accept the Terms of Use, Seller Agreement and Privacy Policy to continue.", "err"); setBusy(true);
    try { await registerSeller({ ...f, acceptTerms: true }); setStep("code"); toast("We emailed you a code."); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const verify = async (code) => {
    setBusy(true);
    try { await verifySignup(f.email.trim().toLowerCase(), code); toast("Store created! It goes live once the admin activates your subscription."); nav("/seller", { replace: true }); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  if (step === "code") return <AuthLayout seller title="Open your online store in minutes." points={[`Your own link: yourname.${ROOT}`, "Products, cart, reviews and order tracking", "Verify payments with one click"]}>
    <VerifyStep email={f.email.trim().toLowerCase()} busy={busy} onVerify={verify} onResend={() => resendSignup(f.email)} onBack={() => setStep("form")} /></AuthLayout>;
  return (
    <AuthLayout seller title="Open your online store in minutes." points={[`Your own link: yourname.${ROOT}`, "Products, cart, reviews and order tracking", "Verify payments with one click"]}>
    <form className="card auth wide" onSubmit={submit}>
      <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
      <h2>Open your store</h2>
      <div className="grid2">
        <Field label="Your name"><input required value={f.name} onChange={set("name")} /></Field>
        <Field label="Phone / WhatsApp"><input required placeholder="03xx xxxxxxx" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="Email"><input type="email" required value={f.email} onChange={set("email")} /></Field>
        <Field label="Password" hint="At least 8 characters, with a letter and a number"><PasswordInput required minLength={8} autoComplete="new-password" value={f.password} onChange={set("password")} /></Field>
        <Field label="Store name"><input required placeholder="Nasir Kitchen" value={f.storeName} onChange={set("storeName")} /></Field>
        <fieldset className="cat-pick signup"><legend>What kind of business is it?</legend>{[["food", "Food & Restaurant", "utensils"], ["clothing", "Clothing & Fashion", "shirt"], ["services", "Services", "briefcase"]].map(([k, l, ic]) => <button type="button" key={k} className={"cat-opt" + (f.category === k ? " on" : "")} aria-pressed={f.category === k} onClick={() => setF({ ...f, category: k })}><Icon n={ic} /><b>{l}</b></button>)}</fieldset>
        <Field label="Store link" hint={`Your store: ${f.slug || "yourname"}.${ROOT}`}>
          <input required value={f.slug} onChange={(e) => { setTouched(true); setF({ ...f, slug: slugify(e.target.value) }); }} /></Field>
      </div>
      <TermsConsent seller checked={agree} onChange={setAgree} />
      <button className="btn primary block" disabled={busy || !agree}>{busy ? "Sending code..." : "Agree and continue"}</button>
      <p className="muted center">Already have a store? <Link to="/login">Log in</Link></p>
    </form></AuthLayout>
  );
}

// Customer login/register inside a storefront
export function CustomerAuth({ base, store }) {
  const { user, login, register, logout } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [agree, setAgree] = useState(false);
  const [mode, setMode] = useState(loc.state?.mode === "register" ? "register" : "login"); const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", login: "", username: "", phone: "", password: "" });
  const to = loc.state?.from || base + "/";
  if (user?.role === "customer") return <Navigate to={to} replace />;
  const submit = async (e) => {
    e.preventDefault(); if (mode === "register" && !agree) return toast("Please accept the Terms of Use and Privacy Policy to continue.", "err"); setBusy(true);
    try {
      if (mode === "login") await login(f.login, f.password);
      else { await register({ name: f.name, username: f.username, phone: f.phone, password: f.password, acceptTerms: true }); toast("Account created. Happy shopping!"); }
      nav(to, { replace: true });
    }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const forgotHref = hostSlug() ? `https://${ROOT}/forgot-password` : "/forgot-password";
  if (user) return <div className="card auth"><p>You are signed in as a {user.role}. Seller and admin accounts are managed at <a href={`https://${ROOT}/login`}>{ROOT}</a>.</p><button className="btn" onClick={logout}>Log out</button></div>;
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === "login" ? "Log in" : "Create account"}</h2>
      <p className="muted">to order from {store.name}</p>
      {mode === "register" && <Field label="Full name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>}
      {mode === "login"
        ? <Field label="Email or username"><input required autoComplete="username" value={f.login} onChange={(e) => setF({ ...f, login: e.target.value })} /></Field>
        : <Field label="Username" hint="3-20 characters: letters, numbers, _ or . You can add your Gmail later from your profile."><input required minLength={3} maxLength={20} autoComplete="username" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, "") })} /></Field>}
      {mode === "register" && <Field label="Phone"><input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>}
      <Field label="Password" hint={mode === "register" ? "At least 8 characters, with a letter and a number" : undefined}><PasswordInput required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      {mode === "login" && <p className="muted" style={{ textAlign: "right", margin: "-4px 0 10px" }}><a href={forgotHref}>Forgot password?</a></p>}
      {mode === "register" && <TermsConsent checked={agree} onChange={setAgree} />}
      <button className="btn brand block" disabled={busy || (mode === "register" && !agree)}>{busy ? "Please wait..." : mode === "login" ? "Log in" : "Agree and continue"}</button>
      <p className="center muted">{mode === "login" ? "New here? " : "Already registered? "}
        <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Create an account" : "Log in"}</a></p>
    </form>
  );
}

// Forgot password: 1) e-mail -> code, 2) code + new password. The server answers the same whether or not the e-mail has an account.
export function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1); const [email, setEmail] = useState(""); const [code, setCode] = useState(""); const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false); const [wait, setWait] = useState(0);
  useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  const send = async (e) => {
    e?.preventDefault(); setBusy(true);
    try { await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() }); setStep(2); setWait(60); toast("If that email has an account, a code is on its way."); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const reset = async (e) => {
    e.preventDefault(); if (pw !== pw2) return toast("The two passwords do not match.", "err"); setBusy(true);
    try { await api.post("/auth/reset-password", { email: email.trim().toLowerCase(), code, password: pw }); toast("Password updated. Log in with your new password."); nav("/login", { replace: true }); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <AuthLayout title="Get back into your account." points={["We email you a 6-digit code", "The code works once and expires in 10 minutes", "Changing your password signs out every other device"]}>
    {step === 1 ? (
      <form className="card auth" onSubmit={send}>
        <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
        <h2>Forgot password</h2><p className="muted">Enter your account email and we will send you a code.</p>
        <Field label="Email"><input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <button className="btn primary block" disabled={busy}>{busy ? "Sending..." : "Send code"}</button>
        <p className="muted center"><Link to="/login">Back to log in</Link></p>
      </form>
    ) : (
      <form className="card auth" onSubmit={reset}>
        <Link to="/" className="logo"><b>O</b><div>Order<span>istan</span></div></Link>
        <h2>Set a new password</h2><p className="muted">If <b>{email}</b> has an account, we sent it a 6-digit code.</p>
        <Field label="Code"><input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus placeholder="123456" style={{ letterSpacing: ".4em", fontSize: "1.4rem", textAlign: "center" }} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} /></Field>
        <Field label="New password" hint="At least 8 characters, with a letter and a number"><PasswordInput required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Repeat new password"><PasswordInput required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        <button className="btn primary block" disabled={busy || code.length !== 6}>{busy ? "Saving..." : "Update password"}</button>
        <p className="muted center">{wait > 0 ? `Resend code in ${wait}s` : <a href="#" onClick={(e) => { e.preventDefault(); send(); }}>Resend code</a>} &middot; <a href="#" onClick={(e) => { e.preventDefault(); setStep(1); }}>Change email</a></p>
      </form>
    )}
    </AuthLayout>
  );
}
