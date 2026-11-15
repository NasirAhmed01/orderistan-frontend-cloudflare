import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { thumb } from "../api";
import { Badge, Empty, Icon, Spinner, money, useGet, waLink } from "../ui";
import { SkeletonGrid } from "../kit";
import { dealText, fromPrice, offPct } from "../pricing";
import { Crumbs, Gallery, HeaderActions, useCatalog } from "./common";
import { ClothingConfigurator } from "./configurators";
import { useStore } from "./ctx";
import { Heart, Stars } from "./parts";

// CLOTHING - fashion boutique: minimal centred header, full-bleed hero, collection tiles, tall 3:4 product photos
export function FashionHeader() {
  const { store, sp } = useStore(); const [open, setOpen] = useState(false);
  return (
    <header className="fa-head">
      <div className="fa-ann">{store.freeDeliveryOver > 0 ? `Free delivery on orders over ${money(store.freeDeliveryOver)}` : store.tagline || "New arrivals every week"}</div>
      <div className="container fa-bar">
        <button className="icon-btn sf-burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><Icon n={open ? "x" : "menu"} /></button>
        <nav className={"fa-nav" + (open ? " on" : "")} onClick={() => setOpen(false)}><NavLink to={sp("/")} end>Shop</NavLink><NavLink to={sp("/about")}>About</NavLink><NavLink to={sp("/contact")}>Contact</NavLink><NavLink to={sp("/track")}>Track order</NavLink></nav>
        <Link to={sp("/")} className="fa-brand">{store.logo ? <img src={thumb(store.logo, 160)} alt={store.name} /> : <span>{store.name}</span>}</Link>
        <HeaderActions />
      </div>
    </header>
  );
}

function Tile({ p }) {
  const { sp } = useStore(); const off = offPct(p), dt = dealText(p);
  return (
    <article className="fa-card">
      <Link to={sp("/p/" + p._id)} className="fa-img">{p.images[0] ? <><img src={thumb(p.images[0], 560)} alt={p.name} loading="lazy" decoding="async" />{p.images[1] && <img className="alt" src={thumb(p.images[1], 560)} alt="" loading="lazy" />}</> : <span><Icon n="shirt" /></span>}
        {(off > 0 || dt) && <i className="fa-tag">{dt || `-${off}%`}</i>}{!p.inStock && <i className="fa-sold">Sold out</i>}</Link>
      <Heart id={p._id} />
      <div className="fa-info"><Link to={sp("/p/" + p._id)}><h3>{p.name}</h3></Link>
        <div className="price">{money(fromPrice(p))}{p.comparePrice > fromPrice(p) && <s>{money(p.comparePrice)}</s>}{p.deal?.kind === "percent" && p.deal.value > 0 && <s>{money(p.price)}</s>}</div>
        {p.colors?.length > 0 && <div className="fa-dots">{p.colors.slice(0, 6).map((c) => <i key={c.name} title={c.name} style={{ background: c.hex }} />)}</div>}</div>
    </article>
  );
}

export function FashionHome() {
  const { store } = useStore(); const { items, cats, loading } = useCatalog(); const [cat, setCat] = useState(""); const [sort, setSort] = useState("newest");
  const hero = store.banner || items.find((p) => p.images[0])?.images[0];
  const shown = useMemo(() => { const l = items.filter((p) => !cat || p.category === cat); return sort === "low" ? [...l].sort((a, b) => fromPrice(a) - fromPrice(b)) : sort === "high" ? [...l].sort((a, b) => fromPrice(b) - fromPrice(a)) : l; }, [items, cat, sort]);
  const wa = waLink(store.whatsapp || store.phone, "Assalam o Alaikum! I saw your collection online.");
  const tiles = cats.map((c) => ({ c, img: items.find((p) => p.category === c && p.images[0])?.images[0] }));
  return (
    <>
      <section className="fa-hero" style={hero ? { backgroundImage: `linear-gradient(180deg,#0000 30%,#000a),url(${thumb(hero, 1800)})` } : undefined}>
        <div className="container"><span>{store.city || "New collection"}</span><h1>{store.name}</h1>{store.tagline && <p>{store.tagline}</p>}
          <div className="row wrap-gap"><a className="btn light lg" href="#shop" onClick={(e) => { e.preventDefault(); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>Shop the collection</a>{wa && <a className="btn ghost-light lg" href={wa} target="_blank" rel="noreferrer">Style advice on WhatsApp</a>}</div></div>
      </section>
      {tiles.length > 1 && <section className="container fa-sec"><div className="fa-h"><h2>Collections</h2></div>
        <div className="fa-tiles">{tiles.map(({ c, img }) => <button key={c} className={"fa-tile" + (cat === c ? " on" : "")} onClick={() => { setCat(c); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }} style={img ? { backgroundImage: `linear-gradient(#0000 40%,#000b),url(${thumb(img, 500)})` } : undefined}><span>{c}</span><em>Shop <Icon n="right" /></em></button>)}</div></section>}
      <section className="container fa-sec" id="shop"><div className="fa-h row between wrap-gap"><h2>{cat || "All pieces"} <small>{shown.length}</small></h2>
        <div className="row wrap-gap"><select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></div></div>
        {cats.length > 1 && <div className="fa-filter"><button className={!cat ? "on" : ""} onClick={() => setCat("")}>All</button>{cats.map((c) => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div>}
        {loading ? <SkeletonGrid /> : !shown.length ? <Empty icon="shirt">Nothing here yet. Check back soon.</Empty> : <div className="fa-grid">{shown.map((p) => <Tile key={p._id} p={p} />)}</div>}</section>
      <section className="container fa-sec"><div className="fa-promise"><div><Icon n="ruler" /><b>Know your fit</b><span>Every piece has its own size chart.</span></div><div><Icon n="truck" /><b>Delivered to you</b><span>{store.deliveryFee > 0 ? `Delivery ${money(store.deliveryFee)}` : "Free delivery"}</span></div><div><Icon n="shield" /><b>Verified payments</b><span>Bank, JazzCash, Easypaisa or COD.</span></div></div></section>
    </>
  );
}

export function FashionProduct() {
  const { id } = useParams(); const { add, sp, store } = useStore(); const nav = useNavigate(); const [color, setColor] = useState("");
  const d = useGet("/store/products/" + id); const rel = useCatalog();
  if (d.loading && !d.data) return <Spinner />;
  const p = d.data?.product; if (!p) return <Empty icon="box">This piece was not found.</Empty>;
  const colorImg = (p.colors || []).find((c) => c.name === color)?.image;
  const related = rel.items.filter((x) => x._id !== p._id && x.category === p.category).slice(0, 4);
  return (
    <div className="container fa-detail"><Crumbs p={p} />
      <div className="fa-pd"><Gallery images={p.images} name={p.name} extra={colorImg} />
        <div className="fa-pd-info"><h1>{p.name}</h1>{p.ratingCount > 0 && <p><Stars v={p.ratingAvg} /> <span className="muted">({p.ratingCount})</span></p>}
          <div className="price lg">{money(fromPrice(p))}{p.comparePrice > fromPrice(p) && <s>{money(p.comparePrice)}</s>}{p.deal?.kind === "percent" && p.deal.value > 0 && <><s>{money(p.price)}</s><Badge v="rejected">{dealText(p)}</Badge></>}</div>
          <p className="pre muted">{p.description}</p>
          {p.inStock ? <ClothingConfigurator p={p} onColor={setColor} onAdd={(sel, qty) => { add(p, qty, sel); nav(sp("/cart")); }} /> : <Badge v="rejected">Sold out</Badge>}
          <div className="buy-perks"><span><Icon n="truck" /> {store.deliveryFee > 0 ? `Delivery ${money(store.deliveryFee)}` : "Free delivery"}</span><span><Icon n="shield" /> Payment verified by the seller</span></div></div></div>
      {related.length > 0 && <section className="fa-sec"><div className="fa-h"><h2>You may also like</h2></div><div className="fa-grid">{related.map((x) => <Tile key={x._id} p={x} />)}</div></section>}
    </div>
  );
}
