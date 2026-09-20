/* ============================================================================
   header.js — MP.header
   ----------------------------------------------------------------------------
   Owns the site header:
     • hidden at the hero, revealed once the page starts scrolling, tucked away
       again when the user returns to the very top;
     • the "My Works" dropdown (hover, keyboard/focus, Escape, click-outside,
       aria-expanded);
     • the mobile navigation toggle and its generated list;
     • the "current section" indication (aria-current + is-current class, so the
       dominant scene is signalled by more than colour alone).

   Reads the scene engine (MP.scroll) through its frame callback — it never
   attaches its own scroll listener. Safe to load when any DOM target is absent.
   Attaches to window.MP. Idempotent init().
   ============================================================================ */
(function (window, document) {
  'use strict';

  var MP = window.MP = window.MP || {};

  var APPEAR_AT = 16;              // px of scroll before the header appears
  var CLASS_VISIBLE = 'is-visible';
  var CLASS_OPEN = 'is-open';
  var CLASS_CURRENT = 'is-current';
  var PORTFOLIO_PREFIX = 'portfolio:';

  var state = {
    ready: false,
    visible: null,
    currentAnchor: null,
    offScroll: null,
    mobileOpen: false
  };

  /* --- local fallbacks: a missing MP.util must never break the header ----- */

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

  function makeEl(tag, opts, children) {
    if (MP.util && typeof MP.util.el === 'function') return MP.util.el(tag, opts, children);
    var node = document.createElement(tag);
    opts = opts || {};
    if (opts.text != null) node.textContent = String(opts.text);
    if (opts.html != null) node.innerHTML = opts.html;
    if (opts.class) node.className = opts.class;
    if (opts.attrs) {
      for (var key in opts.attrs) {
        if (opts.attrs.hasOwnProperty(key)) node.setAttribute(key, opts.attrs[key]);
      }
    }
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (children[i]) node.appendChild(children[i]);
      }
    }
    return node;
  }

  function closest(node, selector) {
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  function anchorLink(text, href, className) {
    return makeEl('a', {
      class: className,
      text: text,
      attrs: { href: href, 'data-anchor': 'true' }
    });
  }

  /* --- "My Works" dropdown ------------------------------------------------ */

  function categories() {
    return (MP.data && MP.data.categories) || [];
  }

  function buildWorksMenu() {
    var menu = qs('[data-works-menu]');
    if (!menu) return;
    while (menu.firstChild) menu.removeChild(menu.firstChild);
    var list = categories();
    for (var i = 0; i < list.length; i++) {
      var category = list[i];
      if (!category || !category.id) continue;
      var link = anchorLink(category.title || category.id, '#' + category.id, 'nav__menu-link');
      menu.appendChild(makeEl('li', { class: 'nav__menu-item' }, [link]));
    }
  }

  function worksToggle() { return qs('[data-works-toggle]'); }

  function isWorksOpen() {
    var toggle = worksToggle();
    return !!toggle && toggle.getAttribute('aria-expanded') === 'true';
  }

  function setWorksOpen(open) {
    var toggle = worksToggle();
    if (!toggle) return;
    open = !!open;
    var menu = qs('[data-works-menu]');
    var group = toggle.parentNode;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (menu) menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (group && group.classList) {
      if (open) group.classList.add(CLASS_OPEN);
      else group.classList.remove(CLASS_OPEN);
    }
  }

  function wireWorksMenu() {
    var toggle = worksToggle();
    var group = toggle && toggle.parentNode;
    if (!toggle || !group) return;

    listen(toggle, 'click', function (event) {
      event.preventDefault();
      setWorksOpen(!isWorksOpen());
    });

    var menu = qs('[data-works-menu]');
    if (menu) {
      listen(menu, 'click', function (event) {
        if (closest(event.target, '[data-anchor]')) setWorksOpen(false);
      });
    }

    listen(group, 'mouseenter', function () { setWorksOpen(true); });
    listen(group, 'mouseleave', function () { setWorksOpen(false); });
    listen(group, 'focusin', function () { setWorksOpen(true); });
    listen(group, 'focusout', function (event) {
      var next = event.relatedTarget;
      if (!next || !group.contains(next)) setWorksOpen(false);
    });

    listen(document, 'click', function (event) {
      if (!isWorksOpen()) return;
      if (!group.contains(event.target)) setWorksOpen(false);
    });
  }

  /* --- mobile navigation -------------------------------------------------- */

  function buildMobileNav() {
    var list = qs('[data-mobile-nav-list]');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    list.appendChild(makeEl('li', { class: 'mobile-nav__item' }, [
      anchorLink('Categories', '#categories', 'mobile-nav__link')
    ]));

    var items = categories();
    if (items.length) {
      var sublist = makeEl('ul', { class: 'mobile-nav__sublist' });
      for (var i = 0; i < items.length; i++) {
        var category = items[i];
        if (!category || !category.id) continue;
        var link = anchorLink(category.title || category.id, '#' + category.id, 'mobile-nav__link');
        sublist.appendChild(makeEl('li', { class: 'mobile-nav__subitem' }, [link]));
      }
      list.appendChild(makeEl('li', { class: 'mobile-nav__group' }, [
        makeEl('span', { class: 'mobile-nav__label', text: 'My Works' }),
        sublist
      ]));
    }

    list.appendChild(makeEl('li', { class: 'mobile-nav__item' }, [
      anchorLink('Contact Me', '#contact', 'mobile-nav__link')
    ]));
  }

  function setMobileOpen(open) {
    var toggle = qs('[data-nav-toggle]');
    var panel = qs('[data-mobile-nav]');
    if (!toggle || !panel) return;
    open = !!open;
    state.mobileOpen = open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.hidden = !open;
    if (open) panel.classList.add(CLASS_OPEN);
    else panel.classList.remove(CLASS_OPEN);
  }

  function wireMobileNav() {
    var toggle = qs('[data-nav-toggle]');
    var panel = qs('[data-mobile-nav]');
    if (!toggle || !panel) return;

    listen(toggle, 'click', function (event) {
      event.preventDefault();
      setMobileOpen(!state.mobileOpen);
    });

    listen(panel, 'click', function (event) {
      if (closest(event.target, '[data-anchor]')) setMobileOpen(false);
    });

    listen(document, 'click', function (event) {
      if (!state.mobileOpen) return;
      if (!panel.contains(event.target) && !toggle.contains(event.target)) setMobileOpen(false);
    });
  }

  function wireEscape() {
    listen(document, 'keydown', function (event) {
      var key = event.key;
      if (key !== 'Escape' && key !== 'Esc') return;
      if (state.mobileOpen) {
        setMobileOpen(false);
        var toggle = qs('[data-nav-toggle]');
        if (toggle && toggle.focus) toggle.focus();
        return;
      }
      if (isWorksOpen()) {
        setWorksOpen(false);
        var works = worksToggle();
        if (works && works.focus) works.focus();
      }
    });
  }

  /* --- visibility + current section --------------------------------------- */

  function setVisible(visible) {
    visible = !!visible;
    if (state.visible === visible) return;
    state.visible = visible;
    var header = qs('[data-header]');
    if (!header) return;
    if (visible) header.classList.add(CLASS_VISIBLE);
    else header.classList.remove(CLASS_VISIBLE);
    header.setAttribute('data-visible', visible ? 'true' : 'false');
  }

  function anchorForScene(sceneId) {
    if (!sceneId) return null;
    if (sceneId === 'explorer') return 'categories';
    if (sceneId.indexOf(PORTFOLIO_PREFIX) === 0) return sceneId.slice(PORTFOLIO_PREFIX.length);
    return sceneId;
  }

  function markCurrent(sceneId) {
    var anchor = anchorForScene(sceneId);
    if (anchor === state.currentAnchor) return;
    state.currentAnchor = anchor;

    var roots = [qs('[data-header]'), qs('[data-mobile-nav]')];
    for (var r = 0; r < roots.length; r++) {
      if (!roots[r]) continue;
      var links = qsa('[data-anchor]', roots[r]);
      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var href = link.getAttribute('href') || '';
        if (anchor && href === '#' + anchor) {
          link.classList.add(CLASS_CURRENT);
          link.setAttribute('aria-current', 'true');
        } else {
          link.classList.remove(CLASS_CURRENT);
          if (link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
        }
      }
    }
  }

  function watchScroll() {
    if (!MP.scroll || typeof MP.scroll.add !== 'function') return;
    state.offScroll = MP.scroll.add(function () {
      var y = (typeof MP.scroll.y === 'number') ? MP.scroll.y : 0;
      setVisible(y > APPEAR_AT);
      var sceneId = (typeof MP.scroll.current === 'function') ? MP.scroll.current() : null;
      markCurrent(sceneId);
    });
  }

  /* --- public API --------------------------------------------------------- */

  function init() {
    if (state.ready) return;
    state.ready = true;

    setVisible(false);
    buildWorksMenu();
    buildMobileNav();
    wireWorksMenu();
    wireMobileNav();
    wireEscape();
    watchScroll();
  }

  MP.header = {
    init: init,
    setVisible: setVisible
  };
})(window, document);
