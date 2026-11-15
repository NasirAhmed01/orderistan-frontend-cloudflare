import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";

// ---- scroll reveal: adds .in once the element enters the viewport (used on a few key sections only)
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }) {
  const ref = useRef(); const [on, setOn] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.12 });
    io.observe(ref.current); return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={"rv " + (on ? "in " : "") + className} style={{ "--d": delay + "ms" }}>{children}</Tag>;
}

// ---- number that counts up when visible
export function CountUp({ to = 0, suffix = "", duration = 1200 }) {
  const ref = useRef(); const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current; let raf, started = false;
    const run = () => { const t0 = performance.now(); const tick = (t) => { const k = Math.min(1, (t - t0) / duration); setN(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick); };
    if (!("IntersectionObserver" in window)) { setN(to); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el); return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{n.toLocaleString("en-PK")}{suffix}</span>;
}

// ---- floating "back to top" button
export function ScrollTop() {
  const [show, setShow] = useState(false);
  useEffect(() => { const f = () => setShow(window.scrollY > 600); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  return <button className={"to-top" + (show ? " on" : "")} aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Icon n="up" /></button>;
}

// ---- true once the page is scrolled past `px` (sticky headers shrink / gain shadow)
export function useScrolled(px = 8) {
  const [s, setS] = useState(false);
  useEffect(() => { const f = () => setS(window.scrollY > px); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, [px]);
  return s;
}

// ---- accordion for FAQs: items = [[question, answer], ...]
export function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="acc">{items.map(([q, a], i) => (
      <div key={q} className={"acc-i" + (open === i ? " open" : "")}>
        <button aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}><span>{q}</span><Icon n="down" /></button>
        <div className="acc-b"><div><p>{a}</p></div></div>
      </div>))}</div>
  );
}

// ---- password input with show / hide toggle (drop-in for <input type="password" />)
export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw"><input {...props} type={show ? "text" : "password"} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}><Icon n={show ? "eyeoff" : "eye"} /></button></div>
  );
}

// ---- animated progress bar (free-delivery meter, profile completeness)
export const Progress = ({ value, label }) => (
  <div className="prog" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></div>
);

// ---- skeleton placeholders (nicer than a spinner for product grids)
export const SkeletonGrid = ({ n = 8 }) => <div className="pgrid">{Array.from({ length: n }).map((_, i) => <div className="pcard sk" key={i}><div className="pimg" /><div className="pinfo"><i /><i className="s" /><i className="b" /></div></div>)}</div>;

export function useCopy() {
  return async (text, ok = "Copied") => { try { await navigator.clipboard.writeText(text); const { toast } = await import("./ui"); toast(ok); } catch { /* ignore */ } };
}

// ---- small helper used by both account areas: per-user saved delivery addresses (kept on this device)
export function useAddresses(userId) {
  const key = "orderistan_addr:" + userId;
  const read = () => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
  const [list, setList] = useState(read);
  const save = (next) => { setList(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ } };
  return [list, save];
}
