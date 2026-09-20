/* contact.js — MP.contact
   ----------------------------------------------------------------------------
   Fills the contact scene and the site footer from MP.data (falling back to the
   raw MP_DATA payload). Only the fields that actually exist are rendered: a
   contact method with no value or no resolvable href is skipped entirely, never
   shown as an empty row or a dead link (plan sections 27-28). Email gets
   mailto:, phone gets tel:, and external socials open in a new tab with
   rel="noopener". The footer copy and links come from data too. */
window.MP = window.MP || {};

MP.contact = (function () {
  'use strict';

  var built = false;
  var EXTERNAL_KEY = /^https?:\/\//i;

  /* --------------------------------------------------------- environment shims */

  function util() { return (window.MP && MP.util) || null; }

  function qs(selector, from) {
    var U = util();
    if (U && typeof U.qs === 'function') { return U.qs(selector, from || document); }
    return (from || document).querySelector(selector);
  }

  function on(target, type, handler, opts) {
    if (!target) { return function () {}; }
    var U = util();
    if (U && typeof U.on === 'function') { return U.on(target, type, handler, opts); }
    target.addEventListener(type, handler, opts);
    return function () { target.removeEventListener(type, handler, opts); };
  }

  function node(tag, className) {
    var el = document.createElement(tag);
    if (className) { el.className = className; }
    return el;
  }

  function dataApi() { return (window.MP && MP.data) || null; }

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

  function pick(key) {
    var d = dataApi();
    if (d && d[key]) { return d[key]; }
    if (window.MP_DATA && window.MP_DATA[key]) { return window.MP_DATA[key]; }
    return null;
  }

  /* ------------------------------------------------------------------- links */

  function hrefFor(link) {
    if (!link) { return null; }
    if (link.href) { return link.href; }
    var value = link.value ? String(link.value).trim() : '';
    if (!value) { return null; }
    if (link.type === 'email') { return 'mailto:' + value; }
    if (link.type === 'phone') { return 'tel:' + value.replace(/[^\d+]/g, ''); }
    if (EXTERNAL_KEY.test(value)) { return value; }
    return null;
  }

  function isExternal(link, href) {
    if (!href || !EXTERNAL_KEY.test(href)) { return false; }
    return link.type !== 'email' && link.type !== 'phone';
  }

  function setText(selector, value) {
    var el = qs(selector);
    if (el && value !== undefined && value !== null) { el.textContent = value; }
  }

  function buildContactLink(link) {
    var href = hrefFor(link);
    var label = link.label || link.value || '';
    if (!href || !label) { return null; }
    var a = node('a');
    a.href = href;
    a.textContent = label;
    if (isExternal(link, href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', label + ' (opens in a new tab)');
    }
    return a;
  }

  function renderLinks(links, skip) {
    var list = qs('[data-contact-links]');
    if (!list) { return []; }
    while (list.firstChild) { list.removeChild(list.firstChild); }
    var usable = [];
    if (Array.isArray(links)) {
      for (var i = 0; i < links.length; i++) {
        // The method promoted to the primary CTA is never repeated as a pill.
        if (links[i] === skip) { continue; }
        var a = buildContactLink(links[i]);
        if (!a) { continue; }
        var li = document.createElement('li');
        li.appendChild(a);
        list.appendChild(li);
        usable.push(links[i]);
      }
    }
    return usable;
  }

  /* One primary CTA, derived from the first usable method so no copy is
     invented: email wins, then phone, then the first external profile. The
     chosen method is featured as the single main action and removed from the
     pill list above so "Email" can never appear twice in one block. */
  function ctaLink(links) {
    if (!Array.isArray(links)) { return null; }
    var order = { email: 0, phone: 1 };
    var best = null;
    var bestRank = 99;
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if (!hrefFor(link)) { continue; }
      var rank = order[link.type] !== undefined ? order[link.type] : 2;
      if (rank < bestRank) { bestRank = rank; best = link; }
    }
    return best;
  }

  function renderCta(link) {
    var box = qs('[data-contact-cta]');
    if (!box) { return; }
    while (box.firstChild) { box.removeChild(box.firstChild); }
    if (!link) { return; }
    var href = hrefFor(link);
    var a = node('a', 'btn');
    a.href = href;
    a.textContent = link.label || link.value || '';
    if (isExternal(link, href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', (link.label || link.value) + ' (opens in a new tab)');
    }
    box.appendChild(a);
  }

  /* ------------------------------------------------------------------ scene */

  function renderPortrait(contact) {
    var img = qs('[data-contact-portrait]');
    if (!img) { return; }
    img.alt = contact.portraitAlt || '';
    img.src = resolveSrc(contact.portrait) || placeholderPath();
    on(img, 'error', function () {
      if (img.getAttribute('data-placeholder') === '1') { return; }
      img.setAttribute('data-placeholder', '1');
      img.src = placeholderPath();
    });
  }

  function renderContact(contact) {
    if (!contact) { return; }
    setText('[data-contact-eyebrow]', contact.eyebrow);
    setText('[data-contact-title]', contact.title);
    setText('[data-contact-message]', contact.message);
    renderPortrait(contact);
    var cta = ctaLink(contact.links);
    renderLinks(contact.links, cta);
    renderCta(cta);
  }

  /* ----------------------------------------------------------------- footer */

  function buildFooterLink(link) {
    if (!link || !link.href || !link.label) { return null; }
    var a = node('a');
    a.href = link.href;
    if (EXTERNAL_KEY.test(link.href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    a.textContent = link.label;
    return a;
  }

  function renderFooter(footer) {
    if (!footer) { return; }
    if (footer.copy !== undefined && footer.copy !== null) {
      setText('[data-footer-copy]', footer.copy);
    }
    var list = qs('[data-footer-links]');
    if (!list) { return; }
    while (list.firstChild) { list.removeChild(list.firstChild); }
    if (!Array.isArray(footer.links)) { return; }
    for (var i = 0; i < footer.links.length; i++) {
      var a = buildFooterLink(footer.links[i]);
      if (!a) { continue; }
      var li = document.createElement('li');
      li.className = 'site-footer__item';
      li.appendChild(a);
      list.appendChild(li);
    }
  }

  /* -------------------------------------------------------------- public API */

  function init() {
    if (built) { return; }
    built = true;
    renderContact(pick('contact'));
    renderFooter(pick('footer'));
  }

  return { init: init };
}());
