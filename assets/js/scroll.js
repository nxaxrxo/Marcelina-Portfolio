/* scroll.js — MP.scroll
   The single scroll engine (architecture.md section 7, plan sections 6-8).
   One passive scroll listener and one debounced resize listener exist for the
   whole site; every other module animates by subscribing with add(). Scrolling
   stays native — the page is never translated or virtualised. Smoothness comes
   only from interpolating element transforms toward the true scroll position.
   Reduced motion bypasses the damping entirely (smoothed === raw y). */

window.MP = window.MP || {};

MP.scroll = (function () {
  'use strict';

  var DAMP_LAMBDA = 14;
  var VELOCITY_LAMBDA = 18;
  var DIRECTION_EPSILON = 0.05;
  var RESIZE_DEBOUNCE = 150;
  var SCENE_ATTR = 'data-scene';
  var CATEGORY_ATTR = 'data-category-id';
  var PORTFOLIO_SCENE = 'portfolio';
  var NOOP = function () {};

  var api = { y: 0, smoothed: 0, velocity: 0, direction: 1 };

  var scenes = [];
  var subs = [];
  var started = false;
  var vh = 0;

  function util() { return (window.MP && MP.util) || null; }

  function listen(target, type, handler, opts) {
    var u = util();
    if (u && typeof u.on === 'function') { return u.on(target, type, handler, opts); }
    if (!target || typeof target.addEventListener !== 'function') { return NOOP; }
    target.addEventListener(type, handler, opts);
    return function () { target.removeEventListener(type, handler, opts); };
  }

  function debounce(fn, ms) {
    var u = util();
    return (u && typeof u.debounce === 'function') ? u.debounce(fn, ms) : fn;
  }

  function raf(cb) {
    var u = util();
    return (u && typeof u.rafLoop === 'function') ? u.rafLoop(cb) : NOOP;
  }

  /* Local fallbacks let the engine run even if util failed to load. */
  function localClamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function localDamp(current, target, lambda, dt) {
    return target + (current - target) * Math.exp(-lambda * dt);
  }
  function localEaseOutCubic(t) { var f = 1 - t; return 1 - f * f * f; }
  function localEaseInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  var fnClamp = localClamp;
  var fnDamp = localDamp;
  var fnEaseOut = localEaseOutCubic;
  var fnEaseInOut = localEaseInOutCubic;

  function bindMath() {
    var u = util();
    if (!u) { return; }
    if (typeof u.clamp === 'function') { fnClamp = u.clamp; }
    if (typeof u.damp === 'function') { fnDamp = u.damp; }
    if (typeof u.easeOutCubic === 'function') { fnEaseOut = u.easeOutCubic; }
    if (typeof u.easeInOutCubic === 'function') { fnEaseInOut = u.easeInOutCubic; }
  }

  function readY() {
    if (typeof window.pageYOffset === 'number') { return window.pageYOffset; }
    return window.scrollY || (document.documentElement && document.documentElement.scrollTop) || 0;
  }

  function readVH() {
    return window.innerHeight || (document.documentElement && document.documentElement.clientHeight) || 0;
  }

  function prefersReduced() {
    var u = util();
    if (u && typeof u.reducedMotion === 'function') { return u.reducedMotion(); }
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) { return false; }
  }

  function sceneIdOf(el) {
    var name = el.getAttribute(SCENE_ATTR) || '';
    if (name === PORTFOLIO_SCENE) {
      var catId = el.getAttribute(CATEGORY_ATTR) || el.id || '';
      return catId ? 'portfolio:' + catId : '';
    }
    return name;
  }

  /* --------------------------------------------------------------- measure */

  function measure() {
    vh = readVH();
    var y = readY();
    var nodes = util() ? util().qsa('[' + SCENE_ATTR + ']') : [];
    var next = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var id = sceneIdOf(node);
      if (!id) { continue; }
      var rect = node.getBoundingClientRect();
      next.push({
        id: id,
        el: node,
        top: rect.top + y,
        height: rect.height || node.offsetHeight || 0
      });
    }
    scenes = next;
  }

  function sceneById(id) {
    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id === id) { return scenes[i]; }
    }
    return null;
  }

  function maxScroll() {
    var doc = document.documentElement;
    var height = (doc && doc.scrollHeight) || 0;
    return Math.max(0, height - (vh || readVH()));
  }

  /* ------------------------------------------------------- scene progress */
  /* Verbatim from section 7:
     p = (viewportBottom - sceneTop) / (viewportHeight + sceneHeight)      */

  function progress(id) {
    var scene = sceneById(id);
    if (!scene) { return 0; }
    var viewport = vh || readVH();
    var denominator = viewport + scene.height;
    if (denominator <= 0) { return 0; }
    return fnClamp(((api.y + viewport) - scene.top) / denominator, 0, 1);
  }

  function phase(id, opts) {
    opts = opts || {};
    var inEnd = (typeof opts.inEnd === 'number' && opts.inEnd > 0) ? Math.min(opts.inEnd, 1) : 0.38;
    var outStart = (typeof opts.outStart === 'number') ? opts.outStart : 0.68;
    if (outStart < inEnd) { outStart = inEnd; }
    if (outStart > 1) { outStart = 1; }
    var p = progress(id);
    var enter = fnEaseOut(fnClamp(p / inEnd, 0, 1));
    var span = 1 - outStart;
    var exit = span > 0 ? fnEaseInOut(fnClamp((p - outStart) / span, 0, 1)) : (p >= outStart ? 1 : 0);
    var presence = fnClamp(enter * (1 - exit), 0, 1);
    return {
      progress: p,
      enter: enter,
      exit: exit,
      visible: p > 0 && p < 1,
      presence: presence,
      dim: 1 - presence
    };
  }

  function current() {
    var viewport = vh || readVH();
    var best = null;
    var bestVisible = 0;
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var top = scene.top - api.y;
      var visible = Math.min(top + scene.height, viewport) - Math.max(top, 0);
      if (visible > bestVisible) { bestVisible = visible; best = scene.id; }
    }
    return best;
  }

  /* ------------------------------------------------------------ frame loop */
  /* One reused ctx object per frame — no per-frame allocation. Each frame is
     strictly MEASURE (cheap viewport reads) then APPLY (subscriber writes), so
     the loop never interleaves reads and writes and never thrashes layout. */

  var ctx = {
    y: 0,
    smoothed: 0,
    velocity: 0,
    direction: 1,
    dt: 0,
    time: 0,
    current: null,
    progress: progress,
    phase: phase
  };

  function frame(dt, time) {
    api.y = readY();
    vh = readVH();

    var reduced = prefersReduced();
    var target = api.y;
    var next = reduced ? target : fnDamp(api.smoothed, target, DAMP_LAMBDA, dt);
    var delta = next - api.smoothed;
    api.smoothed = next;
    api.velocity = reduced ? delta : fnDamp(api.velocity, delta, VELOCITY_LAMBDA, dt);

    if (api.velocity > DIRECTION_EPSILON) { api.direction = 1; }
    else if (api.velocity < -DIRECTION_EPSILON) { api.direction = -1; }

    ctx.y = api.y;
    ctx.smoothed = api.smoothed;
    ctx.velocity = api.velocity;
    ctx.direction = api.direction;
    ctx.dt = dt;
    ctx.time = time;
    ctx.current = current();

    var list = subs.slice();
    for (var i = 0; i < list.length; i++) {
      try { list[i](ctx); } catch (err) { /* one bad subscriber must not stop the loop */ }
    }
  }

  function onScroll() {
    /* Keep the raw mirror current even if rAF is throttled in a background tab. */
    api.y = readY();
  }

  /* ---------------------------------------------------------------- public */

  function refresh() {
    measure();
    api.y = readY();
    api.smoothed = fnClamp(api.smoothed, 0, maxScroll());
  }

  function init() {
    if (started) { return; }
    started = true;
    bindMath();
    api.y = readY();
    api.smoothed = api.y;
    api.velocity = 0;
    api.direction = 1;
    measure();
    listen(window, 'scroll', onScroll, { passive: true });
    listen(window, 'resize', debounce(refresh, RESIZE_DEBOUNCE), { passive: true });
    listen(window, 'load', refresh);
    raf(frame);
  }

  function add(cb) {
    if (typeof cb !== 'function') { return NOOP; }
    subs.push(cb);
    var active = true;
    return function off() {
      if (!active) { return; }
      active = false;
      var index = subs.indexOf(cb);
      if (index !== -1) { subs.splice(index, 1); }
    };
  }

  function to(id, opts) {
    opts = opts || {};
    if (!id) { return; }
    var scene = sceneById(id);
    var el = scene ? scene.el : document.getElementById(id);
    if (!el || typeof el.getBoundingClientRect !== 'function') { return; }
    var offset = (typeof opts.offset === 'number') ? opts.offset : 0;
    var top = el.getBoundingClientRect().top + readY() - offset;
    if (top < 0) { top = 0; }
    var behavior = opts.behavior || (prefersReduced() ? 'auto' : 'smooth');
    try {
      window.scrollTo({ top: top, behavior: behavior });
    } catch (err) {
      window.scrollTo(0, top);
    }
  }

  api.init = init;
  api.refresh = refresh;
  api.add = add;
  api.progress = progress;
  api.phase = phase;
  api.current = current;
  api.to = to;
  return api;
}());
