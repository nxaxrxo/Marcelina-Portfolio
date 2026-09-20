/* autoplay.js — MP.autoplay
   Automatic portfolio progression, one project every 30s (plan section 22).
   Manual control always wins: any pointer, key, hover, focus, scroll or playing
   video holds the timer. Releasing a hold resets the FULL interval (never fires
   immediately). Stops entirely under prefers-reduced-motion, while a video is
   playing and while the tab is hidden. destroy() removes every listener. */
MP.autoplay = (function () {
  'use strict';

  var INTERVAL = 30000;
  var SCROLL_IDLE = 180;
  var INTERACTIVE_SELECTOR =
    'a[href], button, input, select, textarea, video, audio, iframe, ' +
    '[role="button"], [contenteditable="true"], [data-carousel], [data-lightbox]';

  var holds = {};
  var offs = [];
  var timer = null;
  var scrollTimer = null;
  var scrollOff = null;
  var lastY = null;
  var lastYReady = false;
  var videoPlaying = false;
  var lastKey = null;
  var initialised = false;
  var destroyed = false;

  function util() {
    return (window.MP && MP.util) || null;
  }

  function reduced() {
    var u = util();
    return !!(u && typeof u.reducedMotion === 'function' && u.reducedMotion());
  }

  function listen(target, type, handler, opts) {
    if (!target) { return function () {}; }
    var u = util();
    if (u && typeof u.on === 'function') { return u.on(target, type, handler, opts); }
    target.addEventListener(type, handler, opts);
    return function () { target.removeEventListener(type, handler, opts); };
  }

  function isHeld() {
    for (var key in holds) {
      if (Object.prototype.hasOwnProperty.call(holds, key) && holds[key]) { return true; }
    }
    return false;
  }

  /* Media events (play/pause/ended) do not bubble - they are caught in the
     capture phase, attached natively so the flag is guaranteed. */
  function listenCapture(target, type, handler) {
    if (!target) { return function () {}; }
    target.addEventListener(type, handler, true);
    return function () { target.removeEventListener(type, handler, true); };
  }

  function clearTimer() {
    if (timer) { window.clearTimeout(timer); timer = null; }
  }

  function activeCategory() {
    if (!window.MP || !MP.portfolio) { return null; }
    var active = MP.portfolio.active;
    if (!active || !active.categoryId) { return null; }
    if (window.MP.scroll && typeof MP.scroll.current === 'function') {
      var current = MP.scroll.current();
      if (current && current.indexOf('portfolio:') === 0 && current !== 'portfolio:' + active.categoryId) {
        return null;
      }
    }
    return active.categoryId;
  }

  function canRun() {
    if (destroyed) { return false; }
    if (isHeld() || videoPlaying) { return false; }
    if (document.hidden) { return false; }
    if (reduced()) { return false; }
    return !!activeCategory();
  }

  function schedule() {
    clearTimer();
    if (!canRun()) { return; }
    timer = window.setTimeout(fire, INTERVAL);
  }

  function fire() {
    timer = null;
    if (canRun()) {
      var categoryId = activeCategory();
      if (categoryId) { advance(categoryId); }
    }
    schedule();
  }

  function hold(reason) {
    if (!reason || holds[reason]) { return; }
    holds[reason] = true;
    clearTimer();
  }

  function release(reason) {
    if (!reason || !holds[reason]) { return; }
    holds[reason] = false;
    schedule();
  }

  function advance(categoryId) {
    if (!window.MP || !MP.portfolio || typeof MP.portfolio.goTo !== 'function') { return; }
    if (!MP.data || typeof MP.data.category !== 'function') { return; }
    var category = MP.data.category(categoryId);
    if (!category || !category.projects || category.projects.length < 2) { return; }
    var count = category.projects.length;
    var active = MP.portfolio.active;
    var currentIndex = (active && active.categoryId === categoryId && typeof active.index === 'number')
      ? active.index : 0;
    MP.portfolio.goTo(categoryId, (currentIndex + 1) % count);
  }

  function isInteractive(target) {
    if (!target || target.nodeType !== 1) { return false; }
    return !!target.closest(INTERACTIVE_SELECTOR);
  }

  function watch() {
    var key = activeCategory() || '';
    if (key !== lastKey) {
      lastKey = key;
      schedule();
    }
  }

  /* Manual-scroll detection without a native scroll listener: derive movement
     from the engine's mirrored y each frame. Any change holds autoplay, and the
     hold is released only after SCROLL_IDLE ms without further movement. */
  function watchScroll() {
    var y = (typeof MP.scroll.y === 'number') ? MP.scroll.y : 0;
    if (!lastYReady) { lastYReady = true; lastY = y; return; }
    if (y === lastY) { return; }
    lastY = y;
    hold('scroll');
    if (scrollTimer) { window.clearTimeout(scrollTimer); }
    scrollTimer = window.setTimeout(function () {
      scrollTimer = null;
      release('scroll');
    }, SCROLL_IDLE);
  }

  function init() {
    if (initialised) { return; }
    initialised = true;
    destroyed = false;

    offs.push(listen(document, 'pointerdown', function () { hold('pointer'); }));
    offs.push(listen(document, 'pointerup', function () { release('pointer'); }));
    offs.push(listen(document, 'pointercancel', function () { release('pointer'); }));
    offs.push(listen(document, 'keydown', function (ev) {
      if (ev.key === 'Tab') { return; }
      hold('key');
    }));
    offs.push(listen(document, 'keyup', function () { release('key'); }));

    offs.push(listen(document, 'focusin', function (ev) {
      if (isInteractive(ev.target)) { hold('focus'); }
    }));
    offs.push(listen(document, 'focusout', function () { release('focus'); }));

    offs.push(listen(document, 'mouseover', function (ev) {
      if (isInteractive(ev.target)) { hold('hover'); }
    }));
    offs.push(listen(document, 'mouseout', function (ev) {
      if (!isInteractive(ev.relatedTarget)) { release('hover'); }
    }));

    offs.push(listenCapture(document, 'play', function () { videoPlaying = true; hold('video'); }));
    offs.push(listenCapture(document, 'pause', function () { videoPlaying = false; release('video'); }));
    offs.push(listenCapture(document, 'ended', function () { videoPlaying = false; release('video'); }));

    offs.push(listen(document, 'visibilitychange', function () {
      if (document.hidden) { hold('hidden'); } else { release('hidden'); }
    }));

    offs.push(listen(window, 'blur', function () {
      release('key');
      release('pointer');
      release('focus');
      release('hover');
    }));

    if (window.MP && MP.scroll && typeof MP.scroll.add === 'function') {
      scrollOff = MP.scroll.add(function () { watch(); watchScroll(); });
    }

    if (document.hidden) { hold('hidden'); }
    schedule();
  }

  function destroy() {
    destroyed = true;
    clearTimer();
    if (scrollTimer) { window.clearTimeout(scrollTimer); scrollTimer = null; }
    if (typeof scrollOff === 'function') { scrollOff(); scrollOff = null; }
    for (var i = 0; i < offs.length; i++) {
      try { offs[i](); } catch (err) { /* ignore */ }
    }
    offs.length = 0;
    holds = {};
    videoPlaying = false;
    lastKey = null;
    lastY = null;
    lastYReady = false;
    initialised = false;
  }

  return {
    init: init,
    advance: advance,
    hold: hold,
    release: release,
    isHeld: isHeld,
    destroy: destroy
  };
}());
