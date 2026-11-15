import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ROOT, thumb } from "../api";
import { Empty, Icon, Pager, Spinner, money, useGet } from "../ui";
import MainHeader, { MainFooter } from "./MainHeader";

// Store cards link to /s/<slug> (same site) so a customer who is logged in on orderistan.site stays logged in while shopping.
export function StoreCard({ s }) {
  return (
    <Link to={`/s/${s.slug}`} className="scard" style={{ "--brand": s.themeColor }}>
      <div className="scard-banner" style={s.banner ? { backgroundImage: `url(${thumb(s.banner, 600)})` } : undefined} />
      <div className="scard-body">
        <div className="scard-logo">{s.logo ? <img src={thumb(s.logo, 120)} alt="" /> : <span>{s.name.slice(0, 1).toUpperCase()}</span>}</div>
        <b>{s.name}</b>
        {s.tagline && <span className="muted">{s.tagline}</span>}
        <small className="muted"><Icon n="pin" /> {s.city ? s.city + " - " : ""}{s.products} product{s.products === 1 ? "" : "s"}</small>
        <small className="muted"><Icon n="link" /> {s.slug}.{ROOT}</small>
      </div>
    </Link>
  );
}

export default function Market() {
  const [sp, setSp] = useSearchParams();
  const tab = sp.get("tab") === "products" ? "products" : "stores"; const q = sp.get("q") || "";
  const setTab = (t) => setSp(t === "products" ? { tab: "products", ...(q ? { q } : {}) } : q ? { q } : {});
  const setQ = (v) => setSp({ ...(tab === "products" ? { tab } : {}), ...(v ? { q: v } : {}) }, { replace: true });
  return (
    <div className="landing">
      <MainHeader />
      <div className="container sf-main">
        <div className="stores-hero">
          <div><h1>Browse Orderistan</h1><p>Discover local stores and products from sellers all over Pakistan.</p></div>
          <div className="seg" role="tablist">
            <button role="tab" aria-selected={tab === "stores"} className={tab === "stores" ? "on" : ""} onClick={() => setTab("stores")}>Stores</button>
            <button role="tab" aria-selected={tab === "products"} className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}>Products</button>
          </div>
        </div>
        {tab === "stores" ? <Stores q={q} setQ={setQ} /> : <Products q={q} setQ={setQ} />}
      </div>
      <MainFooter />
    </div>
  );
}

function Stores({ q, setQ }) {
  const [city, setCity] = useState(""); const [page, setPage] = useState(1); const [category, setCategory] = useState("");
  const cities = useGet("/market/cities"); const d = useGet("/market/stores", { q, city, category, page });
  return (
    <>
      <div className="toolbar">
        <div className="input-ico grow"><Icon n="search" /><input placeholder="Search stores..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <select value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }}>
          <option value="">All cities</option>{(cities.data?.items || []).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} aria-label="Business category"><option value="">All businesses</option><option value="food">Food &amp; Restaurant</option><option value="clothing">Clothing &amp; Fashion</option><option value="services">Services</option></select>
      </div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="store">No stores found.</Empty> : <div className="sgrid">{d.data.items.map((s) => <StoreCard key={s.slug} s={s} />)}</div>}
      <Pager data={d.data} onPage={setPage} />
    </>
  );
}

function Products({ q, setQ }) {
  const [sort, setSort] = useState("newest"); const [page, setPage] = useState(1);
  const d = useGet("/market/products", { q, sort, page });
  return (
    <>
      <div className="toolbar">
        <div className="input-ico grow"><Icon n="search" /><input placeholder="Search products from all stores..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option><option value="popular">Popular</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option>
        </select>
      </div>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="box">No products found.</Empty> : (
        <div className="pgrid">{d.data.items.map((p) => <ProductTile key={p._id} p={p} />)}</div>)}
      <Pager data={d.data} onPage={setPage} />
    </>
  );
}

export const discount = (p) => (p.comparePrice > p.price ? Math.round((1 - p.price / p.comparePrice) * 100) : 0);

export function ProductTile({ p }) {
  const to = `/s/${p.storeInfo?.slug}/p/${p._id}`; const off = discount(p);
  return (
    <div className="pcard">
      {off > 0 && <span className="pbadge">-{off}%</span>}
      <Link to={to} className="pimg">{p.images?.[0] ? <img src={thumb(p.images[0], 400)} alt={p.name} loading="lazy" decoding="async" /> : <span>No image</span>}</Link>
      <div className="pinfo">
        <Link to={to}><b>{p.name}</b></Link>
        <small className="muted">by <Link to={`/s/${p.storeInfo?.slug}`}>{p.storeInfo?.name}</Link></small>
        <span className="price">{money(p.price)} {p.comparePrice > p.price && <s>{money(p.comparePrice)}</s>}</span>
        <Link className="btn brand sm" to={to}>View &amp; buy</Link>
      </div>
    </div>
  );
}
