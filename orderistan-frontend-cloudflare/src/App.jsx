import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { hostSlug } from "./api";
import { Spinner, Toasts } from "./ui";
import Landing from "./pages/Landing";
import Market from "./pages/Market";
import CookieConsent from "./CookieConsent";
import { About, Contact, Delivery, Faq, Help, HowItWorks, CookiePolicy, NotFound, Privacy, Sell, SellerTerms, Terms } from "./pages/Info";

// Admin and seller code is only downloaded after a successful role check (it is not shipped to customers / visitors).
const Admin = lazy(() => import("./admin/Admin"));
const Account = lazy(() => import("./pages/Account"));
const Store = lazy(() => import("./store/Store"));
const named = (name) => lazy(() => import("./pages/Auth").then((m) => ({ default: m[name] })));
const Login = named("Login"), CustomerSignup = named("CustomerSignup"), SellerSignup = named("SellerSignup"), ForgotPassword = named("ForgotPassword");
const Seller = lazy(() => import("./seller/Seller"));

const homeOf = (u) => (u?.role === "admin" ? "/admin" : u?.role === "seller" ? "/seller" : u?.role === "customer" ? "/account" : "/");

// Role-based route guard (the server enforces the same roles on every API call; this only decides what to show).
//  - not logged in  -> /login (and come back after login)
//  - wrong role     -> that user's own dashboard (a customer typing /admin lands on /account)
function Guard({ role, children }) {
  const { user, loading } = useAuth(); const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return user.role === role ? children : <Navigate to={homeOf(user)} replace />;
}
const PathStore = () => { const { slug } = useParams(); return <Store slug={slug} base={"/s/" + slug} />; };

export default function App() {
  const slug = hostSlug(); // on nasirkitchen.orderistan.site the whole site IS the store
  return (
    <AuthProvider>
      <Toasts />
      <CookieConsent />
      {slug ? (
        <Suspense fallback={<Spinner />}><Routes><Route path="/*" element={<Store slug={slug} base="" />} /></Routes></Suspense>
      ) : (
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<CustomerSignup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/stores" element={<Market />} />
            <Route path="/account/*" element={<Guard role="customer"><Account /></Guard>} />
            <Route path="/seller-signup" element={<SellerSignup />} />
            <Route path="/seller/*" element={<Guard role="seller"><Seller /></Guard>} />
            <Route path="/admin/*" element={<Guard role="admin"><Admin /></Guard>} />
            <Route path="/s/:slug/*" element={<PathStore />} />
            <Route path="/about" element={<About />} /><Route path="/how-it-works" element={<HowItWorks />} /><Route path="/sell" element={<Sell />} />
            <Route path="/contact" element={<Contact />} /><Route path="/faq" element={<Faq />} /><Route path="/help" element={<Help />} />
            <Route path="/delivery" element={<Delivery />} /><Route path="/privacy" element={<Privacy />} /><Route path="/terms" element={<Terms />} /><Route path="/seller-terms" element={<SellerTerms />} /><Route path="/cookies" element={<CookiePolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      )}
    </AuthProvider>
  );
}
