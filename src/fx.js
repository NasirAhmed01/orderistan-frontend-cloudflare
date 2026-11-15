// Orderistan premium motion layer. No React, no dependencies.
// - scroll progress bar, parallax variable, scroll-reveal with stagger, card spotlight that follows the pointer.
// Uses data-* attributes only, so React re-renders never wipe it. Fully disabled with prefers-reduced-motion.
const REVEAL = [
  ".fd-card", ".fd-deal", ".fd-how>div", ".fd-h", ".fa-card", ".fa-tile", ".fa-promise>div", ".fa-h",
  ".sv-card", ".scard", ".perks>div", ".sf-sec>.section-h", ".stat", ".pcard:not(.in-grid):not(.sk)",
  ".strip>div", ".sgrid>*", ".prof-grid>*"
].join(",");
const SPOT = ".pcard,.fd-card,.scard,.feat,.fd-deal,.sv-card,.stat,.fa-promise>div";

export function startFx() {
  if (typeof window === "undefined" || window.__orderistanFx) return;
  window.__orderistanFx = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  // ---- scroll progress bar + parallax variable
  const bar = document.createElement("div"); bar.id = "fx-progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let tick = false;
  const onScroll = () => {
    if (tick) return; tick = true;
    requestAnimationFrame(() => {
      const y = window.scrollY, h = root.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, y / h) : 0})`;
      if (!reduce) root.style.setProperty("--sy", Math.min(y, 900));
      tick = false;
    });
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  if (reduce) return;
  root.classList.add("fx-on");

  // ---- scroll reveal (stagger siblings that appear in the same frame)
  const io = new IntersectionObserver((entries) => {
    const vis = entries.filter((e) => e.isIntersecting);
    vis.forEach((e, i) => {
      e.target.style.setProperty("--fxd", Math.min(i, 8) * 55 + "ms");
      e.target.setAttribute("data-in", "1"); io.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  const scan = () => document.querySelectorAll(REVEAL).forEach((el) => {
    if (el.hasAttribute("data-fx") || el.closest(".rv")) return;
    el.setAttribute("data-fx", "1"); io.observe(el);
  });
  let q = false;
  new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; scan(); }); })
    .observe(document.getElementById("root") || document.body, { childList: true, subtree: true });
  scan();

  // ---- spotlight: cards glow where the pointer is (mouse devices only)
  if (matchMedia("(hover: hover)").matches) {
    let raf = 0;
    addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = e.target.closest?.(SPOT);
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px"); el.style.setProperty("--my", e.clientY - r.top + "px");
      });
    }, { passive: true });
  }
}
