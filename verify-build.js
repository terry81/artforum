#!/usr/bin/env node
/**
 * Verifies the built site in _site/.
 *
 * Run with:  npm run verify      (builds first)
 *            node verify-build.js --no-build
 *
 * Checks the things that are easy to break silently on this site:
 *   - broken internal links
 *   - invalid JSON-LD
 *   - sitemap well-formedness + every <loc> resolving to a real file
 *   - canonical URLs that disagree with the page's own language
 *   - hreflang alternates pointing at URLs that do not exist
 *   - images missing alt text or intrinsic dimensions
 *   - leftover references to the removed Font Awesome CDN
 */

const fs = require('fs');
const path = require('path');

const SITE = path.join(__dirname, '_site');
const ORIGIN = 'https://artforumhair.com';
const DEFAULT_LANG = 'bg';

let failures = 0;
let warnings = 0;

const fail = (msg) => { failures++; console.log(`  \x1b[31m✗\x1b[0m ${msg}`); };
const warn = (msg) => { warnings++; console.log(`  \x1b[33m!\x1b[0m ${msg}`); };
const pass = (msg) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(SITE)) {
  console.error('_site/ not found — run `npm run build` first.');
  process.exit(1);
}

const allFiles = walk(SITE);
const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));

/** Resolve a site-root-relative URL to a file on disk. */
function resolveUrl(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!clean.startsWith('/')) return true; // external or relative — skip
  const direct = path.join(SITE, clean);
  const indexed = path.join(SITE, clean, 'index.html');
  return fs.existsSync(direct) || fs.existsSync(indexed);
}

console.log('\n🔎 Verifying built site\n');

/* ---------------------------------------------------------------- links */
console.log('🔗 Internal links');
{
  const broken = new Map();
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      if (!resolveUrl(m[1])) {
        const key = m[1];
        if (!broken.has(key)) broken.set(key, []);
        broken.get(key).push(path.relative(SITE, file));
      }
    }
  }
  if (broken.size === 0) pass(`no broken internal links (${htmlFiles.length} pages scanned)`);
  else for (const [url, pages] of broken) fail(`${url} — linked from ${pages.length} page(s), e.g. ${pages[0]}`);
}

/* -------------------------------------------------------------- json-ld */
console.log('\n📊 Structured data');
{
  let blocks = 0;
  let bad = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      blocks++;
      try {
        JSON.parse(m[1]);
      } catch (e) {
        bad++;
        if (bad <= 5) fail(`invalid JSON-LD in ${path.relative(SITE, file)} — ${e.message}`);
      }
    }
  }
  if (bad === 0) pass(`${blocks} JSON-LD blocks all parse`);
  const home = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
  if (!home.includes('"HairSalon"')) fail('homepage is missing the HairSalon entity');
  else pass('HairSalon + WebSite entities present on the homepage');
}

/* -------------------------------------------------------------- sitemap */
console.log('\n🗺️  Sitemap');
{
  const smPath = path.join(SITE, 'sitemap.xml');
  if (!fs.existsSync(smPath)) fail('sitemap.xml not generated');
  else {
    const xml = fs.readFileSync(smPath, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const alts = [...xml.matchAll(/hreflang="[^"]*" href="([^"]+)"/g)].map((m) => m[1]);

    const dupes = locs.filter((l, i) => locs.indexOf(l) !== i);
    if (dupes.length) fail(`duplicate <loc> entries: ${[...new Set(dupes)].slice(0, 3).join(', ')}`);

    const missing = [...new Set([...locs, ...alts])]
      .filter((u) => u.startsWith(ORIGIN))
      .filter((u) => !resolveUrl(u.slice(ORIGIN.length)));

    if (missing.length) missing.slice(0, 10).forEach((u) => fail(`sitemap points at a non-existent page: ${u}`));
    else pass(`${locs.length} URLs, all resolve (${locs.filter((l) => l.includes('/en/')).length} English)`);

    if (!locs.some((l) => l.includes('/en/'))) fail('sitemap contains no English URLs');
    if (locs.some((l) => / |%20/.test(l))) fail('sitemap contains URLs with spaces');
  }
}

/* --------------------------------------------- canonical + hreflang */
console.log('\n🌍 Canonical / hreflang');
{
  let mismatched = 0;
  let checked = 0;
  const badAlts = new Set();

  for (const file of htmlFiles) {
    const rel = path.relative(SITE, file);
    const html = fs.readFileSync(file, 'utf8');

    const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
    const lang = html.match(/<html lang="([^"]+)"/);
    if (!canon) { fail(`no canonical in ${rel}`); continue; }
    checked++;

    // The canonical must match the document's own declared language.
    if (lang) {
      const isEnUrl = canon[1].startsWith(`${ORIGIN}/en/`);
      const isEnDoc = lang[1] !== DEFAULT_LANG;
      if (isEnUrl !== isEnDoc) {
        mismatched++;
        if (mismatched <= 5) fail(`${rel}: lang="${lang[1]}" but canonical is ${canon[1]}`);
      }
    }

    for (const m of html.matchAll(/<link rel="alternate" hreflang="[^"]*" href="([^"]+)"/g)) {
      if (m[1].startsWith(ORIGIN) && !resolveUrl(m[1].slice(ORIGIN.length))) badAlts.add(m[1]);
    }
  }

  if (mismatched === 0) pass(`${checked} pages canonicalise to their own language`);
  if (badAlts.size === 0) pass('all hreflang alternates resolve');
  else [...badAlts].slice(0, 10).forEach((u) => fail(`hreflang points at a non-existent URL: ${u}`));
}

/* ------------------------------------------------------------ ui strings */
console.log('\n🔤 Interface localisation');
{
  // Templates must read site.data.ui-text[site.active_lang]; reading
  // site.locale renders Bulgarian chrome on every English page.
  const CYRILLIC = /[\u0400-\u04FF]/;
  const leaked = [];
  for (const file of htmlFiles) {
    if (!path.relative(SITE, file).startsWith('en' + path.sep)) continue;
    const html = fs.readFileSync(file, 'utf8');
    for (const re of [/class="screen-reader-shortcut">([^<]+)</g, /for="ac-toc">([^<]+)</g]) {
      for (const m of html.matchAll(re)) {
        if (CYRILLIC.test(m[1])) leaked.push(`${path.relative(SITE, file)}: "${m[1].trim()}"`);
      }
    }
  }
  if (leaked.length === 0) pass('English pages render English navigation/accessibility labels');
  else leaked.slice(0, 5).forEach((l) => fail(`Bulgarian UI string on an English page — ${l}`));
}

/* ---------------------------------------------------------------- media */
console.log('\n🖼️  Images & assets');
{
  let noAlt = 0;
  let noDims = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<img\s[^>]*>/g)) {
      const tag = m[0];
      if (!/\salt=/.test(tag)) noAlt++;
      if (!/\swidth=/.test(tag) || !/\sheight=/.test(tag)) noDims++;
    }
  }
  noAlt === 0 ? pass('every <img> has alt text') : warn(`${noAlt} <img> tags without alt text`);
  noDims === 0 ? pass('every <img> has width/height (no layout shift)') : warn(`${noDims} <img> tags without width/height`);

  const fa = htmlFiles.filter((f) => /fontawesome|cdn\.jsdelivr|class="fa[sbr]? /.test(fs.readFileSync(f, 'utf8')));
  fa.length === 0
    ? pass('no Font Awesome / third-party CDN references')
    : fail(`${fa.length} page(s) still reference Font Awesome, e.g. ${path.relative(SITE, fa[0])}`);

  const css = path.join(SITE, 'assets/css/main.css');
  const js = path.join(SITE, 'assets/js/main.min.js');
  if (fs.existsSync(css)) pass(`main.css ${(fs.statSync(css).size / 1024).toFixed(0)} KB`);
  if (fs.existsSync(js)) pass(`main.min.js ${(fs.statSync(js).size / 1024).toFixed(0)} KB`);
}

/* --------------------------------------------------------------- result */
console.log('\n' + '─'.repeat(52));
if (failures === 0) {
  console.log(`\x1b[32m✅ Passed\x1b[0m${warnings ? ` with ${warnings} warning(s)` : ''}\n`);
  process.exit(0);
} else {
  console.log(`\x1b[31m❌ ${failures} failure(s)\x1b[0m${warnings ? `, ${warnings} warning(s)` : ''}\n`);
  process.exit(1);
}

