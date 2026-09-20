/* media.js — MP.media
   Unified media abstraction for the Marcelina Miani portfolio.
   One create() call handles every media type from architecture.md section 6:
   image | video | youtube | external | placeholder.
   Every failure path renders the pastel placeholder at full layout size. */
MP.media = (function () {
  'use strict';

  var PLACEHOLDER_FALLBACK = 'assets/img/_placeholder.svg';
  var PLAY_GLYPH = '\u25B6';
  var EXTERNAL_GLYPH = '\u2197';
  var IMAGE_TYPE = { image: true, placeholder: true };
  var MEDIA_TYPES = { image: true, video: true, youtube: true, external: true, placeholder: true };
  var VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;
  var YOUTUBE_RE = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i;
  var DEFAULT_LABEL = 'Media';

  /* ---------------------------------------------------------------- utils */

  function util() {
    return (window.MP && MP.util) || null;
  }

  function clamp(value, min, max) {
    var u = util();
    if (u && typeof u.clamp === 'function') {
      return u.clamp(value, min, max);
    }
    return Math.min(max, Math.max(min, value));
  }

  function listen(target, type, handler, opts) {
    if (!target) { return function () {}; }
    var u = util();
    if (u && typeof u.on === 'function') {
      return u.on(target, type, handler, opts);
    }
    target.addEventListener(type, handler, opts);
    return function () {
      target.removeEventListener(type, handler, opts);
    };
  }

  function node(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text !== undefined && text !== null) { n.textContent = text; }
    return n;
  }

  function placeholderPath() {
    if (window.MP && MP.data && MP.data.PLACEHOLDER) {
      return MP.data.PLACEHOLDER;
    }
    return PLACEHOLDER_FALLBACK;
  }

  function resolve(path) {
    if (!path) { return ''; }
    if (window.MP && MP.data && typeof MP.data.resolveSrc === 'function') {
      try { return MP.data.resolveSrc(path); } catch (err) { /* fall through */ }
    }
    return path;
  }

  function altFor(item, project, index) {
    if (window.MP && MP.data && typeof MP.data.altFor === 'function') {
      try {
        var alt = MP.data.altFor(item, project, index);
        if (alt) { return alt; }
      } catch (err) { /* fall through */ }
    }
    return item.alt || item.title || (project && project.title) || '';
  }

  function labelFor(item, project) {
    return item.label || item.title || item.alt || (project && project.title) || DEFAULT_LABEL;
  }

  function hostOf(url) {
    if (!url) { return ''; }
    var match = /^[a-z]+:\/\/([^/?#]+)/i.exec(url);
    return match ? match[1].replace(/^www\./i, '') : url;
  }

  function toNoCookie(url) {
    if (!url) { return url; }
    return String(url)
      .replace('://www.youtube.com/embed/', '://www.youtube-nocookie.com/embed/')
      .replace('://youtube.com/embed/', '://www.youtube-nocookie.com/embed/')
      .replace('://www.youtube.com/watch', '://www.youtube-nocookie.com/embed')
      .replace('://youtube.com/watch', '://www.youtube-nocookie.com/embed');
  }

  function embedFor(src) {
    var u = util();
    if (!src) { return null; }
    if (u && typeof u.embedUrl === 'function') {
      var made = u.embedUrl(src);
      if (made) { return toNoCookie(made); }
    }
    var id = null;
    var watch = /[?&]v=([\w-]{6,})/.exec(src);
    var short = /youtu\.be\/([\w-]{6,})/.exec(src);
    var embed = /\/embed\/([\w-]{6,})/.exec(src);
    var shorts = /\/shorts\/([\w-]{6,})/.exec(src);
    id = (watch && watch[1]) || (short && short[1]) || (embed && embed[1]) || (shorts && shorts[1]);
    if (!id) { return null; }
    return 'https://www.youtube-nocookie.com/embed/' + id;
  }

  function indexFor(ctx, fallback) {
    if (ctx && typeof ctx.index === 'number' && !isNaN(ctx.index)) { return ctx.index; }
    if (ctx && typeof ctx.i === 'number' && !isNaN(ctx.i)) { return ctx.i; }
    return typeof fallback === 'number' ? fallback : 0;
  }

  function listFor(ctx, item) {
    if (ctx && Array.isArray(ctx.items) && ctx.items.length) { return ctx.items; }
    if (ctx && Array.isArray(ctx.list) && ctx.list.length) { return ctx.list; }
    return [item];
  }

  function normaliseType(item) {
    var type = item && item.type;
    if (type && MEDIA_TYPES[type]) { return type; }
    var src = String((item && (item.src || item.href)) || '');
    if (YOUTUBE_RE.test(src)) { return 'youtube'; }
    if (VIDEO_EXT.test(src)) { return 'video'; }
    if (/^https?:\/\//i.test(src)) { return 'external'; }
    if (src) { return 'image'; }
    return 'placeholder';
  }

  function isImage(item) {
    var type = normaliseType(item);
    return !!IMAGE_TYPE[type];
  }

  /* ---------------------------------------------------------- shared parts */

  function buildPlaceholder(item, project, label) {
    var box = node('div', 'media__frame media__frame--placeholder');
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', label);
    var surface = node('img', 'media__img media__img--placeholder');
    surface.src = placeholderPath();
    surface.alt = '';
    surface.setAttribute('aria-hidden', 'true');
    surface.setAttribute('decoding', 'async');
    surface.draggable = false;
    var caption = node('span', 'media__label', label);
    box.appendChild(surface);
    box.appendChild(caption);
    return box;
  }

  function failInto(frame, label) {
    frame.classList.add('media__frame--failed', 'media__frame--placeholder');
    while (frame.firstChild) { frame.removeChild(frame.firstChild); }
    var surface = node('img', 'media__img media__img--placeholder');
    surface.src = placeholderPath();
    surface.alt = '';
    surface.setAttribute('aria-hidden', 'true');
    surface.setAttribute('decoding', 'async');
    surface.draggable = false;
    frame.appendChild(surface);
    frame.appendChild(node('span', 'media__label', label));
  }

  function attachImageFallback(surface, frame, label) {
    var failed = false;
    return listen(surface, 'error', function () {
      if (failed) { return; }
      failed = true;
      surface.classList.add('is-placeholder');
      if (frame) { frame.classList.add('media__frame--failed'); }
      surface.src = placeholderPath();
      if (frame && label && !frame.querySelector('.media__label')) {
        frame.appendChild(node('span', 'media__label', label));
      }
    });
  }

  function openViewer(ctx, item) {
    if (!isImage(item)) { return; }
    var list = listFor(ctx, item);
    var index = clamp(indexFor(ctx, 0), 0, Math.max(0, list.length - 1));
    if (ctx && typeof ctx.onOpen === 'function') {
      ctx.onOpen(list, index);
      return;
    }
    if (window.MP && MP.lightbox && typeof MP.lightbox.open === 'function') {
      MP.lightbox.open(list, index);
    }
  }

  /* -------------------------------------------------------------- builders */

  function buildImage(item, ctx) {
    var project = ctx.project;
    var index = indexFor(ctx, 0);
    var label = labelFor(item, project);
    var offs = [];
    var destroyed = false;

    var frame = node('button', 'media__frame media__frame--image');
    frame.type = 'button';
    frame.setAttribute('data-media-type', 'image');
    frame.setAttribute('aria-label', 'Open image: ' + label);

    var surface = node('img', 'media__img');
    surface.src = resolve(item.src) || placeholderPath();
    surface.alt = altFor(item, project, index);
    surface.setAttribute('decoding', 'async');
    surface.setAttribute('loading', ctx.lazy === false ? 'eager' : 'lazy');
    surface.draggable = false;
    frame.appendChild(surface);

    offs.push(attachImageFallback(surface, frame, label));
    offs.push(listen(frame, 'click', function (ev) {
      ev.preventDefault();
      openViewer(ctx, item);
    }));

    return {
      el: frame,
      type: 'image',
      destroy: function () {
        if (destroyed) { return; }
        destroyed = true;
        for (var i = 0; i < offs.length; i++) { offs[i](); }
        offs.length = 0;
        if (frame.parentNode) { frame.parentNode.removeChild(frame); }
      }
    };
  }

  function buildVideo(item, ctx) {
    var project = ctx.project;
    var index = indexFor(ctx, 0);
    var label = labelFor(item, project);
    var poster = resolve(item.poster) || placeholderPath();
    var offs = [];
    var video = null;
    var videoOffs = [];
    var destroyed = false;

    var frame = node('div', 'media__frame media__frame--video');
    frame.setAttribute('data-media-type', 'video');

    var surface = node('img', 'media__poster');
    surface.src = poster;
    surface.alt = altFor(item, project, index);
    surface.setAttribute('decoding', 'async');
    surface.setAttribute('loading', ctx.lazy === false ? 'eager' : 'lazy');
    surface.draggable = false;
    frame.appendChild(surface);

    var play = node('button', 'media__play');
    play.type = 'button';
    play.setAttribute('aria-label', 'Play video: ' + label);
    var icon = node('span', 'media__play-icon', PLAY_GLYPH);
    icon.setAttribute('aria-hidden', 'true');
    play.appendChild(icon);
    frame.appendChild(play);

    function releaseVideo() {
      for (var i = 0; i < videoOffs.length; i++) { videoOffs[i](); }
      videoOffs.length = 0;
      if (video) {
        try { video.pause(); } catch (err) { /* ignore */ }
        video.removeAttribute('src');
        try { video.load(); } catch (err) { /* ignore */ }
      }
    }

    function startPlayback() {
      if (video) {
        var resumed = video.play();
        if (resumed && resumed.catch) { resumed.catch(function () {}); }
        return;
      }
      video = node('video', 'media__video');
      video.controls = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('preload', 'none');
      video.poster = poster;
      video.src = resolve(item.src);
      videoOffs.push(listen(video, 'error', function () {
        releaseVideo();
        failInto(frame, label);
      }));
      videoOffs.push(listen(video, 'loadeddata', function () {
        frame.classList.add('is-playing');
      }));
      frame.classList.add('is-loading');
      frame.appendChild(video);
      play.setAttribute('aria-hidden', 'true');
      var started = video.play();
      if (started && started.catch) { started.catch(function () {}); }
    }

    offs.push(attachImageFallback(surface, null, null));
    offs.push(listen(play, 'click', function (ev) {
      ev.preventDefault();
      startPlayback();
    }));

    return {
      el: frame,
      type: 'video',
      destroy: function () {
        if (destroyed) { return; }
        destroyed = true;
        releaseVideo();
        for (var i = 0; i < offs.length; i++) { offs[i](); }
        offs.length = 0;
        if (frame.parentNode) { frame.parentNode.removeChild(frame); }
      }
    };
  }

  function buildYoutube(item, ctx) {
    var project = ctx.project;
    var index = indexFor(ctx, 0);
    var label = labelFor(item, project);
    var poster = resolve(item.poster) || placeholderPath();
    var offs = [];
    var destroyed = false;

    var frame = node('div', 'media__frame media__frame--youtube');
    frame.setAttribute('data-media-type', 'youtube');

    var facade = node('button', 'media__facade');
    facade.type = 'button';
    facade.setAttribute('aria-label', 'Play video on YouTube: ' + label + ' (opens embed)');

    var surface = node('img', 'media__poster');
    surface.src = poster;
    surface.alt = altFor(item, project, index);
    surface.setAttribute('decoding', 'async');
    surface.setAttribute('loading', ctx.lazy === false ? 'eager' : 'lazy');
    surface.draggable = false;
    facade.appendChild(surface);

    var icon = node('span', 'media__play-icon', PLAY_GLYPH);
    icon.setAttribute('aria-hidden', 'true');
    facade.appendChild(icon);
    frame.appendChild(facade);

    offs.push(attachImageFallback(surface, null, null));
    offs.push(listen(facade, 'click', function (ev) {
      ev.preventDefault();
      var embed = embedFor(item.src);
      if (!embed) {
        failInto(frame, label);
        return;
      }
      var iframe = node('iframe', 'media__embed');
      iframe.src = embed + (embed.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1&rel=0';
      iframe.title = label;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.classList.add('is-playing');
      if (facade.parentNode) { frame.removeChild(facade); }
      frame.appendChild(iframe);
    }));

    return {
      el: frame,
      type: 'youtube',
      destroy: function () {
        if (destroyed) { return; }
        destroyed = true;
        for (var i = 0; i < offs.length; i++) { offs[i](); }
        offs.length = 0;
        if (frame.parentNode) { frame.parentNode.removeChild(frame); }
      }
    };
  }

  function buildExternal(item, ctx) {
    var project = ctx.project;
    var label = labelFor(item, project);
    var href = item.href || item.src || '';
    if (!href) {
      var box = buildPlaceholder(item, project, label);
      return {
        el: box,
        type: 'placeholder',
        destroy: function () {
          if (box.parentNode) { box.parentNode.removeChild(box); }
        }
      };
    }
    var host = hostOf(href);
    var link = node('a', 'media__frame media__frame--external');
    link.setAttribute('data-media-type', 'external');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', 'Open external media: ' + label + ' (' + (host || href) + '), opens in a new tab');

    var icon = node('span', 'media__external-icon', EXTERNAL_GLYPH);
    icon.setAttribute('aria-hidden', 'true');
    link.appendChild(icon);
    link.appendChild(node('span', 'media__external-label', label));
    link.appendChild(node('span', 'media__external-url', host || href));
    link.appendChild(node('span', 'media__external-action', 'Open link'));

    return {
      el: link,
      type: 'external',
      destroy: function () {
        if (link.parentNode) { link.parentNode.removeChild(link); }
      }
    };
  }

  /* ------------------------------------------------------------ public API */

  function create(item, ctx) {
    ctx = ctx || {};
    item = item || { type: 'placeholder' };
    var type = normaliseType(item);
    if (type === 'image' && !item.src) { type = 'placeholder'; }
    switch (type) {
      case 'image': return buildImage(item, ctx);
      case 'video': return buildVideo(item, ctx);
      case 'youtube': return buildYoutube(item, ctx);
      case 'external': return buildExternal(item, ctx);
      default: {
        var box = buildPlaceholder(item, ctx.project, labelFor(item, ctx.project));
        return {
          el: box,
          type: 'placeholder',
          destroy: function () {
            if (box.parentNode) { box.parentNode.removeChild(box); }
          }
        };
      }
    }
  }

  return { create: create };
}());
