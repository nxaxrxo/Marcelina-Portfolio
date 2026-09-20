/* ============================================================================
   main.js — MP.boot
   ----------------------------------------------------------------------------
   Boots the whole experience in the frozen order (architecture §7):

     util → motion → data → scroll → header → hero → lightbox →
     portfolio → categories → autoplay → contact → refresh scroll → reveal

   Every module init is guarded: one missing or throwing module can never stop
   the rest of the site from booting. All failures are aggregated into a single
   console.warn. After boot the page is revealed; a hard timeout guarantees the
   page is never left hidden (plan §38 — no long loading screen).

   Also owns the small global behaviours: smooth [data-anchor] navigation
   through MP.scroll.to() (including a deep-link hash on load), optional URL
   hash updates on scene change, hiding the scroll hint, and back-to-top.
   ============================================================================ */
(function (window, document) {
  'use strict';

  var MP = window.MP = window.MP || {};

  var REVEAL_TIMEOUT_MS = 1600;
  var HINT_AT = 8;
  var PORTFOLIO_PREFIX = 'portfolio:';

  var booted = false;
  var revealed = false;
  var failures = [];
  var initialHash = (window.location && window.location.hash) ? window.location.hash : '';

  /* --- local fallbacks: a missing MP.util must never break boot ----------- */

  function qs(selector, root) {
    if (MP.util && typeof MP.util.qs === 'function') return MP.util.qs(selector, root);
    return (root || document).querySelector(selector);
  }

  function listen(target, type, handler) {
    if (!target) return function () {};
    if (MP.util && typeof MP.util.on === 'function') return MP.util.on(target, type, handler);
    target.addEventListener(type, handler, false);
    return function () { target.removeEventListener(type, handler, false); };
  }

  function closest(node, selector) {
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  /* --- reveal ------------------------------------------------------------- */

  function reveal() {
    if (revealed) return;
    revealed = true;
    var html = document.documentElement;
    if (html) {
      html.classList.remove('is-loading');
      html.classList.add('is-ready');
    }
    if (document.body) {
      document.body.classList.remove('is-loading');
      document.body.classList.add('is-ready');
    }
  }

  /* --- guarded module steps ----------------------------------------------- */

  function record(module, error) {
    failures.push({
      module: module,
      error: (error && error.message) ? error.message : String(error)
    });
  }

  function run(module, fn) {
    try {
      fn();
    } catch (error) {
      record(module, error);
    }
  }

  function initModule(name, module, method, args) {
    run(name, function () {
      if (module && typeof module[method] === 'function') module[method].apply(module, args || []);
    });
  }

  /* --- navigation --------------------------------------------------------- */

  function siteConfig() {
    if (MP.data && MP.data.site) return MP.data.site;
    if (MP.data && MP.data.raw && MP.data.raw.site) return MP.data.raw.site;
    if (window.MP_DATA && window.MP_DATA.site) return window.MP_DATA.site;
    return {};
  }

  function sceneIdFor(anchorId) {
    if (anchorId === 'categories' || anchorId === 'explorer') return 'explorer';
    if (anchorId === 'contact') return 'contact';
    if (anchorId === 'hero') return 'hero';
    if (MP.data && typeof MP.data.category === 'function' && MP.data.category(anchorId)) {
      return PORTFOLIO_PREFIX + anchorId;
    }
    return anchorId;
  }

  function navigateTo(anchorId) {
    if (!anchorId) return false;
    var sceneId = sceneIdFor(anchorId);

    if (sceneId.indexOf(PORTFOLIO_PREFIX) === 0 &&
        MP.portfolio && typeof MP.portfolio.activate === 'function') {
      MP.portfolio.activate(anchorId);
      return true;
    }

    if (MP.scroll && typeof MP.scroll.to === 'function') {
      MP.scroll.to(sceneId);
      return true;
    }

    return false;
  }

  function pushHash(id) {
    if (!window.history || typeof window.history.pushState !== 'function') return;
    if (window.location.hash === '#' + id) return;
    window.history.pushState(null, '', '#' + id);
  }

  function replaceHash(id) {
    if (!window.history || typeof window.history.replaceState !== 'function') return;
    if (window.location.hash === '#' + id) return;
    window.history.replaceState(null, '', '#' + id);
  }

  function anchorIdForScene(sceneId) {
    if (!sceneId) return null;
    if (sceneId === 'explorer') return 'categories';
    if (sceneId.indexOf(PORTFOLIO_PREFIX) === 0) return sceneId.slice(PORTFOLIO_PREFIX.length);
    return sceneId;
  }

  function wireAnchors() {
    listen(document, 'click', function (event) {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var link = closest(event.target, '[data-anchor]');
      if (!link) return;

      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      var id = href.slice(1);

      // If no engine can handle it, let the browser perform the native jump.
      if (!navigateTo(id)) return;

      event.preventDefault();
      pushHash(id);
    });
  }

  function wireScrollHint() {
    var hint = qs('[data-scroll-hint]');
    if (!hint) return;
    if (!MP.scroll || typeof MP.scroll.add !== 'function') return;

    var hidden = false;
    MP.scroll.add(function () {
      if (hidden) return;
      var y = (typeof MP.scroll.y === 'number') ? MP.scroll.y : 0;
      if (y <= HINT_AT) return;
      hidden = true;
      hint.classList.add('is-hidden');
      hint.setAttribute('aria-hidden', 'true');
    });
  }

  function wireHashOnScroll() {
    if (!siteConfig().updateHashOnScroll) return;
    if (!MP.scroll || typeof MP.scroll.add !== 'function') return;

    var lastScene = null;
    MP.scroll.add(function () {
      var sceneId = (typeof MP.scroll.current === 'function') ? MP.scroll.current() : null;
      if (!sceneId || sceneId === lastScene) return;
      lastScene = sceneId;
      var anchor = anchorIdForScene(sceneId);
      if (anchor) replaceHash(anchor);
    });
  }

  function wireBackToTop() {
    var control = qs('[data-back-to-top]');
    if (!control) return;
    listen(control, 'click', function (event) {
      if (!navigateTo('hero')) return;
      event.preventDefault();
      replaceHash('hero');
    });
  }

  function applyInitialHash() {
    var hash = initialHash;
    if (!hash || hash.length < 2) return;
    var id = hash.slice(1);
    if (!document.getElementById(id)) return;

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(function () { navigateTo(id); });
    } else {
      navigateTo(id);
    }
  }

  function wireGlobals() {
    wireAnchors();
    wireScrollHint();
    wireHashOnScroll();
    wireBackToTop();
    applyInitialHash();
  }

  /* --- boot --------------------------------------------------------------- */

  function start() {
    if (booted) return;
    booted = true;

    initModule('util', MP.util, 'init');
    initModule('motion', MP.motion, 'init');
    initModule('data', MP.data, 'init');
    initModule('scroll', MP.scroll, 'init');
    initModule('header', MP.header, 'init');
    initModule('hero', MP.hero, 'init');
    initModule('lightbox', MP.lightbox, 'init');
    initModule('portfolio', MP.portfolio, 'init');
    initModule('categories', MP.categories, 'init');
    initModule('autoplay', MP.autoplay, 'init');
    initModule('contact', MP.contact, 'init');
    initModule('scroll.refresh', MP.scroll, 'refresh');

    run('globals', wireGlobals);

    reveal();

    if (failures.length) {
      console.warn('[MP.boot] ' + failures.length + ' boot step(s) failed:', failures);
    }
  }

  MP.boot = { start: start };

  // Hard fallback: nothing may leave the page hidden.
  window.setTimeout(reveal, REVEAL_TIMEOUT_MS);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})(window, document);
