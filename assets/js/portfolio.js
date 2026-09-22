/* portfolio.js — MP.portfolio
   ----------------------------------------------------------------------------
   BUILD: one complete full-screen scene per category, appended to
   [data-scenes-root], matching architecture.md section 3 hook for hook. The
   loop is driven purely by MP.data.categories, so adding a category in
   data/content.js needs ZERO code changes here — this is the whole point of the
   content-driven contract (plan sections 17, 42).

   PROJECT BROWSER: exactly one project is rendered at a time per scene. The
   info block (title / description / specs / counter) and the media block are
   updated in place; prev/next wrap around. The counter is aria-live.

   SCENE MOTION: read-only from MP.scroll.progress/phase inside the single rAF
   loop owned by scroll.js. Values are interpolated every frame, so the motion
   is progress-based and fully reversible on upward scroll — there are no
   one-shot IntersectionObserver reveals. Text and media are treated as two
   depth layers with different travel, never two rigid columns (plan section 15).

   MEDIA: delegated to MP.carousel.create + MP.media. Both are optional at boot:
   if either is missing we fall back to plain placeholder frames inside the same
   aspect box, and a project with no images still renders a finished scene. */
window.MP = window.MP || {};

MP.portfolio = (function () {
  'use strict';

  var SCENE_PREFIX = 'portfolio:';
  var IN_END = 0.38;
  var OUT_START = 0.68;
  var PRELOAD_FALLBACK = 2;

  var built = false;
  var root = null;
  var scenes = [];
  var byId = {};
  var activeState = null;
  var offs = [];
  var categoriesCache = null;

  /* --------------------------------------------------------- environment shims
     MP.util is loaded before us, but a module must survive a missing dependency
     rather than throw (architecture section 2). */

  function util() { return (window.MP && MP.util) || null; }

  function qs(selector, from) {
    var U = util();
    if (U && typeof U.qs === 'function') { return U.qs(selector, from || document); }
    return (from || document).querySelector(selector);
  }

  function clamp(value, min, max) {
    if (min === undefined) { min = 0; }
    if (max === undefined) { max = 1; }
    return value < min ? min : (value > max ? max : value);
  }

  function isReduced() {
    var U = util();
    if (U && typeof U.reducedMotion === 'function') { return !!U.reducedMotion(); }
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function on(target, type, handler, opts) {
    if (!target) { return function () {}; }
    var U = util();
    if (U && typeof U.on === 'function') { return U.on(target, type, handler, opts); }
    target.addEventListener(type, handler, opts);
    return function () { target.removeEventListener(type, handler, opts); };
  }

  function scrollApi() { return (window.MP && MP.scroll) || null; }

  function node(tag, className) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    return el;
  }

  function setAttr(element, name, value) {
    element.setAttribute(name, value === undefined || value === null ? '' : String(value));
  }

  /* ------------------------------------------------------------- data access */

  function dataApi() { return (window.MP && MP.data) || null; }

  function dataCategories() {
    if (categoriesCache) { return categoriesCache; }
    var d = dataApi();
    if (d && Array.isArray(d.categories)) {
      categoriesCache = d.categories;
    } else if (window.MP_DATA && Array.isArray(window.MP_DATA.categories)) {
      categoriesCache = window.MP_DATA.categories;
    } else {
      categoriesCache = [];
    }
    return categoriesCache;
  }

  function preloadCount() {
    var d = dataApi();
    var site = (d && d.site) || (window.MP_DATA && window.MP_DATA.site) || {};
    var n = Number(site.preloadScenes);
    return isFinite(n) && n > 0 ? n : PRELOAD_FALLBACK;
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

  function inferType(src) {
    src = String(src || '');
    if (/(youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(src)) { return 'youtube'; }
    if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i.test(src)) { return 'video'; }
    if (/^https?:\/\//i.test(src)) { return 'external'; }
    return 'image';
  }

  /* Mirrors MP.data.mediaFor() so the scene still builds when MP.data has not
     loaded: manifest first, then the project's own media, then a placeholder. */
  function localMedia(categoryId, project) {
    var manifest = window.MP_MEDIA_MANIFEST || {};
    var bucket = manifest.projects && manifest.projects[categoryId];
    var files = bucket && bucket[project.id];
    var out = [];
    var i;

    if (files && files.length) {
      for (i = 0; i < files.length; i++) {
        out.push({
          type: inferType(files[i]),
          src: 'assets/img/projects/' + categoryId + '/' + project.id + '/' + files[i],
          poster: null,
          alt: (project.title || '') + ' ' + (i + 1),
          title: project.title || null,
          href: null,
          label: project.title || ''
        });
      }
      return out;
    }

    var manual = project.media;
    if (manual && manual.length) {
      for (i = 0; i < manual.length; i++) {
        var item = manual[i];
        if (typeof item === 'string') {
          out.push({
            type: inferType(item), src: item, poster: null, href: null,
            alt: project.title || '', title: project.title || null, label: project.title || ''
          });
        } else if (item && (item.src || item.href)) {
          out.push({
            type: item.type || inferType(item.src || item.href),
            src: item.src || null,
            poster: item.poster || null,
            alt: item.alt || project.title || '',
            title: item.title || project.title || null,
            href: item.href || null,
            label: item.label || project.title || ''
          });
        }
      }
      if (out.length) { return out; }
    }

    return [{ type: 'placeholder', label: project.title || '' }];
  }

  function mediaFor(category, project) {
    var d = dataApi();
    if (d && typeof d.mediaFor === 'function') {
      try {
        var made = d.mediaFor(category.id, project);
        if (made && made.length) { return made; }
      } catch (err) { /* fall through to the local resolver */ }
    }
    return localMedia(category.id, project);
  }

  /* --------------------------------------------------------------- DOM build */

  function buildScene(category) {
    var section = node('section', 'scene scene--portfolio');
    section.id = category.id;
    setAttr(section, 'data-scene', 'portfolio');
    setAttr(section, 'data-category-id', category.id);
    setAttr(section, 'aria-labelledby', category.id + '-title');

    var bg = node('div', 'scene__bg scene__bg--' + (category.tint || 'blush'));
    bg.setAttribute('aria-hidden', 'true');
    setAttr(bg, 'data-parallax', 'bg');

    var inner = node('div', 'portfolio__inner');
    var info = node('div', 'portfolio__info');

    var label = node('p', 'eyebrow');
    setAttr(label, 'data-category-label', '');
    label.textContent = category.title || '';

    var title = node('h2', 'portfolio__title');
    title.id = category.id + '-title';
    setAttr(title, 'data-project-title', '');

    var desc = node('p', 'portfolio__desc');
    setAttr(desc, 'data-project-desc', '');

    var specs = node('dl', 'portfolio__specs');
    setAttr(specs, 'data-project-specs', '');

    var nav = node('div', 'portfolio__nav');
    var prev = node('button', 'btn btn--ghost');
    prev.type = 'button';
    setAttr(prev, 'data-project-prev', '');
    prev.setAttribute('aria-label', 'Previous project');
    prev.textContent = '\u2039';
    var counter = node('p', 'portfolio__counter');
    setAttr(counter, 'data-project-counter', '');
    counter.setAttribute('aria-live', 'polite');
    var next = node('button', 'btn btn--ghost');
    next.type = 'button';
    setAttr(next, 'data-project-next', '');
    next.setAttribute('aria-label', 'Next project');
    next.textContent = '\u203A';
    nav.appendChild(prev);
    nav.appendChild(counter);
    nav.appendChild(next);

    info.appendChild(label);
    info.appendChild(title);
    info.appendChild(desc);
    info.appendChild(specs);
    info.appendChild(nav);

    var media = node('div', 'portfolio__media');
    setAttr(media, 'data-media-root', '');

    inner.appendChild(info);
    inner.appendChild(media);
    section.appendChild(bg);
    section.appendChild(inner);

    return {
      id: SCENE_PREFIX + category.id,
      category: category,
      root: section,
      info: info,
      media: media,
      title: title,
      desc: desc,
      specs: specs,
      counter: counter,
      prev: prev,
      next: next,
      projects: Array.isArray(category.projects) ? category.projects : [],
      index: 0,
      carousel: null,
      mediaBuilt: false
    };
  }

  function buildSpecs(dl, specs) {
    while (dl.firstChild) { dl.removeChild(dl.firstChild); }
    if (!specs || !specs.length) { return; }
    for (var i = 0; i < specs.length; i++) {
      var spec = specs[i];
      if (!spec || spec.label === undefined || spec.value === undefined) { continue; }
      var dt = document.createElement('dt');
      dt.textContent = spec.label;
      var dd = document.createElement('dd');
      dd.textContent = spec.value;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
  }

  function renderProject(scene) {
    if (!scene.projects.length) {
      scene.title.textContent = '';
      scene.desc.textContent = '';
      buildSpecs(scene.specs, null);
      scene.counter.textContent = '';
      return;
    }
    var project = scene.projects[scene.index] || scene.projects[0];
    scene.title.textContent = project.title || '';
    scene.desc.textContent = project.description || '';
    buildSpecs(scene.specs, project.specs);
    scene.counter.textContent = 'Project ' + (scene.index + 1) + ' of ' + scene.projects.length;
  }

  /* ------------------------------------------------------------- media layer */

  function carouselApi() {
    return (window.MP && MP.carousel && typeof MP.carousel.create === 'function') ? MP.carousel : null;
  }

  function mediaApi() {
    return (window.MP && MP.media && typeof MP.media.create === 'function') ? MP.media : null;
  }

  function openItems(list, index) {
    var box = window.MP && MP.lightbox;
    if (box && typeof box.open === 'function') { box.open(list, index || 0); }
  }

  function buildPlaceholderFrames(container, items, project) {
    var count = items.length || 1;
    for (var i = 0; i < count; i++) {
      var item = items[i] || {};
      var label = item.label || (project && project.title) || 'Media';
      var frame = node('div', 'media__frame media__frame--placeholder');
      frame.setAttribute('role', 'img');
      frame.setAttribute('aria-label', label);
      var surface = node('img', 'media__img media__img--placeholder');
      surface.src = placeholderPath();
      surface.alt = '';
      surface.setAttribute('aria-hidden', 'true');
      surface.setAttribute('decoding', 'async');
      surface.draggable = false;
      var caption = node('span', 'media__label');
      caption.textContent = label;
      frame.appendChild(surface);
      frame.appendChild(caption);
      container.appendChild(frame);
    }
  }

  function resetMedia(scene) {
    if (scene.carousel && typeof scene.carousel.destroy === 'function') {
      try { scene.carousel.destroy(); } catch (err) { /* ignore */ }
    }
    scene.carousel = null;
    while (scene.media.firstChild) { scene.media.removeChild(scene.media.firstChild); }
    scene.mediaBuilt = false;
  }

  function ensureMedia(scene) {
    if (scene.mediaBuilt || !scene.projects.length) { return; }
    var project = scene.projects[scene.index];
    var items = mediaFor(scene.category, project);
    var carousel = carouselApi();
    var media = mediaApi();
    var i;

    if (carousel && media) {
      scene.carousel = carousel.create(scene.media, items, {
        interval: 5000,
        project: project,
        category: scene.category,
        onOpen: openItems,
        ariaLabel: scene.category.title + (project.title ? ' \u2014 ' + project.title : '')
      });
    } else if (media) {
      for (i = 0; i < items.length; i++) {
        var made = media.create(items[i], {
          project: project,
          category: scene.category,
          items: items,
          index: i,
          onOpen: openItems,
          lazy: i !== 0
        });
        if (made && made.el) { scene.media.appendChild(made.el); }
      }
    } else {
      buildPlaceholderFrames(scene.media, items, project);
    }
    scene.mediaBuilt = true;
  }

  /* --------------------------------------------------------------- scene loop */

  function scenePhase(id) {
    var s = scrollApi();
    if (s && typeof s.phase === 'function') {
      try {
        var phase = s.phase(id, { inEnd: IN_END, outStart: OUT_START });
        if (phase && typeof phase.enter === 'number') { return phase; }
      } catch (err) { /* fall through to the local derivation */ }
    }
    var p = (s && typeof s.progress === 'function') ? (s.progress(id) || 0) : 0;
    var enter = clamp(p / IN_END, 0, 1);
    var exit = clamp((p - OUT_START) / (1 - OUT_START), 0, 1);
    return {
      progress: p,
      enter: enter,
      exit: exit,
      visible: p > 0 && p < 1,
      presence: clamp(enter * (1 - exit), 0, 1),
      dim: exit
    };
  }

  function trackActive() {
    var s = scrollApi();
    if (!s || typeof s.current !== 'function') { return; }
    var current = s.current();
    if (current && current.indexOf(SCENE_PREFIX) === 0) {
      var id = current.slice(SCENE_PREFIX.length);
      var scene = byId[id];
      if (scene) { activeState = { categoryId: id, index: scene.index }; return; }
    }
    if (activeState) { activeState = null; }
  }

  function frame() {
    if (!scenes.length) { return; }
    for (var i = 0; i < scenes.length; i++) {
      var scene = scenes[i];
      var phase = scenePhase(scene.id);
      if (phase.enter > 0.001 || phase.visible) { ensureMedia(scene); }
    }
    trackActive();
  }

  /* ----------------------------------------------------------- project moves */

  function makeStep(scene, delta) {
    return function () { step(scene, delta); };
  }

  function step(scene, delta) {
    var count = scene.projects.length;
    if (count < 1) { return; }
    scene.index = ((scene.index + delta) % count + count) % count;
    resetMedia(scene);
    renderProject(scene);
    ensureMedia(scene);
    activeState = { categoryId: scene.category.id, index: scene.index };
  }

  function goTo(categoryId, projectIndex) {
    var scene = byId[categoryId];
    if (!scene || !scene.projects.length) { return; }
    var count = scene.projects.length;
    var index = (typeof projectIndex === 'number' && isFinite(projectIndex)) ? projectIndex : 0;
    scene.index = ((index % count) + count) % count;
    resetMedia(scene);
    renderProject(scene);
    ensureMedia(scene);
    activeState = { categoryId: categoryId, index: scene.index };
  }

  function activate(categoryId) {
    var scene = byId[categoryId];
    if (!scene) { return; }
    activeState = { categoryId: categoryId, index: scene.index };
    var s = scrollApi();
    var id = SCENE_PREFIX + categoryId;
    var current = (s && typeof s.current === 'function') ? s.current() : null;
    if (current === id) { return; }
    if (s && typeof s.to === 'function') { s.to(categoryId); return; }
    var target = document.getElementById(categoryId);
    if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function ensureAutoplay() {
    var autoplay = window.MP && MP.autoplay;
    if (autoplay && typeof autoplay.init === 'function') {
      try { autoplay.init(); } catch (err) { /* ignore */ }
    }
  }

  /* -------------------------------------------------------------- public API */

  function init() {
    if (built) { return; }
    root = qs('[data-scenes-root]');
    if (!root) { return; }

    var categories = dataCategories();
    var i;
    for (i = 0; i < categories.length; i++) {
      var category = categories[i];
      if (!category || !category.id) { continue; }
      var scene = buildScene(category);
      scenes.push(scene);
      byId[category.id] = scene;
      root.appendChild(scene.root);
      renderProject(scene);
      offs.push(on(scene.prev, 'click', makeStep(scene, -1)));
      offs.push(on(scene.next, 'click', makeStep(scene, 1)));
    }

    var preload = preloadCount();
    for (i = 0; i < scenes.length && i < preload; i++) { ensureMedia(scenes[i]); }

    built = true;

    var s = scrollApi();
    if (s && typeof s.add === 'function') { offs.push(s.add(frame)); }
    if (s && typeof s.refresh === 'function') {
      try { s.refresh(); } catch (err) { /* ignore */ }
    }
    ensureAutoplay();
  }

  var api = { init: init, goTo: goTo, activate: activate };
  Object.defineProperty(api, 'active', {
    enumerable: true,
    get: function () { return activeState; }
  });
  return api;
}());
