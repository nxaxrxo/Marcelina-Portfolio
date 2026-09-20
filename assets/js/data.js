/* data.js — MP.data
   Normalises window.MP_DATA + window.MP_MEDIA_MANIFEST into one predictable
   shape (architecture.md sections 4, 5, 6).

   Manifest values are BARE FILE NAMES; the folder is implied by the bucket key,
   so this module builds the real path itself:
     hero       -> assets/img/hero/<file>
     contact    -> assets/img/contact/<file>
     categories -> assets/img/categories/<file>
     projects   -> assets/img/projects/<categoryId>/<projectId>/<file>
   An absent/empty manifest, a category with no projects and a project with no
   media are all valid states and never throw. */

window.MP = window.MP || {};

MP.data = (function () {
  'use strict';

  var PLACEHOLDER = 'assets/img/_placeholder.svg';
  var VIEW_TINTS = ['blush', 'lavender', 'peach', 'butter', 'mint', 'periwinkle', 'rose'];
  var MEDIA_TYPES = { image: true, video: true, youtube: true, external: true, placeholder: true };
  var ABSOLUTE_RE = /^(https?:|data:|blob:|mailto:|tel:|#|\/\/)/i;
  var HTTP_RE = /^(https?:)?\/\//i;
  var YOUTUBE_RE = /(?:youtube\.com|youtube-nocookie\.com|youtu\.be)/i;
  var YOUTUBE_ID_RE = /(?:[?&]v=|\/embed\/|\/shorts\/|\/live\/|\/v\/|youtu\.be\/)[\w-]{6,}/i;
  var VIDEO_RE = /\.(mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i;
  var IMAGE_RE = /\.(jpe?g|png|webp|avif|gif|svg)(?:[?#].*)?$/i;

  var initialised = false;

  var api = {
    raw: null,
    manifest: null,
    site: {},
    hero: {},
    explorer: {},
    contact: {},
    footer: {},
    categories: [],
    init: init,
    category: category,
    project: project,
    mediaFor: mediaFor,
    resolveSrc: resolveSrc,
    fileName: fileName,
    altFor: altFor,
    PLACEHOLDER: PLACEHOLDER,
    VIEW_TINTS: VIEW_TINTS
  };

  /* ---------------------------------------------------------------- helpers */

  function util() { return (window.MP && MP.util) || null; }
  function str(value) { return (value === null || value === undefined) ? '' : String(value); }
  function arr(value) { return Array.isArray(value) ? value : []; }
  function obj(value) {
    return (value && typeof value === 'object' && !Array.isArray(value)) ? value : {};
  }

  function resolveSrc(path) {
    var s = str(path).trim();
    if (!s) { return ''; }
    if (ABSOLUTE_RE.test(s)) { return s; }
    return s.replace(/\\/g, '/').replace(/^\.?\//, '');
  }

  function fileName(path) {
    var clean = str(path).split(/[?#]/)[0];
    var parts = clean.split(/[\\/]/);
    return parts.length ? parts[parts.length - 1] : '';
  }

  function urlToId(value) {
    var u = util();
    if (u && typeof u.urlToId === 'function') { return u.urlToId(value); }
    return str(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function naturalCompare(a, b) {
    var u = util();
    if (u && typeof u.naturalSort === 'function') { return u.naturalSort(a, b); }
    var as = str(a);
    var bs = str(b);
    return as < bs ? -1 : (as > bs ? 1 : 0);
  }

  /* ------------------------------------------------------------ media model */
  /* Type inference order (section 6): youtube -> video -> external -> image. */

  function inferType(src) {
    var s = str(src);
    var u = util();
    if (u && typeof u.embedUrl === 'function' && u.embedUrl(s)) { return 'youtube'; }
    if (YOUTUBE_RE.test(s) && YOUTUBE_ID_RE.test(s)) { return 'youtube'; }
    if (VIDEO_RE.test(s)) { return 'video'; }
    if (HTTP_RE.test(s)) { return IMAGE_RE.test(s) ? 'image' : 'external'; }
    return 'image';
  }

  function normaliseMedia(entry) {
    var item = (typeof entry === 'string') ? { src: entry } : obj(entry);
    var rawSrc = str(item.src || item.url || item.file);
    var declared = str(item.type).toLowerCase();
    var type = MEDIA_TYPES[declared] ? declared : inferType(rawSrc);
    var src = resolveSrc(rawSrc);
    var href = item.href ? resolveSrc(item.href) : null;
    var poster = item.poster ? resolveSrc(item.poster) : null;

    if (type === 'youtube') {
      var u = util();
      var embed = (u && typeof u.embedUrl === 'function') ? u.embedUrl(rawSrc) : null;
      if (embed) { src = embed; }
    } else if (type === 'placeholder') {
      src = src || PLACEHOLDER;
    } else if (type === 'external' && !href) {
      href = src || rawSrc;
    }

    var result = {
      type: type,
      src: src,
      poster: poster,
      alt: item.alt ? str(item.alt) : null,
      title: item.title ? str(item.title) : null,
      href: href
    };
    if (item.label) { result.label = str(item.label); }
    return result;
  }

  function placeholderItem(project) {
    var title = str(project.title);
    return {
      type: 'placeholder',
      label: title || 'Media',
      src: PLACEHOLDER,
      poster: null,
      alt: title,
      title: project.title ? str(project.title) : null,
      href: null
    };
  }

  function projectFiles(categoryId, projectId) {
    if (!categoryId || !projectId) { return []; }
    var projects = obj(obj(api.manifest).projects);
    var files = arr(obj(projects[categoryId])[projectId]);
    if (!files.length) { return []; }
    var sorted = files.slice().sort(naturalCompare);
    var out = [];
    for (var i = 0; i < sorted.length; i++) {
      var path = 'assets/img/projects/' + categoryId + '/' + projectId + '/' + sorted[i];
      out.push(normaliseMedia({ src: path }));
    }
    return out;
  }

  function mediaFor(categoryId, project) {
    ensure();
    var proj = obj(project);
    var catId = str(categoryId || proj.categoryId);
    var projId = str(proj.id);
    var files = projectFiles(catId, projId);
    if (files.length) { return files; }
    var manual = arr(proj.media);
    if (manual.length) { return manual.slice(); }
    return [placeholderItem(proj)];
  }

  function altFor(media, project, index) {
    var item = obj(media);
    var base = str(item.alt) || str(item.title) || str(obj(project).title);
    if (!base) { return ''; }
    if (typeof index === 'number' && index > 0) { return base + ' — ' + (index + 1); }
    return base;
  }

  /* -------------------------------------------------------- normalisation */

  function normaliseSpecs(specs) {
    var list = arr(specs);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var spec = obj(list[i]);
      var label = str(spec.label);
      var value = str(spec.value);
      if (!label && !value) { continue; }
      out.push({ label: label, value: value });
    }
    return out;
  }

  function normaliseIsland(island, index) {
    var src = obj(island);
    return {
      size: str(src.size) || 'md',
      preset: (typeof src.preset === 'number') ? src.preset : (index % 6),
      x: (typeof src.x === 'number') ? src.x : 50,
      y: (typeof src.y === 'number') ? src.y : 50,
      rot: (typeof src.rot === 'number') ? src.rot : 0
    };
  }

  function normaliseProject(project, categoryId, index) {
    var src = obj(project);
    var manual = arr(src.media);
    var media = [];
    for (var i = 0; i < manual.length; i++) {
      if (manual[i] === null || manual[i] === undefined) { continue; }
      media.push(normaliseMedia(manual[i]));
    }
    return {
      id: str(src.id) || (categoryId + '-project-' + (index + 1)),
      categoryId: categoryId,
      title: str(src.title),
      description: str(src.description),
      specs: normaliseSpecs(src.specs),
      media: media
    };
  }

  function coverFor(categoryId, fallback, manifest) {
    var files = arr(obj(manifest.categories)[categoryId]);
    if (files.length) { return 'assets/img/categories/' + files[0]; }
    return fallback ? resolveSrc(fallback) : null;
  }

  function normaliseCategory(category, index, manifest) {
    var src = obj(category);
    var id = str(src.id) || urlToId(str(src.title)) || ('category-' + (index + 1));
    var projectsSrc = arr(src.projects);
    var projects = [];
    for (var i = 0; i < projectsSrc.length; i++) {
      projects.push(normaliseProject(projectsSrc[i], id, i));
    }
    var tint = VIEW_TINTS.indexOf(str(src.tint)) !== -1
      ? str(src.tint) : VIEW_TINTS[index % VIEW_TINTS.length];
    return {
      id: id,
      title: str(src.title),
      tint: tint,
      cover: coverFor(id, src.cover, manifest),
      island: normaliseIsland(src.island, index),
      blurb: str(src.blurb),
      projects: projects
    };
  }

  function normaliseContactLinks(links) {
    var list = arr(links);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var link = obj(list[i]);
      out.push({
        type: str(link.type) || 'link',
        label: str(link.label),
        value: str(link.value),
        href: str(link.href)
      });
    }
    return out;
  }

  function normaliseFooterLinks(links) {
    var list = arr(links);
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var link = obj(list[i]);
      var label = str(link.label);
      var href = str(link.href);
      if (!label && !href) { continue; }
      out.push({ label: label, href: href });
    }
    return out;
  }

  function manifestFiles(bucket, manifest) {
    return arr(obj(manifest[bucket]).files);
  }

  function build() {
    var raw = obj(window.MP_DATA);
    var manifest = obj(window.MP_MEDIA_MANIFEST);
    api.raw = window.MP_DATA || null;
    api.manifest = window.MP_MEDIA_MANIFEST || null;

    var site = obj(raw.site);
    api.site = {
      title: str(site.title),
      description: str(site.description),
      url: str(site.url),
      updateHashOnScroll: site.updateHashOnScroll !== false,
      preloadScenes: (typeof site.preloadScenes === 'number') ? site.preloadScenes : 2
    };

    var hero = obj(raw.hero);
    var heroFiles = manifestFiles('hero', manifest);
    api.hero = {
      name: str(hero.name),
      surname: str(hero.surname),
      tagline: str(hero.tagline),
      portrait: heroFiles.length ? 'assets/img/hero/' + heroFiles[0] : resolveSrc(hero.portrait),
      portraitAlt: str(hero.portraitAlt)
    };

    var explorer = obj(raw.explorer);
    api.explorer = {
      eyebrow: str(explorer.eyebrow),
      title: str(explorer.title),
      lede: str(explorer.lede)
    };

    var contact = obj(raw.contact);
    var contactFiles = manifestFiles('contact', manifest);
    api.contact = {
      eyebrow: str(contact.eyebrow),
      title: str(contact.title),
      message: str(contact.message),
      portrait: contactFiles.length ? 'assets/img/contact/' + contactFiles[0] : resolveSrc(contact.portrait),
      portraitAlt: str(contact.portraitAlt),
      links: normaliseContactLinks(contact.links)
    };

    var footer = obj(raw.footer);
    api.footer = {
      copy: str(footer.copy),
      links: normaliseFooterLinks(footer.links)
    };

    var categories = arr(raw.categories);
    var built = [];
    for (var i = 0; i < categories.length; i++) {
      built.push(normaliseCategory(categories[i], i, manifest));
    }
    api.categories = built;
    initialised = true;
  }

  /* ---------------------------------------------------------------- public */

  function init() { build(); }

  function ensure() { if (!initialised) { build(); } }

  function category(id) {
    ensure();
    var key = str(id);
    if (!key) { return null; }
    for (var i = 0; i < api.categories.length; i++) {
      if (api.categories[i].id === key) { return api.categories[i]; }
    }
    return null;
  }

  function project(categoryId, projectId) {
    var cat = category(categoryId);
    if (!cat) { return null; }
    var key = str(projectId);
    if (!key) { return null; }
    for (var i = 0; i < cat.projects.length; i++) {
      if (cat.projects[i].id === key) { return cat.projects[i]; }
    }
    return null;
  }

  build();
  return api;
}());
