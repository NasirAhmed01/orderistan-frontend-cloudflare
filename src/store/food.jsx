import { useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { thumb } from "../api";
import { Badge, Empty, Icon, Spinner, money, useGet, waLink } from "../ui";
import { SkeletonGrid } from "../kit";
import { dealText, fromPrice, offPct } from "../pricing";
import { Crumbs, Gallery, HeaderActions, useCatalog } from "./common";
import { FoodConfigurator } from "./configurators";
import { useStore } from "./ctx";
import { Heart } from "./parts";

// FOOD - restaurant website: warm hero, deals strip, sticky menu categories, menu cards with prices "from"
export function FoodHeader() {
  const { store, sp } = useStore(); const [open, setOpen] = useState(false);
  return (
    <header className="fd-head">
      <div className="fd-top"><div className="container"><span><Icon n="clock" /> Order online - fresh &amp; hot</span>{store.phone && <a href={"tel:" + store.phone}><Icon n="phone" /> {store.phone}</a>}</div></div>
      <div className="container fd-bar">
        <button className="icon-btn sf-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon n={open ? "x" : "menu"} /></button>
        <Link to={sp("/")} className="fd-brand">{store.logo ? <img src={thumb(store.logo, 120)} alt="" /> : <b>{store.name.slice(0, 1).toUpperCase()}</b>}<span>{store.name}</span></Link>
        <nav className={"fd-nav" + (open ? " on" : "")} onClick={() => setOpen(false)}><NavLink to={sp("/")} end>Menu</NavLink><NavLink to={sp("/about")}>Our story</NavLink><NavLink to={sp("/contact")}>Find us</NavLink><NavLink to={sp("/track")}>Track order</NavLink><NavLink to={sp("/faq")}>FAQ</NavLink></nav>
        <HeaderActions />
      </div>
    </header>
  );
}

function MenuCard({ p }) {
  const { sp } = useStore(); const dt = dealText(p), off = offPct(p);
  return (
    <article className="fd-card">
      <Link to={sp("/p/" + p._id)} className="fd-img">{p.images[0] ? <img src={thumb(p.images[0], 420)} alt={p.name} loading="lazy" decoding="async" /> : <span><Icon n="utensils" /></span>}{(dt || off > 0) && <i className="fd-badge">{dt || `-${off}%`}</i>}</Link>
      <div className="fd-body"><Link to={sp("/p/" + p._id)}><h3>{p.name}</h3></Link>
        {p.description && <p>{p.description.slice(0, 90)}</p>}
        {p.sizes?.length > 1 && <div className="fd-sizes">{p.sizes.map((s) => <span key={s.name}>{s.name}</span>)}</div>}
        <div className="fd-foot"><div className="price">{p.sizes?.length ? <small>from</small> : null} {money(fromPrice(p))}{p.comparePrice > p.price && <s>{money(p.comparePrice)}</s>}</div>
          {p.inStock ? <Link className="btn brand sm" to={sp("/p/" + p._id)}>{p.sizes?.length || p.addons?.length ? "Customise" : "Order"} <Icon n="right" /></Link> : <Badge v="rejected">Sold out</Badge>}</div></div>
      <Heart id={p._id} />
    </article>
  );
}

export function FoodHome() {
  const { store, sp } = useStore(); const { items, cats, loading } = useCatalog(); const [cat, setCat] = useState(""); const [q, setQ] = useState(""); const menu = useRef();
  const deals = items.filter((p) => dealText(p) || offPct(p) >= 10);
  const shown = useMemo(() => items.filter((p) => (!cat || p.category === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase()))), [items, cat, q]);
  const wa = waLink(store.whatsapp || store.phone, "Assalam o Alaikum! I would like to place an order.");
  return (
    <>
      <section className="fd-hero" style={store.banner ? { backgroundImage: `linear-gradient(90deg,#1a0d05ee,#1a0d0577),url(${thumb(store.banner, 1600)})` } : undefined}>
        <div className="container fd-hero-in"><span className="fd-kicker">{store.city ? `Serving ${store.city}` : "Freshly made"}</span><h1>{store.name}</h1>{store.tagline && <p className="fd-tag">{store.tagline}</p>}
          <div className="row wrap-gap"><button className="btn sun lg" onClick={() => menu.current?.scrollIntoView({ behavior: "smooth" })}>Order now</button>{wa && <a className="btn glass lg" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> WhatsApp</a>}</div>
          <ul className="fd-facts"><li><Icon n="truck" /> {store.deliveryFee > 0 ? (store.freeDeliveryOver > 0 ? `Free delivery over ${money(store.freeDeliveryOver)}` : `Delivery ${money(store.deliveryFee)}`) : "Free delivery"}</li><li><Icon n="shield" /> Pay by bank, JazzCash or cash</li></ul></div>
      </section>
      {deals.length > 0 && <section className="container fd-sec"><div className="fd-h"><h2>Today's deals</h2><p>Combos and discounts you will not want to miss.</p></div>
        <div className="fd-deals">{deals.map((p) => <Link key={p._id} to={sp("/p/" + p._id)} className="fd-deal"><div className="fd-deal-i">{p.images[0] && <img src={thumb(p.images[0], 360)} alt="" loading="lazy" />}</div>
          <div><span className="fd-chip">{dealText(p) || `-${offPct(p)}%`}</span><b>{p.name}</b><span className="price">{money(fromPrice(p))}</span></div></Link>)}</div></section>}
      <section className="container fd-sec" ref={menu} id="menu"><div className="fd-h"><h2>Our menu</h2><p>{items.length} item{items.length === 1 ? "" : "s"} made to order.</p></div>
        <div className="fd-tabs" role="tablist"><button role="tab" aria-selected={!cat} className={!cat ? "on" : ""} onClick={() => setCat("")}>All</button>{cats.map((c) => <button key={c} role="tab" aria-selected={cat === c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}
          <div className="sf-search"><Icon n="search" /><input placeholder="Search the menu" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the menu" /></div></div>
        {loading ? <SkeletonGrid /> : !shown.length ? <Empty icon="utensils">No dishes match. Try another category.</Empty> : <div className="fd-grid">{shown.map((p) => <MenuCard key={p._id} p={p} />)}</div>}</section>
      <section className="container fd-sec"><div className="fd-how"><div><b>1</b><span>Pick your dish</span></div><div><b>2</b><span>Choose size &amp; toppings</span></div><div><b>3</b><span>Pay &amp; we start cooking</span></div></div></section>
    </>
  );
}

export function FoodProduct() {
  const { id } = useParams(); const { add, sp, store } = useStore(); const nav = useNavigate();
  const d = useGet("/store/products/" + id);
  if (d.loading && !d.data) return <Spinner />;
  const p = d.data?.product; if (!p) return <Empty icon="box">Dish not found.</Empty>;
  const dt = dealText(p);
  return (
    <div className="container fd-detail"><Crumbs p={p} />
      <div className="fd-pd"><div><Gallery images={p.images} name={p.name} />{dt && <span className="fd-chip big">{dt}</span>}</div>
        <div><h1>{p.name}</h1><p className="pre muted">{p.description}</p>
          {p.inStock ? <FoodConfigurator p={p} onAdd={(sel, qty) => { add(p, qty, sel); nav(sp("/cart")); }} cta="Add to cart" /> : <Badge v="rejected">Sold out right now</Badge>}
          <div className="buy-perks"><span><Icon n="truck" /> {store.deliveryFee > 0 ? `Delivery ${money(store.deliveryFee)}` : "Free delivery"}</span><span><Icon n="shield" /> Payment verified by the restaurant</span></div></div></div>
    </div>
  );
}
