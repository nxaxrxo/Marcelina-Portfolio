/* carousel.js — MP.carousel
   Stacked-card media carousel (plan sections 19-21).
   Pointer drag, touch swipe, arrows, dots, 5s autoplay with full timer reset.
   Autoplay pauses on hover / focus-within / pointer-down / document-hidden /
   while a video inside the carousel is playing. Fully keyboard operable.
   Gesture math runs on transforms inside a single rAF batch. destroy() releases
   every listener it added. */
MP.carousel = (function () {
  'use strict';

  var DEFAULT_INTERVAL = 5000;
  var DEFAULT_LABEL = 'Media carousel';
  var DRAG_THRESHOLD_MIN = 40;
  var DRAG_THRESHOLD_RATIO = 0.12;
  var ANCHOR_HOLD = 'hover';
  var ACTIVE_HOLD = 'focus';
  var POINTER_HOLD = 'pointer';
  var HIDDEN_HOLD = 'hidden';
  var VIDEO_HOLD = 'video';
  var OFFSCREEN_HOLD = 'offscreen';
  var RATIO_CLAMP_MIN = 0.45;
  var RATIO_CLAMP_MAX = 2.2;
  var RATIO_DEFAULT = 4 / 3;
  var RATIO_TRANSITION = 320;

  function util() {
    return (window.MP && MP.util) || null;
  }

  function clamp(value, min, max) {
    var u = util();
    if (u && typeof u.clamp === 'function') { return u.clamp(value, min, max); }
    return Math.min(max, Math.max(min, value));
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

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }

  /* Capture-phase listeners must never depend on a wrapper honouring the
     capture flag, so they are attached natively. */
  function listenCapture(target, type, handler) {
    if (!target) { return function () {}; }
    target.addEventListener(type, handler, true);
    return function () { target.removeEventListener(type, handler, true); };
  }

  function wrapIndex(i, count) {
    if (!count) { return 0; }
    return ((i % count) + count) % count;
  }

  function create(root, items, options) {
    if (!root) { return null; }
    options = options || {};
    items = Array.isArray(items) ? items.slice() : [];
    var count = items.length;
    var interval = (typeof options.interval === 'number' && options.interval > 0)
      ? options.interval : DEFAULT_INTERVAL;

    var offs = [];
    var media = [];
    var cards = [];
    var dots = [];
    var index = 0;
    var paused = false;
    var holds = {};
    var videoPlaying = false;
    var timer = null;
    var rafId = 0;
    var suppressClickUntil = 0;
    var observer = null;
    var resizeObserver = null;
    var scrollOff = null;
    var lastWidth = -1;
    var destroyed = false;
    var drag = { active: false, id: null, x: 0, y: 0, dx: 0, moved: false };

    /* ----------------------------------------------------------- DOM build */

    root.classList.add('carousel');
    root.setAttribute('data-carousel', '');
    root.setAttribute('role', 'group');
    root.setAttribute('aria-roledescription', 'carousel');
    root.setAttribute('aria-label', options.ariaLabel || DEFAULT_LABEL);

    var stage = node('div', 'carousel__stage');
    stage.setAttribute('data-carousel-stage', '');
    stage.style.touchAction = 'pan-y';
    stage.style.position = 'relative';

    /* Constant-height slot wrapping the stage. The frame hugs each picture
       inside this reserved height, so advancing the slideshow never rescales
       the page. */
    var viewport = node('div', 'carousel__viewport');
    var ratios = {};

    var track = node('div', 'carousel__track');
    /* The track is a semantic grouping only; display:contents keeps the
       absolutely-positioned cards resolving against the stage. */
    track.style.display = 'contents';

    var controls = node('div', 'carousel__controls');
    var prevBtn = node('button', 'carousel__btn carousel__btn--prev', '\u2039');
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous image');
    var nextBtn = node('button', 'carousel__btn carousel__btn--next', '\u203A');
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next image');

    var dotsBox = node('div', 'carousel__dots');
    dotsBox.setAttribute('role', 'group');
    dotsBox.setAttribute('aria-label', 'Choose image');

    var counter = node('p', 'carousel__counter');
    counter.setAttribute('aria-live', 'polite');

    function buildCard(i) {
      var card = node('article', 'carousel__card');
      card.setAttribute('data-carousel-card', '');
      card.setAttribute('data-index', String(i));
      card.setAttribute('aria-roledescription', 'slide');
      card.setAttribute('aria-label', (i + 1) + ' of ' + count);
      card.style.position = 'absolute';
      card.style.top = '0';
      card.style.left = '0';
      card.style.width = '100%';
      card.style.height = '100%';
      var made = null;
      if (window.MP && MP.media && typeof MP.media.create === 'function') {
        made = MP.media.create(items[i], {
          project: options.project,
          category: options.category,
          items: items,
          index: i,
          onOpen: options.onOpen,
          lazy: i !== 0
        });
      } else {
        made = { el: node('div', 'media__frame'), type: 'placeholder', destroy: function () {} };
      }
      if (made && made.el) {
        made.el.style.width = '100%';
        made.el.style.height = '100%';
        made.el.style.display = 'block';
        card.appendChild(made.el);
      }
      if (made) { media.push(made); }
      /* When the active slide's picture finishes loading its real dimensions
         are known, so re-fit the stage to the image's natural aspect shape. */
      var probe = card.querySelector('.media__img, .media__poster');
      if (probe) {
        offs.push(listen(probe, 'load', function () {
          if (destroyed) { return; }
          if (probe.naturalWidth && probe.naturalHeight) {
            ratios[i] = probe.naturalWidth / probe.naturalHeight;
          }
          updateSlot();
          if (cards[index] === card) { applyAspect(); }
        }));
      }
      track.appendChild(card);
      cards.push(card);
    }

    function buildDot(i) {
      var dot = node('button', 'carousel__dot');
      dot.type = 'button';
      dot.setAttribute('data-carousel-dot', String(i));
      dot.setAttribute('aria-label', 'Show image ' + (i + 1) + ' of ' + count);
      offs.push(listen(dot, 'click', function () { go(i, true); }));
      dots.push(dot);
      dotsBox.appendChild(dot);
    }

    var i;
    for (i = 0; i < count; i++) {
      buildCard(i);
      buildDot(i);
    }

    controls.appendChild(prevBtn);
    controls.appendChild(dotsBox);
    controls.appendChild(nextBtn);
    stage.appendChild(track);
    viewport.appendChild(stage);
    root.appendChild(viewport);
    root.appendChild(controls);
    root.appendChild(counter);

    if (count <= 1) {
      controls.setAttribute('hidden', '');
      counter.setAttribute('hidden', '');
    }

    /* --------------------------------------------------------- rendering */

    function setInert(card, on) {
      if (on) {
        card.setAttribute('aria-hidden', 'true');
        card.setAttribute('inert', '');
        var nodes = card.querySelectorAll('button, a[href], [tabindex]');
        for (var n = 0; n < nodes.length; n++) { nodes[n].setAttribute('tabindex', '-1'); }
      } else {
        card.removeAttribute('aria-hidden');
        card.removeAttribute('inert');
        var restored = card.querySelectorAll('[tabindex="-1"]');
        for (var r = 0; r < restored.length; r++) { restored[r].removeAttribute('tabindex'); }
      }
    }

    function draw() {
      rafId = 0;
      if (destroyed || !count) { return; }
      var width = stage.clientWidth || 1;
      var dragPercent = (drag.active && drag.dx) ? (drag.dx / width) * 100 : 0;
      for (var c = 0; c < cards.length; c++) {
        var d = c - index;
        if (d > count / 2) { d -= count; }
        if (d < -count / 2) { d += count; }
        var abs = Math.abs(d);
        var x = d * 7 + dragPercent;
        var y = abs * 9;
        var rot = d * 2.4;
        var scale = Math.max(0.6, 0.95 - abs * 0.1);
        var opacity = abs > 2 ? 0 : Math.max(0, 1 - abs * 0.14);
        var card = cards[c];
        card.style.transform =
          'translate3d(' + x.toFixed(3) + '%,' + y.toFixed(3) + '%,0) rotate(' +
          rot.toFixed(3) + 'deg) scale(' + scale.toFixed(3) + ')';
        card.style.zIndex = String(100 - abs);
        card.style.opacity = String(opacity);
        card.classList.toggle('is-active', d === 0);
        card.classList.toggle('is-prev', d === -1);
        card.classList.toggle('is-next', d === 1);
        setInert(card, d !== 0);
      }
    }

    function scheduleDraw() {
      if (destroyed || rafId) { return; }
      rafId = window.requestAnimationFrame(draw);
    }

    function updateUi() {
      counter.textContent = count ? ((index + 1) + ' / ' + count) : '';
      for (var c = 0; c < dots.length; c++) {
        var on = c === index;
        dots[c].classList.toggle('is-active', on);
        dots[c].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }

    /* Size the stage to the active slide's natural picture ratio so the frame
       changes shape (portrait, landscape, square) to exactly match each image.
       object-fit:contain in the CSS shows the whole picture with no crop and no
       overflow; a smooth height transition makes the shape change animate. */
    function naturalRatio(card) {
      var img = card && card.querySelector('.media__img, .media__poster');
      if (img && img.naturalWidth && img.naturalHeight) {
        return img.naturalWidth / img.naturalHeight;
      }
      return 0;
    }

    /* The stage is a bounded frame that HUGS the active image: it is fitted
       inside the available column width and a viewport-height cap, keeping the
       image's own aspect ratio exactly. Because the frame ratio matches the
       picture there is never any background (the old pink letterbox) showing,
       and because it is fitted inside a cap a huge picture can never balloon
       the page. A smooth width/height transition makes the shape change. */
    function fittedSize(ratio) {
      var availW = root.clientWidth || 1;
      var capH = Math.max(260, Math.min(window.innerHeight * 0.8, 900));
      var w = availW;
      var h = w / ratio;
      if (h > capH) { h = capH; w = h * ratio; }
      return { w: w, h: h };
    }

    /* The slot is the tallest fitted picture, so the controls beneath it and
       the rest of the page never move when the active slide changes. */
    function updateSlot() {
      if (!viewport) { return; }
      var maxH = 0;
      for (var key in ratios) {
        if (!Object.prototype.hasOwnProperty.call(ratios, key)) { continue; }
        var rt = ratios[key];
        if (rt > RATIO_CLAMP_MIN && rt < RATIO_CLAMP_MAX) {
          var hh = fittedSize(rt).h;
          if (hh > maxH) { maxH = hh; }
        }
      }
      viewport.style.height = maxH > 0 ? (maxH.toFixed(1) + 'px') : '';
    }

    function applyAspect() {
      if (destroyed || !count) { return; }
      var ratio = naturalRatio(cards[index]);
      stage.style.transition = 'width ' + RATIO_TRANSITION + 'ms var(--ease-out), height ' + RATIO_TRANSITION + 'ms var(--ease-out)';
      if (!(ratio > RATIO_CLAMP_MIN && ratio < RATIO_CLAMP_MAX)) {
        stage.style.width = '';
        stage.style.height = '';
        return;
      }
      ratios[index] = ratio;
      var fit = fittedSize(ratio);
      stage.style.width = fit.w.toFixed(1) + 'px';
      stage.style.height = fit.h.toFixed(1) + 'px';
      stage.style.aspectRatio = '';
      updateSlot();
    }

    /* Measure every slide up front (local files, so instant) so the slot is
       settled before the first advance and can never jump. */
    function preload() {
      for (var p = 0; p < items.length; p++) {
        (function (idx) {
          var it = items[idx];
          if (!it || !it.src) { return; }
          if (it.type && it.type !== 'image' && it.type !== 'placeholder') { return; }
          var probeImg = new Image();
          probeImg.onload = function () {
            if (destroyed) { return; }
            if (probeImg.naturalWidth && probeImg.naturalHeight) {
              ratios[idx] = probeImg.naturalWidth / probeImg.naturalHeight;
              updateSlot();
              applyAspect();
            }
          };
          probeImg.src = it.src;
        })(p);
      }
    }

    function render() {
      scheduleDraw();
      updateUi();
      applyAspect();
    }

    /* ------------------------------------------------------ autoplay timer */

    function isHeld() {
      for (var key in holds) {
        if (Object.prototype.hasOwnProperty.call(holds, key) && holds[key]) { return true; }
      }
      return false;
    }

    function eligible() {
      if (destroyed || paused || videoPlaying || count <= 1) { return false; }
      if (document.hidden) { return false; }
      /* The slideshow always self-advances - reduced-motion preferences do not
         stop it, and hover/focus never freeze it. Only an active drag (or a
         real hold like a playing video) pauses it. */
      return !fingerHold();
    }
    function fingerHold() {
      for (var key in holds) {
        if (Object.prototype.hasOwnProperty.call(holds, key) && holds[key] && key !== 'hover' && key !== 'focus') { return true; }
      }
      return false;
    }

    function clearTimer() {
      if (timer) { window.clearTimeout(timer); timer = null; }
    }

    function schedule() {
      clearTimer();
      if (!eligible()) { return; }
      timer = window.setTimeout(function () {
        timer = null;
        go(index + 1);
        schedule();
      }, interval);
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

    /* --------------------------------------------------------- public moves */

    function go(target, reset) {
      if (destroyed || !count) { return; }
      index = wrapIndex(target, count);
      render();
      if (reset !== false) { schedule(); }
    }

    function next() { go(index + 1); }
    function prev() { go(index - 1); }

    function pause() { paused = true; clearTimer(); }
    function resume() { paused = false; schedule(); }

    /* --------------------------------------------------------- interaction */

    function onPointerDown(ev) {
      if (destroyed || count <= 1) { return; }
      if (ev.pointerType === 'mouse' && ev.button !== 0) { return; }
      drag.active = true;
      drag.id = ev.pointerId;
      drag.x = ev.clientX;
      drag.y = ev.clientY;
      drag.dx = 0;
      drag.moved = false;
      hold(POINTER_HOLD);
      stage.classList.add('is-dragging');
    }

    function onPointerMove(ev) {
      if (!drag.active || ev.pointerId !== drag.id) { return; }
      /* If the button was released outside the stage the card would otherwise
         keep following the cursor ("stuck to the mouse"); a move with no
         buttons held always ends the gesture. */
      if (ev.pointerType === 'mouse' && ev.buttons === 0) { endDrag(); return; }
      drag.dx = ev.clientX - drag.x;
      if (Math.abs(drag.dx) > 6 || Math.abs(ev.clientY - drag.y) > 6) { drag.moved = true; }
      scheduleDraw();
    }

    function endDrag() {
      if (!drag.active) { return; }
      var dx = drag.dx;
      var width = stage.clientWidth || 1;
      var threshold = Math.max(DRAG_THRESHOLD_MIN, width * DRAG_THRESHOLD_RATIO);
      var moved = drag.moved;
      drag.active = false;
      drag.id = null;
      drag.dx = 0;
      stage.classList.remove('is-dragging');
      if (moved) { suppressClickUntil = Date.now() + 350; }
      if (Math.abs(dx) > threshold) {
        if (dx < 0) { next(); } else { prev(); }
      } else {
        scheduleDraw();
        schedule();
      }
      release(POINTER_HOLD);
    }

    function onPointerUp(ev) {
      if (!drag.active) { return; }
      if (drag.id !== null && ev.pointerId !== drag.id) { return; }
      endDrag();
    }

    function onClickCapture(ev) {
      if (Date.now() < suppressClickUntil) {
        ev.preventDefault();
        ev.stopPropagation();
        suppressClickUntil = 0;
      }
    }

    function onKeydown(ev) {
      if (destroyed) { return; }
      var key = ev.key;
      if (key === 'ArrowLeft') { ev.preventDefault(); prev(); }
      else if (key === 'ArrowRight') { ev.preventDefault(); next(); }
      else if (key === 'Home') { ev.preventDefault(); go(0); }
      else if (key === 'End') { ev.preventDefault(); go(count - 1); }
    }

    /* Layout change without a window resize listener: ResizeObserver on the
       stage when available, otherwise re-measure the stage width once per
       engine frame and redraw only when it actually changed. */
    function remeasure() {
      if (destroyed) { return; }
      var width = root.clientWidth || 0;
      if (width === lastWidth) { return; }
      lastWidth = width;
      applyAspect();
      scheduleDraw();
    }

    function onVisibility() {
      if (document.hidden) { hold(HIDDEN_HOLD); } else { release(HIDDEN_HOLD); }
    }

    offs.push(listen(prevBtn, 'click', function () { prev(); }));
    offs.push(listen(nextBtn, 'click', function () { next(); }));
    offs.push(listen(stage, 'pointerdown', onPointerDown));
    offs.push(listen(stage, 'pointermove', onPointerMove));
    offs.push(listen(stage, 'pointerup', onPointerUp));
    offs.push(listen(stage, 'pointercancel', onPointerUp));
    offs.push(listen(window, 'pointerup', onPointerUp));
    offs.push(listen(window, 'pointercancel', onPointerUp));
    offs.push(listenCapture(root, 'click', onClickCapture));
    offs.push(listen(root, 'keydown', onKeydown));
    offs.push(listen(root, 'pointerenter', function (ev) {
      if (ev.pointerType === 'mouse') { hold(ANCHOR_HOLD); }
    }));
    offs.push(listen(root, 'pointerleave', function (ev) {
      if (ev.pointerType === 'mouse') { release(ANCHOR_HOLD); }
    }));
    offs.push(listen(root, 'focusin', function () { hold(ACTIVE_HOLD); }));
    offs.push(listen(root, 'focusout', function (ev) {
      if (!root.contains(ev.relatedTarget)) { release(ACTIVE_HOLD); }
    }));
    offs.push(listen(document, 'visibilitychange', onVisibility));
    offs.push(listen(window, 'resize', function () { applyAspect(); }));

    if (typeof window.ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(function () { remeasure(); });
      resizeObserver.observe(stage);
    } else if (window.MP && MP.scroll && typeof MP.scroll.add === 'function') {
      scrollOff = MP.scroll.add(function () { remeasure(); });
    }

    offs.push(listenCapture(root, 'play', function () { videoPlaying = true; hold(VIDEO_HOLD); }));
    offs.push(listenCapture(root, 'pause', function () { videoPlaying = false; release(VIDEO_HOLD); }));
    offs.push(listenCapture(root, 'ended', function () { videoPlaying = false; release(VIDEO_HOLD); }));

    if (typeof window.IntersectionObserver === 'function') {
      observer = new IntersectionObserver(function (entries) {
        for (var e = 0; e < entries.length; e++) {
          if (entries[e].isIntersecting) { release(OFFSCREEN_HOLD); }
          else { hold(OFFSCREEN_HOLD); }
        }
      }, { threshold: 0 });
      observer.observe(root);
    }

    if (document.hidden) { hold(HIDDEN_HOLD); }

    preload();
    render();
    schedule();

    /* ------------------------------------------------------------- destroy */

    function destroy() {
      if (destroyed) { return; }
      destroyed = true;
      clearTimer();
      if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
      if (observer) { observer.disconnect(); observer = null; }
      if (resizeObserver) { resizeObserver.disconnect(); resizeObserver = null; }
      if (typeof scrollOff === 'function') { scrollOff(); scrollOff = null; }
      for (var o = 0; o < offs.length; o++) {
        try { offs[o](); } catch (err) { /* ignore */ }
      }
      offs.length = 0;
      for (var m = 0; m < media.length; m++) {
        try { media[m].destroy(); } catch (err) { /* ignore */ }
      }
      media.length = 0;
      if (viewport && viewport.parentNode) { viewport.parentNode.removeChild(viewport); }
      if (controls.parentNode) { controls.parentNode.removeChild(controls); }
      if (counter.parentNode) { counter.parentNode.removeChild(counter); }
      root.classList.remove('carousel');
      root.removeAttribute('data-carousel');
      root.removeAttribute('role');
      root.removeAttribute('aria-roledescription');
      root.removeAttribute('aria-label');
    }

    var api = {
      go: go,
      next: next,
      prev: prev,
      pause: pause,
      resume: resume,
      destroy: destroy,
      el: root,
      count: count
    };
    Object.defineProperty(api, 'index', {
      enumerable: true,
      get: function () { return index; }
    });
    return api;
  }

  return { create: create };
}());



