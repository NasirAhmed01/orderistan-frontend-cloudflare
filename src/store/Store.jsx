import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import api, { ROOT, errMsg, setStoreSlug, thumb } from "../api";
import { useAuth } from "../auth";
import { useBrandHead } from "../brandHead";
import { Badge, Empty, Field, Icon, Spinner, fmtTime, money, toast, useGet, waLink } from "../ui";
import { Progress, useAddresses } from "../kit";
import { CustomerAuth } from "../pages/Auth";
import { PayWarning } from "../pages/Legal";
import { Ctx, useStore } from "./ctx";
import { Gallery } from "./common";
import { Card, Footer, Header, Heart, Home, Stars } from "./parts";
import { cartKey, cartTotal, dealText, lineLabel, lineAmt, normCart, unitOf } from "../pricing";
import { FoodHeader, FoodHome, FoodProduct } from "./food";
import { FashionHeader, FashionHome, FashionProduct } from "./fashion";
import { MyBookings, ServiceDetail, ServicesHeader, ServicesHome } from "./services";
import { AboutStore, ContactStore, NotificationsPage, Policies, StoreFaq, StoreProfile, Timeline, TrackOrder } from "./StorePages";

const Pg = () => <div className="container sf-main"><Outlet /></div>;

export default function Store({ slug, base }) {
  setStoreSlug(slug); // every API call from here on is scoped to this store
  useEffect(() => () => setStoreSlug(null), []);
  const info = useGet("/store");
  const { user } = useAuth(); const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const [cart, setCart] = useState(() => { try { return normCart(JSON.parse(localStorage.getItem("cart:" + slug))); } catch { return []; } });
  const [wish, setWish] = useState(new Set());
  useEffect(() => { localStorage.setItem("cart:" + slug, JSON.stringify(cart)); }, [cart, slug]);
  useEffect(() => {
    if (user?.role === "customer") api.get("/store/wishlist").then((r) => setWish(new Set(r.data.items.map((p) => p._id)))).catch(() => {});
    else setWish(new Set());
  }, [user, slug]);

  const store = info.data?.store;
  useBrandHead(store, base);
  const api2 = useMemo(() => ({
    store, base, sp: (p) => base + p, cart,
    add: (p, qty = 1, sel = {}) => {
      const key = cartKey(p._id, sel), left = sel.size || sel.color ? ((p.variants || []).find((v) => v.size === (sel.size || "") && v.color === (sel.color || "")) || {}).stock : p.stock;
      const cap = left === null || left === undefined ? 99 : Math.max(1, left);
      setCart((c) => { const i = c.find((x) => x.key === key);
        return i ? c.map((x) => (x.key === key ? { ...x, qty: Math.min(cap, x.qty + qty) } : x))
          : [...c, { key, id: p._id, name: p.name, unit: unitOf(p, sel), price: unitOf(p, sel), deal: p.deal?.kind ? { kind: p.deal.kind, value: p.deal.value } : null, dealLabel: dealText(p), size: sel.size || "", color: sel.color || "", addons: sel.addons || [], image: (p.colors || []).find((x) => x.name === sel.color)?.image || p.images?.[0] || "", qty: Math.min(cap, qty) }]; });
      toast("Added to cart");
    },
    setQty: (key, qty) => setCart((c) => (qty < 1 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, qty: Math.min(99, qty) } : x)))),
    clear: () => setCart([]), wish,
    toggleWish: async (id) => { const { data } = await api.post("/store/wishlist/" + id); setWish((w) => { const n = new Set(w); data.wished ? n.add(id) : n.delete(id); return n; }); }
  }), [store, base, cart, wish]);

  if (info.loading && !store) return <Spinner />;
  if (!store) return <div className="closed"><h1>Store not found</h1><p className="muted">This store link does not exist.</p>{!base && <a href={`https://${ROOT}`}>Go to {ROOT}</a>}</div>;
  const cat = store.category || "", fancy = !!cat;
  const L = { food: [FoodHeader, FoodHome, FoodProduct], clothing: [FashionHeader, FashionHome, FashionProduct], services: [ServicesHeader, ServicesHome, ServiceDetail] }[cat];
  const Head = L ? L[0] : Header, HomeEl = L ? L[1] : Home, ProdEl = L ? L[2] : Product;
  return (
    <Ctx.Provider value={api2}>
      <div className={"storefront sf-" + (cat || "classic")} style={{ "--brand": store.themeColor }}>
        <Head />
        <main><div key={loc.pathname} className="pg-in">
          {store.closed ? <div className="closed"><h1>{store.name}</h1><p className="muted">This store is temporarily closed. Please check back soon.</p></div> : (
            <Routes>
              {fancy && <><Route index element={<HomeEl />} /><Route path="p/:id" element={<ProdEl />} /></>}
              <Route element={<Pg />}>
                {!fancy && <><Route index element={<Home />} /><Route path="p/:id" element={<Product />} /></>}
                <Route path="cart" element={<Cart />} />
                <Route path="checkout" element={<Checkout />} /><Route path="orders" element={<Orders />} /><Route path="wishlist" element={<Wishlist />} /><Route path="bookings" element={<MyBookings />} />
                <Route path="login" element={<div className="center"><CustomerAuth base={base} store={store} /></div>} />
                <Route path="profile" element={<StoreProfile />} /><Route path="notifications" element={<NotificationsPage />} /><Route path="track" element={<TrackOrder />} />
                <Route path="about" element={<AboutStore />} /><Route path="contact" element={<ContactStore />} /><Route path="policies" element={<Policies />} /><Route path="faq" element={<StoreFaq />} />
                <Route path="*" element={<Navigate to={base || "/"} replace />} />
              </Route>
            </Routes>)}
        </div></main>
        <Footer />
      </div>
    </Ctx.Provider>
  );
}

function Product() {
  const { id } = useParams(); const { sp, add } = useStore(); const { user } = useAuth(); const nav = useNavigate();
  const d = useGet("/store/products/" + id); const [qty, setQty] = useState(1);
  const [rv, setRv] = useState({ rating: 5, comment: "" }); const { store } = useStore();
  const cat = d.data?.product?.category; const rel = useGet(cat ? "/store/products" : null, { category: cat, limit: 5 });
  useEffect(() => { setQty(1); }, [id]);
  if (d.loading && !d.data) return <Spinner />;
  if (!d.data?.product) return <Empty icon="box">Product not found.</Empty>;
  const { product: p, reviews } = d.data;
  const review = async (e) => { e.preventDefault(); try { await api.post(`/store/products/${id}/reviews`, rv); toast("Thanks for your review!"); setRv({ rating: 5, comment: "" }); d.reload(); } catch (x) { toast(errMsg(x), "err"); } };
  const share = () => { if (navigator.share) navigator.share({ title: p.name, url: location.href }).catch(() => {}); else { navigator.clipboard?.writeText(location.href); toast("Link copied"); } };
  const related = (rel.data?.items || []).filter((x) => x._id !== p._id).slice(0, 4);
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb"><Link to={sp("/")}>{store.name}</Link><Icon n="right" />{p.category && <><span>{p.category}</span><Icon n="right" /></>}<b>{p.name}</b></nav>
      <div className="detail">
        <div className="big-cr"><Gallery images={p.images} name={p.name} /></div>
        <div><h1>{p.name}</h1>{p.ratingCount > 0 && <p><Stars v={p.ratingAvg} /> <span className="muted">{p.ratingAvg} ({p.ratingCount} reviews)</span></p>}
          <p className="price lg">{money(p.price)} {p.comparePrice > p.price && <s>{money(p.comparePrice)}</s>}</p>
          <p className="pre">{p.description}</p>
          {p.inStock ? <div className="row wrap-gap"><input className="qty" type="number" min="1" max="99" value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} />
            <button className="btn brand" onClick={() => add(p, qty)}><Icon n="cart" /> Add to cart</button>
            <button className="btn" onClick={() => { add(p, qty); nav(sp("/cart")); }}>Buy now</button><Heart id={p._id} /></div> : <Badge v="rejected">Out of stock</Badge>}
          <div className="buy-perks"><span><Icon n="truck" /> {store.deliveryFee > 0 ? (store.freeDeliveryOver > 0 ? `Free delivery over ${money(store.freeDeliveryOver)}` : `Delivery ${money(store.deliveryFee)}`) : "Free delivery"}</span><span><Icon n="shield" /> Payment verified by the seller</span><button className="link" onClick={share}><Icon n="share" /> Share</button></div></div>
      </div>
      {p.inStock && <div className="buy-bar"><div><b>{money(p.price * qty)}</b><small className="muted">{p.name}</small></div><button className="btn brand" onClick={() => add(p, qty)}><Icon n="cart" /> Add to cart</button></div>}
      <section className="card"><h3>Customer reviews</h3>
        {reviews.length === 0 && <p className="muted">No reviews yet.</p>}
        {reviews.map((r) => <div key={r._id} className="review"><Stars v={r.rating} /> <b>{r.userName}</b> {r.verified && <Badge v="verified">verified buyer</Badge>}<small className="muted"> {fmtTime(r.createdAt)}</small>{r.comment && <p>{r.comment}</p>}</div>)}
        {user?.role === "customer" ? <form onSubmit={review} className="review-form"><h4>Write a review</h4>
          <Field label="Rating"><select value={rv.rating} onChange={(e) => setRv({ ...rv, rating: +e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && "s"}</option>)}</select></Field>
          <Field label="Comment"><textarea rows={3} value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} /></Field>
          <button className="btn brand">Submit review</button></form>
          : <p className="muted"><Link to={sp("/login")} state={{ from: sp("/p/" + id) }}>Log in</Link> to write a review.</p>}
      </section>
      {related.length > 0 && <section className="sf-sec"><h2>You may also like</h2><div className="pgrid">{related.map((x, i) => <Card key={x._id} p={x} i={i} />)}</div></section>}
    </>
  );
}

function Wishlist() {
  const { sp, wish } = useStore(); const { user } = useAuth();
  const d = useGet(user?.role === "customer" ? "/store/wishlist" : null, { n: wish.size });
  if (user?.role !== "customer") return <Navigate to={sp("/login")} state={{ from: sp("/wishlist") }} replace />;
  return <><h1>My wishlist</h1>{d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="heart">Nothing saved yet. Tap the heart on a product.</Empty> : <div className="pgrid">{d.data.items.map((p) => <Card key={p._id} p={p} />)}</div>}</>;
}

const feeFor = (store, sub) => (store.freeDeliveryOver > 0 && sub >= store.freeDeliveryOver ? 0 : store.deliveryFee);
function Cart() {
  const { store, cart, setQty, sp } = useStore();
  const sub = cart.reduce((a, i) => a + cartTotal(i), 0);
  if (!cart.length) return <Empty icon="cart">Your cart is empty. <Link to={sp("/")}>Continue shopping</Link></Empty>;
  return (
    <>
      <h1>Your cart</h1>
      <div className="card">{cart.map((i) => (
        <div className="cart-row" key={i.key}><div className="thumb">{i.image && <img src={thumb(i.image, 120)} alt="" loading="lazy" />}</div>
          <div className="grow"><b>{i.name}</b>{lineLabel(i) && <><br /><small className="muted">{lineLabel(i)}</small></>}{i.dealLabel && i.deal && <><br /><Badge v="confirmed">{i.dealLabel}</Badge></>}<br /><span className="muted">{money(i.unit)} each</span></div>
          <div className="qtyb"><button aria-label="Decrease" onClick={() => setQty(i.key, i.qty - 1)}>-</button><b>{i.qty}</b><button aria-label="Increase" onClick={() => setQty(i.key, i.qty + 1)}>+</button></div>
          <b className="w90">{money(cartTotal(i))}</b></div>))}
        <div className="totals"><div className="row between"><span>Subtotal</span><span>{money(sub)}</span></div>
          <div className="row between"><span>Delivery</span><span>{feeFor(store, sub) ? money(feeFor(store, sub)) : "Free"}</span></div>
          {store.freeDeliveryOver > 0 && <div className="fd-meter"><small className="muted">{sub < store.freeDeliveryOver ? <>Add <b>{money(store.freeDeliveryOver - sub)}</b> more for free delivery</> : <><Icon n="check" /> You get free delivery</>}</small><Progress value={(sub / store.freeDeliveryOver) * 100} label="Progress to free delivery" /></div>}
          <div className="row between big-t"><b>Total</b><b>{money(sub + feeFor(store, sub))}</b></div>
          {store.codFee > 0 && <small className="muted">Paying with cash on delivery adds a {money(store.codFee)} fee at checkout.</small>}</div>
        <Link className="btn brand block lg" to={sp("/checkout")}>Proceed to checkout <Icon n="right" /></Link></div>
    </>
  );
}

const METHOD_LABEL = { bank: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa", cod: "Cash on delivery" };
function Checkout() {
  const { store, cart, clear, sp } = useStore(); const { user } = useAuth(); const nav = useNavigate();
  const ok = user?.role === "customer";
  const pay = useGet(ok ? "/store/payment-info" : null);
  const [f, setF] = useState({ name: user?.name || "", phone: user?.phone || "", address: "", note: "" });
  const [method, setMethod] = useState(""); const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const [saved] = useAddresses(user?._id || user?.id);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  if (!ok) return <Navigate to={sp("/login")} state={{ from: sp("/checkout") }} replace />;
  if (!cart.length) return <Navigate to={sp("/cart")} replace />;
  const sub = cart.reduce((a, i) => a + cartTotal(i), 0);
  const methods = pay.data?.methods || {}; const m = method || Object.keys(methods)[0] || ""; const det = methods[m];
  const codFee = m === "cod" ? Math.round(Number(det?.fee) || 0) : 0;      // the seller's cash-on-delivery fee; the server adds the same amount
  const total = sub + feeFor(store, sub) + codFee;
  const submit = async (e) => {
    e.preventDefault(); if (!m) return toast("This store has no payment method set up yet.", "err");
    if (m !== "cod" && !file) return toast("Please upload your payment screenshot.", "err");
    setBusy(true);
    try {
      const fd = new FormData(); fd.append("items", JSON.stringify(cart.map((i) => ({ product: i.id, qty: i.qty, size: i.size, color: i.color, addons: i.addons }))));
      Object.entries(f).forEach(([k, v]) => fd.append(k, v)); fd.append("paymentMethod", m); if (file && m !== "cod") fd.append("screenshot", file);
      const { data } = await api.post("/store/orders", fd); clear();
      nav(sp("/orders"), { state: { placed: data.order._id }, replace: true });
    } catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="checkout">
      <div>
        <div className="card"><h3>Delivery details</h3>
          <Field label="Full name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone / WhatsApp"><input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          {saved.length > 0 && <div className="chips saved-addr"><small className="muted">Saved:</small>{saved.map((a) => <button type="button" key={a.id} className={"chip" + (f.address === a.text ? " on" : "")} onClick={() => setF({ ...f, address: a.text })}><Icon n="pin" /> {a.label}</button>)}</div>}
          <Field label="Full address"><textarea required rows={3} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Note (optional)"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field></div>
        <div className="card"><h3>Payment</h3>
          {pay.loading ? <Spinner /> : Object.keys(methods).length === 0 ? <p className="muted">This store has not set up payment methods yet.</p> : <>
            <div className="chips">{Object.keys(methods).map((k) => <button type="button" key={k} className={"chip" + (m === k ? " on" : "")} onClick={() => setMethod(k)}>{METHOD_LABEL[k]}{k === "cod" && Number(methods.cod?.fee) > 0 && ` (+${money(methods.cod.fee)})`}</button>)}</div>
            {m === "cod" ? <p className="muted">Pay the rider in cash when your order arrives.{codFee > 0 && <> A cash-on-delivery fee of <b>{money(codFee)}</b> is added to your total.</>}</p> : det && <>
              <PayWarning /><div className="paybox"><p>Send <b>{money(total)}</b> to:</p>
                {det.bankName && <div>Bank: <b>{det.bankName}</b></div>}<div>Account title: <b>{det.title}</b></div>
                <div>{m === "bank" ? "Account no" : "Mobile no"}: <b className="sel">{det.number}</b></div>{det.iban && <div>IBAN: <b className="sel">{det.iban}</b></div>}</div>
              <Field label="Upload payment screenshot" hint="The seller will verify your payment and confirm your order."><input type="file" accept="image/*" required onChange={(e) => setFile(e.target.files[0])} /></Field>
              {preview && <img className="shot" src={preview} alt="Screenshot preview" />}</>}</>}</div>
      </div>
      <aside className="card summary"><h3>Order summary</h3>
        {cart.map((i) => <div key={i.key} className="row between"><span>{i.name} x{i.qty}{lineLabel(i) && <small className="muted"> · {lineLabel(i)}</small>}</span><span>{money(cartTotal(i))}</span></div>)}
        <hr /><div className="row between"><span>Delivery</span><span>{feeFor(store, sub) ? money(feeFor(store, sub)) : "Free"}</span></div>
        {codFee > 0 && <div className="row between"><span>Cash on delivery fee</span><span>{money(codFee)}</span></div>}
        <div className="row between big-t"><b>Total</b><b>{money(total)}</b></div>
        <button className="btn brand block" disabled={busy || !m}>{busy ? "Placing order..." : "Place order"}</button></aside>
    </form>
  );
}

function Orders() {
  const { store, sp } = useStore(); const { user } = useAuth(); const loc = useLocation();
  const d = useGet(user?.role === "customer" ? "/store/orders" : null);
  if (user?.role !== "customer") return <Navigate to={sp("/login")} state={{ from: sp("/orders") }} replace />;
  return (
    <>
      <h1>My orders</h1>
      {d.loading && !d.data ? <Spinner /> : !d.data?.items?.length ? <Empty icon="bag">You have not placed any orders yet.</Empty> :
        d.data.items.map((o) => <OrderCard key={o._id} o={o} store={store} fresh={loc.state?.placed === o._id} reload={d.reload} />)}
    </>
  );
}
function OrderCard({ o, store, fresh, reload }) {
  const [file, setFile] = useState(null); const [busy, setBusy] = useState(false);
  const msg = `Assalam o Alaikum! I placed order ${o.orderNo} for ${money(o.total)}${o.paymentMethod !== "cod" ? ` and paid via ${METHOD_LABEL[o.paymentMethod]}. I have uploaded the payment screenshot on your website. Please verify my payment.` : " (cash on delivery)."} - ${o.info.name}`;
  const wa = waLink(store.whatsapp || store.phone, msg);
  const reupload = async () => {
    if (!file) return toast("Choose a screenshot first.", "err"); setBusy(true);
    try { const fd = new FormData(); fd.append("screenshot", file); await api.post(`/store/orders/${o._id}/screenshot`, fd); toast("Screenshot sent to the seller."); setFile(null); reload(); }
    catch (x) { toast(errMsg(x), "err"); } finally { setBusy(false); }
  };
  const cancel = async () => { if (!confirm("Cancel this order?")) return; try { await api.post(`/store/orders/${o._id}/cancel`); reload(); } catch (x) { toast(errMsg(x), "err"); } };
  return (
    <div className={"card order" + (fresh ? " fresh" : "")}>
      {fresh && <div className="banner ok"><Icon n="check" /><div>Order placed! {o.paymentMethod !== "cod" ? "The seller will verify your payment shortly." : "The seller will confirm your order shortly."}</div></div>}
      <div className="row between wrap-gap"><div><b>{o.orderNo}</b> <small className="muted">{fmtTime(o.createdAt)}</small></div><div><Badge v={o.status} /> <Badge v={o.paymentStatus} /></div></div>
      <Timeline status={o.status} />
      {o.items.map((i, k) => <div className="row between" key={k}><span>{i.name} x{i.qty}{lineLabel(i) && <small className="muted"> · {lineLabel(i)}</small>}</span><span>{money(lineAmt(i))}</span></div>)}
      {o.codFee > 0 && <div className="row between"><span>Cash on delivery fee</span><span>{money(o.codFee)}</span></div>}
      <div className="row between big-t"><b>Total ({METHOD_LABEL[o.paymentMethod]})</b><b>{money(o.total)}</b></div>
      {o.paymentStatus === "rejected" && <div className="banner warn"><Icon n="alert" /><div><b>Payment not verified:</b> {o.paymentNote}
        <div className="row wrap-gap" style={{ marginTop: 8 }}><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /><button className="btn brand sm" disabled={busy} onClick={reupload}>Upload new screenshot</button></div></div></div>}
      <div className="row wrap-gap">{wa && <a className="btn" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> Message seller on WhatsApp</a>}
        {o.status === "pending" && o.paymentStatus !== "verified" && <button className="btn danger ghost" onClick={cancel}>Cancel order</button>}</div>
    </div>
  );
}
