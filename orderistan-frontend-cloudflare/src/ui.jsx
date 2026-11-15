import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api, { errMsg, thumb } from "./api";
import { useAuth } from "./auth";
import { prefGet, prefSet } from "./consent";

export const money = (n) => "Rs " + Number(n || 0).toLocaleString("en-PK");
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-");
export const fmtTime = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-");
export function waLink(number, text) {
  let d = String(number || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2); else if (d.startsWith("0")) d = "92" + d.slice(1);
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(text)}` : "";
}

// ---- icons (inline SVG, no dependency)
const P = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  store: <><path d="M3 9l1.5-5h15L21 9" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v8h14v-8" /><path d="M10 20v-5h4v5" /></>,
  box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  bag: <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  cart: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
  sliders: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  menu: <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  check: <polyline points="20 6 9 17 4 12" />,
  x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  truck: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  card: <><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
  link: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  send: <><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  down: <polyline points="6 9 12 15 18 9" />,
  right: <polyline points="9 18 15 12 9 6" />,
  left: <polyline points="15 18 9 12 15 6" />,
  refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  award: <><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></>,
  percent: <><line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></>,
  sun: <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>,
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  mail: <><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>,
  star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
  up: <polyline points="18 15 12 9 6 15" />,
  gift: <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2V2" /><line x1="6" y1="2" x2="6" y2="22" /><path d="M18 22V2c-2.5 1.5-4 4.5-4 8 0 2 1 3 2 3h2" /></>,
  shirt: <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  ruler: <><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z" /><path d="M14.5 12.5l2-2M11.5 9.5l2-2M8.5 6.5l2-2M17.5 15.5l2-2" /></>,
  palette: <><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1-.3-.3-.5-.6-.5-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-4.9-4.5-9-10-9z" /></>,
  cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
  list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>,
  filter: <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />,
  paperclip: <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  wallet: <><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" /><path d="M4 6v12c0 1.1.9 2 2 2h14v-4" /><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" /></>
};
export const Icon = ({ n, className = "" }) => (
  <svg className={"ico " + className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">{P[n] || null}</svg>
);
export const Logo = ({ to = "/", mark = true }) => <Link to={to} className="logo" aria-label="Orderistan home">{mark && <img src="/logo.png" alt="" width="40" height="38" />}<div>Order<span>istan</span></div></Link>;
export const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "U";
export const Avatar = ({ name, size = "", solid, src }) => <span className={"av " + size + (solid && !src ? " solid" : "") + (src ? " has-img" : "")} aria-hidden="true">{src ? <img src={thumb(src, size === "lg" ? 256 : 96)} alt="" loading="lazy" /> : initials(name)}</span>;

// ---- toasts
let push = () => {};
export const toast = (m, type = "ok") => push({ m, type, id: Math.random() });
export const copyText = (t, what = "Copied") => navigator.clipboard?.writeText(String(t)).then(() => toast(what + "."));
// Confirmation dialog: `if (await confirmBox({ title, body, ok, danger })) ...` (replaces the browser's confirm()).
let askConfirm = null;
export const confirmBox = (o) => new Promise((res) => { if (!askConfirm) return res(window.confirm(typeof o === "string" ? o : o.body || o.title)); askConfirm({ ...(typeof o === "string" ? { body: o } : o), res }); });
function ConfirmHost() {
  const [c, setC] = useState(null);
  useEffect(() => { askConfirm = setC; return () => { askConfirm = null; }; }, []);
  if (!c) return null;
  const done = (v) => { c.res(v); setC(null); };
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && done(false)} onKeyDown={(e) => e.key === "Escape" && done(false)}>
      <div className="modal confirm" role="alertdialog" aria-modal="true" aria-label={c.title || "Confirm"}>
        <div className="modal-b"><div className={"c-ico" + (c.danger ? " red" : "")}><Icon n={c.danger ? "alert" : "help"} /></div>
          <h3>{c.title || "Are you sure?"}</h3>{c.body && <p className="muted pre">{c.body}</p>}
          <div className="row c-act"><button className="btn grow" autoFocus onClick={() => done(false)}>{c.cancel || "Cancel"}</button><button className={"btn grow " + (c.danger ? "danger" : "primary")} onClick={() => done(true)}>{c.ok || "Confirm"}</button></div></div>
      </div>
    </div>
  );
}
export function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    push = (t) => { setList((x) => [...x, t]); setTimeout(() => setList((x) => x.filter((i) => i !== t)), 3800); };
    return () => { push = () => {}; };
  }, []);
  return <><ConfirmHost /><div className="toasts" role="status" aria-live="polite">{list.map((t) => <div key={t.id} className={"toast " + t.type}>{t.m}</div>)}</div></>;
}

// ---- data hook
export function useGet(path, params) {
  const [s, setS] = useState({ data: null, loading: !!path, error: "", status: 0 });
  const key = JSON.stringify([path, params]);
  const load = useCallback(() => {
    if (!path) return Promise.resolve();
    setS((x) => ({ ...x, loading: true }));
    return api.get(path, { params }).then((r) => setS({ data: r.data, loading: false, error: "", status: 200 }))
      .catch((e) => setS({ data: e.response?.data || null, loading: false, error: errMsg(e), status: e.response?.status || 0 }));
  }, [key]); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  return { ...s, reload: load };
}

// Sidebar badges (unread chat messages, renewal requests waiting). Polls a tiny endpoint only while the tab is visible;
// the chat page fires "chat:read" after opening a thread so the number drops at once.
export function useBadges(ms = 30000) {
  const [b, setB] = useState({ chat: 0, renewals: 0 });
  const load = useCallback(() => { if (!document.hidden) api.get("/chat/badges").then((r) => setB(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    load(); const t = setInterval(load, ms);
    document.addEventListener("visibilitychange", load); window.addEventListener("chat:read", load);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", load); window.removeEventListener("chat:read", load); };
  }, [load, ms]);
  return b;
}

// ---- small components
export const Spinner = () => <div className="center muted pad"><i className="spin" />Loading...</div>;
export const Empty = ({ children, icon = "box" }) => <div className="empty"><Icon n={icon} />{children}</div>;
const TONES = { active: "green", verified: "green", delivered: "green", confirmed: "blue", preparing: "blue", out_for_delivery: "blue", submitted: "amber", pending: "amber",
  unpaid: "amber", cod: "gray", completed: "green", booking: "blue", request: "amber", processing: "blue", rejected: "red", cancelled: "red", expired: "red", inactive: "gray", suspended: "red" };
const BLABEL = { preparing: "processing" };
export const Badge = ({ v, children }) => <span className={"badge " + (TONES[v] || "gray")}>{children || BLABEL[v] || String(v).replace(/_/g, " ")}</span>;

export function Modal({ title, onClose, children, wide, xl }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={"modal" + (wide ? " wide" : "") + (xl ? " xl" : "")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-h"><h3>{title}</h3><button className="x" onClick={onClose} aria-label="Close">&times;</button></div>
        <div className="modal-b">{children}</div>
      </div>
    </div>
  );
}

export function Pager({ data, onPage }) {
  if (!data || data.pages <= 1) return null;
  return (
    <div className="pager">
      <button className="btn sm" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}><Icon n="left" /> Prev</button>
      <span className="muted">Page {data.page} of {data.pages}</span>
      <button className="btn sm" disabled={data.page >= data.pages} onClick={() => onPage(data.page + 1)}>Next <Icon n="right" /></button>
    </div>
  );
}

// Private images (payment screenshots) need the login token, so fetch as a blob.
export function AuthImage({ url, alt = "Payment screenshot" }) {
  const [src, setSrc] = useState(""); const [bad, setBad] = useState(false);
  useEffect(() => {
    let obj = ""; setBad(false);
    api.get(url, { responseType: "blob" }).then((r) => { obj = URL.createObjectURL(r.data); setSrc(obj); }).catch(() => setBad(true));
    return () => obj && URL.revokeObjectURL(obj);
  }, [url]);
  if (bad) return <div className="muted">Screenshot unavailable.</div>;
  return src ? <a href={src} target="_blank" rel="noreferrer"><img className="shot" src={src} alt={alt} /></a> : <div className="muted">Loading screenshot...</div>;
}

export function Field({ label, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small className="muted">{hint}</small>}</label>;
}

// KPI card used on admin + seller dashboards
export const Stat = ({ label, value, tone, icon = "chart" }) => (
  <div className={"stat " + (tone || "")}><div className="stat-ico"><Icon n={icon} /></div><div><span>{label}</span><b>{value}</b></div></div>
);
export const PageHead = ({ title, sub, children }) => (
  <div className="page-h"><div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>{children && <div className="row wrap-gap">{children}</div>}</div>
);

// close a popup when clicking outside it
function useOutside(ref, fn) {
  useEffect(() => { const c = (e) => ref.current && !ref.current.contains(e.target) && fn(); addEventListener("mousedown", c); return () => removeEventListener("mousedown", c); }, []); // eslint-disable-line
}

// ---- notification bell (works for admin, seller and customer)
export function Bell({ base = "" }) {
  const [d, setD] = useState({ items: [], unread: 0 }); const [open, setOpen] = useState(false);
  const nav = useNavigate(); const ref = useRef();
  // The badge polls a tiny "unread count" endpoint, only while the tab is visible. The full list is loaded when the bell is opened.
  const count = () => { if (!document.hidden) api.get("/notifications/unread").then((r) => setD((x) => ({ ...x, unread: r.data.unread }))).catch(() => {}); };
  useEffect(() => {
    count(); const t = setInterval(count, 90000);
    document.addEventListener("visibilitychange", count);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", count); };
  }, []); // eslint-disable-line
  useOutside(ref, () => setOpen(false));
  const toggle = () => {
    const o = !open; setOpen(o);
    if (o) api.get("/notifications").then((r) => {
      setD(r.data);
      if (r.data.unread) api.post("/notifications/read").then(() => setD((x) => ({ ...x, unread: 0 }))).catch(() => {});
    }).catch(() => {});
  };
  const go = (l) => { setOpen(false); if (!l) return; nav(l.startsWith("store:") ? base + l.slice(6) : l); };
  return (
    <div className="bell" ref={ref}>
      <button className="icon-btn" onClick={toggle} aria-label="Notifications" aria-expanded={open}><Icon n="bell" />{d.unread > 0 && <i>{d.unread}</i>}</button>
      {open && (
        <div className="drop">
          <div className="drop-h">Notifications</div>
          {d.items.length === 0 && <div className="muted pad center">You're all caught up.</div>}
          {d.items.map((n) => (
            <button key={n._id} className={"note" + (n.read ? "" : " new")} onClick={() => go(n.link)}>
              <b>{n.title}</b><span>{n.body}</span><small>{fmtTime(n.createdAt)}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- profile dropdown: avatar + name, role-aware links, log out
// items: [{ to, label, icon, href? }]
export function UserMenu({ items = [], afterLogout = "/login" }) {
  const { user, logout } = useAuth(); const nav = useNavigate(); const [open, setOpen] = useState(false); const ref = useRef();
  useOutside(ref, () => setOpen(false));
  if (!user) return null;
  return (
    <div className="umenu" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <Avatar name={user.name} src={user.avatar} solid /><span><b>{user.name}</b><small>{user.role === "admin" ? "Owner" : user.role}</small></span><Icon n="down" />
      </button>
      {open && (
        <div className="drop u" role="menu" onClick={() => setOpen(false)}>
          <div className="head"><b>{user.name}</b><small>{user.email}</small></div>
          {items.map((i) => i.href
            ? <a key={i.label} href={i.href} target="_blank" rel="noreferrer"><Icon n={i.icon} />{i.label}</a>
            : <Link key={i.label} to={i.to}><Icon n={i.icon} />{i.label}</Link>)}
          <button className="out" onClick={() => { logout(); nav(afterLogout); }}><Icon n="logout" />Log out</button>
        </div>
      )}
    </div>
  );
}

// ---- dashboard shell shared by admin and seller
// theme: "admin" | "seller". links: [{ heading } | { to, label, icon, end?, hidden? }]
export function Shell({ theme, links, children }) {
  const { user, store, logout } = useAuth(); const nav = useNavigate(); const loc = useLocation(); const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => { return prefGet("orderistan_mode") === "dark"; });
  const flip = () => setDark((d) => { const n = !d; prefSet("orderistan_mode", n ? "dark" : "light"); return n; });
  useEffect(() => { setOpen(false); }, [loc.pathname]);
  const real = links.filter((l) => l.to);
  const cur = [...real].sort((a, b) => b.to.length - a.to.length).find((l) => loc.pathname === l.to || loc.pathname.startsWith(l.to + "/"));
  const isAdmin = theme === "admin";
  const menu = isAdmin
    ? [{ to: "/admin/profile", label: "My profile", icon: "user" }, { to: "/", label: "Public website", icon: "home" }]
    : [{ to: "/seller/profile", label: "My profile", icon: "user" }, { to: "/seller/settings", label: "Store settings", icon: "sliders" },
       ...(store?.slug ? [{ to: "/s/" + store.slug, label: "View my store", icon: "store" }] : [])];
  return (
    <div className={`shell t-${theme}${dark ? " dark" : ""}`}>
      <div className={"scrim" + (open ? " on" : "")} onClick={() => setOpen(false)} />
      <aside className={"side" + (open ? " open" : "")} aria-label="Main navigation">
        <div className="brand"><img className="mark-img" src="/logo.png" alt="" width="38" height="36" /><div>Order<span>istan</span></div><small>{isAdmin ? "Owner" : "Seller"}</small></div>
        <nav>
          {links.filter((l) => !l.hidden).map((l, i) => l.heading
            ? <div key={i} className="nav-h">{l.heading}</div>
            : <NavLink key={l.to} to={l.to} end={l.end}><Icon n={l.icon} /><span>{l.label}</span>{l.badge > 0 && <em className="nav-badge" aria-label={`${l.badge} waiting`}>{l.badge > 99 ? "99+" : l.badge}</em>}</NavLink>)}
        </nav>
        <div className="side-foot">
          <div className="side-user"><Avatar name={user?.name} src={user?.avatar} solid /><div><b>{user?.name}</b><small>{isAdmin ? "Platform owner" : store?.name || "Seller"}</small></div></div>
          <button className="btn" onClick={() => { logout(); nav("/login"); }}><Icon n="logout" /> Log out</button>
        </div>
      </aside>
      <div className="main">
        <header className="top">
          <button className="icon-btn menu" onClick={() => setOpen(!open)} aria-label="Menu"><Icon n="menu" /></button>
          <div className="crumb"><h2>{cur?.label || "Dashboard"}</h2><small>{isAdmin ? "Orderistan owner panel" : "Seller dashboard"}</small></div>
          <div className="grow" />
          <button className="icon-btn" onClick={flip} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} title={dark ? "Light mode" : "Dark mode"}><Icon n={dark ? "sun" : "moon"} /></button>
          <Bell />
          <UserMenu items={menu} />
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
