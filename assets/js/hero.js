/* ============================================================================
   hero.js — MP.hero
   ----------------------------------------------------------------------------
   Fills the hero hooks from MP.data (name, surname, tagline, portrait src+alt)
   and drives a speed-based parallax on every [data-parallax] layer inside the
   hero using MP.motion.layerSpeed().

   Scroll progress is read from MP.scroll only — this module adds no scroll
   listener of its own. If the portrait is missing, the image falls back to the
   pastel placeholder. Safe to load when the hero markup is absent. Idempotent.
   ============================================================================ */
(function (window, document) {
  'use strict';

  var MP = window.MP = window.MP || {};

  var PARALLAX_RANGE = 160;        // px travelled by a layer at speed 1.0 across the scene
  var PLACEHOLDER = 'assets/img/_placeholder.svg';

  var state = {
    ready: false,
    offScroll: null,
    layers: [],
    speeds: []
  };

  /* --- local fallbacks: a missing MP.util must never break the hero ------- */

  function qs(selector, root) {
    if (MP.util && typeof MP.util.qs === 'function') return MP.util.qs(selector, root);
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    if (MP.util && typeof MP.util.qsa === 'function') return MP.util.qsa(selector, root);
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function listen(target, type, handler) {
    if (!target) return function () {};
    if (MP.util && typeof MP.util.on === 'function') return MP.util.on(target, type, handler);
    target.addEventListener(type, handler, false);
    return function () { target.removeEventListener(type, handler, false); };
  }

  function heroData() {
    if (MP.data && MP.data.hero) return MP.data.hero;
    if (MP.data && MP.data.raw && MP.data.raw.hero) return MP.data.raw.hero;
    if (window.MP_DATA && window.MP_DATA.hero) return window.MP_DATA.hero;
    return {};
  }

  function placeholderSrc() {
    if (MP.data && MP.data.PLACEHOLDER) return MP.data.PLACEHOLDER;
    return PLACEHOLDER;
  }

  function resolveSrc(path) {
    if (!path) return '';
    if (MP.data && typeof MP.data.resolveSrc === 'function') return MP.data.resolveSrc(path);
    return path;
  }

  /* --- copy --------------------------------------------------------------- */

  function fillCopy(hero) {
    var name = qs('[data-hero-name]');
    if (name) name.textContent = hero.name || '';

    var surname = qs('[data-hero-surname]');
    if (surname) surname.textContent = hero.surname || '';

    var tagline = qs('[data-hero-tagline]');
    if (tagline) tagline.textContent = hero.tagline || '';
  }

  /* Marks the slot while it holds the pastel placeholder so scenes.css can fade
     it into the scene as a soft ghost — a real portrait dropped in later is left
     untouched and keeps its clean crop. */
  function markPlaceholder(img, isPlaceholder) {
    if (!img || !img.classList) return;
    img.classList.toggle('is-placeholder', !!isPlaceholder);
  }

  function fillPortrait(hero) {
    var img = qs('[data-hero-portrait]');
    if (!img) return;

    var fallback = placeholderSrc();
    var src = resolveSrc(hero.portrait) || fallback;
    img.setAttribute('src', src);
    img.setAttribute('alt', hero.portraitAlt || '');
    markPlaceholder(img, src === fallback);

    listen(img, 'error', function () {
      if (img.getAttribute('src') !== fallback) img.setAttribute('src', fallback);
      markPlaceholder(img, true);
    });
  }

  /* --- parallax ----------------------------------------------------------- */

  function setupParallax(root) {
    if (!root) return;
    if (!MP.motion || typeof MP.motion.layerSpeed !== 'function') return;
    if (!MP.scroll || typeof MP.scroll.add !== 'function') return;

    var layers = qsa('[data-parallax]', root);
    if (!layers.length) return;

    var speeds = [];
    for (var i = 0; i < layers.length; i++) {
      var speed = MP.motion.layerSpeed(layers[i].getAttribute('data-parallax'));
      speeds[i] = (typeof speed === 'number' && isFinite(speed)) ? speed : 0;
    }

    state.layers = layers;
    state.speeds = speeds;

    state.offScroll = MP.scroll.add(function () {
      var reduced = !!(MP.motion && MP.motion.reduced);
      var progress = (typeof MP.scroll.progress === 'function') ? MP.scroll.progress('hero') : 0;
      if (typeof progress !== 'number' || !isFinite(progress)) progress = 0;

      for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if (reduced) {
          if (layer.style.transform) layer.style.transform = '';
          continue;
        }
        // Centred on 0.5: the hero rests at ~0.5 when it fills the viewport,
        // so its layers sit at rest on load and drift apart as the user scrolls.
        var offset = -(progress - 0.5) * speeds[i] * PARALLAX_RANGE;
        layer.style.transform = 'translate3d(0,' + offset.toFixed(2) + 'px,0)';
      }
    });
  }

  /* --- public API --------------------------------------------------------- */

  function init() {
    if (state.ready) return;
    state.ready = true;

    var hero = heroData();
    var root = qs('[data-scene="hero"]');

    fillCopy(hero);
    fillPortrait(hero);
    setupParallax(root);
  }

  MP.hero = {
    init: init
  };
})(window, document);
