import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "content", "notes");
const outDir = path.join(root, "notes");
fs.mkdirSync(outDir, { recursive: true });

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("missing frontmatter");
  const meta = {};
  match[1].split("\n").forEach((line) => {
    const idx = line.indexOf(":");
    if (idx === -1) return;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return { meta, body: match[2] };
}

function splitLang(body) {
  const zh = body.split(/^## en\s*$/m)[0].replace(/^## zh\s*$/m, "").trim();
  const enPart = body.split(/^## en\s*$/m)[1];
  if (!enPart) throw new Error("missing ## en");
  return { zh: zh.trim(), en: enPart.trim() };
}

function blocks(text) {
  const lines = text.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }
    if (line.startsWith("### ")) {
      out.push({ type: "h3", text: line.slice(4).trim() });
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i += 1;
      }
      out.push({ type: "ul", items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !lines[i].startsWith("### ") && !lines[i].startsWith("- ") && !lines[i].startsWith("```")) {
      para.push(lines[i].trim());
      i += 1;
    }
    out.push({ type: "p", text: para.join(" ") });
  }
  return out;
}

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function highlight(code) {
  return esc(code)
    .replace(/(^|\n)(#.*)/g, "$1<span class=\"tok-c\">$2</span>")
    .replace(/\b(\d+(?:\.\d+)?)\b/g, "<span class=\"tok-n\">$1</span>")
    .replace(/\b(map|odom|base_link|camera_frame|object_frame|base_frame|fx|fy|cx|cy)\b/g, "<span class=\"tok-k\">$1</span>");
}

function readingMinutes(text) {
  const chars = text.replace(/\s/g, "").length;
  return Math.max(3, Math.round(chars / 380));
}

function renderPair(zhBlocks, enBlocks) {
  const html = [];
  const count = Math.max(zhBlocks.length, enBlocks.length);
  for (let i = 0; i < count; i += 1) {
    const zh = zhBlocks[i];
    const en = enBlocks[i];
    if (!zh) continue;
    if (zh.type === "h3") {
      html.push(`<h2 data-en="${esc(en && en.text ? en.text : zh.text)}">${esc(zh.text)}</h2>`);
    } else if (zh.type === "p") {
      html.push(`<p data-en="${esc(en && en.text ? en.text : zh.text)}">${esc(zh.text)}</p>`);
    } else if (zh.type === "ul") {
      const enItems = en && en.items ? en.items : zh.items;
      const items = zh.items.map((item, idx) => `<li data-en="${esc(enItems[idx] || item)}">${esc(item)}</li>`).join("");
      html.push(`<ul>${items}</ul>`);
    } else if (zh.type === "code") {
      html.push(`<pre><code>${highlight(zh.text)}</code></pre>`);
    }
  }
  return html.join("\n");
}

function page(meta, article, minutes) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title data-en="${esc(meta.title_en)} · muxintian">${esc(meta.title_zh)} · muxintian</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <a class="skip" href="#main" data-en="Skip to content">跳到主要内容</a>
  <header class="topbar">
    <div class="wrap bar">
      <a class="brand" href="../index.html">muxintian</a>
      <nav id="site-nav" aria-label="页内导航" data-en-aria="On this page">
        <a href="../index.html#about" data-en="About">关于</a>
        <a href="../index.html#notes" data-en="Notes">笔记</a>
        <a href="../index.html#work" data-en="Videos">作品</a>
        <a href="../index.html#contact" data-en="Contact">联系</a>
      </nav>
      <div class="tools">
        <button class="tool-btn" id="lang-toggle" type="button">EN</button>
        <button class="tool-btn" id="weather-toggle" type="button" aria-label="切换天气">☀</button>
        <button class="tool-btn" id="theme-toggle" type="button" aria-label="切换日间">☀</button>
        <button class="tool-btn" id="term-toggle" type="button" aria-label="打开终端" data-en-aria="Open terminal">&gt;_</button>
      </div>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr-only">打开菜单</span><span class="burger" aria-hidden="true"></span></button>
    </div>
  </header>
  <main id="main" class="project">
    <article class="wrap note-body">
      <a class="back" href="../index.html#notes" data-en="← All notes">← 全部笔记</a>
      <p class="draft" data-en="Draft. The author will refine this note.">草稿，作者之后会再改一版。</p>
      <p class="eyebrow" lang="en">Notes</p>
      <h1 data-en="${esc(meta.title_en)}">${esc(meta.title_zh)}</h1>
      <p class="note"><time datetime="${esc(meta.date)}">${esc(meta.date)}</time> · <span data-en="About ${minutes} min">约 ${minutes} 分钟</span></p>
      ${article}
    </article>
  </main>
  <footer class="site-footer"><div class="wrap"><p>muxintian · Mwaitwait</p><p data-egg-count>彩蛋 0/10</p></div></footer>
  <script src="../i18n.js"></script>
  <script src="../script.js"></script>
  <script defer src="../extras.js"></script>
</body>
</html>
`;
}

const posts = [];
for (const file of fs.readdirSync(srcDir).filter((name) => name.endsWith(".md")).sort()) {
  const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  const langs = splitLang(body);
  const zhBlocks = blocks(langs.zh);
  const enBlocks = blocks(langs.en);
  const minutes = readingMinutes(langs.zh + langs.en);
  const html = page(meta, renderPair(zhBlocks, enBlocks), minutes);
  fs.writeFileSync(path.join(outDir, `${meta.slug}.html`), html);
  posts.push({ ...meta, minutes });
  console.log("wrote", meta.slug, "blocks", zhBlocks.length, enBlocks.length);
}

const cards = posts.map((meta) => `        <a class="note-card" href="${meta.slug}.html">
          <p class="draft" data-en="Draft">草稿</p>
          <h2 data-en="${esc(meta.title_en)}">${esc(meta.title_zh)}</h2>
          <p data-en="${esc(meta.summary_en)}">${esc(meta.summary_zh)}</p>
        </a>`).join("\n");

const index = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title data-en="Notes · muxintian">技术笔记 · muxintian</title>
  <link rel="icon" href="../favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <a class="skip" href="#main" data-en="Skip to content">跳到主要内容</a>
  <header class="topbar">
    <div class="wrap bar">
      <a class="brand" href="../index.html">muxintian</a>
      <nav id="site-nav" aria-label="页内导航" data-en-aria="On this page">
        <a href="../index.html#notes" data-en="Notes">笔记</a>
        <a href="../index.html#work" data-en="Videos">作品</a>
        <a href="../index.html#contact" data-en="Contact">联系</a>
      </nav>
      <div class="tools">
        <button class="tool-btn" id="lang-toggle" type="button">EN</button>
        <button class="tool-btn" id="theme-toggle" type="button" aria-label="切换日间">☀</button>
      </div>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="sr-only">打开菜单</span><span class="burger" aria-hidden="true"></span></button>
    </div>
  </header>
  <main id="main" class="project">
    <div class="wrap">
      <a class="back" href="../index.html" data-en="← Home">← 首页</a>
      <h1 data-en="Technical notes">技术笔记</h1>
      <p class="lede" data-en="Draft checklists. They do not add results the videos did not publish.">草稿清单。不补充视频里没有公布的结果。</p>
      <div class="note-list">
${cards}
      </div>
    </div>
  </main>
  <script src="../i18n.js"></script>
  <script src="../script.js"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(outDir, "index.html"), index);
console.log("wrote index", posts.length);
