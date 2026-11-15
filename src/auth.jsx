import { createContext, useContext, useEffect, useState } from "react";
import api from "./api";

const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null); // seller's own store summary
  const [loading, setLoading] = useState(true);
  const apply = ({ token, user, store }) => {
    if (token) localStorage.setItem("orderistan_token", token);
    setUser(user); setStore(store || null); return user;
  };
  useEffect(() => {
    if (!localStorage.getItem("orderistan_token")) { setLoading(false); return; }
    api.get("/auth/me").then(({ data }) => apply(data))
      .catch(() => localStorage.removeItem("orderistan_token")).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const out = () => { setUser(null); setStore(null); };
    window.addEventListener("auth:expired", out);
    return () => window.removeEventListener("auth:expired", out);
  }, []);
  // Returns the user, or { otpRequired: true, email } for the owner account: the password alone never gives the owner a session.
  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.otpRequired) return { otpRequired: true, email: data.email || email };
    return apply(data);
  };
  const verifyAdminLogin = async (email, code) => apply((await api.post("/auth/admin/verify-login", { email, code })).data);
  // Sign-up is two steps: register* e-mails a 6-digit code (no account yet), verifySignup creates the account and logs in.
  const register = async (body) => apply((await api.post("/auth/register", body)).data);   // customer: username + password, signed in at once
  const registerSeller = async (body) => (await api.post("/auth/register-seller", body)).data;
  const verifySignup = async (email, code) => apply((await api.post("/auth/verify-signup", { email, code })).data);
  const resendSignup = async (email) => (await api.post("/auth/resend-signup", { email })).data;
  const logout = () => { localStorage.removeItem("orderistan_token"); setUser(null); setStore(null); };
  return <Ctx.Provider value={{ user, store, setUser, loading, login, verifyAdminLogin, register, registerSeller, verifySignup, resendSignup, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
