import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { errMsg, thumb } from "../api";
import { useAuth } from "../auth";
import { Badge, Empty, Field, Icon, Spinner, fmtTime, money, toast, useGet, waLink } from "../ui";
import { SkeletonGrid } from "../kit";
import { fmtMins, ymd } from "../pricing";
import { Crumbs, Gallery, HeaderActions, Hours, useCatalog } from "./common";
import { useStore } from "./ctx";

// SERVICES - professional business site: split hero, service cards, packages, booking calendar / request form
export function ServicesHeader() {
  const { store, sp } = useStore(); const [open, setOpen] = useState(false);
  return (
    <header className="sv-head">
      <div className="container sv-bar">
        <Link to={sp("/")} className="sv-brand">{store.logo ? <img src={thumb(store.logo, 120)} alt="" /> : <b>{store.name.slice(0, 1).toUpperCase()}</b>}<span>{store.name}</span></Link>
        <button className="icon-btn sf-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon n={open ? "x" : "menu"} /></button>
        <nav className={"sv-nav" + (open ? " on" : "")} onClick={() => setOpen(false)}><NavLink to={sp("/")} end>Services</NavLink><NavLink to={sp("/about")}>About</NavLink><NavLink to={sp("/contact")}>Contact</NavLink><NavLink to={sp("/faq")}>FAQ</NavLink><NavLink to={sp("/bookings")}>My bookings</NavLink></nav>
        <div className="row">{store.phone && <a className="btn sm hide-sm" href={"tel:" + store.phone}><Icon n="phone" /> {store.phone}</a>}<HeaderActions wishlist={false} cart={false} /></div>
      </div>
    </header>
  );
}

function ServiceCard({ p }) {
  const { sp } = useStore(); const req = p.bookingMode === "request"; const low = Math.min(p.price || Infinity, ...(p.packages || []).map((x) => x.price));
  return (
    <article className="sv-card">
      <Link to={sp("/p/" + p._id)} className="sv-img">{p.images[0] ? <img src={thumb(p.images[0], 520)} alt={p.name} loading="lazy" decoding="async" /> : <span><Icon n="briefcase" /></span>}<Badge v={req ? "request" : "booking"}>{req ? "Request a quote" : "Instant booking"}</Badge></Link>
      <div className="sv-body"><small>{p.category}</small><Link to={sp("/p/" + p._id)}><h3>{p.name}</h3></Link>
        {p.description && <p>{p.description.slice(0, 110)}</p>}
        <div className="sv-meta">{p.duration > 0 && <span><Icon n="clock" /> {fmtMins(p.duration)}</span>}{p.packages?.length > 0 && <span><Icon n="layers" /> {p.packages.length} packages</span>}</div>
        <div className="fd-foot"><div className="price"><small>from</small> {isFinite(low) ? money(low) : money(p.price)}</div><Link className="btn brand sm" to={sp("/p/" + p._id)}>{req ? "Request" : "Book now"} <Icon n="right" /></Link></div></div>
    </article>
  );
}

export function ServicesHome() {
  const { store, sp } = useStore(); const { items, cats, loading } = useCatalog(); const [cat, setCat] = useState("");
  const shown = useMemo(() => items.filter((p) => !cat || p.category === cat), [items, cat]);
  const hero = store.banner || items.find((p) => p.images[0])?.images[0];
  const wa = waLink(store.whatsapp || store.phone, "Assalam o Alaikum! I would like to know about your services.");
  const packs = items.flatMap((p) => (p.packages || []).map((k) => ({ ...k, service: p })));
  return (
    <>
      <section className="sv-hero"><div className="container sv-hero-in">
        <div><span className="sv-kicker">{store.city ? `Serving ${store.city}` : "Professional services"}</span><h1>{store.name}</h1>{store.tagline && <p>{store.tagline}</p>}
          <div className="row wrap-gap"><a className="btn brand lg" href="#services" onClick={(e) => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}>Book a service</a>{wa && <a className="btn lg" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> WhatsApp us</a>}</div>
          <ul className="sv-trust"><li><Icon n="check" /> Choose your own time</li><li><Icon n="check" /> Clear pricing</li><li><Icon n="check" /> Confirmed by the team</li></ul></div>
        <div className="sv-hero-img">{hero ? <img src={thumb(hero, 900)} alt="" /> : <span><Icon n="briefcase" /></span>}</div></div></section>
      <section className="container sv-sec" id="services"><div className="sv-h"><h2>Our services</h2><p>Pick a service, choose a package and book your slot.</p></div>
        {cats.length > 1 && <div className="chips"><button className={"chip" + (!cat ? " on" : "")} onClick={() => setCat("")}>All services</button>{cats.map((c) => <button key={c} className={"chip" + (cat === c ? " on" : "")} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {loading ? <SkeletonGrid n={6} /> : !shown.length ? <Empty icon="briefcase">No services listed yet.</Empty> : <div className="sv-grid">{shown.map((p) => <ServiceCard key={p._id} p={p} />)}</div>}</section>
      {packs.length > 0 && <section className="sv-band"><div className="container"><div className="sv-h"><h2>Popular packages</h2></div>
        <div className="sv-packs">{packs.slice(0, 6).map((k, i) => <Link key={i} to={sp("/p/" + k.service._id)} className="sv-pack"><small>{k.service.name}</small><b>{k.name}</b><span className="price">{money(k.price)}</span>{k.duration > 0 && <em>{fmtMins(k.duration)}</em>}{k.description && <p>{k.description}</p>}</Link>)}</div></div></section>}
      <section className="container sv-sec"><div className="sv-how"><div><b>1</b><h4>Choose</h4><p>Pick the service and package that suits you.</p></div><div><b>2</b><h4>Book</h4><p>Select a date and time that works for you.</p></div><div><b>3</b><h4>Relax</h4><p>We confirm and take care of the rest.</p></div></div></section>
      <section className="container sv-sec"><div className="sv-contact card"><div><h2>Visit or contact us</h2>
        {store.address && <p><Icon n="pin" /> {store.address}{store.city && `, ${store.city}`}</p>}{store.phone && <p><Icon n="phone" /> <a href={"tel:" + store.phone}>{store.phone}</a></p>}{wa && <p><Icon n="chat" /> <a href={wa} target="_blank" rel="noreferrer">Message on WhatsApp</a></p>}
        <Link className="btn" to={sp("/contact")}>Contact page</Link></div><div><h4>Opening hours</h4><Hours store={store} /></div></div></section>
    </>
  );
}

// ---- booking / request ---------------------------------------------------------------------------------------------------------------------
export function ServiceDetail() {
  const { id } = useParams(); const { store, sp } = useStore(); const d = useGet("/store/products/" + id);
  if (d.loading && !d.data) return <Spinner />;
  const p = d.data?.product; if (!p) return <Empty icon="box">Service not found.</Empty>;
  return (
    <div className="container sv-detail"><Crumbs p={p} />
      <div className="sv-pd"><div><Gallery images={p.images} name={p.name} /><h1>{p.name}</h1>
        <div className="sv-meta big">{p.duration > 0 && <span><Icon n="clock" /> {fmtMins(p.duration)}</span>}<Badge v={p.bookingMode === "request" ? "request" : "booking"}>{p.bookingMode === "request" ? "Request a quote" : "Instant booking"}</Badge></div>
        <p className="pre muted">{p.description}</p>
        <div className="card flat"><b>{store.name}</b><br /><small className="muted">{[store.phone, store.address].filter(Boolean).join(" · ")}</small><br /><Link to={sp("/contact")}>Contact details</Link></div></div>
        <BookingBox p={p} /></div>
    </div>
  );
}

function BookingBox({ p }) {
  const { store, sp } = useStore(); const { user } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const req = p.bookingMode === "request", packs = p.packages || [], adds = p.addons || [];
  const [pack, setPack] = useState(packs[0]?.name || ""); const [picked, setPicked] = useState([]); const [date, setDate] = useState(""); const [time, setTime] = useState("");
  const [slots, setSlots] = useState(null); const [busy, setBusy] = useState(false); const [f, setF] = useState({ name: user?.name || "", phone: user?.phone || "", note: "" });
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const openDays = new Set((store.availability?.days || []).filter((x) => x.open).map((x) => x.day));
  useEffect(() => {
    if (req || !date) return; setSlots(null); setTime("");
    api.get("/store/availability", { params: { date } }).then((r) => setSlots(r.data)).catch((e) => { toast(errMsg(e), "err"); setSlots({ open: false, slots: [] }); });
  }, [date, req]);
  const chosen = packs.find((x) => x.name === pack);
  const total = (chosen ? chosen.price : p.price) + adds.filter((a) => picked.includes(a.name)).reduce((s, a) => s + a.price, 0);
  const submit = async (e) => {
    e.preventDefault();
    if (user?.role !== "customer") return nav(sp("/login"), { state: { from: loc.pathname } });
    if (!req && (!date || !time)) return toast("Choose a date and a time slot.", "err");
    setBusy(true);
    try { const { data } = await api.post("/store/bookings", { product: p._id, package: pack, addons: picked, date, time, ...f }); toast(req ? "Request sent!" : "Booking placed!"); nav(sp("/bookings"), { state: { placed: data.booking._id }, replace: true }); }
    catch (x) { toast(errMsg(x), "err"); if (x?.response?.status === 409 && date) { setTime(""); api.get("/store/availability", { params: { date } }).then((r) => setSlots(r.data)).catch(() => {}); } }
    finally { setBusy(false); }
  };
  return (
    <form className="card bk" onSubmit={submit}><h3>{req ? "Request this service" : "Book this service"}</h3>
      {packs.length > 0 && <fieldset className="cfg-sec"><legend>Package</legend><div className="pk-list">{packs.map((k) => <label key={k.name} className={"pk" + (pack === k.name ? " on" : "")}><input type="radio" name="pack" checked={pack === k.name} onChange={() => setPack(k.name)} /><div><b>{k.name}</b><small>{[k.duration ? fmtMins(k.duration) : "", k.description].filter(Boolean).join(" · ")}</small></div><span>{money(k.price)}</span></label>)}</div></fieldset>}
      {adds.length > 0 && <fieldset className="cfg-sec"><legend>Add-ons <small>optional</small></legend><div className="chk-list">{adds.map((a) => <label key={a.name} className={"chk" + (picked.includes(a.name) ? " on" : "")}><input type="checkbox" checked={picked.includes(a.name)} onChange={() => setPicked((x) => (x.includes(a.name) ? x.filter((n) => n !== a.name) : [...x, a.name]))} /><span>{a.name}</span><em>+{money(a.price)}</em></label>)}</div></fieldset>}
      {!req ? <>
        <fieldset className="cfg-sec"><legend>Date</legend><div className="dates">{days.map((d) => { const v = ymd(d), off = !openDays.has(d.getDay()); return <button type="button" key={v} disabled={off} className={"dt" + (date === v ? " on" : "")} onClick={() => setDate(v)}><small>{d.toLocaleDateString("en", { weekday: "short" })}</small><b>{d.getDate()}</b><small>{d.toLocaleDateString("en", { month: "short" })}</small></button>; })}</div></fieldset>
        {date && <fieldset className="cfg-sec"><legend>Time</legend>{!slots ? <Spinner /> : !slots.slots.length ? <p className="muted">Closed on this day.</p> : <div className="slots">{slots.slots.map((s) => <button type="button" key={s.time} disabled={!s.available} className={"slot" + (time === s.time ? " on" : "")} onClick={() => setTime(s.time)}>{s.time}</button>)}</div>}
          {slots?.slots?.length > 0 && !slots.slots.some((s) => s.available) && <p className="muted">Fully booked - try another day.</p>}</fieldset>}</>
        : <Field label="Preferred date (optional)"><input type="date" min={ymd(new Date())} value={date} onChange={(e) => setDate(e.target.value)} /></Field>}
      <div className="grid2"><Field label="Your name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Phone / WhatsApp"><input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field></div>
      <Field label={req ? "Tell us what you need" : "Note (optional)"}><textarea rows={3} required={req} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
      <div className="row between bk-total"><span>{req ? "Estimated price" : "Total"}</span><b>{money(total)}</b></div>
      <button className="btn brand lg block" disabled={busy}>{busy ? "Sending..." : user?.role !== "customer" ? "Log in to continue" : req ? "Send request" : "Confirm booking"}</button>
      <small className="muted">{req ? "The business will contact you with a quote." : "The business confirms your booking shortly. You pay at the service."}</small>
    </form>
  );
}

export function MyBookings() {
  const { sp } = useStore(); const { user } = useAuth(); const loc = useLocation();
  const d = useGet(user?.role === "customer" ? "/store/bookings" : null);
  if (user?.role !== "customer") return <Navigate to={sp("/login")} state={{ from: sp("/bookings") }} replace />;
  const cancel = async (b) => { if (!window.confirm("Cancel this booking?")) return; try { await api.post(`/store/bookings/${b._id}/cancel`); d.reload(); } catch (e) { toast(errMsg(e), "err"); } };
  return (
    <div className="container"><h1>My bookings</h1>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="calendar">No bookings yet. <Link to={sp("/")}>Browse services</Link></Empty> : d.data.items.map((b) => (
        <div className={"card order" + (loc.state?.placed === b._id ? " fresh" : "")} key={b._id}>
          {loc.state?.placed === b._id && <div className="banner ok"><Icon n="check" /><div>{b.type === "request" ? "Request sent! The business will contact you." : "Booking placed! You will be notified when it is confirmed."}</div></div>}
          <div className="row between wrap-gap"><div><b>{b.serviceName}</b>{b.packageName && <small className="muted"> · {b.packageName}</small>}</div><div><Badge v={b.type} /> <Badge v={b.status} /></div></div>
          <p className="muted" style={{ margin: "6px 0" }}>{b.date ? <><Icon n="calendar" /> {b.date}{b.time && ` at ${b.time}`}</> : "Date: flexible"} · {money(b.price)}{b.addons?.length > 0 && ` · + ${b.addons.join(", ")}`}</p>
          <small className="muted">Placed {fmtTime(b.createdAt)}</small>
          {["pending", "confirmed"].includes(b.status) && <div style={{ marginTop: 8 }}><button className="btn danger ghost sm" onClick={() => cancel(b)}>Cancel</button></div>}</div>))}
    </div>
  );
}
