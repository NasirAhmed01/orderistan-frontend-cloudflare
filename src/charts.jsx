import { useMemo } from "react";

// Small dependency-free SVG charts for the admin and seller dashboards.
const nice = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + "k" : String(Math.round(n)));

export function AreaChart({ data, x = "day", y = "value", height = 220, color = "var(--accent)", format = nice, label }) {
  const W = 640, H = height, pad = { l: 40, r: 12, t: 14, b: 26 };
  const max = Math.max(1, ...data.map((d) => d[y])), n = Math.max(1, data.length - 1);
  const px = (i) => pad.l + (i / n) * (W - pad.l - pad.r), py = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const line = data.map((d, i) => `${i ? "L" : "M"}${px(i).toFixed(1)},${py(d[y]).toFixed(1)}`).join(" ");
  const area = data.length ? `${line} L${px(data.length - 1)},${H - pad.b} L${px(0)},${H - pad.b} Z` : "";
  const ticks = [0, 0.5, 1].map((t) => t * max);
  const step = Math.ceil(data.length / 7);
  const id = useMemo(() => "g" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label || "Trend chart"} preserveAspectRatio="none">
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {ticks.map((t, i) => <g key={i}><line x1={pad.l} x2={W - pad.r} y1={py(t)} y2={py(t)} className="grid-l" /><text x={pad.l - 6} y={py(t) + 4} textAnchor="end" className="ax">{format(t)}</text></g>)}
      {area && <path d={area} fill={`url(#${id})`} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />}
      {data.map((d, i) => <g key={i}>{i % step === 0 && <text x={px(i)} y={H - 6} textAnchor="middle" className="ax">{String(d[x]).slice(5)}</text>}
        <circle cx={px(i)} cy={py(d[y])} r="9" fill="transparent"><title>{`${d[x]}: ${format(d[y])}`}</title></circle></g>)}
    </svg>
  );
}

export function BarChart({ data, x = "label", y = "value", height = 200, color = "var(--accent)", format = nice }) {
  const max = Math.max(1, ...data.map((d) => d[y]));
  return (
    <div className="bars2" style={{ height }} role="img" aria-label="Bar chart">
      {data.map((d, i) => (
        <div key={i} title={`${d[x]}: ${format(d[y])}`}><em>{d[y] ? format(d[y]) : ""}</em><i style={{ height: Math.max(d[y] ? 3 : 0, (d[y] / max) * 100) + "%", background: d.color || color }} /><small>{d[x]}</small></div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 150, center }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1, r = 52, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 140 140" width={size} height={size} role="img" aria-label="Distribution">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
        {parts.map((p) => { const len = (p.value / total) * c, el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" stroke={p.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)"><title>{`${p.label}: ${p.value}`}</title></circle>; off += len; return el; })}
        <text x="70" y="68" textAnchor="middle" className="d-big">{center ?? total}</text><text x="70" y="86" textAnchor="middle" className="d-sm">total</text>
      </svg>
      <ul className="legend">{parts.map((p) => <li key={p.label}><i style={{ background: p.color }} />{p.label}<b>{p.value}</b></li>)}</ul>
    </div>
  );
}

// usage meter: turns amber at 70 %, orange at 85 %, red at 95 %
export function Meter({ value, max, label, sub, thresholds = true }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const tone = !thresholds ? "" : pct >= 95 ? "crit" : pct >= 85 ? "high" : pct >= 70 ? "warn" : "";
  return (
    <div className={"meter " + tone}>
      <div className="meter-h"><span>{label}</span><b>{sub ?? `${Math.round(pct)}%`}</b></div>
      <div className="meter-t" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ width: pct + "%" }} /></div>
    </div>
  );
}
