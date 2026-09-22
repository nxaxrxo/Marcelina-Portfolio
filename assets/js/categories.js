/* categories.js — MP.categories
   ----------------------------------------------------------------------------
   ORGANIC SHAPE SYSTEM (plan sections 11-12, architecture section 9). Seven
   hand-authored blob presets live here; each is a closed loop of cubic (C)
   segments only — no polygons, no straight lines — authored in a 0..200 box and
   normalised into a 0..1 unit box at init. They are rendered as
   <clipPath clipPathUnits="objectBoundingBox"> defs into [data-blob-defs], and
   islands reference them with clip-path: url(#blob-01).

   ISLANDS: one real <a> anchor per category, appended to [data-island-field].
   The shape is assigned by ARRAY INDEX (a per-category `island.preset` override
   is honoured when present) so any number of categories works without code
   changes.

   MENUS: the header "My Works" dropdown ([data-works-menu]) and the mobile nav
   list ([data-mobile-nav-list]) are owned and built solely by header.js
   (MP.header); this module no longer touches either container.

   PLACEMENT: content.js's island.x/y are intent, not geometry. categories.js
   re-resolves the scatter against the live field rect every time the field
   changes size — it sizes every silhouette from the field's own area, restores
   the authored spots and then pushes overlapping pairs apart until no two
   blobs intersect, so the cluster stays organic and close at any aspect ratio
   without ever piling up. See "organic layout" below. <=600px scenes.css flows
   the islands into a wrapped stack and this module hands sizing back to CSS.

   MOTION: idle drift via MP.motion.float; a gentle parallax and a cursor
   influence capped at 6px are applied to the island media in the shared rAF
   batch (never from a raw mousemove write). All three are disabled on touch and
   under prefers-reduced-motion.
   Nav/island clicks route through MP.scroll.to() and never rely on the default
   anchor jump. */
window.MP = window.MP || {};

MP.categories = (function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var MAX_CURSOR = 6;

  /* Seven distinct organic presets: a wide three-lobed rock, a soft cloud
     pebble, a lobed rounded-square, a wide cushion pebble, a kidney bean, a
     teardrop and a chunky squircle with a bite. No two read alike and none is
     an oval. Every path stays inside the 0..200 box - the mask can never clip
     the frame - and every segment is a C curve.

     Every preset is a single smooth closed loop, so no silhouette ever shows a
     corner: the largest angle a chord turns through anywhere on a preset is a
     few degrees. (blob-02 and blob-04 used to be a five-petal blossom and a
     five-point sparkle, whose petal tips and genuine cusps read as stars next
     to the round presets; both were re-authored as the smooth cloud and cushion
     below.) */
  var PRESETS = [
    {  /* wide three-lobed rock */
      id: 'blob-01', size: 'lg', rot: -4, viewBox: '0 0 200 200',
      path: 'M 90.2 9.7 C 98.2 12.1 105.1 15.7 112.2 18.4 C 119.4 21.2 125.9 23.3 133.3 26 C 140.6 28.7 148.6 30.7 156.2 34.6 C 163.8 38.5 172.6 43 178.9 49.4 C 185.2 55.8 191.3 64.2 194.1 72.8 C 196.9 81.3 197.3 91.8 195.4 100.6 C 193.6 109.4 188.4 118.4 183.1 125.5 C 177.8 132.5 170.1 138.1 163.8 143 C 157.4 148 150.8 151.2 144.9 155.3 C 139.1 159.3 134.3 163 128.8 167.4 C 123.3 171.8 118.4 177.2 111.9 181.6 C 105.5 185.9 98.1 191.1 90.2 193.5 C 82.4 195.9 72.8 197.4 64.7 196 C 56.5 194.6 47.8 190.5 41.4 185.2 C 34.9 180 29.9 171.9 26.2 164.6 C 22.6 157.2 21.3 148.7 19.7 141.3 C 18.1 133.9 17.9 127.1 16.5 120.3 C 15.2 113.5 13.4 107.7 11.6 100.6 C 9.8 93.5 6.7 86.1 5.5 77.9 C 4.4 69.6 3 59.9 4.6 51.1 C 6.1 42.4 9.5 32.4 14.9 25.3 C 20.3 18.1 28.7 11.8 36.9 8.2 C 45.1 4.7 55.5 3.8 64.4 4 C 73.2 4.2 82.2 7.3 90.2 9.7 Z'
    },
    {  /* soft cloud pebble - three gentle swells, one waist, no tips */
      id: 'blob-02', size: 'lg', rot: 3, viewBox: '0 0 200 200',
      path: 'M 187.4 99.7 C 184.4 112.1 174.7 123.4 167.4 132.8 C 160.1 142.3 151.9 148.1 143.5 156.1 C 135.1 164.1 128.1 174.0 117.0 180.7 C 105.8 187.3 90.3 196.0 76.5 196.0 C 62.7 196.0 44.7 189.6 34.1 180.4 C 23.5 171.2 16.7 154.3 13.0 140.8 C 9.3 127.3 10.9 112.9 11.9 99.7 C 13.0 86.4 14.7 73.8 19.4 61.6 C 24.1 49.4 30.4 35.7 40.1 26.4 C 49.7 17.1 63.8 9.3 77.1 6.0 C 90.4 2.8 106.1 3.7 119.7 6.8 C 133.2 9.9 147.5 16.0 158.4 24.5 C 169.3 33.1 180.4 45.4 185.2 57.9 C 190.0 70.4 190.4 87.2 187.4 99.7 Z'
    },
    {  /* lobed rounded-square */
      id: 'blob-03', size: 'md', rot: -6, viewBox: '0 0 200 200',
      path: 'M 100 22 C 134 22 160 42 166 74 C 172 108 150 122 156 152 C 160 174 130 188 100 184 C 70 180 42 176 46 152 C 50 122 28 108 34 74 C 40 42 66 22 100 22 Z'
    },
    {  /* wide cushion pebble - one soft waist, two rounded ends */
      id: 'blob-04', size: 'lg', rot: 12, viewBox: '0 0 200 200',
      path: 'M 195.1 102.1 C 192.9 115.8 184.3 129.7 176.3 140.0 C 168.3 150.3 157.2 158.0 146.8 163.9 C 136.5 169.9 125.4 173.6 114.3 175.8 C 103.3 177.9 91.8 178.5 80.4 176.9 C 69.1 175.4 56.8 172.5 46.1 166.5 C 35.4 160.5 23.4 151.9 16.3 141.1 C 9.3 130.4 3.7 114.9 4.0 102.1 C 4.3 89.2 10.8 74.0 18.3 63.9 C 25.8 53.8 38.7 47.0 49.1 41.4 C 59.6 35.8 70.0 33.5 81.1 30.3 C 92.2 27.1 103.1 22.8 115.7 22.4 C 128.3 22.0 144.6 21.8 156.8 27.7 C 169.1 33.6 183.0 45.4 189.4 57.8 C 195.7 70.2 197.2 88.4 195.1 102.1 Z'
    },
    {  /* kidney bean with a waist */
      id: 'blob-05', size: 'lg', rot: -3, viewBox: '0 0 200 200',
      path: 'M 87.7 4 C 96.1 4 104.5 4.8 112.8 6.6 C 121 8.4 129.3 11 137.1 14.7 C 144.8 18.4 152.5 23 159.3 28.6 C 166 34.2 172.5 40.9 177.6 48.3 C 182.6 55.7 187 64.2 189.7 72.8 C 192.5 81.5 194 91.1 194 100.2 C 194 109.3 192.5 118.9 189.7 127.5 C 187 136.1 182.6 144.7 177.6 152 C 172.5 159.4 166 166.1 159.3 171.7 C 152.5 177.3 144.8 182 137.1 185.6 C 129.3 189.3 121 191.9 112.8 193.7 C 104.5 195.4 96 196.3 87.7 196 C 79.4 195.7 70.7 194.7 63.2 191.8 C 55.6 189 47.6 184.7 42.3 178.8 C 37 173 33 164.4 31.3 156.6 C 29.6 148.9 31.7 139.3 32.1 132.3 C 32.4 125.3 34.9 120.1 33.4 114.7 C 32 109.4 27.4 106.1 23.4 100.2 C 19.3 94.2 11.9 86.9 9 79.1 C 6.1 71.2 4.5 61.1 6 53 C 7.5 44.9 12.5 36.7 17.9 30.3 C 23.3 24 31.1 19 38.6 15.1 C 46 11.1 54.5 8.5 62.7 6.7 C 70.8 4.8 79.4 4 87.7 4 Z'
    },
    {  /* teardrop with a cusped tail */
      id: 'blob-06', size: 'lg', rot: 4, viewBox: '0 0 200 200',
      path: 'M 100 4 C 117.2 4 137.2 3.3 151.6 12.3 C 166.1 21.2 179.5 41.2 186.7 57.7 C 193.9 74.2 198.1 93.8 195 111.4 C 191.9 128.9 184 148.9 168.1 163 C 152.3 177.1 100 196 100 196 C 100 196 47.7 177.1 31.9 163 C 16 148.9 8.1 128.9 5 111.4 C 1.9 93.8 6.1 74.2 13.3 57.7 C 20.5 41.2 33.9 21.2 48.4 12.3 C 62.8 3.3 82.8 4 100 4 Z'
    },
    {  /* squircle with a bite */
      id: 'blob-07', size: 'sm', rot: 5, viewBox: '0 0 200 200',
      path: 'M 100 14.9 C 105.6 14.9 111 6.5 116.8 4.7 C 122.6 2.8 129 3.3 134.9 4 C 140.9 4.7 147 6.4 152.7 8.8 C 158.3 11.2 163.8 14.4 168.7 18.2 C 173.5 21.9 178.1 26.5 181.8 31.3 C 185.6 36.2 188.8 41.7 191.2 47.3 C 193.6 53 195.6 59 196 65.1 C 196.4 71.1 196.3 77.7 193.7 83.5 C 191 89.3 181.8 94.8 180.3 100 C 178.8 105.2 185.1 110.2 184.5 114.9 C 184 119.6 180.2 124.2 176.9 128 C 173.5 131.7 168.5 134.5 164.5 137.3 C 160.5 140 156.2 141.7 152.8 144.3 C 149.4 146.9 146.9 149.4 144.3 152.8 C 141.7 156.2 140 160.5 137.3 164.5 C 134.5 168.5 131.7 173.5 128 176.9 C 124.2 180.2 119.6 184 114.9 184.5 C 110.2 185.1 105.2 178.8 100 180.3 C 94.8 181.8 89.3 191 83.5 193.7 C 77.7 196.3 71.1 196.4 65.1 196 C 59 195.6 53 193.6 47.3 191.2 C 41.7 188.8 36.2 185.6 31.3 181.8 C 26.5 178.1 21.9 173.5 18.2 168.7 C 14.4 163.8 11.2 158.3 8.8 152.7 C 6.4 147 4.7 140.9 4 134.9 C 3.3 129 2.8 122.6 4.7 116.8 C 6.5 111 14.9 105.6 14.9 100 C 14.9 94.4 6.5 89 4.7 83.2 C 2.8 77.4 3.3 71 4 65.1 C 4.7 59.1 6.4 53 8.8 47.3 C 11.2 41.7 14.4 36.2 18.2 31.3 C 21.9 26.5 26.5 21.9 31.3 18.2 C 36.2 14.4 41.7 11.2 47.3 8.8 C 53 6.4 59.1 4.7 65.1 4 C 71 3.3 77.4 2.8 83.2 4.7 C 89 6.5 94.4 14.9 100 14.9 Z'
    }
  ];

  /* Deterministic scatter used when a category does not define island.x/y, so
     the explorer keeps a deliberately composed layout with any category count. */
  var FALLBACK_POSITIONS = [
    { x: 18, y: 30 }, { x: 68, y: 22 }, { x: 82, y: 60 }, { x: 30, y: 72 },
    { x: 52, y: 46 }, { x: 12, y: 56 }, { x: 44, y: 14 }, { x: 74, y: 78 },
    { x: 24, y: 10 }, { x: 88, y: 36 }
  ];

  var built = false;
  var islands = [];
  var fieldEl = null;
  var offs = [];
  var cursor = { x: 0, y: 0, active: false };
  var viewport = { w: 0, h: 0 };

  /* --------------------------------------------------------- environment shims */

  function util() { return (window.MP && MP.util) || null; }

  function qs(selector, from) {
    var U = util();
    if (U && typeof U.qs === 'function') { return U.qs(selector, from || document); }
    return (from || document).querySelector(selector);
  }

  function on(target, type, handler, opts) {
    if (!target) { return function () {}; }
    var U = util();
    if (U && typeof U.on === 'function') { return U.on(target, type, handler, opts); }
    target.addEventListener(type, handler, opts);
    return function () { target.removeEventListener(type, handler, opts); };
  }

  function scrollApi() { return (window.MP && MP.scroll) || null; }

  function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value);
  }

  function isTouch() {
    var U = util();
    if (U && typeof U.isTouch === 'function') { return !!U.isTouch(); }
    return !!(window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);
  }

  function isReduced() {
    var U = util();
    if (U && typeof U.reducedMotion === 'function') { return !!U.reducedMotion(); }
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function setAttr(element, name, value) {
    element.setAttribute(name, value === undefined || value === null ? '' : String(value));
  }

  function node(tag, className) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    return el;
  }

  /* ------------------------------------------------------------- data access */

  function dataApi() { return (window.MP && MP.data) || null; }

  function dataCategories() {
    var d = dataApi();
    if (d && Array.isArray(d.categories)) { return d.categories; }
    if (window.MP_DATA && Array.isArray(window.MP_DATA.categories)) { return window.MP_DATA.categories; }
    return [];
  }

  function placeholderPath() {
    var d = dataApi();
    if (d && d.PLACEHOLDER) { return d.PLACEHOLDER; }
    return 'assets/img/_placeholder.svg';
  }

  function resolveSrc(path) {
    if (!path) { return ''; }
    var d = dataApi();
    if (d && typeof d.resolveSrc === 'function') {
      try { return d.resolveSrc(path); } catch (err) { /* fall through */ }
    }
    return path;
  }

  function coverSrc(category) {
    var manifest = window.MP_MEDIA_MANIFEST || {};
    var files = manifest.categories && manifest.categories[category.id];
    var path = null;
    if (files && files.length) { path = 'assets/img/categories/' + files[0]; }
    else if (category.cover) { path = category.cover; }
    if (!path) { return placeholderPath(); }
    return resolveSrc(path);
  }

  function projectCount(category) {
    return Array.isArray(category.projects) ? category.projects.length : 0;
  }

  function countLabel(category) {
    var n = projectCount(category);
    return n + (n === 1 ? ' project' : ' projects');
  }

  function wrap(index, length) {
    return ((index % length) + length) % length;
  }

  /* ------------------------------------------------------- blob def rendering */

  function unitPath(preset) {
    var box = String(preset.viewBox || '0 0 200 200').split(/\s+/);
    var w = parseFloat(box[2]) || 200;
    var h = parseFloat(box[3]) || 200;
    var i = 0;
    return String(preset.path).replace(/-?\d*\.?\d+/g, function (raw) {
      var value = parseFloat(raw);
      var scaled = (i % 2 === 0) ? value / w : value / h;
      i++;
      return scaled.toFixed(5);
    });
  }

  function renderDefs() {
    var svg = qs('[data-blob-defs]');
    if (!svg) { return; }
    for (var i = 0; i < PRESETS.length; i++) {
      var preset = PRESETS[i];
      var clip = document.createElementNS(SVG_NS, 'clipPath');
      clip.setAttribute('id', preset.id);
      clip.setAttribute('clipPathUnits', 'objectBoundingBox');
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', unitPath(preset));
      clip.appendChild(path);
      svg.appendChild(clip);
    }
  }

  /* ------------------------------------------------------ silhouette metrics */

  /* RHO[presetId] is the furthest the silhouette reaches from the centre of its
     unit box (a fraction of the island's width). A circle of that radius
     therefore CONTAINS the whole shape however the island is rotated, because
     rotating only moves every point around that same centre. The layout below
     leans on that: keep two circles apart and the two blobs can never touch. */
  var RHO = {};
  var CURVE_SAMPLES = 12;

  function presetRadius(preset) {
    var tokens = String(unitPath(preset)).match(/[A-Za-z]|-?\d*\.?\d+/g) || [];
    var i = 0;
    var cmd = '';
    var sx = 0, sy = 0;          /* subpath start */
    var px = 0, py = 0;          /* pen position before the current segment */
    var max = 0;

    function reach(ax, ay) {
      var dx = ax - 0.5, dy = ay - 0.5;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d > max) { max = d; }
    }

    function num() { return parseFloat(tokens[i++]); }

    while (i < tokens.length) {
      var token = tokens[i];
      if (token === 'Z' || token === 'z') { px = sx; py = sy; i++; cmd = ''; continue; }
      if (/[A-Za-z]/.test(token)) { cmd = token; i++; continue; }
      if (cmd === 'M') {
        px = num(); py = num();
        sx = px; sy = py;
        reach(px, py);
      } else if (cmd === 'C') {
        var c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex = num(), ey = num();
        for (var s = 1; s <= CURVE_SAMPLES; s++) {
          var t = s / CURVE_SAMPLES, u = 1 - t;
          var a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
          reach(a * px + b * c1x + c * c2x + d * ex,
                a * py + b * c1y + c * c2y + d * ey);
        }
        px = ex; py = ey;
      } else {
        i++;                     /* anything unexpected: step over one number */
      }
    }
    return max || 0.5;
  }

  function rhoOf(preset) {
    var key = preset && preset.id ? preset.id : '';
    if (!key) { return 0.5; }
    if (!RHO[key]) { RHO[key] = presetRadius(preset); }
    return RHO[key];
  }

  /* ----------------------------------------------------------- organic layout */

  /* content.js authors --island-x/--island-y as INTENT: where an island should
     sit and how big it should feel. Intent alone cannot survive a window
     reshape, because the field's height is drawn from the viewport height while
     the island widths were drawn from the viewport width - so a wide, short
     window (or a tall, narrow one) piled the shapes on top of each other.

     So every time the field changes size, the scatter is re-resolved:
       1. size every silhouette from the FIELD's own area - coverage says how
          much of the field the shapes plus their breathing room may claim;
       2. drop them back on their authored spots;
       3. push any overlapping pair apart along the line joining their centres,
          over and over, clamping to a padded field each pass, until nothing
          overlaps anything.

     Nothing here is random and nothing is on a grid: the authored spots supply
     the asymmetry, and the pushes only ever move what has to move, so the
     cluster keeps its thrown-on-the-ground scatter and lands identically on
     every load. The shape size itself is searched rather than fixed - solve()
     bisects it and keeps the largest value that still separates - so the blobs
     are always as large, and therefore as close, as the field can honestly
     hold. */
  var LAYOUT = {
    /* island width per size class: the ratio the CSS size classes used to carry */
    ratio: { xl: 1.2, lg: 1, md: 0.94, sm: 0.82 },
    /* the search below bisects this range for the largest coverage that still
       resolves, so the cluster always ends up as big (and therefore as close)
       as the field can honestly hold */
    coverageMin: 0.6,
    coverageMax: 2.3,
    coverageSteps: 7,
    /* The owner wants the cluster big and tight, and accepts the shapes just
       touching or slightly lapping: `overlap` is how many px two silhouettes may
       sit inside each other at rest (negative would enforce a gap), and `drift`
       is the head-room the idle float needs. A pair therefore separates by
       2 × drift - overlap. */
    overlap: 95,
    drift: 0,
    pad: 14,            /* px inset from the field's edge */
    passes: 110,
    settle: 0.5         /* residual px overlap still counted as a fit */
  };

  var placed = { w: 0, h: 0 };

  function scatterIsAbsolute() {
    var el = islands[0] && islands[0].el;
    if (!el || !window.getComputedStyle) { return true; }
    try { return window.getComputedStyle(el).position === 'absolute'; }
    catch (err) { return true; }
  }

  function clearPlaced() {
    for (var i = 0; i < islands.length; i++) {
      var style = islands[i].el.style;
      style.removeProperty('--island-w');
      style.setProperty('--island-x', islands[i].ix + '%');
      style.setProperty('--island-y', islands[i].iy + '%');
    }
  }

  /* Largest unit width whose circles (silhouette + margin) still cover no more
     than `coverage` of the field; the area is monotone in the unit, so a plain
     bisection lands on it. The cap keeps the biggest circle inside the field. */
  function solveUnit(w, h, margin, coverage) {
    var n = islands.length;
    var head = 0;
    var i;
    for (i = 0; i < n; i++) {
      var reach = rhoOf(islands[i].preset) * (LAYOUT.ratio[islands[i].size] || 1);
      if (reach > head) { head = reach; }
    }
    var limit = (Math.min(w, h) - 2 * LAYOUT.pad) / 2 - margin;
    if (limit <= 0 || head <= 0) { return 0; }

    var target = coverage * w * h;
    var lo = 0;
    var hi = Math.min(w, limit / head);
    for (var step = 0; step < 24; step++) {
      var mid = (lo + hi) / 2;
      var area = 0;
      for (i = 0; i < n; i++) {
        var r = rhoOf(islands[i].preset) * mid * (LAYOUT.ratio[islands[i].size] || 1) + margin;
        area += Math.PI * r * r;
      }
      if (area < target) { lo = mid; } else { hi = mid; }
    }
    return hi;
  }

  /* Push every overlapping pair apart, then clamp the batch back inside the
     padded field; repeat until a clean pass or the pass budget runs out. */
  function separate(boxes, radii, w, h) {
    var n = boxes.length;
    var pad = LAYOUT.pad;
    var pass, i, j;

    for (pass = 0; pass < LAYOUT.passes; pass++) {
      var pushed = false;
      for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
          var dx = boxes[j].cx - boxes[i].cx;
          var dy = boxes[j].cy - boxes[i].cy;
          var need = radii[i] + radii[j];
          var d2 = dx * dx + dy * dy;
          if (d2 >= need * need) { continue; }
          var d = Math.sqrt(d2);
          var ux, uy;
          if (d > 0.01) {
            ux = dx / d; uy = dy / d;
          } else {
            /* identical centres: split along a fixed angle so the result stays
               reproducible instead of depending on floating-point noise */
            var angle = (i * 2.39996) + (j * 1.32472);
            ux = Math.cos(angle); uy = Math.sin(angle);
          }
          var push = (need - d) / 2;
          boxes[i].cx -= ux * push; boxes[i].cy -= uy * push;
          boxes[j].cx += ux * push; boxes[j].cy += uy * push;
          pushed = true;
        }
      }

      for (i = 0; i < n; i++) {
        var minX = pad + radii[i], maxX = w - pad - radii[i];
        var minY = pad + radii[i], maxY = h - pad - radii[i];
        boxes[i].cx = (minX > maxX) ? w / 2 : clamp(boxes[i].cx, minX, maxX);
        boxes[i].cy = (minY > maxY) ? h / 2 : clamp(boxes[i].cy, minY, maxY);
      }

      if (!pushed) { break; }
    }

    /* The clamp has the last word, so re-test: a fit is only a fit if the
       bounds did not leave a pair overlapping. */
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        var ddx = boxes[j].cx - boxes[i].cx;
        var ddy = boxes[j].cy - boxes[i].cy;
        var clearance = radii[i] + radii[j] - Math.sqrt(ddx * ddx + ddy * ddy);
        if (clearance > LAYOUT.settle) { return false; }
      }
    }
    return true;
  }

  function attempt(w, h, margin, coverage) {
    var unit = solveUnit(w, h, margin, coverage);
    if (!unit) { return null; }

    var boxes = [];
    var radii = [];
    for (var i = 0; i < islands.length; i++) {
      var island = islands[i];
      var width = unit * (LAYOUT.ratio[island.size] || 1);
      radii.push(rhoOf(island.preset) * width + margin);
      boxes.push({ w: width, cx: island.ix / 100 * w, cy: island.iy / 100 * h });
    }
    return separate(boxes, radii, w, h) ? boxes : null;
  }

  /* Bigger shapes are harder to keep apart, so feasibility falls away as
     coverage climbs and the search is monotone: bisect it and keep the last
     coverage that resolved. */
  function solve(w, h) {
    var margin = LAYOUT.drift - LAYOUT.overlap / 2;
    var lo = LAYOUT.coverageMin;
    var hi = LAYOUT.coverageMax;
    var best = null;

    for (var step = 0; step < LAYOUT.coverageSteps; step++) {
      var mid = (lo + hi) / 2;
      var boxes = attempt(w, h, margin, mid);
      if (boxes) { best = boxes; lo = mid; } else { hi = mid; }
    }
    if (!best) { best = attempt(w, h, margin, LAYOUT.coverageMin); }
    return best;
  }

  function layout() {
    if (!fieldEl || !islands.length) { return; }

    var rect = fieldEl.getBoundingClientRect();
    var w = rect.width, h = rect.height;
    if (w === placed.w && h === placed.h) { return; }
    if (!(w > 1) || !(h > 1)) { return; }

    placed.w = w;
    placed.h = h;

    /* ≤600px the field stops being a canvas: scenes.css flows the islands into
       a wrapped stack, so hand the sizing back to CSS and leave the authored
       intent in place. */
    if (!scatterIsAbsolute()) { clearPlaced(); return; }

    var boxes = solve(w, h);
    if (!boxes) { clearPlaced(); return; }

    for (var i = 0; i < islands.length; i++) {
      var style = islands[i].el.style;
      style.setProperty('--island-w', boxes[i].w.toFixed(1) + 'px');
      style.setProperty('--island-x', (boxes[i].cx / w * 100).toFixed(3) + '%');
      style.setProperty('--island-y', (boxes[i].cy / h * 100).toFixed(3) + '%');
    }
    measure();
  }

  function wireLayout() {
    if (!fieldEl || !islands.length) { return; }
    if (typeof window.ResizeObserver === 'function') {
      /* The observer is the whole trigger: it fires once on observe and then
         only when the field really changes size, which covers window resizes,
         the mobile breakpoint flip and the page reflowing once webfonts land. */
      var observer = new window.ResizeObserver(function () { layout(); });
      observer.observe(fieldEl);
      offs.push(function () { observer.disconnect(); });
      layout();
      return;
    }
    /* No observer: fall back to the shared frame loop; layout() early-outs
       unless the field's size actually moved. */
    offs.push(rafLoop(layout));
  }

  /* ------------------------------------------------------------ island build */
  function pickPreset(category, index) {
    var island = category.island || {};
    var raw = (typeof island.preset === 'number' && isFinite(island.preset)) ? island.preset : index;
    return PRESETS[wrap(Math.round(raw), PRESETS.length)];
  }

  function normalSize(size) {
    return (size === 'xl' || size === 'lg' || size === 'md' || size === 'sm') ? size : null;
  }

  function positionFor(index, island) {
    if (island && typeof island.x === 'number' && typeof island.y === 'number') {
      return { x: clamp(island.x, 4, 96), y: clamp(island.y, 4, 96) };
    }
    var spot = FALLBACK_POSITIONS[wrap(index, FALLBACK_POSITIONS.length)];
    return { x: spot.x, y: spot.y };
  }

  function routeTo(categoryId) {
    var s = scrollApi();
    if (s && typeof s.to === 'function') { s.to(categoryId); return; }
    var target = document.getElementById(categoryId);
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function buildIsland(category, index) {
    var preset = pickPreset(category, index);
    var island = category.island || {};
    var size = normalSize(island.size) || normalSize(preset.size) || 'md';
    var position = positionFor(index, island);
    var rot = (typeof island.rot === 'number') ? island.rot : preset.rot;

    var anchor = node('a', 'island island--' + preset.id + ' island--size-' + size);
    anchor.href = '#' + category.id;
    setAttr(anchor, 'data-anchor', '');
    setAttr(anchor, 'data-island', '');
    setAttr(anchor, 'data-category-id', category.id);
    anchor.setAttribute('aria-label', (category.title || ''));
    anchor.style.setProperty('--island-x', position.x + '%');
    anchor.style.setProperty('--island-y', position.y + '%');
    anchor.style.setProperty('--island-rot', rot + 'deg');
    anchor.style.setProperty('--island-delay', (index * 0.6).toFixed(1) + 's');

    var media = node('span', 'island__media');
    media.setAttribute('aria-hidden', 'true');
    var img = node('img', 'island__img');
    img.alt = '';
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');
    img.draggable = false;
    img.src = coverSrc(category);
    on(img, 'error', function () {
      if (img.getAttribute('data-placeholder') === '1') { return; }
      img.setAttribute('data-placeholder', '1');
      img.src = placeholderPath();
    });
    media.appendChild(img);

    var label = node('span', 'island__label');
    var title = node('span', 'island__title');
    title.textContent = category.title || '';
    label.appendChild(title);

    anchor.appendChild(media);
    anchor.appendChild(label);

    on(anchor, 'click', function (ev) {
      ev.preventDefault();
      routeTo(category.id);
    });

    islands.push({
      el: anchor,
      media: media,
      index: index,
      /* kept so the layout can re-resolve the scatter without re-reading the
         data: the preset's silhouette, the authored spot and the size class */
      preset: preset,
      size: size,
      ix: position.x,
      iy: position.y,
      cx: 0,
      cy: 0,
      r: 1
    });
    return anchor;
  }

  function buildIslands(categories) {
    fieldEl = qs('[data-island-field]');
    if (!fieldEl) { return; }
    while (fieldEl.firstChild) { fieldEl.removeChild(fieldEl.firstChild); }
    islands = [];
    for (var i = 0; i < categories.length; i++) {
      if (!categories[i] || !categories[i].id) { continue; }
      fieldEl.appendChild(buildIsland(categories[i], i));
    }
  }

  /* ------------------------------------------------------- idle / parallax / cursor */

  function measure() {
    if (!fieldEl) { return; }
    var frame = fieldEl.getBoundingClientRect();
    for (var i = 0; i < islands.length; i++) {
      var island = islands[i];
      var rect = island.el.getBoundingClientRect();
      island.cx = rect.left - frame.left + rect.width / 2;
      island.cy = rect.top - frame.top + rect.height / 2;
      island.r = Math.max(rect.width, rect.height) * 0.62 || 1;
    }
  }

  function applyOffsets() {
    if (!fieldEl || !islands.length) { return; }
    if (isTouch() || isReduced()) {
      for (var r = 0; r < islands.length; r++) { islands[r].media.style.translate = ''; }
      return;
    }

    /* scroll.js owns the single native resize listener for the whole site, so
       this subscriber re-measures only when the viewport actually changes. */
    var vw = window.innerWidth || 0;
    var vh = window.innerHeight || 0;
    if (vw !== viewport.w || vh !== viewport.h) {
      viewport.w = vw;
      viewport.h = vh;
      measure();
    }

    var frame = fieldEl.getBoundingClientRect();
    var localX = cursor.x - frame.left;
    var localY = cursor.y - frame.top;

    for (var i = 0; i < islands.length; i++) {
      var island = islands[i];
      var ox = 0;
      var oy = 0;

      if (cursor.active) {
        var dx = localX - island.cx;
        var dy = localY - island.cy;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < island.r) {
          var falloff = (1 - dist / island.r) * MAX_CURSOR;
          ox += (dx / dist) * falloff;
          oy += (dy / dist) * falloff;
        }
      }

      ox = clamp(ox, -MAX_CURSOR, MAX_CURSOR);
      oy = clamp(oy, -MAX_CURSOR, MAX_CURSOR);
      island.media.style.translate = ox.toFixed(2) + 'px ' + oy.toFixed(2) + 'px';
    }
  }

  function rafLoop(callback) {
    var U = util();
    if (U && typeof U.rafLoop === 'function') { return U.rafLoop(callback); }
    var id = 0;
    var stopped = false;
    var last = 0;
    function tick(time) {
      if (stopped) { return; }
      var dt = last ? time - last : 16;
      last = time;
      callback(dt, time);
      id = window.requestAnimationFrame(tick);
    }
    id = window.requestAnimationFrame(tick);
    return function () {
      stopped = true;
      if (id) { window.cancelAnimationFrame(id); }
    };
  }

  function wireMotion() {
    if (!fieldEl) { return; }
    if (isTouch() || isReduced()) { return; }

    measure();
    requestAnimationFrame(measure);

    offs.push(on(fieldEl, 'pointermove', function (ev) {
      if (ev.pointerType && ev.pointerType !== 'mouse') { return; }
      cursor.x = ev.clientX;
      cursor.y = ev.clientY;
      cursor.active = true;
    }));
    offs.push(on(fieldEl, 'pointerleave', function () { cursor.active = false; }));

    var s = scrollApi();
    if (s && typeof s.add === 'function') {
      offs.push(s.add(applyOffsets));
    } else {
      offs.push(rafLoop(applyOffsets));
    }

    var motion = window.MP && MP.motion;
    if (motion && typeof motion.float === 'function') {
      for (var i = 0; i < islands.length; i++) {
        try {
          motion.float(islands[i].el, { amp: 6, dur: 7 + i * 0.5, delay: i * 0.5, rot: 1.5 });
        } catch (err) { /* ignore */ }
      }
    }
  }

  /* -------------------------------------------------------------- public API */

  function init() {
    if (built) { return; }
    built = true;
    renderDefs();
    var categories = dataCategories();
    buildIslands(categories);
    wireLayout();
    wireMotion();
    var s = scrollApi();
    if (s && typeof s.refresh === 'function') {
      try { s.refresh(); } catch (err) { /* ignore */ }
    }
  }

  return { init: init, presets: PRESETS };
}());
