import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ROOT, SUPPORT_EMAIL } from "../api";
import { useAuth } from "../auth";
import { Bell, Icon, Logo, UserMenu } from "../ui";
import { ScrollTop, useScrolled } from "../kit";
import { openCookieSettings } from "../consent";

// Top bar for orderistan.site (landing, marketplace, login, customer account).
export default function MainHeader() {
  const { user } = useAuth(); const nav = useNavigate(); const [q, setQ] = useState(""); const [open, setOpen] = useState(false); const scrolled = useScrolled(8); const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  const role = user?.role;
  const dash = role === "admin" ? ["/admin", "Admin panel"] : role === "seller" ? ["/seller", "Seller dashboard"] : ["/account", "My account"];
  const menu = role === "customer"
    ? [{ to: "/account", label: "My orders", icon: "bag" }, { to: "/account/wishlist", label: "Wishlist", icon: "heart" }, { to: "/account/profile", label: "My profile", icon: "user" }, { to: "/account/addresses", label: "Addresses", icon: "pin" }, { to: "/account/notifications", label: "Notifications", icon: "bell" }]
    : [{ to: dash[0], label: dash[1], icon: "grid" }, { to: dash[0] + "/profile", label: "My profile", icon: "user" }];
  const search = (e) => { e.preventDefault(); nav(`/stores?tab=products&q=${encodeURIComponent(q.trim())}`); };
  return (
    <header className={"mh" + (scrolled ? " scrolled" : "")}>
      <div className="mh-top"><div className="container"><span><b>Pay your way</b> - bank transfer, JazzCash, Easypaisa or cash on delivery</span><span>Local sellers across Pakistan</span></div></div>
      <div className="container mh-main">
        <button className="icon-btn mh-burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}><Icon n={open ? "x" : "menu"} /></button>
        <Logo />
        <form className="mh-search" onSubmit={search} role="search">
          <input placeholder="Search products from all stores..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
          <button aria-label="Search"><Icon n="search" /></button>
        </form>
        <nav className="mh-nav">
          <NavLink className="hide-md" to="/stores">Stores</NavLink><NavLink className="hide-md" to="/how-it-works">How it works</NavLink><NavLink className="hide-md" to="/sell">Sell</NavLink><NavLink className="hide-md" to="/help">Help</NavLink>
          {role === "customer" && <><Link className="hide-sm" to="/account/wishlist" aria-label="Wishlist"><Icon n="heart" /></Link><Bell base="/account" /></>}
          {user ? <UserMenu items={menu} afterLogout="/" /> : <>
            <Link className="btn ghost sm hide-sm" to="/login">Log in</Link>
            <Link className="btn sm hide-sm" to="/signup">Sign up</Link>
            <Link className="btn primary sm" to="/seller-signup">Open your store</Link>
          </>}
        </nav>
      </div>
      <div className={"mh-drawer" + (open ? " on" : "")}>{[["/stores", "Stores"], ["/how-it-works", "How it works"], ["/sell", "Sell on Orderistan"], ["/help", "Help centre"], ["/about", "About"], ["/contact", "Contact"], ...(user ? [] : [["/login", "Log in"], ["/signup", "Create account"]])].map(([to, l]) => <Link key={to} to={to}>{l}</Link>)}</div>
    </header>
  );
}

export function MainFooter() {
  return (
    <footer className="foot"><div className="container">
      <div className="foot-grid">
        <div><Logo /><p>Online stores for Pakistani sellers. Pay by bank, JazzCash or Easypaisa - no payment gateway needed.</p>
          <div className="pay-chips"><span>Bank transfer</span><span>JazzCash</span><span>Easypaisa</span><span>Cash on delivery</span></div></div>
        <div><h4>Shop</h4><Link to="/stores">Browse stores</Link><Link to="/signup">Create account</Link><Link to="/login">Log in</Link><Link to="/account">My orders</Link></div>
        <div><h4>Sell</h4><Link to="/seller-signup">Open your store</Link><Link to="/sell">Why Orderistan</Link><Link to="/login">Seller login</Link></div>
        <div><h4>Support</h4><Link to="/help">Help centre</Link><Link to="/faq">FAQ</Link><Link to="/delivery">Delivery &amp; payments</Link><Link to="/contact">Contact</Link></div>
        <div><h4>Company</h4><Link to="/about">About</Link><Link to="/how-it-works">How it works</Link><Link to="/privacy">Privacy policy</Link><Link to="/terms">Terms of use</Link><Link to="/seller-terms">Seller agreement</Link><Link to="/cookies">Cookie policy</Link><button type="button" className="linkbtn" onClick={openCookieSettings}>Cookie settings</button></div>
      </div>
      <div className="copy"><span>&copy; {new Date().getFullYear()} Orderistan - Karachi, Pakistan</span><span><a href={"mailto:" + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a> &middot; <a href={"https://" + ROOT}>{ROOT}</a></span></div>
    </div><ScrollTop /></footer>
  );
}
