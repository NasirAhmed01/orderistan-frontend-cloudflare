import { lineAmt, lineLabel } from "../pricing";
import { useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { AuthImage, Avatar, Badge, Empty, Icon, Pager, Spinner, Stat, fmtTime, money, useGet, waLink } from "../ui";
import MainHeader, { MainFooter } from "./MainHeader";
import { ProductTile } from "./Market";
import { GmailCard, IdentityCard, PasswordForm, ProfileDetails } from "./Profile";
import { Addresses, NotificationList } from "../store/StorePages";
import { CountUp } from "../kit";

const METHOD = { bank: "Bank transfer", jazzcash: "JazzCash", easypaisa: "Easypaisa", cod: "Cash on delivery" };

// Customer area: profile card + side menu, content on the right
export default function Account() {
  const { user, logout } = useAuth(); const nav = useNavigate();
  const sum = useGet("/me/summary");
  return (
    <div className="landing">
      <MainHeader />
      <div className="container sf-main">
        <div className="acct">
          <aside className="acct-side">
            <div className="card">
              <div className="acct-me"><Avatar name={user.name} src={user.avatar} size="lg" solid /><b>{user.name}</b><small>{user.email || "@" + user.username}</small></div>
              <nav className="acct-nav" aria-label="Account">
                <NavLink to="/account" end><Icon n="bag" /> My orders {sum.data?.open > 0 && <span className="n">{sum.data.open} open</span>}</NavLink>
                <NavLink to="/account/wishlist"><Icon n="heart" /> Wishlist {sum.data?.wishlist > 0 && <span className="n">{sum.data.wishlist}</span>}</NavLink>
                <NavLink to="/account/profile"><Icon n="user" /> Profile</NavLink>
                <NavLink to="/account/security"><Icon n="lock" /> Password</NavLink>
                <NavLink to="/account/addresses"><Icon n="pin" /> Addresses</NavLink>
                <NavLink to="/account/notifications"><Icon n="bell" /> Notifications</NavLink>
                <NavLink to="/help"><Icon n="help" /> Help centre</NavLink>
                <Link to="/stores"><Icon n="store" /> Browse stores</Link>
                <button className="out" onClick={() => { logout(); nav("/"); }}><Icon n="logout" /> Log out</button>
              </nav>
            </div>
          </aside>
          <section>
            <h1 className="page-title acct-hello">Hello, {user.name.split(" ")[0]}</h1>
            <p className="page-sub">Track your orders, manage your wishlist and update your details.</p>
            <div className="stats">
              <Stat icon="bag" label="Total orders" value={sum.data ? <CountUp to={sum.data.orders} /> : "-"} />
              <Stat icon="truck" label="Open orders" value={sum.data ? <CountUp to={sum.data.open} /> : "-"} tone="amber" />
              <Stat icon="heart" label="Wishlist" value={sum.data ? <CountUp to={sum.data.wishlist} /> : "-"} tone="red" />
            </div>
            <Routes>
              <Route index element={<Orders />} /><Route path="orders" element={<Orders />} />
              <Route path="wishlist" element={<Wishlist />} />
              <Route path="profile" element={<><IdentityCard /><ProfileDetails /><GmailCard /></>} /><Route path="security" element={<div className="narrow-form"><PasswordForm /></div>} />
              <Route path="addresses" element={<Addresses user={user} />} /><Route path="notifications" element={<NotificationList base="/account" />} />
            </Routes>
          </section>
        </div>
      </div>
      <MainFooter />
    </div>
  );
}

function Orders() {
  const [page, setPage] = useState(1);
  const d = useGet("/me/orders", { page });
  if (d.loading && !d.data) return <Spinner />;
  if (!d.data?.items?.length) return <Empty icon="bag">No orders yet. <Link to="/stores">Browse stores</Link> and place your first order.</Empty>;
  return <>{d.data.items.map((o) => <OrderCard key={o._id} o={o} />)}<Pager data={d.data} onPage={setPage} /></>;
}

function OrderCard({ o }) {
  const [shot, setShot] = useState(false); const st = o.store || {};
  const msg = `Assalam o Alaikum! I placed order ${o.orderNo} for ${money(o.total)}${o.paymentMethod !== "cod" ? ` and paid via ${METHOD[o.paymentMethod]}. I have uploaded the payment screenshot on your website. Please verify my payment.` : " (cash on delivery)."} - ${o.info?.name}`;
  const wa = waLink(st.whatsapp || st.phone, msg);
  return (
    <div className="card order">
      <div className="row between wrap-gap" style={{ marginBottom: 8 }}>
        <div><b style={{ fontSize: "1.05rem" }}>{o.orderNo}</b> <small className="muted">{fmtTime(o.createdAt)}</small><br /><span className="muted">From</span> <Link to={`/s/${st.slug}`}>{st.name}</Link></div>
        <div className="row"><Badge v={o.status} /> <Badge v={o.paymentStatus} /></div>
      </div>
      {o.items.map((i, k) => <div className="list-row" key={k}><span>{i.name} <span className="muted">x{i.qty}{lineLabel(i) ? " · " + lineLabel(i) : ""}</span></span><span>{money(lineAmt(i))}</span></div>)}
      {o.codFee > 0 && <div className="list-row"><span>Cash on delivery fee</span><span>{money(o.codFee)}</span></div>}
      <div className="row between big-t"><b>Total ({METHOD[o.paymentMethod]})</b><b>{money(o.total)}</b></div>
      {o.paymentStatus === "rejected" && <div className="banner warn"><Icon n="alert" /><div><b>Payment not verified:</b> {o.paymentNote} <Link to={`/s/${st.slug}/orders`}>Upload a new screenshot</Link></div></div>}
      {shot && o.hasScreenshot && <AuthImage url={`/orders/${o._id}/screenshot`} />}
      <div className="row wrap-gap">
        <Link className="btn sm primary" to={`/s/${st.slug}/orders`}><Icon n="truck" /> Track &amp; manage order</Link>
        {o.hasScreenshot && <button className="btn sm" onClick={() => setShot(!shot)}><Icon n="image" /> {shot ? "Hide" : "View"} my screenshot</button>}
        {wa && <a className="btn sm" href={wa} target="_blank" rel="noreferrer"><Icon n="chat" /> Message seller on WhatsApp</a>}
      </div>
    </div>
  );
}

function Wishlist() {
  const d = useGet("/me/wishlist");
  if (d.loading && !d.data) return <Spinner />;
  if (!d.data?.items?.length) return <Empty icon="heart">Your wishlist is empty. Tap the heart on any product inside a store.</Empty>;
  return <div className="pgrid">{d.data.items.map((p) => <ProductTile key={p._id} p={p} />)}</div>;
}
