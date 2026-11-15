import { useState } from "react";
import { Link } from "react-router-dom";
import { ROOT, SUPPORT_EMAIL } from "../api";
import { useAuth } from "../auth";
import { Accordion, Reveal } from "../kit";
import { Field, Icon, toast } from "../ui";
import MainHeader, { MainFooter } from "./MainHeader";

export { SUPPORT_EMAIL };

function Frame({ title, sub, icon = "info", children, narrow }) {
  return (
    <div className="landing">
      <MainHeader />
      <section className="info-hero"><div className="container"><span className="info-ico"><Icon n={icon} /></span><h1>{title}</h1>{sub && <p>{sub}</p>}</div></section>
      <div className={"container info-body" + (narrow ? " narrow" : "")}>{children}</div>
      <MainFooter />
    </div>
  );
}
const Cards = ({ items }) => <div className="features">{items.map(([i, t, d], k) => <Reveal key={t} delay={k * 60} className="feat"><div className="stat-ico"><Icon n={i} /></div><h3>{t}</h3><p>{d}</p></Reveal>)}</div>;
const Cta = ({ title, text, to, label }) => <Reveal className="cta"><div><h2>{title}</h2><p>{text}</p></div><Link className="btn sun lg" to={to}>{label}</Link></Reveal>;

export function About() {
  return (
    <Frame icon="store" title="Built for Pakistan's local sellers" sub="Orderistan gives every seller a real online store and gives every shopper one account for all of them.">
      <Reveal className="card story"><h2>Why we exist</h2><p>Most small sellers in Pakistan already sell on WhatsApp and Instagram. What they lack is a proper shop: a catalogue, a cart, order tracking and a way to confirm payments without a card gateway.</p>
        <p>Orderistan fills that gap. A seller opens a store at <b>yourname.{ROOT}</b>, adds products and receives orders. Customers pay by bank transfer, JazzCash or Easypaisa, upload a screenshot, and the seller verifies it with one click.</p></Reveal>
      <Cards items={[["shield", "Payments you can trust", "Every payment is checked by the seller before an order is confirmed."], ["heart", "One account, every store", "Customers keep one wishlist, one profile and one order history."], ["chat", "WhatsApp-first", "Every order has a button to message the seller straight away."], ["chart", "Simple for sellers", "Products, orders, customers and settings in one clean dashboard."]]} />
      <Cta title="Join the marketplace" text="Shop from local stores or open your own in minutes." to="/stores" label="Browse stores" />
    </Frame>
  );
}

export function HowItWorks() {
  const buy = [["Create an account", "Sign up once with your email and phone."], ["Fill your cart", "Browse any store, save favourites, add to cart."], ["Pay and upload proof", "Send money by bank, JazzCash or Easypaisa and upload the screenshot, or choose cash on delivery."], ["Track delivery", "Follow the order from confirmed to delivered and review what you bought."]];
  const sell = [["Open your store", "Pick your store name and link."], ["Add products", "Photos, prices, categories and stock."], ["Share your link", "Post it on WhatsApp, Instagram and Facebook."], ["Verify and deliver", "Check payment screenshots, update order status."]];
  const Steps = ({ list }) => <ol className="steps-list">{list.map(([t, d], i) => <Reveal as="li" key={t} delay={i * 70}><span>{i + 1}</span><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}</ol>;
  return (
    <Frame icon="clock" title="How Orderistan works" sub="Four steps whether you are buying or selling.">
      <div className="split"><div><h2>Shopping</h2><Steps list={buy} /></div><div><h2>Selling</h2><Steps list={sell} /></div></div>
    </Frame>
  );
}

export function Sell() {
  const { user } = useAuth();
  return (
    <Frame icon="award" title="Sell on Orderistan" sub="A complete online store for your business, with no payment gateway to set up.">
      <Cards items={[["link", "Your own store link", `yourname.${ROOT} - ready to share the moment you sign up.`], ["card", "Bank, JazzCash, Easypaisa, COD", "Customers pay the way they already do. You verify each screenshot."], ["bag", "Orders in one place", "Alerts for new orders, status updates and a WhatsApp button per customer."], ["tag", "Products and categories", "Prices, compare-at prices, stock and photos."], ["star", "Reviews from buyers", "Verified-buyer reviews build trust in your store."], ["chart", "Dashboard", "See orders, customers and revenue at a glance."]]} />
      <Reveal className="card story"><h2>How the subscription works</h2><p>Your store runs on a simple monthly subscription. After you sign up, the Orderistan team activates your store once your subscription is confirmed. You are notified before it ends so your store never goes offline by surprise.</p></Reveal>
      {!user && <Cta title="Ready to open your store?" text="Create it in a few minutes." to="/seller-signup" label="Open your store" />}
    </Frame>
  );
}

export function Contact() {
  const [f, setF] = useState({ name: "", email: "", msg: "" });
  const send = (e) => { e.preventDefault(); window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Message from " + f.name)}&body=${encodeURIComponent(f.msg + "\n\n" + f.name + " - " + f.email)}`; toast("Opening your email app..."); };
  return (
    <Frame icon="mail" title="Contact Orderistan" sub="Questions about the platform, your account or opening a store.">
      <div className="about-grid">
        <form className="card" onSubmit={send}>
          <Field label="Your name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email"><input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="How can we help?"><textarea required rows={5} value={f.msg} onChange={(e) => setF({ ...f, msg: e.target.value })} /></Field>
          <button className="btn primary"><Icon n="send" /> Send message</button><small className="muted block-note">Opens your email app with the message ready to send.</small>
        </form>
        <div className="contact-cards">
          <a className="card contact-c" href={"mailto:" + SUPPORT_EMAIL}><span className="perk-ico"><Icon n="mail" /></span><div><b>Email</b><span>{SUPPORT_EMAIL}</span></div></a>
          <div className="card contact-c"><span className="perk-ico"><Icon n="pin" /></span><div><b>Office</b><span>Karachi, Pakistan</span></div></div>
          <Link className="card contact-c" to="/faq"><span className="perk-ico"><Icon n="help" /></span><div><b>Read the FAQ</b><span>Quick answers to common questions</span></div></Link>
          <div className="card contact-c"><span className="perk-ico"><Icon n="store" /></span><div><b>Order problem?</b><span>Message the seller from My orders - they handle delivery and returns.</span></div></div>
        </div>
      </div>
    </Frame>
  );
}

export const FAQS = [
  ["Do I need an account to shop?", "Yes. One free account works on every Orderistan store and keeps your orders, wishlist and details together."],
  ["How do I pay?", "Send the order total to the seller's bank, JazzCash or Easypaisa account shown at checkout and upload your payment screenshot. Many stores also offer cash on delivery."],
  ["When is my order confirmed?", "When the seller verifies your payment (or immediately for cash on delivery). You get a notification at each step."],
  ["Who handles delivery and returns?", "The seller. Message them on WhatsApp from My orders with your order number."],
  ["Can I use the same account to sell?", "Seller accounts are separate. Open a store from Sell on Orderistan with your email and phone."],
  ["How do I open a store?", "Create a seller account, choose your store name and link, then add products. The Orderistan team activates your store after your subscription is confirmed."],
  ["Is my payment screenshot private?", "Screenshots are only visible to you, the seller you paid and the platform team."]
];
export const Faq = () => (
  <Frame icon="help" title="Frequently asked questions" sub="Answers for shoppers and sellers." narrow><Accordion items={FAQS} />
    <p className="muted center" style={{ marginTop: 22 }}>Still stuck? <Link to="/contact">Contact us</Link></p></Frame>
);

export function Help() {
  const L = [["help", "FAQ", "Quick answers", "/faq"], ["clock", "How it works", "Buying and selling in four steps", "/how-it-works"], ["truck", "Delivery & payments", "How orders and payments work", "/delivery"], ["award", "Sell on Orderistan", "Open your own store", "/sell"], ["mail", "Contact us", "Talk to the team", "/contact"], ["lock", "Privacy & terms", "How we handle your data", "/privacy"]];
  return <Frame icon="help" title="Help centre" sub="Find your answer fast."><div className="features">{L.map(([i, t, d, to], k) => <Reveal key={t} delay={k * 50}><Link to={to} className="feat linkcard"><div className="stat-ico"><Icon n={i} /></div><h3>{t}</h3><p>{d}</p></Link></Reveal>)}</div></Frame>;
}

export function Delivery() {
  return (
    <Frame icon="truck" title="Delivery & payments" sub="What to expect after you order." narrow>
      {[["wallet", "Paying for an order", "Choose bank transfer, JazzCash, Easypaisa or cash on delivery (where the store offers it). For transfers, upload your screenshot at checkout."], ["shield", "Payment verification", "The seller checks your screenshot. If something is unclear you will see a note on the order and can upload a new screenshot."], ["truck", "Delivery", "Each seller sets their own delivery fee and any free-delivery threshold. The total, including delivery, is shown before you pay."], ["x", "Cancelling", "You can cancel from My orders while the order is pending and unverified. After that, message the seller."], ["refresh", "Returns", "Return terms are set by each seller. Message them on WhatsApp with your order number and photos."]]
        .map(([i, t, d]) => <Reveal key={t} className="card policy"><span className="perk-ico"><Icon n={i} /></span><div><h3>{t}</h3><p>{d}</p></div></Reveal>)}
    </Frame>
  );
}

// Terms, Seller Agreement and Privacy Policy live in ./Legal.jsx
export { Terms, SellerTerms, Privacy, CookiePolicy } from "./Legal";

export function NotFound() {
  return (
    <div className="landing"><MainHeader />
      <section className="nf container"><div className="nf-code" aria-hidden="true">404</div><h1>This page isn't here</h1><p className="muted">The link may be old or mistyped. Try one of these instead.</p>
        <div className="row wrap-gap" style={{ justifyContent: "center" }}><Link className="btn primary" to="/">Go home</Link><Link className="btn" to="/stores">Browse stores</Link><Link className="btn" to="/help">Help centre</Link></div></section>
      <MainFooter /></div>
  );
}
