/* Hand-rolled SVG/CSS chart kit (no dependencies).
   Every spec: { type, title:{zh,en}, sub:{zh,en}, source:[{label,url}], ...typeSpecific }
   Colours are CSS-var tokens: accent | coral | lime | blue | amber | faint */

const C = {
  accent: "var(--accent)",
  bright: "var(--accent-bright)",
  coral: "var(--coral)",
  lime: "var(--lime)",
  blue: "var(--blue)",
  amber: "var(--amber)",
  faint: "var(--faint)",
  ink: "var(--ink)",
  line: "var(--line)",
  panel: "var(--panel-3)",
};
const col = (k) => (k && C[k]) || C.accent;
const L = (v, lang) => (v && typeof v === "object" ? v[lang] ?? v.zh : v);

let uid = 0;

function caption(spec) {
  if (!spec.source || !spec.source.length) return "";
  const lang = spec._lang || "zh";
  const items = spec.source
    .map(
      (s) =>
        `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${L(
          s.label,
          lang
        )}</a>`
    )
    .join(" · ");
  const note = spec.note ? `${L(spec.note, lang)} ` : "";
  return `<figcaption>${note}${lang === "zh" ? "数据/出处" : "Data / source"}：${items}</figcaption>`;
}

/* ---------- bar ---------- */
function bar(spec, lang) {
  const cats = spec.categories[lang] || spec.categories.zh;
  const series = spec.series;
  const W = 720, H = spec.height || 300, pad = { t: 18, r: 14, b: 46, l: 46 };
  const max = spec.max || Math.max(...series.flatMap((s) => s.values)) * 1.15;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const gw = iw / cats.length;
  const bw = Math.min(30, (gw * 0.7) / series.length);
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ih / 4) * i;
    g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
    g += `<text class="axis-label" x="${pad.l - 8}" y="${y + 3.5}" text-anchor="end">${Math.round(
      max - (max / 4) * i
    )}</text>`;
  }
  cats.forEach((c, ci) => {
    const cx = pad.l + gw * ci + gw / 2;
    series.forEach((s, si) => {
      const v = s.values[ci];
      const h = (v / max) * ih;
      const x = cx - (series.length * bw) / 2 + si * bw;
      const y = pad.t + ih - h;
      g += `<rect class="bar-rect chart-hover" x="${x.toFixed(1)}" y="${y.toFixed(
        1
      )}" width="${(bw - 3).toFixed(1)}" height="${Math.max(h, 1).toFixed(1)}" rx="4" fill="${col(
        s.color
      )}" style="transition-delay:${(ci * series.length + si) * 45}ms"><title>${L(
        s.name,
        lang
      )} · ${c}: ${v}${spec.unit || ""}</title></rect>`;
      if (series.length === 1 && spec.showValues !== false)
        g += `<text class="axis-label" x="${x + (bw - 3) / 2}" y="${y - 6}" text-anchor="middle" style="fill:var(--ink)">${v}</text>`;
    });
    g += `<text class="axis-label" x="${cx}" y="${H - pad.b + 18}" text-anchor="middle">${c}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${L(spec.title, lang)}">${g}</svg>${legend(
    series,
    lang
  )}`;
}

/* ---------- horizontal bars (HTML) ---------- */
function hbar(spec, lang) {
  const rows = spec.rows.map((r, i) => {
    const max = spec.max || Math.max(...spec.rows.map((x) => x.value));
    const pct = Math.max(2, (r.value / max) * 100);
    const tone = r.tone || (i % 3 === 1 ? "coral" : i % 3 === 2 ? "blue" : "");
    return `<div class="hbar-row"><div class="hbar-head"><span>${L(
      r.label,
      lang
    )}</span><b>${r.value}${r.suffix || spec.unit || ""}</b></div><div class="hbar-track"><i class="hbar-fill ${tone}" style="width:${pct}%;transition-delay:${
      i * 70
    }ms"></i></div></div>`;
  });
  return `<div class="hbars">${rows.join("")}</div>`;
}

/* ---------- donut ---------- */
function donut(spec, lang) {
  const total = spec.slices.reduce((a, s) => a + s.value, 0);
  const R = 78, SW = spec.thickness || 30, CIRC = 2 * Math.PI * R;
  let off = 0;
  const arcs = spec.slices
    .map((s, i) => {
      const frac = s.value / total;
      const len = CIRC * frac;
      const a = `<circle class="donut-arc" cx="110" cy="110" r="${R}" fill="none" stroke="${col(
        s.color
      )}" stroke-width="${SW}" stroke-dasharray="${len.toFixed(2)} ${(
        CIRC - len
      ).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 110 110)" style="transition-delay:${
        i * 130
      }ms"><title>${L(s.name, lang)}: ${s.value}${spec.unit || ""} (${Math.round(
        frac * 100
      )}%)</title></circle>`;
      off += len;
      return a;
    })
    .join("");
  const center = `<text x="110" y="104" text-anchor="middle" style="font-family:var(--font-mono);font-size:26px;font-weight:700;fill:var(--ink)">${
    spec.center || total
  }</text><text x="110" y="126" text-anchor="middle" class="axis-label">${L(
    spec.centerLabel,
    lang
  ) || ""}</text>`;
  const leg = spec.slices
    .map(
      (s) =>
        `<span><i style="background:${col(s.color)}"></i>${L(s.name, lang)} · ${
          s.value
        }${spec.unit || ""}</span>`
    )
    .join("");
  return `<div style="display:flex;gap:22px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 220 220" style="max-width:230px;flex:1 1 200px">${arcs}${center}</svg><div class="chart-legend" style="flex-direction:column;align-items:flex-start;gap:7px">${leg}</div></div>`;
}

/* ---------- stacked 100% bar ---------- */
function stack(spec, lang) {
  const total = spec.parts.reduce((a, p) => a + p.value, 0);
  const cells = spec.parts
    .map(
      (p, i) =>
        `<div class="stack-seg chart-hover" title="${L(p.name, lang)}: ${p.value}${
          spec.unit || ""
        }" style="width:${((p.value / total) * 100).toFixed(2)}%;background:${col(
          p.color
        )};transition-delay:${i * 90}ms"><span>${
          p.value / total > 0.08 ? Math.round((p.value / total) * 100) + "%" : ""
        }</span></div>`
    )
    .join("");
  const leg = spec.parts
    .map(
      (p) =>
        `<span><i style="background:${col(p.color)}"></i>${L(p.name, lang)} · ${p.value}${
          spec.unit || ""
        }</span>`
    )
    .join("");
  return `<div class="stack-bar">${cells}</div><div class="chart-legend">${leg}</div>`;
}

/* ---------- line / area ---------- */
function line(spec, lang) {
  const W = 720, H = spec.height || 280, pad = { t: 16, r: 14, b: 40, l: 46 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const xs = spec.xs[lang] || spec.xs.zh;
  const max = spec.max || Math.max(...spec.series.flatMap((s) => s.values)) * 1.1;
  const step = iw / (xs.length - 1);
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ih / 4) * i;
    g += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}" stroke="var(--line)"/>`;
    g += `<text class="axis-label" x="${pad.l - 8}" y="${y + 3.5}" text-anchor="end">${Math.round(
      max - (max / 4) * i
    )}</text>`;
  }
  xs.forEach((x, i) => {
    g += `<text class="axis-label" x="${pad.l + step * i}" y="${H - pad.b + 18}" text-anchor="middle">${x}</text>`;
  });
  spec.series.forEach((s, si) => {
    const pts = s.values.map(
      (v, i) => `${(pad.l + step * i).toFixed(1)},${(pad.t + ih - (v / max) * ih).toFixed(1)}`
    );
    const id = `grad${uid++}`;
    if (s.area)
      g += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col(
        s.color
      )}" stop-opacity=".35"/><stop offset="1" stop-color="${col(
        s.color
      )}" stop-opacity="0"/></linearGradient></defs><polygon points="${pad.l},${
        pad.t + ih
      } ${pts.join(" ")} ${W - pad.r},${pad.t + ih}" fill="url(#${id})" opacity=".9"/>`;
    g += `<polyline class="spark-path" pathLength="1" points="${pts.join(" ")}" fill="none" stroke="${col(
      s.color
    )}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="transition-delay:${
      si * 180
    }ms"/>`;
    s.values.forEach((v, i) => {
      const [x, y] = pts[i].split(",");
      g += `<circle class="chart-hover" cx="${x}" cy="${y}" r="3.6" fill="var(--bg)" stroke="${col(
        s.color
      )}" stroke-width="2.2"><title>${L(s.name, lang)} · ${xs[i]}: ${v}${
        spec.unit || ""
      }</title></circle>`;
    });
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg>${legend(spec.series, lang)}`;
}

/* ---------- waterfall ---------- */
function waterfall(spec, lang) {
  const W = 720, H = spec.height || 300, pad = { t: 16, r: 14, b: 46, l: 48 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const labels = spec.steps.map((s) => L(s.name, lang));
  const max = spec.max || Math.max(...spec.steps.map((s) => Math.abs(s.value))) * 1.15;
  const bw = Math.min(54, (iw / spec.steps.length) * 0.68);
  let acc = 0, g = "";
  spec.steps.forEach((s, i) => {
    const x = pad.l + (iw / spec.steps.length) * i + (iw / spec.steps.length - bw) / 2;
    const from = s.cumulative === false ? 0 : acc;
    const to = from + s.value;
    const y1 = pad.t + ih - (Math.max(from, to) / max) * ih;
    const y2 = pad.t + ih - (Math.min(from, to) / max) * ih;
    g += `<rect class="bar-rect chart-hover" x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${bw.toFixed(
      1
    )}" height="${Math.max(y2 - y1, 2).toFixed(1)}" rx="4" fill="${col(
      s.color
    )}" style="transition-delay:${i * 80}ms"><title>${labels[i]}: ${s.value}${
      spec.unit || ""
    }</title></rect>`;
    g += `<text class="axis-label" x="${(x + bw / 2).toFixed(1)}" y="${H - pad.b + 18}" text-anchor="middle">${
      labels[i].length > 9 ? labels[i].slice(0, 9) + "…" : labels[i]
    }</text>`;
    acc = s.total != null ? s.total : to;
  });
  return `<svg viewBox="0 0 ${W} ${H}">${g}</svg>`;
}

/* ---------- radar ---------- */
function radar(spec, lang) {
  const size = 340, cx = size / 2, cy = size / 2, R = size / 2 - 46;
  const axes = spec.axes.map((a) => L(a.name, lang));
  const N = axes.length;
  const pt = (i, r) => {
    const ang = (Math.PI * 2 * i) / N - Math.PI / 2;
    return `${(cx + Math.cos(ang) * r).toFixed(1)},${(cy + Math.sin(ang) * r).toFixed(1)}`;
  };
  let g = "";
  for (let ring = 1; ring <= 4; ring++) {
    const poly = axes.map((_, i) => pt(i, (R * ring) / 4)).join(" ");
    g += `<polygon points="${poly}" fill="none" stroke="var(--line)" stroke-width="1"/>`;
  }
  axes.forEach((a, i) => {
    const [x, y] = pt(i, R).split(",");
    g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;
    const [lx, ly] = pt(i, R + 24).split(",");
    g += `<text class="axis-label" x="${lx}" y="${Number(ly) + 4}" text-anchor="middle">${
      a.length > 8 ? a.slice(0, 8) + "…" : a
    }</text>`;
  });
  spec.series.forEach((s, si) => {
    const poly = s.values.map((v, i) => pt(i, (R * v) / (spec.max || 5))).join(" ");
    g += `<polygon points="${poly}" fill="${col(s.color)}" fill-opacity=".18" stroke="${col(
      s.color
    )}" stroke-width="2.4" class="chart-hover" style="animation:pop-in .7s ${(
      si * 160
    )}ms var(--ease) backwards"><title>${L(s.name, lang)}</title></polygon>`;
  });
  return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 ${size} ${size}" style="flex:1 1 260px;max-width:360px">${g}</svg><div class="chart-legend" style="flex-direction:column;gap:7px">${legend(
    spec.series,
    lang
  )}</div></div>`;
}

/* ---------- heat grid ---------- */
function heat(spec, lang) {
  const cols = spec.cols[lang] || spec.cols.zh;
  const rows = spec.rows.map((r) => L(r.name, lang));
  const max = spec.max || Math.max(...spec.cells.flat());
  let html = `<div class="heat" style="--heat-cols:${cols.length}"><div class="heat-corner"></div>`;
  cols.forEach((c) => (html += `<div class="heat-col">${c}</div>`));
  spec.cells.forEach((row, ri) => {
    html += `<div class="heat-rowlabel">${rows[ri]}</div>`;
    row.forEach((v, ci) => {
      const a = v / max;
      html += `<div class="heat-cell chart-hover" style="background:color-mix(in srgb, ${col(
        spec.color || "accent"
      )} ${(a * 92).toFixed(0)}%, transparent)" title="${rows[ri]} × ${cols[ci]}: ${v}${
        spec.unit || ""
      }"><span>${v || ""}</span></div>`;
    });
  });
  html += `</div>`;
  if (spec.legendText)
    html += `<div class="chart-legend"><span>${L(spec.legendText, lang)}</span></div>`;
  return html;
}

/* ---------- gauge ---------- */
function gauge(spec, lang) {
  const R = 74, CIRC = Math.PI * R, pct = spec.value / (spec.max || 100);
  return `<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">
  <svg viewBox="0 0 180 104" style="flex:1 1 190px;max-width:240px">
    <path d="M16 92 A ${R} ${R} 0 0 1 164 92" fill="none" stroke="var(--panel-3)" stroke-width="15" stroke-linecap="round"/>
    <path class="gauge-arc" pathLength="1" d="M16 92 A ${R} ${R} 0 0 1 164 92" fill="none" stroke="${col(
    spec.color || "accent"
  )}" stroke-width="15" stroke-linecap="round" style="--dash:${pct.toFixed(3)}"/>
    <text x="90" y="80" text-anchor="middle" style="font-family:var(--font-mono);font-size:23px;font-weight:700;fill:var(--ink)">${
      spec.display || Math.round(pct * 100) + "%"
    }</text>
  </svg>
  <div style="flex:1 1 220px"><p style="margin:0 0 6px;font-weight:700">${L(spec.name, lang)}</p>
  <p style="margin:0;color:var(--muted);font-size:13.5px">${L(spec.desc, lang) || ""}</p></div></div>`;
}

/* ---------- timeline (HTML) ---------- */
function timeline(spec, lang) {
  return `<div class="timeline">${spec.items
    .map(
      (it, i) =>
        `<div class="tl-item reveal" data-delay="${i % 5}"><span class="tl-date">${L(
          it.date,
          lang
        )}</span><div class="tl-body"><b>${L(it.title, lang)}</b><p>${L(
          it.text,
          lang
        )}</p>${it.url ? `<a class="ext" href="${it.url}" target="_blank" rel="noopener noreferrer">${L(
          it.linkText || { zh: "阅读原文", en: "Read source" },
          lang
        )} ↗</a>` : ""}</div></div>`
    )
    .join("")}</div>`;
}

/* ---------- compare (HTML two columns) ---------- */
function compare(spec, lang) {
  const cell = (c, tone) => `<div class="cmp-col cmp-${tone}"><b>${L(c.name, lang)}</b><ul>${c.points
    .map((p) => `<li>${L(p, lang)}</li>`)
    .join("")}</ul></div>`;
  return `<div class="cmp">${cell(spec.left, "accent")}${cell(
    spec.right,
    "coral"
  )}</div>`;
}

/* ---------- matrix (2x2) ---------- */
function matrix(spec, lang) {
  return `<div class="matrix"><div class="mx-axis mx-top">${L(spec.xLabel, lang)}</div><div class="mx-axis mx-left">${L(
    spec.yLabel,
    lang
  )}</div>${spec.quadrants
    .map(
      (q, i) =>
        `<div class="mx-cell" style="--mx:${col(q.color)}"><b>${L(q.name, lang)}</b><p>${L(
          q.text,
          lang
        )}</p><span class="mx-idx">${String.fromCharCode(65 + i)}</span></div>`
    )
    .join("")}</div>`;
}

function legend(series, lang) {
  if (!series || series.length < 2) return "";
  return `<div class="chart-legend">${series
    .map((s) => `<span><i style="background:${col(s.color)}"></i>${L(s.name, lang)}</span>`)
    .join("")}</div>`;
}

const TYPES = { bar, hbar, donut, stack, line, waterfall, radar, heat, gauge, timeline, compare, matrix };

export function renderChart(key, lang) {
  const spec = CHART_REGISTRY[key];
  if (!spec) return `<aside class="callout callout-warn"><span class="ct">missing chart</span><p>图表 <code>${key}</code> 未注册 / chart not found</p></aside>`;
  const fn = TYPES[spec.type];
  if (!fn) return `<aside class="callout callout-warn"><span class="ct">unknown chart type</span><p>${spec.type}</p></aside>`;
  spec._lang = lang;
  return `<figure class="figure reveal reveal-pending">
    <div class="figure-title">${L(spec.title, lang) || key}</div>
    ${spec.sub ? `<div class="figure-sub">${L(spec.sub, lang)}</div>` : ""}
    ${fn(spec, lang)}
    ${caption(spec)}
  </figure>`;
}

export let CHART_REGISTRY = {};
export function registerCharts(obj) {
  CHART_REGISTRY = { ...CHART_REGISTRY, ...obj };
}
