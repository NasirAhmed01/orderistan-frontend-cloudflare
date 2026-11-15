import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ROOT, errMsg, thumb } from "../api";
import { useAuth } from "../auth";
import { Reveal, ScrollTop, SkeletonGrid, useScrolled } from "../kit";
import { Badge, Bell, Empty, Icon, Pager, UserMenu, money, toast, useGet, waLink } from "../ui";
import { discount } from "../pages/Market";
import { useStore } from "./ctx";
import { openCookieSettings } from "../consent";

export const Stars = ({ v }) => <span className="stars" aria-label={`${v} out of 5`}>{"★".repeat(Math.round(v))}<i>{"★".repeat(5 - Math.round(v))}</i></span>;

export function Heart({ id }) {
  const { wish, toggleWish, sp } = useStore(); const { user } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const on = wish.has(id);
  const click = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (user?.role !== "customer") return nav(sp("/login"), { state: { from: loc.pathname } });
    toggleWish(id).catch((x) => toast(errMsg(x), "err"));
  };
  return <button key={String(on)} className={"heart" + (on ? " on" : "")} onClick={click} aria-pressed={on} aria-label={on ? "Remove from wishlist" : "Add to wishlist"}>{on ? "♥" : "♡"}</button>;
}

export function Card({ p, i = 0 }) {
  const { sp, add } = useStore(); const [done, setDone] = useState(false);
  const off = discount(p);
  const buy = () => { add(p); setDone(true); setTimeout(() => setDone(false), 1400); };
  return (
    <div className="pcard in-grid" style={{ "--i": Math.min(i, 11) }}>
      {off > 0 && <span className="pbadge">-{off}%</span>}
      <Link to={sp("/p/" + p._id)} className="pimg">{p.images[0] ? <img src={thumb(p.images[0], 400)} alt={p.name} loading="lazy" decoding="async" /> : <span>No image</span>}</Link>
      <Heart id={p._id} />
      <div className="pinfo"><Link to={sp("/p/" + p._id)}><b>{p.name}</b></Link>
        {p.ratingCount > 0 && <span><Stars v={p.ratingAvg} /> <small className="muted">({p.ratingCount})</small></span>}
        <span className="price">{money(p.price)} {p.comparePrice > p.price && <s>{money(p.comparePrice)}</s>}</span>
        {p.inStock ? <button className={"btn brand sm add" + (done ? " done" : "")} onClick={buy}><Icon n={done ? "check" : "cart"} /> {done ? "Added" : "Add to cart"}</button> : <Badge v="rejected">Out of stock</Badge>}</div>
    </div>
  );
}

const LINKS = [["", "Home", true], ["/#shop", "Shop"], ["/about", "About"], ["/contact", "Contact"], ["/faq", "FAQ"]];

export function Header() {
  const { store, sp, cart, wish } = useStore(); const { user } = useAuth(); const nav = useNavigate(); const loc = useLocation();
  const [open, setOpen] = useState(false); const [q, setQ] = useState(""); const scrolled = useScrolled(10);
  const count = cart.reduce((a, i) => a + i.qty, 0); const cust = user?.role === "customer";
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  const search = (e) => { e.preventDefault(); nav(sp("/") + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : "")); setOpen(false); };
  const menu = [{ to: sp("/profile"), label: "My profile", icon: "user" }, { to: sp("/orders"), label: "My orders", icon: "bag" }, { to: sp("/wishlist"), label: "Wishlist", icon: "heart" },
    { to: sp("/notifications"), label: "Notifications", icon: "bell" }, { to: sp("/track"), label: "Track an order", icon: "truck" }];
  const ann = store.freeDeliveryOver > 0 ? <>Free delivery on orders over <b>{money(store.freeDeliveryOver)}</b></> : store.tagline ? <>{store.tagline}</> : <>Order online - the seller confirms on WhatsApp</>;
  return (
    <>
      <div className="sf-ann"><div className="container"><span>{ann}</span>{store.phone && <a href={"tel:" + store.phone}><Icon n="phone" /> {store.phone}</a>}</div></div>
      <header className={"sf-head" + (scrolled ? " scrolled" : "")}>
        <div className="container sf-bar">
          <button className="icon-btn sf-burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}><Icon n={open ? "x" : "menu"} /></button>
          <Link to={sp("/")} className="sf-brand">{store.logo ? <img src={thumb(store.logo, 120)} alt="" /> : <b className="sf-mark">{store.name.slice(0, 1).toUpperCase()}</b>}<span>{store.name}</span></Link>
          <nav className="sf-links" aria-label="Store">{LINKS.map(([to, l, end]) => to.includes("#")
            ? <a key={l} href={sp("/") + "#shop"} onClick={(e) => { e.preventDefault(); const go = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); if (loc.pathname === (sp("/") || "/") || loc.pathname === sp("")) go(); else { nav(sp("/")); setTimeout(go, 500); } }}>{l}</a>
            : <NavLink key={l} to={sp(to || "/")} end={end}>{l}</NavLink>)}</nav>
          <form className="sf-find" onSubmit={search} role="search"><Icon n="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this store" aria-label="Search this store" /></form>
          <div className="sf-actions">
            <Link to={sp("/wishlist")} className="icon-btn" aria-label="Wishlist"><Icon n="heart" />{wish.size > 0 && <b key={wish.size} className="count pop">{wish.size}</b>}</Link>
            <Link to={sp("/cart")} className="icon-btn" aria-label={`Cart, ${count} items`}><Icon n="cart" />{count > 0 && <b key={count} className="count pop">{count}</b>}</Link>
            {cust && <Bell base={sp("")} />}
            {cust ? <UserMenu items={menu} afterLogout={sp("/")} /> : <><Link className="btn ghost sm hide-sm" to={sp("/login")}>Log in</Link><Link className="btn brand sm" to={sp("/login")} state={{ mode: "register" }}>Sign up</Link></>}
          </div>
        </div>
        <div className={"sf-drawer" + (open ? " on" : "")}>
          <form onSubmit={search} className="sf-find"><Icon n="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this store" /></form>
          {LINKS.map(([to, l]) => <Link key={l} to={to.includes("#") ? sp("/") : sp(to || "/")}>{l}</Link>)}
          <Link to={sp("/track")}>Track an order</Link><Link to={sp("/policies")}>Delivery &amp; returns</Link>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  const { store, sp } = useStore(); const wa = waLink(store.whatsapp || store.phone, "Assalam o Alaikum! I have a question about your store.");
  return (
    <footer className="sf-foot">
      <div className="container sf-foot-grid">
        <div><div className="sf-brand light">{store.logo ? <img src={thumb(store.logo, 120)} alt="" /> : <b className="sf-mark">{store.name.slice(0, 1).toUpperCase()}</b>}<span>{store.name}</span></div>
          {store.tagline && <p>{store.tagline}</p>}
          {store.category !== "services" && <div className="pay-chips"><span>Bank transfer</span><span>JazzCash</span><span>Easypaisa</span><span>Cash on delivery</span></div>}</div>
        {store.category === "services" ? <div><h4>Services</h4><Link to={sp("/")}>All services</Link><Link to={sp("/bookings")}>My bookings</Link><Link to={sp("/contact")}>Request a quote</Link></div>
          : <div><h4>{store.category === "food" ? "Menu" : "Shop"}</h4><Link to={sp("/")}>{store.category === "food" ? "Full menu" : "All products"}</Link><Link to={sp("/wishlist")}>Wishlist</Link><Link to={sp("/cart")}>Cart</Link><Link to={sp("/orders")}>My orders</Link></div>}
        <div><h4>Help</h4>{store.category !== "services" && <Link to={sp("/track")}>Track an order</Link>}<Link to={sp("/policies")}>{store.category === "services" ? "Policies" : "Delivery & returns"}</Link><Link to={sp("/faq")}>FAQ</Link><Link to={sp("/contact")}>Contact us</Link></div>
        <div><h4>Visit us</h4>
          {store.address && <span><Icon n="pin" /> {store.address}{store.city && `, ${store.city}`}</span>}
          {store.phone && <a href={"tel:" + store.phone}><Icon n="phone" /> {store.phone}</a>}
          {wa && <a href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> WhatsApp us</a>}
          <Link to={sp("/about")}>About {store.name}</Link></div>
      </div>
      <div className="container sf-foot-end"><span>&copy; {new Date().getFullYear()} {store.name}</span><span className="sf-legal"><a href={`https://${ROOT}/terms`}>Terms</a><a href={`https://${ROOT}/privacy`}>Privacy</a><a href={`https://${ROOT}/cookies`}>Cookies</a><button type="button" className="linkbtn" onClick={openCookieSettings}>Cookie settings</button><span>Powered by <a href={`https://${ROOT}`}>Orderistan</a></span></span></div>
      <ScrollTop />
    </footer>
  );
}

const PERKS = (s) => [
  ["truck", "Delivery", s.deliveryFee > 0 ? (s.freeDeliveryOver > 0 ? `${money(s.deliveryFee)}, free over ${money(s.freeDeliveryOver)}` : money(s.deliveryFee) + " flat rate") : "Free delivery"],
  ["shield", "Verified payments", "The seller checks every payment"],
  ["chat", "WhatsApp support", "Message the seller directly"],
  ["clock", "Order tracking", "Follow your order step by step"]
];

export function Home() {
  const { store, sp } = useStore(); const [params] = useSearchParams();
  const [f, setF] = useState({ q: params.get("q") || "", category: "", sort: "newest" }); const [page, setPage] = useState(1);
  useEffect(() => { setF((x) => ({ ...x, q: params.get("q") || "" })); setPage(1); }, [params]);
  const cats = useGet("/store/categories"); const d = useGet("/store/products", { ...f, page });
  const top = useGet("/store/products", { sort: "popular", limit: 4 });
  const wa = waLink(store.whatsapp || store.phone, "Assalam o Alaikum! I found your store on Orderistan.");
  const browsing = !f.q && !f.category && page === 1;
  const shop = useRef();
  return (
    <>
      <section className="sf-hero" style={store.banner ? { backgroundImage: `linear-gradient(100deg,#000a,#0004),url(${thumb(store.banner, 1600)})` } : undefined}>
        <div className="sf-hero-in">
          <div className="sf-hero-logo" style={{ "--i": 0 }}>{store.logo ? <img src={thumb(store.logo, 200)} alt="" /> : <span>{store.name.slice(0, 1).toUpperCase()}</span>}</div>
          <h1 style={{ "--i": 1 }}>{store.name}</h1>
          {store.tagline && <p style={{ "--i": 2 }}>{store.tagline}</p>}
          {store.description && <small style={{ "--i": 3 }}>{store.description}</small>}
          <div className="row wrap-gap" style={{ "--i": 4 }}>
            <a className="btn sun lg" href="#shop" onClick={(e) => { e.preventDefault(); shop.current?.scrollIntoView({ behavior: "smooth" }); }}>Shop now</a>
            {wa && <a className="btn glass lg" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> Chat on WhatsApp</a>}
          </div>
        </div>
      </section>
      <div className="perks">{PERKS(store).map(([i, t, s]) => <div key={t}><span className="perk-ico"><Icon n={i} /></span><div><b>{t}</b><small>{s}</small></div></div>)}</div>

      {browsing && top.data?.items?.length > 0 && <section className="sf-sec"><Reveal>
        <div className="section-h"><div><h2>Popular right now</h2><p>What other customers are ordering.</p></div></div>
        <div className="pgrid">{top.data.items.map((p, i) => <Card key={p._id} p={p} i={i} />)}</div></Reveal></section>}

      <section className="sf-sec" id="shop" ref={shop}>
        <div className="section-h"><div><h2>{f.q ? `Results for "${f.q}"` : "All products"}</h2>{d.data?.total != null && <p>{d.data.total} item{d.data.total === 1 ? "" : "s"}</p>}</div></div>
        <div className="toolbar">
          <div className="sf-search"><Icon n="search" /><input placeholder="Search products..." value={f.q} onChange={(e) => { setF({ ...f, q: e.target.value }); setPage(1); }} /></div>
          <select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })} aria-label="Sort products"><option value="newest">Newest</option><option value="popular">Popular</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select>
        </div>
        {cats.data?.items?.length > 1 && <div className="chips"><button className={"chip" + (!f.category ? " on" : "")} onClick={() => { setF({ ...f, category: "" }); setPage(1); }}>All</button>
          {cats.data.items.map((c) => <button key={c} className={"chip" + (f.category === c ? " on" : "")} onClick={() => { setF({ ...f, category: c }); setPage(1); }}>{c}</button>)}</div>}
        {d.loading && !d.data ? <SkeletonGrid /> : !d.data?.items?.length ? <Empty icon="box">No products match. Try a different search or category.</Empty> : <div className={"pgrid" + (d.loading ? " busy" : "")}>{d.data.items.map((p, i) => <Card key={p._id} p={p} i={i} />)}</div>}
        <Pager data={d.data} onPage={(n) => { setPage(n); shop.current?.scrollIntoView({ behavior: "smooth" }); }} />
      </section>

      <Reveal className="sf-band"><div><h2>Questions before you order?</h2><p>Message {store.name} directly or read how delivery and payments work.</p></div>
        <div className="row wrap-gap"><Link className="btn glass" to={sp("/policies")}>Delivery &amp; returns</Link><Link className="btn sun" to={sp("/contact")}>Contact the seller</Link></div></Reveal>
    </>
  );
}
