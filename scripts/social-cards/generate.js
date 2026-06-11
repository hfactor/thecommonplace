const { chromium } = require('playwright');
const matter = require('gray-matter');
const fs = require('fs');
const path = require('path');

const REPO_ROOT = process.env.REPO_ROOT || path.resolve(__dirname, '../..');
const OUT_DIR   = process.env.OUT_DIR   || '/tmp/social-cards';
const MAX_WORDS = 105;

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function extractNote(content) {
  const first = content.trim().split(/\n\n+/)[0].trim()
    .replace(/\[\[([^\]]+)\]\]/g, '$1');
  const words = first.split(/\s+/);
  return words.length <= MAX_WORDS ? first : words.slice(0, MAX_WORDS).join(' ') + '…';
}

function isRecommended(val) {
  return val === true || val === 'true' || val === 'yes';
}

const T = {
  bg:          '#0f0f0f',
  bgGradient:  'radial-gradient(ellipse 140% 50% at 50% 110%, rgba(91,143,255,0.18) 0%, transparent 65%)',
  title:       '#ededed',
  author:      '#999999',
  note:        '#909090',
  rec:         '#5b8fff',
  dot:         'rgba(255,255,255,0.22)',
  brand:       'rgba(255,255,255,0.22)',
  coverShadow: '-10px 6px 36px rgba(0,0,0,0.75), 2px 2px 12px rgba(0,0,0,0.45)',
  fadeMask:    'linear-gradient(to bottom, #0f0f0f 55%, transparent 100%)',
};

function bookHtml(f, note) {
  const t = T;
  const cover = f.image
    ? `<img src="${esc(f.image)}" style="width:100%;height:100%;object-fit:cover;display:block;">`
    : `<div style="width:100%;height:100%;background:#222;"></div>`;
  const rec = isRecommended(f.recommended)
    ? `<span style="color:${t.rec};font-size:48px;vertical-align:middle;margin-left:10px;">✦</span>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,500;1,400&family=Bricolage+Grotesque:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1920px;overflow:hidden;}
body{
  background:${t.bg};
  font-family:'Public Sans',sans-serif;
  display:flex;flex-direction:column;align-items:center;
  text-align:center;
  padding:260px 120px 200px;
  position:relative;
}
body::after{content:'';position:absolute;inset:0;background:${t.bgGradient};pointer-events:none;z-index:0;}
.note-wrap{width:100%;overflow:hidden;position:relative;margin-top:64px;flex-shrink:0;max-height:460px;}
*{position:relative;z-index:1;}
</style>
</head><body>

<div style="width:280px;height:420px;border-radius:3px 10px 10px 3px;overflow:hidden;flex-shrink:0;
  box-shadow:${t.coverShadow};position:relative;margin-bottom:52px;">
  ${cover}
  <div style="position:absolute;left:0;top:0;bottom:0;width:14px;
    background:linear-gradient(to right,rgba(0,0,0,0.4),transparent);"></div>
</div>

<div style="font-family:'Bricolage Grotesque',sans-serif;font-size:66px;font-weight:500;
  color:${t.title};line-height:1.25;margin-bottom:18px;">${esc(f.title)}${rec}</div>

<div style="font-size:36px;color:${t.author};">${esc(f.author || '')}</div>

<div class="note-wrap" id="note">
  <div style="font-size:38px;color:${t.note};line-height:1.6;">${esc(note)}</div>
</div>

<div style="flex:1;min-height:40px;"></div>
<div style="font-size:52px;font-weight:300;color:${t.dot};line-height:1;margin-bottom:20px;">+</div>
<div style="font-family:'Bricolage Grotesque',sans-serif;font-size:28px;
  letter-spacing:0.05em;color:${t.brand};">hiran.in</div>

<script>
const w=document.getElementById('note');
if(w.scrollHeight>w.clientHeight){
  w.style.webkitMaskImage='${t.fadeMask}';
  w.style.maskImage='${t.fadeMask}';
}
</script>
</body></html>`;
}

function bookmarkHtml(f, note) {
  const t = T;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,500;1,400&family=Bricolage+Grotesque:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1080px;height:1920px;overflow:hidden;}
body{
  background:${t.bg};
  font-family:'Public Sans',sans-serif;
  display:flex;flex-direction:column;align-items:center;
  text-align:center;
  padding:260px 120px 200px;
  position:relative;
}
body::after{content:'';position:absolute;inset:0;background:${t.bgGradient};pointer-events:none;z-index:0;}
.content{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;position:relative;z-index:1;}
.note-wrap{width:100%;overflow:hidden;position:relative;margin-top:52px;flex-shrink:0;max-height:400px;}
.bottom{flex-shrink:0;display:flex;flex-direction:column;align-items:center;position:relative;z-index:1;}
</style>
</head><body>

<div class="content">
  <div style="font-family:'Bricolage Grotesque',sans-serif;font-size:66px;font-weight:500;
    color:${t.title};line-height:1.3;">${esc(f.title)}</div>
  <div class="note-wrap" id="note">
    <div style="font-size:38px;color:${t.note};line-height:1.6;">${esc(note)}</div>
  </div>
</div>

<div class="bottom">
  <div style="font-size:52px;font-weight:300;color:${t.dot};line-height:1;margin-bottom:20px;">+</div>
  <div style="font-family:'Bricolage Grotesque',sans-serif;font-size:28px;
    letter-spacing:0.05em;color:${t.brand};">hiran.in</div>
</div>

<script>
const w=document.getElementById('note');
if(w.scrollHeight>w.clientHeight){
  w.style.webkitMaskImage='${t.fadeMask}';
  w.style.maskImage='${t.fadeMask}';
}
</script>
</body></html>`;
}

async function renderCard(page, html, outPath) {
  await page.setContent(html, { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
}

async function main() {
  const newFiles = (process.env.NEW_FILES || '').trim().split('\n').filter(Boolean);
  if (newFiles.length === 0) { console.log('No new content files.'); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1920 });

  for (const rel of newFiles) {
    const fullPath = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(fullPath)) { console.warn(`Not found: ${rel}`); continue; }

    const { data: f, content } = matter(fs.readFileSync(fullPath, 'utf8'));
    const note = extractNote(content);
    if (!note) { console.log(`Skipping ${rel} — no body`); continue; }

    const slug = path.basename(rel, '.md');

    let html;
    if (rel.startsWith('content/reading/'))        html = bookHtml(f, note);
    else if (rel.startsWith('content/bookmarks/')) html = bookmarkHtml(f, note);
    else continue;

    console.log(`Generating: ${f.title}`);
    await renderCard(page, html, path.join(OUT_DIR, `${slug}.png`));
  }

  await browser.close();
  console.log(`Done — written to ${OUT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
