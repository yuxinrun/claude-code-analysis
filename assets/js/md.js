/* Minimal markdown-lite renderer for bilingual handbook content.
   Supports: ##/###/#### headings, paragraphs, lists, tables, fenced code,
   blockquotes, :::tip|warn|aha|quote|src callouts, :::chart key, - [ ] checklists,
   and inline **bold** / *mark* / `code` / [link](url) / raw inline HTML. */

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

/* Highlighting happens in several regex passes. Emitting real <span> markup
   between passes lets later passes re-match our own attributes (the classic
   `class='tk-s'` inside a keyword regex). So every token is parked behind a
   placeholder and only expanded at the end. The index is spelled in uppercase
   letters (A=0 … J=9), so it can never collide with digits, lowercase
   keywords, parentheses or quote characters. */
const PH_OPEN = "\u0000";
const PH_CLOSE = "\u0001";
const phEncode = (n) =>
  String(n)
    .split("")
    .map((d) => String.fromCharCode(65 + Number(d)))
    .join("");
const phDecode = (s) =>
  Number(
    s
      .split("")
      .map((ch) => ch.charCodeAt(0) - 65)
      .join("")
  );

function highlight(code, lang) {
  const store = [];
  const hold = (cls, text) => {
    store.push(`<span class="tk-${cls}">${text}</span>`);
    return PH_OPEN + phEncode(store.length - 1) + PH_CLOSE;
  };
  const restore = (s) => {
    let out = s;
    // one extra pass per nesting level (a token may sit inside another token)
    for (let pass = 0; pass < 4 && out.indexOf(PH_OPEN) !== -1; pass++) {
      out = out.replace(/\u0000([A-J]+)\u0001/g, (m, key) => {
        const hit = store[phDecode(key)];
        return hit === undefined ? m : hit;
      });
    }
    return out;
  };

  const src = esc(code);
  if (/^(bash|sh|shell|console|zsh)$/i.test(lang)) {
    return restore(
      src
        .replace(/(&quot;|')(?:\\.|(?!\1)[^\\\n])*?\1/g, (m) => hold("s", m))
        .replace(/(^|\n)(\s*)([#$])/g, (m, nl, sp, sym) => nl + sp + hold("c", sym))
        .replace(/(^|\s)(\/\/[^\n]*|#[^\n]*)/g, (m, pre, cmt) => pre + hold("c", cmt))
    );
  }
  return restore(
    src
      .replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) => hold("c", m))
      .replace(/(&quot;|'|`)(?:\\.|(?!\1)[^\\\n])*?\1/g, (m) => hold("s", m))
      .replace(
        /\b(const|let|var|export|default|import|from|function|return|async|await|if|else|for|while|new|class|extends|type|interface|enum|true|false|null|undefined|try|catch|throw)\b/g,
        (m) => hold("k", m)
      )
      .replace(/\b(\d[\d_.,]*)\b/g, (m) => hold("n", m))
      .replace(/([A-Za-z_$][\w$]*)(?=\()/g, (m) => hold("f", m))
  );
}

function inline(src) {
  let s = src;
  // links: [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
    const ext = /^https?:/i.test(url);
    const attrs = ext
      ? ' class="ext" target="_blank" rel="noopener noreferrer"'
      : "";
    return `<a href="${url}"${attrs}>${text}</a>`;
  });
  s = s.replace(/`([^`]+)`/g, (m, c) => `<code>${esc(c)}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  return s;
}

function parseTable(lines) {
  const rows = lines
    .map((l) =>
      l
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split("|")
        .map((c) => c.trim())
    );
  const head = rows[0];
  const body = rows.slice(2);
  const thead = `<thead><tr>${head
    .map((h) => `<th>${inline(h)}</th>`)
    .join("")}</tr></thead>`;
  const tbody = `<tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody>`;
  return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
}

const CALLOUT_LABEL = {
  tip: { zh: "要点", en: "Takeaway" },
  warn: { zh: "注意", en: "Watch out" },
  aha: { zh: "有意思的是", en: "Delightful detail" },
  quote: { zh: "原文摘录", en: "Quoted" },
  src: { zh: "来源与可信度", en: "Source & confidence" },
};

export function renderMarkdown(md, lang, counter) {
  const lines = String(md).replace(/\r/g, "").split("\n");
  const out = [];
  let i = 0;
  const n = () => (counter ? counter.next() : "");

  while (i < lines.length) {
    let line = lines[i];

    // fenced code (supports ``` and ~~~ so JS template literals stay clean)
    const fence = line.match(/^\s*(```|~~~)(\S*)\s*(.*)$/);
    if (fence) {
      const mark = fence[1];
      const langTag = fence[2] || "text";
      const meta = fence[3] || "";
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(mark)) buf.push(lines[i++]);
      i++;
      const code = buf.join("\n");
      out.push(
        `<figure class="code-block"><figcaption class="code-head"><span class="dots"><i></i><i></i><i></i></span><span>${esc(
          meta
        )}</span><span class="lang">${esc(langTag)}</span></figcaption><pre class="code-body">${highlight(
          code,
          langTag
        )
          .split("\n")
          .map((l) => `<span class="cl">${l || " "}</span>`)
          .join("")}</pre></figure>`
      );
      continue;
    }

    // directives :::type args ... :::
    const dir = line.match(/^\s*:::\s*([a-zA-Z]+)\s*(.*)$/);
    if (dir) {
      const kind = dir[1].toLowerCase();
      const arg = dir[2];
      if (kind === "chart" || kind === "dashboard") {
        out.push(`<!--CHART:${arg.trim()}-->`);
        i++;
        while (i < lines.length && !/^\s*:::\s*end/.test(lines[i]) && !/^\s*:::$/.test(lines[i]))
          i++;
        i++;
        continue;
      }
      if (kind === "html") {
        const buf = [];
        i++;
        while (i < lines.length && !/^\s*:::\s*end/.test(lines[i]) && !/^\s*:::$/.test(lines[i]))
          buf.push(lines[i++]);
        i++;
        out.push(buf.join("\n"));
        continue;
      }
      // callouts
      const buf = [];
      i++;
      while (i < lines.length && !/^\s*:::\s*$/.test(lines[i]) && !/^\s*:::\s*end/.test(lines[i]))
        buf.push(lines[i++]);
      i++;
      const label = CALLOUT_LABEL[kind] ? CALLOUT_LABEL[kind][lang] : kind;
      const title = arg ? `<strong>${inline(arg)}</strong>` : "";
      out.push(
        `<aside class="callout callout-${kind}"><span class="ct">${label}</span>${title}${renderInner(
          buf.join("\n"),
          lang
        )}</aside>`
      );
      continue;
    }

    // headings
    const h = line.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      const text = h[2].trim();
      const id = slug(text) || `sec-${out.length}`;
      const idx = lvl === 2 ? n() : "";
      out.push(
        `<h${lvl} id="${id}" data-idx="${idx}">${inline(text)}</h${lvl}>`
      );
      i++;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      out.push("<hr />");
      i++;
      continue;
    }

    // table block
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] || "")) {
      const buf = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) buf.push(lines[i++]);
      out.push(parseTable(buf));
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i]))
        buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }

    // checklist
    if (/^\s*-\s+\[[ xX]\]/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+\[[ xX]\]/.test(lines[i])) {
        const m = lines[i].match(/^\s*-\s+\[( |x|X)\]\s*(.*)$/);
        items.push(
          `<div class="check-item${m[1] ? " done" : ""}" tabindex="0" role="checkbox" aria-checked="${
            !!m[1]
          }"><span class="check-box">✓</span><span>${inline(m[2])}</span></div>`
        );
        i++;
      }
      out.push(`<div class="checklist">${items.join("")}</div>`);
      continue;
    }

    // lists
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) {
        let txt = lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "");
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+\.)\s+/.test(lines[i]))
          txt += " " + lines[i++].trim();
        items.push(`<li>${inline(txt)}</li>`);
      }
      out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      continue;
    }

    // raw html block passthrough
    if (/^\s*</.test(line)) {
      const buf = [];
      while (i < lines.length && lines[i].trim() !== "") buf.push(lines[i++]);
      out.push(buf.join("\n"));
      continue;
    }

    // blank
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }

    // paragraph
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{2,4}\s|\s*```|\s*:::|\s*>|\s*\||\s*([-*]|\d+\.)\s|\s*---)/.test(lines[i])
    )
      buf.push(lines[i++]);
    if (buf.length) out.push(`<p>${inline(buf.join(" ").replace(/\s+/g, " "))}</p>`);
    else i++;
  }
  return out.join("\n");
}

function renderInner(text, lang) {
  return text
    .split(/\n{2,}/)
    .map((b) => {
      b = b.trim();
      if (!b) return "";
      if (/^\s*[-*]\s/m.test(b)) {
        const items = b
          .split("\n")
          .filter((l) => /^\s*[-*]\s/.test(l))
          .map((l) => `<li>${inline(l.replace(/^\s*[-*]\s/, ""))}</li>`);
        return `<ul>${items.join("")}</ul>`;
      }
      return `<p>${inline(b)}</p>`;
    })
    .join("");
}

export { esc, slug };
