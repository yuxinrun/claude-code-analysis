import { CHAPTERS } from "../assets/js/data/chapters/index.js";
import { CHART_SPECS } from "../assets/js/data/charts.js";
import { registerCharts, renderChart } from "../assets/js/charts.js";
import { renderMarkdown } from "../assets/js/md.js";

registerCharts(CHART_SPECS);

const used = new Set();
let problems = 0;

for (const ch of CHAPTERS) {
  for (const lang of ["zh", "en"]) {
    let n = 0;
    let html = renderMarkdown(ch.body[lang], lang, {
      next: () => String(++n).padStart(2, "0"),
    });
    const refs = [...html.matchAll(/<!--CHART:([\w-]+)-->/g)].map((m) => m[1]);
    for (const key of refs) {
      used.add(key);
      if (!CHART_SPECS[key]) {
        console.log("MISSING CHART:", key, "in", ch.id, lang);
        problems++;
        continue;
      }
      html = html.replace(`<!--CHART:${key}-->`, renderChart(key, lang));
    }
    if (html.includes("<!--CHART:")) {
      console.log("UNRESOLVED CHART:", ch.id, lang);
      problems++;
    }
    if (html.includes("[object Object]")) {
      console.log("[object Object] in", ch.id, lang);
      problems++;
    }
    if (/\bundefined\b/.test(html)) {
      console.log("undefined in", ch.id, lang);
      problems++;
    }
    const opens = (html.match(/<figure/g) || []).length;
    const closes = (html.match(/<\/figure>/g) || []).length;
    if (opens !== closes) {
      console.log("unbalanced figure in", ch.id, lang, opens, closes);
      problems++;
    }
    // highlighter guards: markup must never be emitted inside another tag
    if (/<span[^>]*<span/.test(html) || /(class|href)="[^"]*<span/.test(html)) {
      console.log("nested markup leak in", ch.id, lang);
      problems++;
    }
    const spanOpen = (html.match(/<span\b/g) || []).length;
    const spanClose = (html.match(/<\/span>/g) || []).length;
    if (spanOpen !== spanClose) {
      console.log("unbalanced span in", ch.id, lang, spanOpen, spanClose);
      problems++;
    }
    if (html.indexOf("\u0000") !== -1 || html.indexOf("\u0001") !== -1) {
      console.log("placeholder leak in", ch.id, lang);
      problems++;
    }
  }
}

const unused = Object.keys(CHART_SPECS).filter((k) => !used.has(k));
console.log("charts referenced:", used.size, "of", Object.keys(CHART_SPECS).length);
console.log("unused charts:", unused.length ? unused.join(", ") : "none");

// bilingual sanity: the English edition should not be full of Chinese characters
const cjk = (s) => (String(s).match(/[\u4e00-\u9fff]/g) || []).length;
for (const ch of CHAPTERS) {
  const en = `${ch.title.en} ${ch.sub.en}\n${ch.body.en}`;
  const ratio = cjk(en) / en.length;
  if (ratio > 0.02) console.log("untranslated en in", ch.id, (ratio * 100).toFixed(1) + "%");
  if (!ch.title.en || ch.title.en === ch.title.zh) console.log("en title missing in", ch.id);
  if (ch.body.zh.length < 800) console.log("zh body too short in", ch.id, ch.body.zh.length);
  if (ch.body.en.length < 1200) console.log("en body too short in", ch.id, ch.body.en.length);
}
console.log("problems:", problems);