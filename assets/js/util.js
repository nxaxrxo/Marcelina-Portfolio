/* util.js — MP.util
   Shared primitives for the Marcelina Miani portfolio (architecture.md section 7).
   Classic script, ES5 only (file:// safe). Every helper is defensive: a missing
   target/root returns null/[]/no-op and never throws, so the page still boots
   when a DOM hook is absent. This file also owns the ONE shared rAF scheduler
   used by the whole site — one rAF loop, many subscribers. */

window.MP = window.MP || {};

MP.util = (function () {
  'use strict';

  /* ------------------------------------------------------------- constants */

  var IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg)(?:[?#].*)?$/i;
  var VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i;
  var YOUTUBE_HOST = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i;
  var YOUTUBE_ID = /(?:[?&]v=|\/shorts\/|\/embed\/|\/live\/|\/v\/|youtu\.be\/)([\w-]{6,})/;
  var EMBED_BASE = 'https://www.youtube-nocookie.com/embed/';
  var NOOP = function () {};

  /* ------------------------------------------------------------- selectors */

  function qs(sel, root) {
    var scope = root || document;
    if (!scope || typeof scope.querySelector !== 'function') { return null; }
    try { return scope.querySelector(sel); } catch (err) { return null; }
  }

  function qsa(sel, root) {
    var scope = root || document;
    if (!scope || typeof scope.querySelectorAll !== 'function') { return []; }
    try { return Array.prototype.slice.call(scope.querySelectorAll(sel)); }
    catch (err) { return []; }
  }

  /* ------------------------------------------------------------ node build */

  function applyAttrs(node, attrs) {
    if (!attrs) { return; }
    for (var key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) { continue; }
      var value = attrs[key];
      if (value === null || value === undefined || value === false) { continue; }
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }

  function applyStyle(node, style) {
    if (!style) { return; }
    if (typeof style === 'string') { node.style.cssText += style; return; }
    for (var key in style) {
      if (!Object.prototype.hasOwnProperty.call(style, key)) { continue; }
      var value = style[key];
      if (value === null || value === undefined) { continue; }
      /* custom properties (--island-x …) must use setProperty, not camelCase */
      if (key.indexOf('--') === 0) { node.style.setProperty(key, String(value)); }
      else { node.style[key] = value; }
    }
  }

  function applyData(node, data) {
    if (!data) { return; }
    for (var key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) { continue; }
      var value = data[key];
      if (value === null || value === undefined) { continue; }
      var attr = 'data-' + key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      node.setAttribute(attr, String(value));
    }
  }

  function applyEvents(node, handlers) {
    if (!handlers) { return; }
    for (var type in handlers) {
      if (!Object.prototype.hasOwnProperty.call(handlers, type)) { continue; }
      var list = Array.isArray(handlers[type]) ? handlers[type] : [handlers[type]];
      for (var i = 0; i < list.length; i++) {
        if (typeof list[i] === 'function') { node.addEventListener(type, list[i]); }
      }
    }
  }

  function appendChildren(node, children) {
    if (!children || !children.length) { return; }
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child === null || child === undefined || child === false) { continue; }
      node.appendChild(child && child.nodeType ? child : document.createTextNode(String(child)));
    }
  }

  function el(tag, opts, children) {
    var node = document.createElement(tag || 'div');
    opts = opts || {};
    if (opts.class) { node.className = String(opts.class); }
    if (opts.text !== undefined && opts.text !== null) { node.textContent = String(opts.text); }
    if (opts.html !== undefined && opts.html !== null) { node.innerHTML = String(opts.html); }
    applyAttrs(node, opts.attrs);
    applyStyle(node, opts.style);
    applyData(node, opts.data);
    applyEvents(node, opts.on);
    appendChildren(node, children || []);
    return node;
  }

  /* ---------------------------------------------------------------- events */

  function on(target, type, handler, opts) {
    if (!target || !type || typeof handler !== 'function') { return NOOP; }
    if (typeof target.addEventListener !== 'function') { return NOOP; }
    target.addEventListener(type, handler, opts);
    return function off() { target.removeEventListener(type, handler, opts); };
  }

  function onDelegated(root, selector, type, handler) {
    if (!root || !selector || typeof handler !== 'function') { return NOOP; }
    return on(root, type, function (ev) {
      var target = ev.target;
      if (!target || typeof target.closest !== 'function') { return; }
      var match = target.closest(selector);
      if (!match || !root.contains(match)) { return; }
      /* delegateTarget lets a handler read the matched node without binding `this` */
      ev.delegateTarget = match;
      handler.call(match, ev);
    });
  }

  /* ----------------------------------------------------------------- maths */

  function clamp(v, min, max) {
    var lo = (typeof min === 'number') ? min : 0;
    var hi = (typeof max === 'number') ? max : 1;
    if (lo > hi) { var swap = lo; lo = hi; hi = swap; }
    if (typeof v !== 'number' || isNaN(v)) { return lo; }
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function lerp(a, b, t) {
    return a + (b - a) * (typeof t === 'number' ? t : 0);
  }

  function mapRange(v, inMin, inMax, outMin, outMax) {
    var from0 = (typeof outMin === 'number') ? outMin : 0;
    var from1 = (typeof outMax === 'number') ? outMax : 1;
    var span = inMax - inMin;
    var t = (span === 0) ? 0 : (v - inMin) / span;
    return from0 + clamp(t, 0, 1) * (from1 - from0);
  }

  /* Frame-rate independent damping; lambda = stiffness, dt = seconds. */
  function damp(current, target, lambda, dt) {
    var l = (typeof lambda === 'number' && lambda > 0) ? lambda : 0.1;
    var step = (typeof dt === 'number' && dt > 0) ? dt : 0;
    return target + (current - target) * Math.exp(-l * step);
  }

  function easeOutCubic(t) {
    var f = 1 - clamp(t, 0, 1);
    return 1 - f * f * f;
  }

  function easeInOutCubic(t) {
    var x = clamp(t, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function naturalSort(a, b) {
    var ax = String(a === null || a === undefined ? '' : a).match(/(\d+|\D+)/g) || [];
    var bx = String(b === null || b === undefined ? '' : b).match(/(\d+|\D+)/g) || [];
    var len = Math.min(ax.length, bx.length);
    for (var i = 0; i < len; i++) {
      var as = ax[i];
      var bs = bx[i];
      if (/\d/.test(as) && /\d/.test(bs)) {
        var an = parseInt(as, 10);
        var bn = parseInt(bs, 10);
        if (an !== bn) { return an - bn; }
      } else if (as !== bs) {
        return as < bs ? -1 : 1;
      }
    }
    return ax.length - bx.length;
  }

  /* ---------------------------------------------------------------- timing */

  function debounce(fn, ms) {
    var timer = null;
    var wait = (typeof ms === 'number') ? ms : 0;
    function wrapped() {
      var ctx = this;
      var args = arguments;
      if (timer) { window.clearTimeout(timer); }
      timer = window.setTimeout(function () {
        timer = null;
        fn.apply(ctx, args);
      }, wait);
    }
    wrapped.cancel = function () {
      if (timer) { window.clearTimeout(timer); timer = null; }
    };
    return wrapped;
  }

  function throttle(fn, ms) {
    var last = 0;
    var timer = null;
    var wait = (typeof ms === 'number') ? ms : 0;
    function wrapped() {
      var ctx = this;
      var args = arguments;
      var now = Date.now();
      var remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        if (timer) { window.clearTimeout(timer); timer = null; }
        fn.apply(ctx, args);
      } else if (!timer) {
        timer = window.setTimeout(function () {
          timer = null;
          last = Date.now();
          fn.apply(ctx, args);
        }, remaining);
      }
    }
    wrapped.cancel = function () {
      if (timer) { window.clearTimeout(timer); timer = null; }
    };
    return wrapped;
  }

  /* ------------------------------------------------- one shared rAF driver */
  /* All subscribers share a single requestAnimationFrame, so the page never
     runs competing loops. dt is seconds, time is the rAF timestamp (ms).
     The loop sleeps as soon as its last subscriber unsubscribes. */

  var loopSubs = [];
  var loopHandle = null;
  var loopLast = 0;

  function loopTick(time) {
    loopHandle = null;
    var dt = loopLast ? (time - loopLast) / 1000 : 0;
    if (dt > 0.1) { dt = 0.1; } /* cap after tab stalls so damping never jumps */
    loopLast = time;
    var list = loopSubs.slice();
    for (var i = 0; i < list.length; i++) {
      try { list[i](dt, time); } catch (err) { /* a bad subscriber must not kill the loop */ }
    }
    if (loopSubs.length) { scheduleLoop(); }
  }

  function scheduleLoop() {
    if (loopHandle === null) {
      loopHandle = window.requestAnimationFrame(loopTick);
    }
  }

  function rafLoop(cb) {
    if (typeof cb !== 'function') { return NOOP; }
    if (typeof window.requestAnimationFrame !== 'function') { return NOOP; }
    loopSubs.push(cb);
    loopLast = 0;
    scheduleLoop();
    var active = true;
    return function off() {
      if (!active) { return; }
      active = false;
      var index = loopSubs.indexOf(cb);
      if (index !== -1) { loopSubs.splice(index, 1); }
      if (!loopSubs.length && loopHandle !== null) {
        window.cancelAnimationFrame(loopHandle);
        loopHandle = null;
      }
    };
  }

  /* ---------------------------------------------------------- environment */

  function isTouch() {
    try {
      if (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
        return true;
      }
    } catch (err) { /* matchMedia unavailable */ }
    if ('ontouchstart' in window) { return true; }
    return (navigator.maxTouchPoints || navigator.msMaxTouchPoints || 0) > 0;
  }

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (err) { return false; }
  }

  /* ---------------------------------------------------------------- string */

  function urlToId(str) {
    return String(str === null || str === undefined ? '' : str)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* Extension matchers. IMAGE_EXT/VIDEO_EXT are RegExps; imageExt/videoExt are
     predicates that also expose .test so either calling convention works. */
  function imageExt(path) { return IMAGE_EXT.test(String(path === null || path === undefined ? '' : path)); }
  function videoExt(path) { return VIDEO_EXT.test(String(path === null || path === undefined ? '' : path)); }
  imageExt.test = imageExt;
  videoExt.test = videoExt;

  function embedUrl(src) {
    if (!src) { return null; }
    var raw = String(src);
    if (!YOUTUBE_HOST.test(raw)) { return null; }
    var match = YOUTUBE_ID.exec(raw);
    if (!match || !match[1]) { return null; }
    return EMBED_BASE + match[1];
  }

  /* ------------------------------------------------------------ public API */

  return {
    qs: qs,
    qsa: qsa,
    el: el,
    on: on,
    onDelegated: onDelegated,
    clamp: clamp,
    lerp: lerp,
    mapRange: mapRange,
    damp: damp,
    easeOutCubic: easeOutCubic,
    easeInOutCubic: easeInOutCubic,
    naturalSort: naturalSort,
    debounce: debounce,
    throttle: throttle,
    rafLoop: rafLoop,
    isTouch: isTouch,
    reducedMotion: reducedMotion,
    urlToId: urlToId,
    imageExt: imageExt,
    videoExt: videoExt,
    IMAGE_EXT: IMAGE_EXT,
    VIDEO_EXT: VIDEO_EXT,
    embedUrl: embedUrl
  };
}());
