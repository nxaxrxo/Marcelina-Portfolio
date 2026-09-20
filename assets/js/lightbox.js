/* lightbox.js â€” MP.lightbox
   Accessible fullscreen viewer (plan section 23).
   role=dialog + aria-modal, focus trap, focus restored to opener, body scroll
   lock, Escape to close, arrow keys to browse, wheel / button / double-tap zoom,
   drag to pan, swipe to navigate, reset-to-fit. Zoom and pan are bounded so the
   image can never leave the screen. Works with mouse and touch.
   Gesture math runs on transforms inside a single rAF batch. */
MP.lightbox = (function () {
  'use strict';

  var MIN_SCALE = 1;
  var MAX_SCALE = 4;
  var ZOOM_STEP = 1.15;
  var DOUBLE_TAP_MS = 300;
  var SWIPE_MIN = 50;
  var DOUBLE_CLICK_SCALE = 2.5;

  var root = null;
  var stage = null;
  var img = null;
  var btnPrev = null;
  var btnNext = null;
  var btnZoom = null;
  var btnClose = null;
  var counter = null;
  var extras = null;

  var offs = [];
  var items = [];
  var index = 0;
  var opened = false;
  var initialised = false;
  var opener = null;

  var scale = 1;
  var tx = 0;
  var ty = 0;
  var rafId = 0;
  var pendingAnimate = false;

  var drag = null;
  var pointers = {};
  var pinch = null;
  var lastTap = { time: 0, x: 0, y: 0 };

  var prevBodyOverflow = '';
  var prevHtmlOverflow = '';

  /* ---------------------------------------------------------------- utils */

  function util() {
    return (window.MP && MP.util) || null;
  }

  function qs(selector, from) {
    var u = util();
    if (u && typeof u.qs === 'function') { return u.qs(selector, from || document); }
    return (from || document).querySelector(selector);
  }

  function clamp(value, min, max) {
    var u = util();
    if (u && typeof u.clamp === 'function') { return u.clamp(value, min, max); }
    return Math.min(max, Math.max(min, value));
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

  function placeholderPath() {
    if (window.MP && MP.data && MP.data.PLACEHOLDER) { return MP.data.PLACEHOLDER; }
    return 'assets/img/_placeholder.svg';
  }

  function resolve(path) {
    if (!path) { return ''; }
    if (window.MP && MP.data && typeof MP.data.resolveSrc === 'function') {
      try { return MP.data.resolveSrc(path); } catch (err) { /* fall through */ }
    }
    return path;
  }

  function toNoCookie(url) {
    if (!url) { return url; }
    return String(url)
      .replace('://www.youtube.com/embed/', '://www.youtube-nocookie.com/embed/')
      .replace('://youtube.com/embed/', '://www.youtube-nocookie.com/embed/');
  }

  function embedFor(src) {
    var u = util();
    if (!src) { return null; }
    if (u && typeof u.embedUrl === 'function') {
      var made = u.embedUrl(src);
      if (made) { return toNoCookie(made); }
    }
    return null;
  }

  function isImage(item) {
    if (!item) { return false; }
    if (item.type && item.type !== 'image' && item.type !== 'placeholder') { return false; }
    return true;
  }

  function hostOf(url) {
    if (!url) { return ''; }
    var match = /^[a-z]+:\/\/([^/?#]+)/i.exec(url);
    return match ? match[1].replace(/^www\./i, '') : url;
  }

  function current() {
    return items[index] || null;
  }

  /* ---------------------------------------------------------- transform IO */

  function draw() {
    rafId = 0;
    if (!img) { return; }
    img.style.transition = pendingAnimate ? 'transform 180ms ease-out' : 'none';
    img.style.transform =
      'translate3d(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px,0) scale(' + scale.toFixed(4) + ')';
    img.classList.toggle('is-zoomed', scale > 1.001);
    pendingAnimate = false;
  }

  function scheduleDraw() {
    if (rafId) { return; }
    rafId = window.requestAnimationFrame(draw);
  }

  function applyTransform(animate) {
    if (!stage) { return; }
    scale = clamp(scale, MIN_SCALE, MAX_SCALE);
    if (scale <= 1.001) { scale = 1; tx = 0; ty = 0; }
    var maxX = scale > 1 ? ((scale - 1) * stage.clientWidth) / 2 : 0;
    var maxY = scale > 1 ? ((scale - 1) * stage.clientHeight) / 2 : 0;
    tx = clamp(tx, -maxX, maxX);
    ty = clamp(ty, -maxY, maxY);
    pendingAnimate = !!animate;
    scheduleDraw();
  }

  function resetTransform(animate) {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform(animate);
    updateZoomButton();
  }

  function zoomTo(nextScale, originX, originY, animate) {
    var target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    if (target === scale) { return; }
    var ratio = target / scale;
    tx = originX - ratio * (originX - tx);
    ty = originY - ratio * (originY - ty);
    scale = target;
    applyTransform(animate);
    updateZoomButton();
  }

  function stageOrigin(clientX, clientY) {
    var rect = stage.getBoundingClientRect();
    return {
      x: clientX - (rect.left + rect.width / 2),
      y: clientY - (rect.top + rect.height / 2)
    };
  }

  function updateZoomButton() {
    if (!btnZoom) { return; }
    var on = scale > 1.001;
    btnZoom.setAttribute('aria-pressed', on ? 'true' : 'false');
    btnZoom.classList.toggle('is-active', on);
    if (btnZoom.textContent !== (on ? '\u2212' : '\u002B')) {
      btnZoom.textContent = on ? '\u2212' : '\u002B';
    }
  }

  /* --------------------------------------------------------------- display */

  function clearExtras() {
    if (!extras) { return; }
    var videos = extras.querySelectorAll('video');
    for (var v = 0; v < videos.length; v++) {
      try { videos[v].pause(); } catch (err) { /* ignore */ }
      videos[v].removeAttribute('src');
    }
    while (extras.firstChild) { extras.removeChild(extras.firstChild); }
  }

  function buildExtra(item) {
    if (!extras) { return; }
    var type = item.type || 'image';
    if (type === 'video') {
      var video = node('video', 'lightbox__video');
      video.controls = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('preload', 'none');
      video.src = resolve(item.src);
      if (item.poster) { video.poster = resolve(item.poster); }
      extras.appendChild(video);
    } else if (type === 'youtube') {
      var frame = node('iframe', 'lightbox__embed');
      var embed = embedFor(item.src);
      frame.src = embed ? embed + (embed.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1&rel=0' : '';
      frame.title = item.title || item.alt || 'Video';
      frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      frame.setAttribute('allowfullscreen', '');
      frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      extras.appendChild(frame);
    } else if (type === 'external') {
      var link = node('a', 'lightbox__link', (item.title || item.alt || 'Open external media') + ' \u2197');
      link.href = item.href || item.src || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      var hint = node('span', 'lightbox__link-url', hostOf(item.href || item.src));
      extras.appendChild(link);
      extras.appendChild(hint);
    } else {
      var fallback = node('img', 'lightbox__img lightbox__img--placeholder');
      fallback.src = placeholderPath();
      fallback.alt = item.alt || item.title || '';
      extras.appendChild(fallback);
    }
  }

  function updateNav() {
    var single = items.length <= 1;
    if (btnPrev) { btnPrev.disabled = single; }
    if (btnNext) { btnNext.disabled = single; }
    if (counter) { counter.textContent = items.length ? ((index + 1) + ' / ' + items.length) : ''; }
    if (btnZoom) { btnZoom.hidden = !isImage(current()); }
  }

  function prefetch() {
    var ahead = items[(index + 1) % items.length];
    var behind = items[(index - 1 + items.length) % items.length];
    [ahead, behind].forEach(function (item) {
      if (item && item.src && isImage(item)) {
        var pre = new Image();
        pre.src = resolve(item.src);
      }
    });
  }

  function load() {
    var item = current();
    clearExtras();
    if (!item || !img) { updateNav(); return; }
    if (isImage(item)) {
      img.hidden = false;
      img.removeAttribute('aria-hidden');
      img.alt = item.alt || item.title || '';
      img.draggable = false;
      img.src = resolve(item.src) || placeholderPath();
      img.classList.remove('is-placeholder');
      if (item.title) { img.setAttribute('data-title', item.title); } else { img.removeAttribute('data-title'); }
      if (extras) { extras.hidden = true; }
      resetTransform(false);
    } else {
      img.hidden = true;
      img.setAttribute('aria-hidden', 'true');
      img.removeAttribute('src');
      if (extras) { extras.hidden = false; }
      buildExtra(item);
      resetTransform(false);
    }
    updateNav();
    prefetch();
  }

  /* --------------------------------------------------------------- locking */

  function lockScroll() {
    prevBodyOverflow = document.body.style.overflow;
    prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = prevBodyOverflow;
    document.documentElement.style.overflow = prevHtmlOverflow;
  }

  /* --------------------------------------------------------------- focus */

  function focusables() {
    if (!root) { return []; }
    var list = root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
    var out = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].hidden) { continue; }
      if (list[i].getClientRects().length) { out.push(list[i]); }
    }
    return out;
  }

  function trapTab(ev) {
    var list = focusables();
    if (!list.length) {
      ev.preventDefault();
      if (root) { root.focus(); }
      return;
    }
    var first = list[0];
    var last = list[list.length - 1];
    var active = document.activeElement;
    if (ev.shiftKey && (active === first || active === root || !root.contains(active))) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && active === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------ public API */

  function open(list, start) {
    if (!initialised) { init(); }
    if (!root) { return; }
    items = Array.isArray(list) ? list.filter(Boolean) : [];
    if (!items.length) { return; }
    index = ((Number(start) || 0) % items.length + items.length) % items.length;
    var wasOpen = opened;
    if (!wasOpen) { opener = document.activeElement; }
    opened = true;
    root.hidden = false;
    root.classList.add('is-open');
    if (img) { img.style.transition = 'none'; }
    if (extras) { extras.hidden = true; }
    load();
    if (!wasOpen) { lockScroll(); }
    window.requestAnimationFrame(function () {
      if (root) { root.focus(); }
    });
  }

  function close() {
    if (!opened || !root) { return; }
    opened = false;
    clearExtras();
    resetTransform(false);
    if (img) {
      img.hidden = false;
      img.removeAttribute('src');
      img.removeAttribute('data-title');
    }
    root.classList.remove('is-open');
    root.hidden = true;
    unlockScroll();
    items = [];
    index = 0;
    var target = opener;
    opener = null;
    if (target && document.body.contains(target) && typeof target.focus === 'function') {
      try { target.focus(); } catch (err) { /* ignore */ }
    }
  }

  function go(target) {
    if (!items.length) { return; }
    index = ((target % items.length) + items.length) % items.length;
    load();
  }

  function next() { if (items.length) { go(index + 1); } }
  function prev() { if (items.length) { go(index - 1); } }

  function toggleZoom() {
    if (scale > 1.001) { resetTransform(true); }
    else { scale = DOUBLE_CLICK_SCALE; tx = 0; ty = 0; applyTransform(true); updateZoomButton(); }
  }

  /* ---------------------------------------------------------- interaction */

  function onKeydown(ev) {
    if (!opened) { return; }
    var key = ev.key;
    if (key === 'Escape') { ev.preventDefault(); close(); return; }
    if (key === 'ArrowLeft') { ev.preventDefault(); prev(); return; }
    if (key === 'ArrowRight') { ev.preventDefault(); next(); return; }
    if (key === 'Tab') { trapTab(ev); }
  }

  function onWheel(ev) {
    if (!opened || !isImage(current())) { return; }
    ev.preventDefault();
    var factor = ev.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    var origin = stageOrigin(ev.clientX, ev.clientY);
    zoomTo(scale * factor, origin.x, origin.y, false);
  }

  function onDblClick(ev) {
    if (!opened || !isImage(current())) { return; }
    if (scale > 1.001) { resetTransform(true); return; }
    var origin = stageOrigin(ev.clientX, ev.clientY);
    scale = DOUBLE_CLICK_SCALE;
    tx = origin.x * (1 - scale);
    ty = origin.y * (1 - scale);
    applyTransform(true);
    updateZoomButton();
  }

  function pointerCount() {
    var n = 0;
    for (var key in pointers) {
      if (Object.prototype.hasOwnProperty.call(pointers, key)) { n++; }
    }
    return n;
  }

  function pointerIds() {
    var ids = [];
    for (var key in pointers) {
      if (Object.prototype.hasOwnProperty.call(pointers, key)) { ids.push(key); }
    }
    return ids;
  }

  function startPinch() {
    var ids = pointerIds();
    if (ids.length < 2) { return; }
    var a = pointers[ids[0]];
    var b = pointers[ids[1]];
    drag = null;
    pinch = {
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      scale: scale
    };
    if (img) { img.style.transition = 'none'; }
  }

  function updatePinch() {
    var ids = pointerIds();
    if (ids.length < 2 || !pinch) { return; }
    var a = pointers[ids[0]];
    var b = pointers[ids[1]];
    var dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    scale = clamp(pinch.scale * (dist / pinch.dist), MIN_SCALE, MAX_SCALE);
    applyTransform(false);
    updateZoomButton();
  }

  function onPointerDown(ev) {
    if (!opened) { return; }
    pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    if (pointerCount() === 2) { startPinch(); return; }
    if (!isImage(current())) { return; }
    if (ev.pointerType === 'mouse' && ev.button !== 0) { return; }
    if (ev.pointerType === 'touch') {
      var now = Date.now();
      if (now - lastTap.time < DOUBLE_TAP_MS && Math.abs(ev.clientX - lastTap.x) < 30 && Math.abs(ev.clientY - lastTap.y) < 30) {
        lastTap.time = 0;
        onDblClick(ev);
        return;
      }
      lastTap = { time: now, x: ev.clientX, y: ev.clientY };
    }
    drag = {
      id: ev.pointerId,
      x: ev.clientX,
      y: ev.clientY,
      tx: tx,
      ty: ty,
      pointerType: ev.pointerType,
      moved: false
    };
    if (stage.setPointerCapture) {
      try { stage.setPointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
    }
    if (img) { img.style.transition = 'none'; }
  }

  function onPointerMove(ev) {
    if (!opened) { return; }
    if (pointers[ev.pointerId]) { pointers[ev.pointerId] = { x: ev.clientX, y: ev.clientY }; }
    if (pinch) { updatePinch(); return; }
    if (!drag || ev.pointerId !== drag.id) { return; }
    var dx = ev.clientX - drag.x;
    var dy = ev.clientY - drag.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) { drag.moved = true; }
    if (scale > 1.001) {
      tx = drag.tx + dx;
      ty = drag.ty + dy;
      applyTransform(false);
    }
  }

  function onPointerUp(ev) {
    delete pointers[ev.pointerId];
    if (pinch && pointerCount() < 2) { pinch = null; applyTransform(false); }
    if (!drag || ev.pointerId !== drag.id) { return; }
    var dx = ev.clientX - drag.x;
    var dy = ev.clientY - drag.y;
    var wasDrag = drag;
    drag = null;
    if (stage.releasePointerCapture) {
      try { stage.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore */ }
    }
    if (scale <= 1.001 && wasDrag.pointerType !== 'mouse' && Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) { next(); } else { prev(); }
      return;
    }
    applyTransform(false);
  }

  function onBackdrop(ev) {
    if (ev.target === root) { close(); }
  }

  function onImageError() {
    if (!opened || !img) { return; }
    img.classList.add('is-placeholder');
    img.src = placeholderPath();
  }

  /* ------------------------------------------------------------------ wire */

  function wire() {
    offs.push(listen(btnPrev, 'click', prev));
    offs.push(listen(btnNext, 'click', next));
    offs.push(listen(btnClose, 'click', close));
    offs.push(listen(btnZoom, 'click', toggleZoom));
    offs.push(listen(root, 'click', onBackdrop));
    offs.push(listen(document, 'keydown', onKeydown));
    offs.push(listen(stage, 'wheel', onWheel, { passive: false }));
    offs.push(listen(stage, 'dblclick', onDblClick));
    offs.push(listen(stage, 'pointerdown', onPointerDown));
    offs.push(listen(stage, 'pointermove', onPointerMove));
    offs.push(listen(stage, 'pointerup', onPointerUp));
    offs.push(listen(stage, 'pointercancel', onPointerUp));
    offs.push(listen(img, 'error', onImageError));
  }

  function init() {
    if (initialised) { return; }
    root = qs('[data-lightbox]');
    if (!root) { return; }
    stage = qs('[data-lightbox-stage]', root);
    img = qs('[data-lightbox-img]', root);
    btnPrev = qs('[data-lightbox-prev]', root);
    btnNext = qs('[data-lightbox-next]', root);
    btnZoom = qs('[data-lightbox-zoom]', root);
    btnClose = qs('[data-lightbox-close]', root);
    counter = qs('[data-lightbox-counter]', root);
    if (!stage || !img) { return; }
    extras = node('div', 'lightbox__extra');
    extras.hidden = true;
    if (stage) { stage.appendChild(extras); }
    if (btnZoom) { btnZoom.setAttribute('aria-pressed', 'false'); }
    if (!root.getAttribute('tabindex')) { root.setAttribute('tabindex', '-1'); }
    if (stage) { stage.style.touchAction = 'none'; }
    initialised = true;
    wire();
  }

  function destroy() {
    if (opened) { unlockScroll(); }
    for (var i = 0; i < offs.length; i++) {
      try { offs[i](); } catch (err) { /* ignore */ }
    }
    offs.length = 0;
    if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; }
    opened = false;
    items = [];
    if (extras && extras.parentNode) { extras.parentNode.removeChild(extras); }
    extras = null;
    if (root) {
      root.classList.remove('is-open');
      root.hidden = true;
    }
    initialised = false;
  }

  return { init: init, open: open, close: close, destroy: destroy };
}());

