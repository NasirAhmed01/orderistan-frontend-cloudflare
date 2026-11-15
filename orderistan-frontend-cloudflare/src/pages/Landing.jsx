import { Link } from "react-router-dom";
import { ROOT } from "../api";
import { useAuth } from "../auth";
import { Icon, Spinner, useGet } from "../ui";
import MainHeader, { MainFooter } from "./MainHeader";
import { StoreCard } from "./Market";
import { Accordion, Reveal } from "../kit";
import { FAQS } from "./Info";

const FEATURES = [
  ["link", "Your own store link", `Get yourname.${ROOT} in seconds. Share it on WhatsApp, Instagram or Facebook - customers land straight on your store.`],
  ["store", "A real online store", "Products, categories, cart, wishlist, reviews and order tracking. It feels like your own website, not a marketplace."],
  ["card", "No payment gateway needed", "Customers pay to your bank, JazzCash or Easypaisa, then upload the screenshot. You verify it with one click."],
  ["chat", "Orders and WhatsApp", "New order alerts, payment verification, delivery status updates and a WhatsApp button for every customer."],
  ["clock", "Simple subscription", "Pay monthly. We notify you before it ends so your store never goes offline by surprise."],
  ["shield", "Owner dashboard", "Platform owner sees every seller, order, subscription and activity log in one secure admin panel."]
];
const STEPS = [
  ["1", "Create an account", "Sign up once with your email and phone."],
  ["2", "Pick a store and add to cart", "Browse every seller, save favourites to your wishlist."],
  ["3", "Pay and upload screenshot", "Send money to the seller's bank / JazzCash / Easypaisa and upload the screenshot."],
  ["4", "Seller verifies, you track", "Follow your order status and review the product after delivery."]
];
const STRIP = [["truck", "Order tracking", "From confirmed to delivered"], ["shield", "Verified payments", "Sellers check every screenshot"], ["heart", "Wishlist", "Save products you love"], ["chat", "WhatsApp support", "Message the seller directly"], ["award", "Real reviews", "From verified buyers"]];

export default function Landing() {
  const stores = useGet("/market/stores", { limit: 6 });
  const { user } = useAuth();
  return (
    <div className="landing">
      <MainHeader />
      <section className="hero hero-bg">
        <div className="container hero-wrap">
          <div>
                        <h1>Shop from local sellers - or open <em>your own store</em> online.</h1>
            <p>Orderistan gives every Pakistani seller a complete online store at <b>yourname.{ROOT}</b>. Customers buy with one account and pay by bank, JazzCash or Easypaisa screenshot.</p>
            <div className="row wrap-gap">
              <Link className="btn primary lg" to="/stores">Browse stores</Link>
              {!user && <Link className="btn sun lg" to="/seller-signup">Open your store</Link>}
              {!user && <Link className="btn lg" to="/signup">Create account</Link>}
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="blob" />
            <div className="float a"><div className="stat-ico"><Icon n="check" /></div><div><b>Payment verified</b><small>Order delivered to your door</small></div></div>
            <div className="float b"><div className="stat-ico" style={{ background: "#fff3d6", color: "#a76b00" }}><Icon n="bag" /></div><div><b>New order received</b><small>Rs 2,450 - Cash on delivery</small></div></div>
            <div className="float c"><div className="stat-ico" style={{ background: "#e6f0ff", color: "#2563eb" }}><Icon n="store" /></div><div><b>yourname.{ROOT}</b><small>Your store is live</small></div></div>
          </div>
        </div>
      </section>
      <div className="strip-bar"><div className="container strip">{STRIP.map(([i, t, d]) => <div key={t}><div className="stat-ico"><Icon n={i} /></div><div>{t}<small>{d}</small></div></div>)}</div></div>

      <div className="marquee" aria-hidden="true"><div>{[0, 1].map((k) => <span key={k}>{["Bank transfer", "JazzCash", "Easypaisa", "Cash on delivery", "Order tracking", "WhatsApp support", "Verified reviews", "Your own store link"].map((t) => <i key={t}>{t}</i>)}</span>)}</div></div>

      <section className="section"><div className="container">
        <div className="section-h"><div><h2>Latest stores</h2><p>Fresh shops that just went live on Orderistan.</p></div><Link className="btn" to="/stores">See all stores <Icon n="right" /></Link></div>
        {stores.loading && !stores.data ? <Spinner /> : stores.data?.items?.length ? <div className="sgrid">{stores.data.items.map((s) => <StoreCard key={s.slug} s={s} />)}</div> : <p className="muted">Stores will appear here once sellers go live.</p>}
      </div></section>

      <section className="section alt"><div className="container">
        <div className="section-h"><div><h2>How buying works</h2><p>Four simple steps from browsing to delivery.</p></div></div>
        <div className="features">{STEPS.map(([n, t, d], k) => <Reveal className="feat" delay={k * 80} key={t}><div className="step-n">{n}</div><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
      </div></section>

      <section className="section"><div className="container">
        <div className="section-h"><div><h2>Built for sellers</h2><p>Everything you need to sell online, without a payment gateway.</p></div></div>
        <div className="features">{FEATURES.map(([i, t, d], k) => <Reveal className="feat" delay={k * 70} key={t}><div className="stat-ico"><Icon n={i} /></div><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
      </div></section>

      <section className="section alt"><div className="container faq-wrap">
        <div><h2>Questions, answered</h2><p className="muted">The basics of buying and selling on Orderistan.</p><Link className="btn" to="/faq">Read the full FAQ <Icon n="right" /></Link></div>
        <Accordion items={FAQS.slice(0, 5)} />
      </div></section>

      {!user && <section className="section" style={{ paddingTop: 0 }}><div className="container">
        <div className="cta"><div><h2>Ready to open your store?</h2><p>Create your store in minutes and start taking orders on WhatsApp-friendly links.</p></div>
          <Link className="btn sun lg" to="/seller-signup">Open your store</Link></div>
      </div></section>}

      <MainFooter />
    </div>
  );
}
