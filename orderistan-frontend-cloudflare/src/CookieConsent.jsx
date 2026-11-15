import { useEffect, useRef, useState } from "react";
import { ROOT, hostSlug } from "./api";
import { CATEGORIES, acceptAll, onOpenSettings, openCookieSettings, rejectAll, setConsent, useConsent } from "./consent";
import { toast } from "./ui";

const CookieIcon = ({ size = 22 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" /><path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M7 14v.01" />
  </svg>
);
// Store subdomains do not have the legal pages, so link to the main site from there.
const policyHref = () => (hostSlug() ? `https://${ROOT}` : "") + "/cookies";
const saved = () => toast("Your cookie preferences have been saved.");

function PreferenceCenter({ initial, hasConsent, onClose }) {
  const [sel, setSel] = useState({ preferences: !!initial?.preferences, analytics: !!initial?.analytics, marketing: !!initial?.marketing });
  const [openKey, setOpenKey] = useState(null);
  const box = useRef(null);
  const gpc = typeof navigator !== "undefined" && navigator.globalPrivacyControl === true;

  // modal behaviour: lock page scroll, move focus in, keep Tab inside, Esc closes, give focus back on close
  useEffect(() => {
    const before = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => [...box.current.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')];
    focusables()[1]?.focus();
    const key = (e) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab") return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = overflow; before?.focus?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const done = (fn) => () => { fn(); saved(); onClose(true); };
  return (
    <div className="ck-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ck-modal" ref={box} role="dialog" aria-modal="true" aria-labelledby="ck-pt">
        <div className="ck-mhead">
          <span className="ck-ico"><CookieIcon /></span>
          <div><h2 id="ck-pt">Privacy preference centre</h2><small>Choose which cookies Orderistan may use</small></div>
          <button className="ck-x" onClick={() => onClose()} aria-label="Close">&times;</button>
        </div>
        <div className="ck-mbody">
          <p className="ck-intro">Orderistan uses cookies to improve your shopping experience, remember your preferences, analyze website traffic and personalize content. You decide which categories to allow. You can change your mind at any time using <b>Cookie settings</b> at the bottom of the page. <a href={policyHref()} target="_blank" rel="noreferrer">Cookie Policy</a></p>
          {gpc && <p className="ck-gpc">Your browser sends a Global Privacy Control signal. Optional categories stay off unless you switch them on.</p>}
          {CATEGORIES.map((c) => {
            const o = openKey === c.key;
            return (
              <div className="ck-cat" key={c.key}>
                <div className="ck-cat-head">
                  <button type="button" className="ck-cat-t" aria-expanded={o} onClick={() => setOpenKey(o ? null : c.key)}><span className={"ck-chev" + (o ? " on" : "")} aria-hidden="true">&rsaquo;</span>{c.title}</button>
                  {c.locked ? <span className="ck-always">Always active</span>
                    : <label className="ck-switch"><input type="checkbox" role="switch" checked={sel[c.key]} onChange={(e) => setSel({ ...sel, [c.key]: e.target.checked })} aria-label={c.title} /><i /></label>}
                </div>
                <p>{c.desc}</p>
                {o && <ul>{c.examples.map((x) => <li key={x}>{x}</li>)}</ul>}
              </div>
            );
          })}
        </div>
        <div className="ck-mfoot">
          <button className="btn primary" onClick={done(() => setConsent(sel, hasConsent ? "update" : "custom"))}>Save my choices</button>
          <button className="btn" onClick={done(acceptAll)}>Accept all</button>
          <button className="btn" onClick={done(rejectAll)}>Reject non-essential</button>
        </div>
      </div>
    </div>
  );
}

export default function CookieConsent() {
  const consent = useConsent();
  const [ready, setReady] = useState(false); const [open, setOpen] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 600); return () => clearTimeout(t); }, []);
  useEffect(() => onOpenSettings(() => setOpen(true)), []);
  if (!ready) return null;
  return (
    <>
      {!consent && !open && (
        <div className="ck-banner" role="region" aria-label="Cookie consent">
          <div className="ck-head"><span className="ck-ico"><CookieIcon /></span><h2>Your Privacy Matters</h2></div>
          <p>Orderistan uses cookies to improve your shopping experience, remember your preferences, analyze website traffic and personalize content. You choose what we can use. <a href={policyHref()}>Cookie Policy</a></p>
          <div className="ck-actions">
            <button className="btn primary" onClick={() => { acceptAll(); saved(); }}>Accept all</button>
            <button className="btn" onClick={() => { rejectAll(); saved(); }}>Reject non-essential</button>
            <button className="ck-link" onClick={() => setOpen(true)}>Customize</button>
          </div>
        </div>
      )}
      {consent && !open && <button className="ck-fab" onClick={openCookieSettings} aria-label="Cookie settings" title="Cookie settings"><CookieIcon size={20} /></button>}
      {open && <PreferenceCenter initial={consent?.c} hasConsent={!!consent} onClose={() => setOpen(false)} />}
    </>
  );
}
