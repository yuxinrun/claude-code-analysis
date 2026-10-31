/* ============================================================
   Claude Code 源码解析 · 鱼心快跑
   App shell: hash routing, bilingual rendering, theme, motion.
   No framework, no build step.
   ============================================================ */

import { SITE, UI, PARTS, SISTER, FAQ, GLOSSARY, ROADMAP } from "./data/meta.js";
import { EXTRA_SOURCES } from "./data/sources.js";
import { CHAPTERS } from "./data/chapters/index.js";
import { CHART_SPECS, CHART_GROUPS } from "./data/charts.js";
import { registerCharts, renderChart } from "./charts.js";
import { renderMarkdown, esc } from "./md.js";

registerCharts(CHART_SPECS);

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const root = document.documentElement;
const L = () => root.dataset.lang || "zh";
const T = (v) => (v && typeof v === "object" ? v[L()] ?? v.zh : v ?? "");
const c = (zh, en) => ({ zh, en });
const pad = (n) => String(n).padStart(2, "0");
const byId = new Map(CHAPTERS.map((ch) => [ch.id, ch]));
const partOf = (id) => PARTS.find((p) => p.id === id);
const tagsOf = (ch) => (ch.tags?.[L()] || ch.tags?.zh || []).join(" · ");
const siteHost = (u) => String(u).replace(/^https?:\/\//, "").replace(/\/.*$/, "");

const COPY = {
  heroKicker: c("一本写给工程师的源码导游", "A source-code field guide for engineers"),
  heroTitleA: c("把", "Open up"),
  heroTitleHl: c("Claude Code", "Claude Code"),
  heroTitleB: c("拆开给你看", "piece by piece"),
  heroLead: c(
    "51 万行 TypeScript，Anthropic 原本没打算给你看——npm 打包脚本替他们做了决定。本站不逐行翻译代码，只拆那些真正值钱的东西：每个设计背后的 why，以及你明天就能抄走的东西。",
    "510,000 lines of TypeScript that Anthropic never meant to hand you — an npm packing script made the call for them. No line-by-line translation here, only what is actually worth stealing: the why behind each decision, and what you can ship tomorrow."
  ),
  ctaStart: c("从第 1 章开始", "Start at chapter 1"),
  ctaDash: c("先看报表中心", "See the dashboards"),
  heroMeta: c(
    [["17", "章深度拆解"], ["510K", "行代码的决策"], ["40%", "Harness 贡献"], ["2", "种语言切换"]],
    [["17", "chapters"], ["510K", "lines of source"], ["40%", "harness share"], ["2", "languages"]]
  ),
  tickerLabel: c("速览", "Snapshot"),
  statsTitle: c("先用几个数字建立直觉", "Numbers first, opinions later"),
  statsSub: c(
    "读完这些数字，你就知道为什么「再读一遍源码」不如「读懂一次决策」。",
    "Once these numbers land, you will see why one decision beats another thousand lines read."
  ),
  chaptersTitle: c("17 章，把笼具拆成零件", "17 chapters, one harness in parts"),
  chaptersSub: c(
    "五个部分：先看全景，再看六个核心系统，然后是多 Agent 与成本，最后是边界与方法论。",
    "Five parts: the big picture, six core systems, multi-agent and cost, then the edges and the method."
  ),
  dashTitle: c("Agent 的钱都花在看不见的 token 上", "Agent money burns in tokens you never look at"),
  dashSub: c(
    "把缓存、上下文预算、工具分布画出来，优化才算开始。图表全部标注数据来源与可信度。",
    "Cache hits, context budgets, tool distribution — optimisation only starts once they are drawn. Every chart is tagged by source and confidence."
  ),
  dashCta: c("进入报表中心", "Open dashboards"),
  roadTitle: c("从「会用」到「能设计」的 12 周", "Twelve weeks from user to designer"),
  roadSub: c(
    "每一级都有可交付物。跑完这条路，你手里会有一件能拿出去讲的作品，而不是一堆收藏夹。",
    "Every rung has a deliverable. Finish the path and you hold something you can present — not a folder of bookmarks."
  ),
  roadCta: c("查看完整路线", "See the full roadmap"),
  sisterTitle: c("鱼心快跑的姊妹站", "The Yuxin Rush shelf"),
  sisterSub: c(
    "同一个作者，同一套工程审美：把复杂系统讲到能上手。",
    "Same author, same taste in engineering: complex systems explained until they are usable."
  ),
  faqTitle: c("先说清楚，免得误会", "House rules, up front"),
  faqSub: c("关于资料来源、可信度与阅读顺序。", "Sources, confidence and where to start."),
  statCards: c(
    [
      ["510K", "行 TypeScript 代码", "约 1,900 个严格模式文件，一个人读完要两年"],
      ["59", "个内置工具", "全部由 4 个原语组合而来：读、写、跑、连"],
      ["44", "个 Feature Flags", "未发布功能藏在这里，路线图最诚实的泄露者"],
      ["64", "token 的权限预算", "先做一次极便宜的粗筛，再决定要不要花 4,096 token 细想"],
    ],
    [
      ["510K", "lines of TypeScript", "~1,900 strict files; a human read would take years"],
      ["59", "built-in tools", "All composed from four primitives: read, write, run, connect"],
      ["44", "feature flags", "Unreleased capability hides here — the roadmap's honest leak"],
      ["64", "tokens for permission", "A cheap first pass decides whether to spend 4,096 thinking harder"],
    ]
  ),
};

/* ---------- static i18n ---------- */
function applyStaticI18n() {
  $$("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const dict = UI[key] || SITE[key.replace("brand.", "")];
    if (dict) el.textContent = T(dict);
  });
  $$("[data-set-lang]").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.setLang === L())
  );
  root.lang = L() === "zh" ? "zh-CN" : "en";
}

/* ---------- theme ---------- */
function setTheme(next) {
  root.dataset.theme = next;
  try {
    localStorage.setItem("yx-theme", next);
  } catch (e) {}
  $$('meta[name="theme-color"]').forEach((m) =>
    m.setAttribute("content", next === "dark" ? "#06100e" : "#f6f4ee")
  );
}

/* ---------- small pieces ---------- */
function pill(text, tone) {
  return `<span class="pill${tone ? " pill-" + tone : ""}">${esc(text)}</span>`;
}

function sectionHead(eyebrow, title, sub) {
  return `<div class="section-head"><div>
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h2 class="section-title">${esc(title)}</h2>
    ${sub ? `<p class="section-sub">${esc(sub)}</p>` : ""}
  </div></div>`;
}

function termMock() {
  const l = L();
  const lines = [
    { k: "u", t: l === "zh" ? "> 帮我修掉登录接口的时区 bug，别改测试" : "> fix the timezone bug in the login API, don't touch tests" },
    { k: "a", t: l === "zh" ? "● 先读相关代码，再动手。" : "● Reading first, editing second." },
    { k: "t", t: "  ⏺ Read(src/auth/session.ts) … 412 lines" },
    { k: "t", t: '  ⏺ Grep("timezone|UTC", src/) … 7 files' },
    { k: "a", t: l === "zh" ? "● 找到了：本地时间被直接写进了 token。" : "● Found it: local time was written straight into the token." },
    { k: "t", t: "  ⏺ Edit(src/auth/session.ts) … +18 −11" },
    { k: "t", t: "  ⏺ Bash(npm test -- auth) … 12 passed" },
    { k: "w", t: l === "zh" ? "  ! 3 个文件需要你的确认（权限模式 default）" : "  ! 3 files need your approval (permission mode: default)" },
    { k: "a", t: l === "zh" ? "● 修好了。要不要顺手加一条回归测试？" : "● Done. Want a regression test while I'm here?" },
    { k: "u", t: l === "zh" ? "> 加。顺便看看有没有别的接口也中招。" : "> Add it. And check whether other endpoints got hit too." },
  ];
  const body = lines
    .map((x) => `<span class="term-line"><span class="${x.k}">${esc(x.t)}</span></span>`)
    .join("");
  return `<div class="term-float"><span class="term-glow"></span><div class="term">
    <div class="term-bar"><i></i><i></i><i></i><span>claude — ~/repo — 100×30</span></div>
    <div class="term-body">${body}<span class="term-line u caret"></span></div>
  </div></div>`;
}

function ticker() {
  const l = L();
  const items =
    l === "zh"
      ? [
          ["1902", "个 TypeScript 文件"],
          ["59", "个内置工具"],
          ["44", "个 feature flags"],
          ["4", "类记忆分层"],
          ["2", "阶段权限分类器"],
          [String(Object.keys(CHART_SPECS).length), "张图解报表"],
          ["1", "条 npm 打包命令"],
        ]
      : [
          ["1902", "TypeScript files"],
          ["59", "built-in tools"],
          ["44", "feature flags"],
          ["4", "memory layers"],
          ["2", "permission stages"],
          [String(Object.keys(CHART_SPECS).length), "charts & diagrams"],
          ["1", "npm pack command"],
        ];
  const chunk = items
    .map(([n, t]) => `<span><b>${n}</b> ${esc(t)}</span>`)
    .join("");
  return `<div class="ticker-wrap" aria-hidden="true"><div class="ticker">${chunk}${chunk}${chunk}${chunk}</div></div>`;
}

function chapterCard(ch, i) {
  const kicker = (ch.tags?.[L()] || ch.tags?.zh || [])[0] || "";
  return `<a class="card reveal" href="#/c/${ch.id}" data-delay="${i % 4}">
    <span class="card-num">CH.${ch.num}${kicker ? ` · ${esc(kicker)}` : ""}</span>
    <h3>${esc(T(ch.title))}</h3>
    <p>${esc(T(ch.sub))}</p>
    <div class="card-foot"><span>${ch.read} min</span><span>${esc(tagsOf(ch))}</span><span class="arrow" aria-hidden="true">→</span></div>
  </a>`;
}

/* ---------- home ---------- */
function renderHome() {
  const l = L();
  const [m1, m2, m3, m4] = COPY.heroMeta[l];
  const statCards = COPY.statCards[l]
    .map(
      ([n, t, d], i) =>
        `<div class="stat reveal" data-delay="${i}"><i></i><b>${esc(n)}</b><span><strong>${esc(
          t
        )}</strong><br>${esc(d)}</span></div>`
    )
    .join("");

  const chapterBlocks = PARTS.map((p) => {
    const list = CHAPTERS.filter((ch) => ch.part === p.id);
    if (!list.length) return "";
    return `<div class="part-label">${esc(T(p.name))} · ${esc(T(p.blurb))}</div>${list
      .map((ch, i) => chapterCard(ch, i))
      .join("")}`;
  }).join("");

  return `
  <section class="hero">
    <div>
      <div class="hero-badges">
        ${pill(COPY.heroKicker[l])}
        ${pill("v2.1.88", "accent")}
        ${pill(l === "zh" ? "17 章 · 中英双语" : "17 chapters · bilingual", "coral")}
      </div>
      <h1>${esc(COPY.heroTitleA[l])} <span class="hl">${esc(COPY.heroTitleHl[l])}</span><br>${esc(
    COPY.heroTitleB[l]
  )}</h1>
      <p class="hero-lead">${esc(COPY.heroLead[l])}</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="#/c/${CHAPTERS[0].id}">${esc(COPY.ctaStart[l])} <span aria-hidden="true">→</span></a>
        <a class="btn btn-ghost" href="#/dashboard">${esc(COPY.ctaDash[l])}</a>
      </div>
      <div class="hero-meta">
        <div><b>${m1[0]}</b><span>${esc(m1[1])}</span></div>
        <div><b>${m2[0]}</b><span>${esc(m2[1])}</span></div>
        <div><b>${m3[0]}</b><span>${esc(m3[1])}</span></div>
        <div><b>${m4[0]}</b><span>${esc(m4[1])}</span></div>
      </div>
    </div>
    ${termMock()}
  </section>
  ${ticker()}

  <section class="section">
    ${sectionHead(l === "zh" ? "By the numbers" : "By the numbers", COPY.statsTitle[l], COPY.statsSub[l])}
    <div class="stat-grid">${statCards}</div>
  </section>

  <section class="section" id="chapters">
    ${sectionHead(l === "zh" ? "The book" : "The book", COPY.chaptersTitle[l], COPY.chaptersSub[l])}
    <div class="card-grid">${chapterBlocks}</div>
  </section>

  <section class="section">
    ${sectionHead(l === "zh" ? "Dashboards" : "Dashboards", COPY.dashTitle[l], COPY.dashSub[l])}
    <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">
      <div class="reveal">${renderChart("cache-economics", l)}</div>
      <div class="reveal" data-delay="1">${renderChart("token-composition", l)}</div>
    </div>
    <p style="margin-top:18px"><a class="btn btn-ghost" href="#/dashboard">${esc(COPY.dashCta[l])} <span aria-hidden="true">→</span></a></p>
  </section>

  <section class="section">
    ${sectionHead(l === "zh" ? "Roadmap" : "Roadmap", COPY.roadTitle[l], COPY.roadSub[l])}
    <div class="ladder">${ROADMAP.levels
      .map(
        (lv, i) => `<div class="ladder-card reveal" data-delay="${i}">
        <span class="rung">${esc(T(lv.rung))}</span>
        <h3>${esc(T(lv.goal))}</h3>
        <ul>${lv.items.map((it) => `<li>${esc(T(it))}</li>`).join("")}</ul>
        <p class="weeks">${esc(T(lv.weeks))}</p>
      </div>`
      )
      .join("")}</div>
    <p style="margin-top:18px"><a class="btn btn-ghost" href="#/roadmap">${esc(COPY.roadCta[l])} <span aria-hidden="true">→</span></a></p>
  </section>

  <section class="section">
    ${sectionHead(l === "zh" ? "Sister sites" : "Sister sites", COPY.sisterTitle[l], COPY.sisterSub[l])}
    <div class="sister-grid">${SISTER.map(
      (s) =>
        `<a class="sister" href="https://yuxinrun.github.io/${s.slug}/" target="_blank" rel="noopener">
          <b>${esc(s.slug)}</b><span>${esc(T(s.name))} · ${esc(T(s.desc))}</span></a>`
    ).join("")}</div>
  </section>

  <section class="section">
    ${sectionHead(l === "zh" ? "FAQ" : "FAQ", COPY.faqTitle[l], COPY.faqSub[l])}
    ${faqAccordion()}
  </section>`;
}

function faqAccordion() {
  return `<div class="accordion">${FAQ.map(
    (f, i) => `<div class="acc-item${i === 0 ? " is-open" : ""}">
      <button class="acc-head" type="button" aria-expanded="${i === 0}">${esc(T(f.q))}<span class="mark">+</span></button>
      <div class="acc-body">${esc(T(f.a))}</div>
    </div>`
  ).join("")}</div>`;
}/* ---------- chapters index ---------- */
function renderChaptersIndex() {
  const l = L();
  return `
  <header class="page-hero">
    <span class="eyebrow">${l === "zh" ? "全部章节" : "All chapters"}</span>
    <h1>${l === "zh" ? "17 章，按顺序读或挑着读" : "17 chapters — in order, or not"}</h1>
    <p>${l === "zh"
      ? "每一章都相对独立：开头讲问题，中间拆决策，结尾给一份能带走的清单。第一次来建议从第 1 章开始，赶时间就直接跳第 3、5、7 章。"
      : "Each chapter stands alone: the problem first, the decisions in the middle, a takeaway list at the end. New here? Start at ch.1. In a hurry? Jump to ch.3, 5 and 7."}</p>
    <div class="page-hero-meta">
      ${pill("17 " + (l === "zh" ? "章" : "chapters"), "accent")}
      ${pill(l === "zh" ? "5 个部分" : "5 parts")}
      ${pill(l === "zh" ? "中英双语" : "bilingual")}
    </div>
  </header>
  <section class="section">
    <div class="card-grid">${PARTS.map((p) => {
      const list = CHAPTERS.filter((ch) => ch.part === p.id);
      return `<div class="part-label">${esc(T(p.name))} · ${esc(T(p.blurb))}</div>${list
        .map((ch, i) => chapterCard(ch, i))
        .join("")}`;
    }).join("")}</div>
  </section>`;
}

/* ---------- chapter detail ---------- */
function renderChapter(ch) {
  const l = L();
  const idx = CHAPTERS.indexOf(ch);
  const prev = CHAPTERS[idx - 1];
  const next = CHAPTERS[idx + 1];
  let counter = 0;
  const bodyHtml = renderMarkdown(T(ch.body) || "", l, {
    next: () => pad(++counter),
  }).replace(/<!--CHART:([\w-]+)-->/g, (m, key) => renderChart(key, l));

  const rail = CHAPTERS.map(
    (x) => `<a href="#/c/${x.id}" class="${x.id === ch.id ? "is-active" : ""}">
      <i>${x.num}</i><span>${esc(T(x.title))}</span></a>`
  ).join("");

  const sources = (ch.sources || [])
    .map(
      (s) =>
        `<a href="${s.url}" target="_blank" rel="noopener noreferrer">
          <span class="dom">${esc(s.dom || siteHost(s.url))}</span>
          <span>${esc(T(s.label))}</span>
          <span class="ext-ico" aria-hidden="true">↗</span></a>`
    )
    .join("");

  const pager = `
    ${prev ? `<a href="#/c/${prev.id}"><span>← ${l === "zh" ? "上一章" : "Previous"}</span><b>${esc(T(prev.title))}</b></a>` : `<a href="#/"><span>← ${l === "zh" ? "回到首页" : "Home"}</span><b>${esc(T(SITE.name))}</b></a>`}
    ${next ? `<a class="next" href="#/c/${next.id}"><span>${l === "zh" ? "下一章" : "Next"} →</span><b>${esc(T(next.title))}</b></a>` : `<a class="next" href="#/roadmap"><span>${l === "zh" ? "继续" : "Continue"} →</span><b>${l === "zh" ? "转型路线图" : "The roadmap"}</b></a>`}
  `;

  return `
  <div class="chapter-layout">
    <aside class="rail-left">
      <p class="rail-title">${l === "zh" ? "全部章节" : "All chapters"}</p>
      <nav class="chapter-rail" aria-label="${l === "zh" ? "章节列表" : "Chapter list"}">${rail}</nav>
    </aside>
    <article>
      <header class="chapter-hero">
        <div class="kicker">${esc(T(partOf(ch.part)?.name))} · CH.${ch.num}</div>
        <h1>${esc(T(ch.title))}</h1>
        <p class="lead">${esc(T(ch.lead))}</p>
        <div class="chapter-meta">
          ${pill(`${ch.read} min`, "accent")}
          ${(ch.tags?.[l] || ch.tags?.zh || []).map((t) => pill(t)).join("")}
          ${pill(l === "zh" ? "已校对" : "reviewed")}
        </div>
      </header>
      <div class="prose">${bodyHtml}</div>
      <div class="chapter-end">
        ${sources ? `<p class="rail-title">${l === "zh" ? "本章来源" : "Sources for this chapter"}</p><div class="source-list">${sources}</div>` : ""}
        <nav class="pager" aria-label="${l === "zh" ? "翻页" : "Pagination"}">${pager}</nav>
      </div>
    </article>
    <aside class="rail-right">
      <p class="rail-title">${l === "zh" ? "本页目录" : "On this page"}</p>
      <nav class="toc-list" id="tocList" aria-label="${l === "zh" ? "页内目录" : "On this page"}"></nav>
    </aside>
  </div>`;
}

/* ---------- dashboards ---------- */
function renderDashboard() {
  const l = L();
  const keys = Object.keys(CHART_SPECS);
  const groups = CHART_GROUPS.map((g) => {
    const list = keys.filter((k) => CHART_SPECS[k].group?.zh === g.name.zh);
    return list.length
      ? `<section class="section" style="padding-top:44px">
          <div class="section-head"><div>
            <span class="eyebrow">${esc(T(g.name))}</span>
            <h2 class="section-title" style="font-size:clamp(22px,2.6vw,30px)">${esc(T(g.desc))}</h2>
          </div></div>
          <div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">
            ${list
              .map(
                (k, i) =>
                  `<div class="reveal" data-delay="${i % 3}">${renderChart(k, l)}</div>`
              )
              .join("")}
          </div>
        </section>`
      : "";
  }).join("");

  const extra = keys.filter((k) => !CHART_GROUPS.some((g) => g.name.zh === CHART_SPECS[k].group?.zh));
  const overflow = extra.length
    ? `<section class="section"><div class="card-grid" style="grid-template-columns:repeat(auto-fit,minmax(340px,1fr))">${extra
        .map((k, i) => `<div class="reveal" data-delay="${i % 3}">${renderChart(k, l)}</div>`)
        .join("")}</div></section>`
    : "";

  return `
  <header class="page-hero">
    <span class="eyebrow">${l === "zh" ? "报表中心" : "Dashboards"}</span>
    <h1>${l === "zh" ? "把看不见的成本画出来" : "Draw the costs you cannot see"}</h1>
    <p>${l === "zh"
      ? "这里的每张图都服务于一个决策：要不要缓存、上下文怎么分预算、工具该砍哪一个、Agent 该不该拆。数据分三类标注：官方公布、社区实测、示意估算。"
      : "Every chart here serves one decision: cache or not, how to split the context budget, which tool to cut, when to split an agent. Data is tagged official, community-measured, or illustrative."}</p>
    <div class="page-hero-meta">
      ${pill(Object.keys(CHART_SPECS).length + " " + (l === "zh" ? "张图表" : "charts"), "accent")}
      ${pill(l === "zh" ? "来源可追溯" : "traceable sources")}
      ${pill(l === "zh" ? "支持深色" : "dark-mode ready")}
    </div>
  </header>
  ${groups}${overflow}
  <section class="section">
    <div class="callout callout-src" style="margin:0">
      <span class="ct">${l === "zh" ? "怎么读这些数字" : "How to read the numbers"}</span>
      <p>${l === "zh"
        ? "价格与阈值会随版本变化，图表里的数字用于建立量级直觉，不是精确报价单。真正要抄走的是曲线的形状和拐点，以及每个拐点背后的工程取舍。"
        : "Prices and thresholds move with every release. Treat the numbers as order-of-magnitude intuition, not a quote sheet. What you steal is the shape of each curve — and the trade-off sitting behind every knee."}</p>
    </div>
  </section>`;
}

/* ---------- roadmap ---------- */
function renderRoadmap() {
  const l = L();
  return `
  <header class="page-hero">
    <span class="eyebrow">${l === "zh" ? "转型路线" : "Roadmap"}</span>
    <h1>${l === "zh" ? "12 周，从使用者到设计者" : "Twelve weeks from operator to designer"}</h1>
    <p>${esc(T(ROADMAP.intro))}</p>
    <div class="page-hero-meta">
      ${pill(l === "zh" ? "4 个台阶" : "4 rungs", "accent")}
      ${pill(l === "zh" ? "每周有交付物" : "weekly deliverables")}
      ${pill(l === "zh" ? "可写进简历" : "portfolio-ready", "coral")}
    </div>
  </header>
  <section class="section">
    <div class="ladder">${ROADMAP.levels
      .map(
        (lv, i) => `<div class="ladder-card reveal" data-delay="${i}">
      <span class="rung">${esc(T(lv.rung))}</span>
      <h3>${esc(T(lv.goal))}</h3>
      <ul>${lv.items.map((it) => `<li>${esc(T(it))}</li>`).join("")}</ul>
      <p class="weeks">${esc(T(lv.weeks))} · ${esc(T(lv.deliver))}</p>
    </div>`
      )
      .join("")}</div>
  </section>
  <section class="section">
    ${sectionHead(
      l === "zh" ? "能力雷达" : "Skill radar",
      l === "zh" ? "跑完 12 周，你应该长成这样" : "What twelve weeks should build",
      l === "zh" ? "雷达图是自评模板，不是考试分数。" : "A self-review template, not an exam score."
    )}
    ${renderChart("maturity-radar", l)}
  </section>
  <section class="section">
    <div class="callout callout-tip">
      <span class="ct">${l === "zh" ? "使用说明" : "How to use this"}</span>
      <p>${l === "zh"
        ? "不要一次报名四个台阶。每周只做一件事：读一章、写一个能跑的东西、留下一条复盘。12 周后你会拥有一份带失败样本的评估报告——这比任何证书都能证明你懂 Agent。"
        : "Do not enrol in four rungs at once. One thing per week: read a chapter, ship something that runs, leave one retrospective. After twelve weeks you own an eval report with failure cases — better proof than any certificate."}</p>
    </div>
  </section>`;
}

/* ---------- glossary ---------- */
function renderGlossary() {
  const l = L();
  const cats = [...new Set(GLOSSARY.map((g) => g.cat))];
  return `
  <header class="page-hero">
    <span class="eyebrow">${l === "zh" ? "术语表" : "Glossary"}</span>
    <h1>${l === "zh" ? "先说人话，再谈架构" : "Plain words before architecture"}</h1>
    <p>${l === "zh"
      ? "这些词你在别处也见过，但在这里它们各自绑定了一个真实的设计决策。搜一下，或者按分类筛。"
      : "You have met these words elsewhere. Here each one is pinned to a real design decision. Search, or filter by category."}</p>
  </header>
  <section class="section">
    <div class="search-box">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.6-3.6"></path></svg>
      <input type="search" id="glossSearch" placeholder="${l === "zh" ? "搜索术语，例如：缓存 / grep / 压缩" : "Search terms, e.g. cache / grep / compaction"}" aria-label="${l === "zh" ? "搜索术语" : "Search glossary"}">
    </div>
    <div class="filters" id="glossFilters">
      <button class="filter-pill is-active" data-cat="*">${l === "zh" ? "全部" : "All"}</button>
      ${cats.map((cat) => `<button class="filter-pill" data-cat="${esc(cat)}">${esc(cat)}</button>`).join("")}
    </div>
    <div class="accordion" id="glossList">${GLOSSARY.map(
      (g, i) => `<div class="acc-item" data-cat="${esc(g.cat)}" data-text="${esc(
        (T(g.t) + " " + T(g.c)).toLowerCase()
      )}">
        <button class="acc-head" type="button">${esc(T(g.t))}<span class="term-en">${esc(
        g.t.en
      )}</span><span class="mark">+</span></button>
        <div class="acc-body"><p>${esc(T(g.c))}</p><p><span class="pill">${esc(g.cat)}</span></p></div>
      </div>`
    ).join("")}</div>
    <p id="glossEmpty" style="display:none;color:var(--muted);margin-top:16px">${l === "zh" ? "没有匹配的术语，换个关键词试试。" : "No match. Try another keyword."}</p>
  </section>`;
}

/* ---------- sources ---------- */
function renderSources() {
  const l = L();
  const official = EXTRA_SOURCES.map(
    (s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">
      <span class="dom">${esc(s.dom || siteHost(s.url))}</span>
      <span>${esc(T(s.label))}</span>
      <span class="ext-ico" aria-hidden="true">↗</span></a>`
  ).join("");

  const perChapter = CHAPTERS.map((ch) => {
    if (!ch.sources || !ch.sources.length) return "";
    return `<div style="margin:26px 0">
      <p class="rail-title">CH.${ch.num} · ${esc(T(ch.title))}</p>
      <div class="source-list">${ch.sources
        .map(
          (s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">
          <span class="dom">${esc(s.dom || siteHost(s.url))}</span>
          <span>${esc(T(s.label))}</span>
          <span class="ext-ico" aria-hidden="true">↗</span></a>`
        )
        .join("")}</div>
    </div>`;
  }).join("");

  return `
  <header class="page-hero">
    <span class="eyebrow">${l === "zh" ? "资料来源" : "Sources"}</span>
    <h1>${l === "zh" ? "每一条结论，都能点回去" : "Every claim clicks back"}</h1>
    <p>${l === "zh"
      ? "来源分三层：官方文档与工程博客最可靠；2026 年 3 月 npm 包带出的 source map 与社区拆解属于事件性材料；我自己的行为观察会明确标注为「推断」。"
      : "Three layers: official docs and engineering blogs are strongest; the March 2026 source-map leak and community teardowns are event-based material; my own behavioural observations are labelled inference."}</p>
  </header>
  <section class="section">
    ${sectionHead(l === "zh" ? "Primary" : "Primary", l === "zh" ? "一手资料" : "First-hand sources", l === "zh" ? "官方文档、工程博客与协议规范。" : "Official docs, engineering blogs and protocol specs.")}
    <div class="source-list">${official}</div>
  </section>
  <section class="section">
    ${sectionHead(l === "zh" ? "Chapter by chapter" : "Chapter by chapter", l === "zh" ? "按章出处" : "Per-chapter references", l === "zh" ? "每一章的原文与延伸阅读。" : "Primary text and further reading for each chapter.")}
    ${perChapter}
  </section>`;
}

/* ---------- about ---------- */
function renderAbout() {
  const l = L();
  return `
  <header class="page-hero">
    <span class="eyebrow">${l === "zh" ? "关于" : "About"}</span>
    <h1>${l === "zh" ? "鱼心快跑，Bug 追不到" : "Yuxin Rush — Bugs Gone"}</h1>
    <p>${l === "zh"
      ? "我是鱼心，一个喜欢把复杂系统拆开看的人。这个站是一份学习笔记，也是一封写给「正在转型 Agent 工程」的你的信：别怕源码大，先看懂决策。"
      : "I am Yuxin — someone who takes complex systems apart for fun. This site is a study notebook and a letter to anyone moving into agent engineering: don't fear the size of the source, fear missing the decision."}</p>
    <div class="page-hero-meta">
      ${pill("Yuxin Rush", "accent")}
      ${pill("yuxin.run")}
      ${pill(l === "zh" ? "独立写作" : "independent", "coral")}
    </div>
  </header>
  <section class="section">
    ${sectionHead(l === "zh" ? "Brand" : "Brand", l === "zh" ? "关于这个品牌" : "About the brand", "")}
    <div class="callout callout-tip">
      <span class="ct">${l === "zh" ? "鱼心快跑 · Yuxin Rush" : "Yuxin Rush"}</span>
      <p><strong>${l === "zh" ? "鱼心快跑，Bug 追不到。" : "Run, Yuxin, run — bugs can't catch you."}</strong></p>
      <p>${l === "zh"
        ? "名字来自一个很朴素的愿望：写得够快、跑得够稳，让 bug 连尾灯都看不见。这个站里的每一章，都是这个愿望的技术版本。"
        : "The name comes from a simple wish: move fast enough, build steady enough, that bugs never see the taillights. Every chapter here is the technical version of that wish."}</p>
      <p><a href="https://www.yuxin.run" target="_blank" rel="noopener">www.yuxin.run ↗</a> · <a href="https://github.com/yuxinrun" target="_blank" rel="noopener">github.com/yuxinrun ↗</a></p>
    </div>
  </section>
  <section class="section">
    ${sectionHead(l === "zh" ? "Sister sites" : "Sister sites", l === "zh" ? "姊妹站" : "The shelf", l === "zh" ? "同一个作者，同一套工程审美。" : "Same author, same taste.")}
    <div class="sister-grid">${SISTER.map(
      (s) =>
        `<a class="sister" href="https://yuxinrun.github.io/${s.slug}/" target="_blank" rel="noopener">
          <b>${esc(s.slug)}</b><span>${esc(T(s.name))} · ${esc(T(s.desc))}</span></a>`
    ).join("")}</div>
  </section>
  <section class="section">
    ${sectionHead(l === "zh" ? "FAQ" : "FAQ", l === "zh" ? "常见问题" : "Questions people ask", "")}
    ${faqAccordion()}
  </section>
  <section class="section">
    <div class="callout callout-src">
      <span class="ct">${l === "zh" ? "免责声明" : "Disclaimer"}</span>
      <p>${l === "zh"
        ? "本站为个人学习与研究用途的技术解读，不隶属于 Anthropic，也不代表其立场。Claude Code 是 Anthropic 的商标。若与官方文档冲突，以官方为准。"
        : "An independent study for learning and research. Not affiliated with Anthropic and not representing its positions. Claude Code is a trademark of Anthropic. Where this site disagrees with official docs, believe the docs."}</p>
    </div>
  </section>`;
}

/* ---------- 404 ---------- */
function renderNotFound() {
  const l = L();
  return `<header class="page-hero">
    <span class="eyebrow">404</span>
    <h1>${l === "zh" ? "这条鱼游丢了" : "This fish swam off"}</h1>
    <p>${l === "zh" ? "页面不存在，或者章节编号写错了。回首页重新出发。" : "That page does not exist, or the chapter id is off. Head home and restart."}</p>
    <div class="hero-cta" style="margin-top:22px"><a class="btn btn-primary" href="#/">${l === "zh" ? "回到首页" : "Back home"}</a></div>
  </header>`;
}/* ---------- footer ---------- */
function renderFooterCols() {
  const l = L();
  const pages = [
    [UI["nav.home"], "#/"],
    [UI["nav.chapters"], "#/chapters"],
    [UI["nav.dashboard"], "#/dashboard"],
    [UI["nav.roadmap"], "#/roadmap"],
    [UI["nav.glossary"], "#/glossary"],
    [UI["nav.sources"], "#/sources"],
    [UI["nav.about"], "#/about"],
  ];
  const cols = [
    { h: c("章节", "Chapters"), links: CHAPTERS.slice(0, 5).map((ch) => [T(ch.title), `#/c/${ch.id}`]) },
    { h: c("页面", "Pages"), links: pages.map(([k, u]) => [T(k), u]) },
    { h: c("姊妹站", "Sisters"), links: SISTER.slice(0, 4).map((s) => [s.slug, `https://yuxinrun.github.io/${s.slug}/`]) },
  ];
  const host = $("#footerCols");
  if (!host) return;
  host.innerHTML = cols
    .map(
      (col) => `<div><h3>${esc(T(col.h))}</h3>${col.links
        .map(
          ([label, url]) =>
            `<a href="${url}"${url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}</a>`
        )
        .join("")}</div>`
    )
    .join("");
}

/* ---------- reveal / toc / progress ---------- */
let revealIO = null;
function setupReveal() {
  if (revealIO) revealIO.disconnect();
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => {
      el.classList.add("is-revealed");
      el.classList.remove("reveal-pending");
    });
    return;
  }
  revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        entry.target.classList.remove("reveal-pending");
        revealIO.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
  );
  els.forEach((el) => revealIO.observe(el));
}

function setupToc() {
  const list = $("#tocList");
  const prose = $(".prose");
  if (!list || !prose) return;
  const heads = $$("h2, h3", prose).filter((h) => h.id);
  list.innerHTML = heads
    .map(
      (h) =>
        `<a class="${h.tagName === "H3" ? "lvl-4" : ""}" href="#${h.id}" data-toc="${h.id}">${esc(
          h.textContent.replace(/^\d+\s*/, "")
        )}</a>`
    )
    .join("");
}

function updateTocActive() {
  const list = $("#tocList");
  if (!list) return;
  const heads = $$("h2, h3", $(".prose"));
  if (!heads.length) return;
  let active = heads[0].id;
  for (const h of heads) {
    if (h.getBoundingClientRect().top < 150) active = h.id;
    else break;
  }
  $$("a", list).forEach((a) => a.classList.toggle("is-active", a.dataset.toc === active));
}

function updateProgress() {
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const pct = max > 8 ? Math.min(100, (doc.scrollTop / max) * 100) : 0;
  const bar = $("#readingProgress");
  if (bar) bar.style.width = pct.toFixed(2) + "%";
  updateTocActive();
  const top = $("#toTop");
  if (top) top.classList.toggle("show", doc.scrollTop > 620);
}

/* ---------- copy buttons ---------- */
function setupCopyButtons() {
  const label = L() === "zh" ? "复制" : "copy";
  const copied = L() === "zh" ? "已复制" : "copied";
  $$(".code-block").forEach((fig) => {
    const head = $(".code-head", fig);
    const body = $(".code-body", fig);
    if (!head || !body || $(".copy-btn", head)) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = label;
    btn.addEventListener("click", async () => {
      const code = $$(".cl", body).map((l) => l.textContent).join("\n");
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = copied;
        btn.classList.add("ok");
      } catch (e) {
        btn.textContent = "×";
      }
      setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove("ok");
      }, 1600);
    });
    head.appendChild(btn);
  });
}

/* ---------- glossary filter ---------- */
let glossCat = "*";
function filterGlossary(cat) {
  glossCat = cat || "*";
  const input = $("#glossSearch");
  const kw = (input?.value || "").trim().toLowerCase();
  let shown = 0;
  $$("#glossList .acc-item").forEach((item) => {
    const okCat = glossCat === "*" || item.dataset.cat === glossCat;
    const okKw = !kw || (item.dataset.text || "").includes(kw);
    const visible = okCat && okKw;
    item.style.display = visible ? "" : "none";
    if (visible) shown++;
  });
  $$("#glossFilters .filter-pill").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.cat === glossCat)
  );
  const empty = $("#glossEmpty");
  if (empty) empty.style.display = shown ? "none" : "block";
}

/* ---------- drawer ---------- */
function buildDrawer() {
  const inner = $(".mobile-drawer-inner");
  if (!inner) return;
  const l = L();
  const nav = [
    [UI["nav.home"], "#/"],
    [UI["nav.chapters"], "#/chapters"],
    [UI["nav.dashboard"], "#/dashboard"],
    [UI["nav.roadmap"], "#/roadmap"],
    [UI["nav.glossary"], "#/glossary"],
    [UI["nav.sources"], "#/sources"],
    [UI["nav.about"], "#/about"],
  ];
  inner.innerHTML = `
    ${nav.map(([k, u]) => `<a href="${u}">${esc(T(k))}</a>`).join("")}
    <p class="mgroup">${l === "zh" ? "章节" : "Chapters"}</p>
    ${CHAPTERS.map(
      (ch) => `<a class="mch" href="#/c/${ch.id}"><i>${ch.num}</i>${esc(T(ch.title))}</a>`
    ).join("")}`;
}

function closeDrawer() {
  document.body.classList.remove("nav-open");
  const drawer = $("#mobileDrawer");
  if (drawer) drawer.hidden = true;
  const btn = $("#menuToggle");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function toggleDrawer() {
  const drawer = $("#mobileDrawer");
  if (!drawer) return;
  const open = drawer.hidden;
  drawer.hidden = !open;
  document.body.classList.toggle("nav-open", open);
  $("#menuToggle")?.setAttribute("aria-expanded", String(open));
}

/* ---------- top button ---------- */
function ensureTopButton() {
  if ($("#toTop")) return;
  const btn = document.createElement("button");
  btn.id = "toTop";
  btn.type = "button";
  btn.className = "to-top";
  btn.setAttribute("aria-label", L() === "zh" ? "回到顶部" : "Back to top");
  btn.textContent = "↑";
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(btn);
}

/* ---------- routing ---------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const seg = raw.split("/").filter(Boolean);
  return { page: seg[0] || "home", arg: seg[1] || "" };
}

function setNav(key) {
  $$(".main-nav a").forEach((a) => a.classList.toggle("is-active", a.dataset.nav === key));
}

function renderPage(opts = {}) {
  const { page, arg } = parseHash();
  const keep = opts.keepScroll === true;
  const scrollY = window.scrollY;
  let body = "";
  let nav = "home";
  let title = `${T(SITE.name)} · ${T(SITE.sub)}`;
  const l = L();

  if (page === "home") {
    body = renderHome();
  } else if (page === "chapters") {
    body = renderChaptersIndex();
    nav = "chapters";
    title = `${l === "zh" ? "全部章节" : "All chapters"} · ${T(SITE.name)}`;
  } else if (page === "c") {
    const ch = byId.get(arg);
    if (ch) {
      body = renderChapter(ch);
      nav = "chapters";
      title = `${T(ch.title)} · ${T(SITE.name)}`;
    } else {
      body = renderNotFound();
      title = `404 · ${T(SITE.name)}`;
    }
  } else if (page === "dashboard") {
    body = renderDashboard();
    nav = "dashboard";
    title = `${T(UI["nav.dashboard"])} · ${T(SITE.name)}`;
  } else if (page === "roadmap") {
    body = renderRoadmap();
    nav = "roadmap";
    title = `${T(UI["nav.roadmap"])} · ${T(SITE.name)}`;
  } else if (page === "glossary") {
    body = renderGlossary();
    nav = "glossary";
    title = `${T(UI["nav.glossary"])} · ${T(SITE.name)}`;
  } else if (page === "sources") {
    body = renderSources();
    nav = "sources";
    title = `${T(UI["nav.sources"])} · ${T(SITE.name)}`;
  } else if (page === "about") {
    body = renderAbout();
    nav = "about";
    title = `${T(UI["nav.about"])} · ${T(SITE.name)}`;
  } else {
    body = renderNotFound();
    title = `404 · ${T(SITE.name)}`;
  }

  $("#app").innerHTML = body;
  document.title = title;
  applyStaticI18n();
  setNav(nav);
  renderFooterCols();
  buildDrawer();
  setupReveal();
  setupToc();
  setupCopyButtons();
  closeDrawer();

  if (page === "glossary") {
    glossCat = "*";
    const input = $("#glossSearch");
    if (input) input.addEventListener("input", () => filterGlossary(glossCat));
    filterGlossary("*");
  }

  if (keep) window.scrollTo(0, scrollY);
  else window.scrollTo(0, 0);
  updateProgress();
}

/* ---------- language ---------- */
function switchLang(lang) {
  if (lang === L()) return;
  root.dataset.lang = lang;
  try {
    localStorage.setItem("yx-lang", lang);
  } catch (e) {}
  applyStaticI18n();
  renderPage({ keepScroll: true });
}

/* ---------- global interactions ---------- */
document.addEventListener("click", (event) => {
  const target = event.target;

  const langBtn = target.closest("[data-set-lang]");
  if (langBtn) {
    switchLang(langBtn.dataset.setLang);
    return;
  }
  if (target.closest("#themeToggle")) {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
    return;
  }
  if (target.closest("#menuToggle")) {
    toggleDrawer();
    return;
  }
  const toc = target.closest("[data-toc]");
  if (toc) {
    event.preventDefault();
    const el = document.getElementById(toc.dataset.toc);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const acc = target.closest(".acc-head");
  if (acc) {
    const item = acc.closest(".acc-item");
    const open = item.classList.toggle("is-open");
    acc.setAttribute("aria-expanded", String(open));
    return;
  }
  const filter = target.closest(".filter-pill");
  if (filter) {
    filterGlossary(filter.dataset.cat);
    return;
  }
  const check = target.closest(".check-item");
  if (check) {
    const done = check.classList.toggle("done");
    check.setAttribute("aria-checked", String(done));
    return;
  }
  if (target.closest(".mobile-drawer-inner a")) closeDrawer();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== " " && event.key !== "Enter") return;
  const check = event.target.closest?.(".check-item");
  if (!check) return;
  event.preventDefault();
  const done = check.classList.toggle("done");
  check.setAttribute("aria-checked", String(done));
  if (event.key === "Enter") check.click();
});

window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

window.addEventListener("hashchange", () => {
  if (location.hash && !location.hash.startsWith("#/")) return;
  renderPage();
});

/* ---------- boot ---------- */
applyStaticI18n();
ensureTopButton();
renderPage();