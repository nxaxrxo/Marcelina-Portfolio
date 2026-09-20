#!/usr/bin/env node
/* ============================================================================
   tools/check.js  —  static consistency checker for the portfolio
   ----------------------------------------------------------------------------
   Zero dependencies. Run from the project root:

       node tools/check.js

   It verifies (architecture.md section 12):
     1. every JavaScript file parses cleanly (node --check);
     2. every [data-*] hook queried by JS exists in index.html or is produced
        by JS-generated markup;
     3. every local src/href referenced by index.html / content.js / the
        media manifest exists on disk;
     4. every var(--x) used in CSS is defined in some stylesheet under assets/css
        (tokens or a component's own rule block) or set at runtime by JS
        (setProperty('--x' …) or an inline style string);
     5. no leftover TODO / FIXME / console.log in the shipped JS.

   Prints one line per problem, then PASS or FAIL. Exits non-zero on failure.
   Missing optional image files are reported as WARN, not FAIL, because the
   site is designed to show placeholders until the client adds them.
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');

const SHIPPED_JS_DIRS = ['assets/js', 'data'];
const ALL_JS_DIRS = ['assets/js', 'data', 'tools'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'assets/img', 'assets']);

const failures = [];
const warnings = [];

function rel(abs) {
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readFile(abs) {
  try {
    return fs.readFileSync(abs, 'utf8');
  } catch (err) {
    return null;
  }
}

function exists(abs) {
  try {
    fs.accessSync(abs);
    return true;
  } catch (err) {
    return false;
  }
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function walkFiles(dir, filter, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
      walkFiles(full, filter, out);
    } else if (filter(full)) {
      out.push(full);
    }
  }
  return out;
}

function collectJs(dirs) {
  const files = [];
  dirs.forEach(function (d) {
    walkFiles(path.join(ROOT, d), function (f) { return f.endsWith('.js'); }, files);
  });
  return files;
}

function collectCss() {
  const files = [];
  walkFiles(path.join(ROOT, 'assets', 'css'), function (f) { return f.endsWith('.css'); }, files);
  return files;
}

/* ------------------------------------------------------------------ 1. syntax */
function checkSyntax(jsFiles) {
  if (!jsFiles.length) {
    warn('no JavaScript files found yet — syntax check skipped');
    return;
  }
  jsFiles.forEach(function (file) {
    const result = cp.spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      const detail = String(result.stderr || '').trim().split('\n').slice(0, 3).join(' | ');
      fail('syntax error in ' + rel(file) + ': ' + detail);
    }
  });
}

/* --------------------------------------------------------------- 2. data hooks */
function renderableAttrs(jsFiles) {
  const generated = new Set();
  jsFiles.forEach(function (file) {
    const text = readFile(file) || '';
    const literals = text.match(/`[^`]*`|'[^']*'|"[^"]*"/g) || [];
    literals.forEach(function (literal) {
      const inner = literal.slice(1, -1);
      const isMarkup = inner.indexOf('<') !== -1;
      const isKey = /^data-[a-z0-9-]+$/i.test(inner);
      if (isMarkup || isKey) {
        const found = inner.match(/data-[a-z0-9-]+/gi) || [];
        found.forEach(function (attr) { generated.add(attr.toLowerCase()); });
      }
    });
  });
  return generated;
}

function checkDataHooks(jsFiles) {
  const htmlPath = path.join(ROOT, 'index.html');
  const html = readFile(htmlPath);
  if (html === null) {
    fail('index.html not found — cannot verify [data-*] DOM hooks');
    return;
  }
  const inHtml = new Set();
  (html.match(/data-[a-z0-9-]+/gi) || []).forEach(function (attr) {
    inHtml.add(attr.toLowerCase());
  });
  const generated = renderableAttrs(jsFiles);

  jsFiles.forEach(function (file) {
    const text = readFile(file) || '';
    const referenced = new Set();
    (text.match(/data-[a-z0-9-]+/gi) || []).forEach(function (attr) {
      referenced.add(attr.toLowerCase());
    });
    let m;
    const dataset = /\.dataset\.([A-Za-z0-9_]+)/g;
    while ((m = dataset.exec(text))) {
      referenced.add(('data-' + m[1].replace(/([a-z0-9])([A-Z])/g, '$1-$2')).toLowerCase());
    }
    referenced.forEach(function (attr) {
      if (inHtml.has(attr) || generated.has(attr)) return;
      fail(rel(file) + ': hook ' + attr + ' is not in index.html and is not generated by JS');
    });
  });
}

/* --------------------------------------------------------- 3. local references */
const EXTERNAL = /^(https?:|\/\/|#|mailto:|tel:|data:|javascript:)/i;

function checkHtmlRefs() {
  const html = readFile(path.join(ROOT, 'index.html'));
  if (html === null) return;
  const re = /(src|href)\s*=\s*"([^"]*)"/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[2].trim();
    if (!raw || EXTERNAL.test(raw)) continue;
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean) continue;
    const abs = path.resolve(ROOT, clean);
    if (!exists(abs)) {
      fail('index.html:' + lineOf(html, m.index) + ': missing local ' + m[1] + ' "' + raw + '"');
    }
  }
}

function checkContentRefs() {
  const contentPath = path.join(ROOT, 'data', 'content.js');
  const text = readFile(contentPath);
  if (text === null) {
    fail('data/content.js not found');
    return;
  }
  const re = /["']((?:\.\/)?assets\/[^"']+\.[a-z0-9]{2,5})["']/gi;
  let m;
  while ((m = re.exec(text))) {
    const p = m[1];
    if (!exists(path.resolve(ROOT, p))) {
      warn('content.js:' + lineOf(text, m.index) + ': "' + p + '" is not on disk yet (placeholder shown until added)');
    }
  }
}

function parseManifest() {
  const text = readFile(path.join(ROOT, 'data', 'media-manifest.js'));
  if (text === null) return null;
  const start = text.indexOf('window.MP_MEDIA_MANIFEST');
  if (start === -1) return null;
  const open = text.indexOf('{', start);
  const close = text.lastIndexOf('}');
  if (open === -1 || close === -1) return null;
  try {
    return JSON.parse(text.slice(open, close + 1));
  } catch (err) {
    fail('data/media-manifest.js is not valid — re-run node tools/build-manifest.js');
    return null;
  }
}

function checkManifestRefs() {
  const manifest = parseManifest();
  if (!manifest) return;
  const expect = [];
  ((manifest.hero && manifest.hero.files) || []).forEach(function (f) {
    expect.push('assets/img/hero/' + f);
  });
  ((manifest.contact && manifest.contact.files) || []).forEach(function (f) {
    expect.push('assets/img/contact/' + f);
  });
  const categories = manifest.categories || {};
  Object.keys(categories).forEach(function (id) {
    (categories[id] || []).forEach(function (f) {
      expect.push('assets/img/categories/' + f);
    });
  });
  const projects = manifest.projects || {};
  Object.keys(projects).forEach(function (cat) {
    Object.keys(projects[cat] || {}).forEach(function (proj) {
      (projects[cat][proj] || []).forEach(function (f) {
        expect.push('assets/img/projects/' + cat + '/' + proj + '/' + f);
      });
    });
  });
  expect.forEach(function (p) {
    if (!exists(path.resolve(ROOT, p))) {
      fail('media-manifest.js lists "' + p + '" but it is missing — re-run node tools/build-manifest.js');
    }
  });
}

/* ----------------------------------------------------------- 4. css variables */
/* A custom property is considered defined when it is:
     - declared anywhere under assets/css (tokens.css or a component's own
       rule block), or
     - written at runtime by JS under assets/js, either via
       setProperty('--name', …) or as a custom-property declaration inside an
       inline style string (style="--name: …", cssText = '--name: …', …). */
function runtimeCustomProps() {
  const defined = new Set();
  collectJs(['assets/js']).forEach(function (file) {
    const text = readFile(file) || '';
    let m;
    const setRe = /setProperty\(\s*['"](--[a-z0-9-]+)['"]/gi;
    while ((m = setRe.exec(text))) {
      defined.add(m[1].toLowerCase());
    }
    const inlineRe = /['"][^'"]*?(--[a-z0-9-]+)\s*:[^'"]*?['"]/g;
    while ((m = inlineRe.exec(text))) {
      defined.add(m[1].toLowerCase());
    }
  });
  return defined;
}

function checkCssVars() {
  const cssFiles = collectCss();
  if (!cssFiles.length) {
    warn('no stylesheets under assets/css yet — CSS variable check skipped');
    return;
  }
  const defined = new Set();
  cssFiles.forEach(function (file) {
    const text = readFile(file) || '';
    (text.match(/--[a-z0-9-]+\s*:/gi) || []).forEach(function (decl) {
      defined.add(decl.replace(/\s*:$/, '').toLowerCase());
    });
  });
  runtimeCustomProps().forEach(function (name) { defined.add(name); });

  cssFiles.forEach(function (file) {
    const text = readFile(file) || '';
    const re = /var\(\s*(--[a-z0-9-]+)/gi;
    let m;
    while ((m = re.exec(text))) {
      const name = m[1].toLowerCase();
      if (!defined.has(name)) {
        fail(rel(file) + ':' + lineOf(text, m.index) + ': var(' + m[1] +
          ') is not defined in any stylesheet or set at runtime by JS');
      }
    }
  });
}

/* ------------------------------------------------------- 5. leftover dev traces */
function checkTraces() {
  collectJs(SHIPPED_JS_DIRS).forEach(function (file) {
    const text = readFile(file) || '';
    text.split('\n').forEach(function (line, i) {
      if (/\b(TODO|FIXME)\b/.test(line)) {
        fail(rel(file) + ':' + (i + 1) + ': leftover TODO/FIXME');
      }
      if (/console\.log/.test(line)) {
        fail(rel(file) + ':' + (i + 1) + ': leftover console.log');
      }
    });
  });
}

/* ------------------------------------------------------------------ entrypoint */
function main() {
  const allJs = collectJs(ALL_JS_DIRS);
  const shippedJs = collectJs(SHIPPED_JS_DIRS);

  checkSyntax(allJs);
  checkDataHooks(shippedJs);
  checkHtmlRefs();
  checkContentRefs();
  checkManifestRefs();
  checkCssVars();
  checkTraces();

  const lines = [];
  warnings.forEach(function (w) { lines.push('WARN  ' + w); });
  failures.forEach(function (f) { lines.push('FAIL  ' + f); });
  lines.push('');
  if (failures.length) {
    lines.push('FAIL — ' + failures.length + ' problem(s), ' + warnings.length + ' warning(s)');
    process.stdout.write(lines.join('\n') + '\n');
    process.exit(1);
  }
  lines.push('PASS — ' + allJs.length + ' JS file(s) checked, ' + warnings.length + ' warning(s)');
  process.stdout.write(lines.join('\n') + '\n');
  process.exit(0);
}

main();
