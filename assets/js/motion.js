/* motion.js — MP.motion
   Gentle scroll-linked motion (architecture.md section 7).
   MP.motion.reduced is resolved once at init and updated live when the user
   flips prefers-reduced-motion: idle float is stopped and parallax transforms
   are reset to neutral instead of merely shortened. */

window.MP = window.MP || {};

MP.motion = (function () {
  'use strict';

  var LAYER_SPEEDS = {
    bg: 0.10,
    atmosphere: 0.18,
    decoration: 0.26,
    typography: 0.34,
    portrait: 0.42,
    foreground: 0.5
  };
  /* Total travel at progress extremes; ×0.5 top speed ⇒ ≤32px of screen motion. */
  var MAX_SHIFT = 64;
  var PARALLAX_LAMBDA = 12;
  var TWO_PI = Math.PI * 2;
  var REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
  var SCENE_ATTR = 'data-scene';
  var PARALLAX_ATTR = 'data-parallax';
  var CATEGORY_ATTR = 'data-category-id';
  var NOOP = function () {};

  var api = { reduced: false };

  var initialised = false;
  var floats = [];
  var parallaxStates = null;

  function util() { return (window.MP && MP.util) || null; }

  function number(value, fallback) {
    return (typeof value === 'number' && !isNaN(value)) ? value : fallback;
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  function prefersReduced() {
    var u = util();
    if (u && typeof u.reducedMotion === 'function') { return u.reducedMotion(); }
    try { return window.matchMedia(REDUCED_QUERY).matches; } catch (err) { return false; }
  }

  function isReduced() { return initialised ? api.reduced : prefersReduced(); }

  function layerSpeed(name) {
    if (!name) { return 0; }
    var key = String(name).toLowerCase();
    return Object.prototype.hasOwnProperty.call(LAYER_SPEEDS, key) ? LAYER_SPEEDS[key] : 0;
  }

  function sceneIdOf(el) {
    var name = el.getAttribute(SCENE_ATTR) || '';
    if (name === 'portfolio') {
      var catId = el.getAttribute(CATEGORY_ATTR) || el.id || '';
      return catId ? 'portfolio:' + catId : '';
    }
    return name;
  }

  function localDamp(current, target, lambda, dt) {
    return target + (current - target) * Math.exp(-lambda * dt);
  }

  function init() {
    if (initialised) { return; }
    initialised = true;
    api.reduced = prefersReduced();
    try {
      var mql = window.matchMedia(REDUCED_QUERY);
      var handler = function () { onReducedChange(); };
      if (mql.addEventListener) { mql.addEventListener('change', handler); }
      else if (mql.addListener) { mql.addListener(handler); }
    } catch (err) { /* no matchMedia: motion simply stays enabled */ }
  }

  function onReducedChange() {
    api.reduced = prefersReduced();
    if (api.reduced) {
      stopFloats();
      resetParallax();
    }
  }

  /* ------------------------------------------------------------ idle float */

  function float(el, opts) {
    opts = opts || {};
    if (!el || !el.style || isReduced()) { return NOOP; }
    var u = util();
    if (!u || typeof u.rafLoop !== 'function') { return NOOP; }
    var amp = number(opts.amp, 8);
    var dur = Math.max(0.5, number(opts.dur, 6));
    var delay = number(opts.delay, 0);
    var rot = number(opts.rot, 0);
    var state = { el: el, off: NOOP, active: true };
    var start = 0;
    el.style.willChange = 'transform';
    var offLoop = u.rafLoop(function (dt, time) {
      if (!state.active) { return; }
      if (start === 0) { start = time + delay * 1000; }
      var t = (time - start) / 1000;
      var a = (t / dur) * TWO_PI;
      var x = Math.sin(a) * amp * 0.6;
      var y = Math.cos(a * 0.8) * amp;
      var r = Math.sin(a * 0.6) * rot;
      el.style.transform = 'translate3d(' + round2(x) + 'px,' + round2(y) + 'px,0) rotate(' + round2(r) + 'deg)';
    });
    state.off = function () {
      if (!state.active) { return; }
      state.active = false;
      offLoop();
      el.style.transform = '';
      el.style.willChange = '';
      var index = floats.indexOf(state);
      if (index !== -1) { floats.splice(index, 1); }
    };
    floats.push(state);
    return state.off;
  }

  function stopFloats() {
    var list = floats.slice();
    for (var i = 0; i < list.length; i++) { list[i].off(); }
    floats.length = 0;
  }

  /* -------------------------------------------------------------- parallax */

  function parallax() {
    if (parallaxStates) { return; }
    var u = util();
    if (!u) { return; }
    var nodes = u.qsa('[' + PARALLAX_ATTR + ']');
    parallaxStates = [];
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var scene = (typeof node.closest === 'function') ? node.closest('[' + SCENE_ATTR + ']') : null;
      parallaxStates.push({
        el: node,
        sceneId: scene ? sceneIdOf(scene) : '',
        speed: layerSpeed(node.getAttribute(PARALLAX_ATTR)),
        current: 0,
        last: 0,
        wc: false
      });
    }
    if (window.MP && MP.scroll && typeof MP.scroll.add === 'function') {
      MP.scroll.add(renderParallax);
    }
  }

  /* Targets come from the RAW scene progress; the element transform is then
     interpolated toward that target — the only source of smoothness. */
  function renderParallax(ctx) {
    if (!parallaxStates || !parallaxStates.length || isReduced()) { return; }
    var u = util();
    var dampFn = (u && typeof u.damp === 'function') ? u.damp : localDamp;
    var dt = (ctx && typeof ctx.dt === 'number') ? ctx.dt : 0;
    for (var i = 0; i < parallaxStates.length; i++) {
      var st = parallaxStates[i];
      var p = (st.sceneId && ctx && typeof ctx.progress === 'function')
        ? ctx.progress(st.sceneId) : 0.5;
      var target = (p - 0.5) * 2 * MAX_SHIFT * st.speed;
      st.current = (dt > 0) ? dampFn(st.current, target, PARALLAX_LAMBDA, dt) : target;
      var active = p > 0 && p < 1;
      if (active !== st.wc) { st.el.style.willChange = active ? 'transform' : ''; st.wc = active; }
      if (Math.abs(st.current - st.last) > 0.02) {
        st.el.style.transform = 'translate3d(0,' + round2(st.current) + 'px,0)';
        st.last = st.current;
      }
    }
  }

  function resetParallax() {
    if (!parallaxStates) { return; }
    for (var i = 0; i < parallaxStates.length; i++) {
      var st = parallaxStates[i];
      st.current = 0;
      st.last = 0;
      if (st.wc) { st.el.style.willChange = ''; st.wc = false; }
      st.el.style.transform = '';
    }
  }

  function setVar(el, name, value) {
    if (!el || !el.style || !name) { return; }
    var key = (String(name).indexOf('--') === 0) ? String(name) : '--' + String(name);
    if (typeof el.style.setProperty === 'function') { el.style.setProperty(key, String(value)); }
  }

  api.init = init;
  api.float = float;
  api.parallax = parallax;
  api.setVar = setVar;
  api.layerSpeed = layerSpeed;
  return api;
}());
