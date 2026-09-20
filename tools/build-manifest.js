#!/usr/bin/env node
/* ============================================================================
   tools/build-manifest.js
   ----------------------------------------------------------------------------
   Scans the image folders and rewrites data/media-manifest.js so the site can
   find every image automatically. There is nothing to install and nothing to
   configure.

       node tools/build-manifest.js

   It reads:
       assets/img/hero/                       -> window.MP_MEDIA_MANIFEST.hero
       assets/img/contact/                    -> .contact
       assets/img/categories/                 -> .categories (keyed by file name)
       assets/img/projects/<category>/<project>/ -> .projects

   It ignores files that begin with "_" or "." and keeps only real media
   extensions. Missing folders are simply treated as empty. The script always
   exits 0, so it is safe to run at any time.
   ============================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const OUT_FILE = path.join(ROOT, 'data', 'media-manifest.js');

const ALLOWED_EXT = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg',
  '.mp4', '.webm', '.mov'
]);

/* Node's locale-aware sort can vary between machines. This comparator is
   deterministic and puts 01, 02, 10 in numeric order (not 1, 10, 2). */
function naturalCompare(a, b) {
  const chunk = /(\d+)|(\D+)/g;
  const left = String(a).match(chunk) || [];
  const right = String(b).match(chunk) || [];
  const len = Math.min(left.length, right.length);
  for (let i = 0; i < len; i += 1) {
    const x = left[i];
    const y = right[i];
    const xNum = /^\d/.test(x);
    const yNum = /^\d/.test(y);
    if (xNum && yNum) {
      const delta = Number(x) - Number(y);
      if (delta !== 0) return delta;
      if (x.length !== y.length) return x.length - y.length;
    } else {
      const lx = x.toLowerCase();
      const ly = y.toLowerCase();
      if (lx < ly) return -1;
      if (lx > ly) return 1;
    }
  }
  return left.length - right.length;
}

function isIgnored(name) {
  return name.startsWith('_') || name.startsWith('.');
}

function isMediaFile(name) {
  return ALLOWED_EXT.has(path.extname(name).toLowerCase());
}

const skipped = [];

/* Returns the sorted media file names directly inside `dir`. A missing or
   unreadable folder yields an empty list rather than an error. */
function listMediaFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (isIgnored(entry.name)) {
      skipped.push(path.relative(ROOT, path.join(dir, entry.name)) + ' (hidden)');
      continue;
    }
    if (!isMediaFile(entry.name)) {
      skipped.push(path.relative(ROOT, path.join(dir, entry.name)) + ' (unsupported type)');
      continue;
    }
    files.push(entry.name);
  }
  return files.sort(naturalCompare);
}

/* Returns the sorted sub-folder names directly inside `dir`. */
function listSubdirs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return [];
  }
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (isIgnored(entry.name)) {
      skipped.push(path.relative(ROOT, path.join(dir, entry.name)) + ' (hidden folder)');
      continue;
    }
    dirs.push(entry.name);
  }
  return dirs.sort(naturalCompare);
}

function sortKeys(source) {
  const out = {};
  Object.keys(source).sort(naturalCompare).forEach(function (key) {
    out[key] = source[key];
  });
  return out;
}

function scanHero() {
  return listMediaFiles(path.join(IMG, 'hero'));
}

function scanFlatCovers() {
  const bucket = {};
  const files = listMediaFiles(path.join(IMG, 'categories'));
  for (const file of files) {
    const id = path.basename(file, path.extname(file));
    if (!bucket[id]) bucket[id] = [];
    bucket[id].push(file);
  }
  return sortKeys(bucket);
}

function scanProjects() {
  const bucket = {};
  const projectsDir = path.join(IMG, 'projects');
  for (const category of listSubdirs(projectsDir)) {
    const perProject = {};
    const categoryDir = path.join(projectsDir, category);
    for (const project of listSubdirs(categoryDir)) {
      perProject[project] = listMediaFiles(path.join(categoryDir, project));
    }
    bucket[category] = sortKeys(perProject);
  }
  return sortKeys(bucket);
}

/* Read the previous generatedAt so a re-run with no changes produces a
   byte-identical file (the "timestamp" only moves when the content changes). */
function readPrevious() {
  let text;
  try {
    text = fs.readFileSync(OUT_FILE, 'utf8');
  } catch (err) {
    return null;
  }
  const start = text.indexOf('window.MP_MEDIA_MANIFEST');
  if (start === -1) return null;
  const open = text.indexOf('{', start);
  const close = text.lastIndexOf('}');
  if (open === -1 || close === -1 || close < open) return null;
  try {
    return JSON.parse(text.slice(open, close + 1));
  } catch (err) {
    return null;
  }
}

function bucketSignature(buckets) {
  return JSON.stringify({
    hero: buckets.hero,
    contact: buckets.contact,
    categories: buckets.categories,
    projects: buckets.projects
  });
}

const HEADER = [
  '/* ============================================================================',
  '   data/media-manifest.js',
  '   ----------------------------------------------------------------------------',
  '   MACHINE GENERATED — do not edit this file by hand.',
  '   It is rewritten every time you run:  node tools/build-manifest.js',
  '   Any manual changes you make here will be lost on the next run.',
  '',
  '   Values are bare file names. The folder for each bucket is fixed:',
  '     hero.files               ->  assets/img/hero/<name>',
  '     contact.files            ->  assets/img/contact/<name>',
  '     categories[<category>]   ->  assets/img/categories/<name>',
  '     projects[<category>][<project>]  ->  assets/img/projects/<category>/<project>/<name>',
  '',
  '   See docs/image-guide.md for the drop-in workflow.',
  '   ============================================================================ */'
].join('\n');

function buildManifest() {
  const buckets = {
    hero: { files: scanHero() },
    contact: { files: listMediaFiles(path.join(IMG, 'contact')) },
    categories: scanFlatCovers(),
    projects: scanProjects()
  };

  const previous = readPrevious();
  let generatedAt = new Date().toISOString();
  if (previous && previous.generatedAt) {
    const previousBuckets = {
      hero: previous.hero,
      contact: previous.contact,
      categories: previous.categories,
      projects: previous.projects
    };
    if (bucketSignature(previousBuckets) === bucketSignature(buckets)) {
      generatedAt = previous.generatedAt;
    }
  }

  const payload = {
    generatedAt: generatedAt,
    hero: buckets.hero,
    contact: buckets.contact,
    categories: buckets.categories,
    projects: buckets.projects
  };

  const body = 'window.MP_MEDIA_MANIFEST = ' + JSON.stringify(payload, null, 2) + ';\n';
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, HEADER + '\n' + body, 'utf8');

  return buckets;
}

function countProjects(projects) {
  let total = 0;
  Object.keys(projects).forEach(function (category) {
    total += Object.keys(projects[category]).length;
  });
  return total;
}

function report(buckets) {
  const categoriesFound = Object.keys(buckets.categories).length;
  const projectsFound = countProjects(buckets.projects);
  const lines = [
    'build-manifest — scanning ' + path.relative(ROOT, IMG).replace(/\\/g, '/') || 'assets/img',
    '  hero        : ' + buckets.hero.files.length + ' file(s)',
    '  contact     : ' + buckets.contact.files.length + ' file(s)',
    '  categories  : ' + categoriesFound + ' cover id(s)',
    '  projects    : ' + projectsFound + ' project folder(s) across ' + Object.keys(buckets.projects).length + ' category(ies)'
  ];
  if (skipped.length) {
    lines.push('  skipped     : ' + skipped.length);
    skipped.forEach(function (item) {
      lines.push('                - ' + item.replace(/\\/g, '/'));
    });
  } else {
    lines.push('  skipped     : 0');
  }
  lines.push('wrote ' + path.relative(ROOT, OUT_FILE).replace(/\\/g, '/'));
  return lines.join('\n');
}

function main() {
  try {
    const buckets = buildManifest();
    process.stdout.write(report(buckets) + '\n');
  } catch (err) {
    process.stderr.write('build-manifest: recovered from error: ' + (err && err.message) + '\n');
  }
  process.exit(0);
}

main();
