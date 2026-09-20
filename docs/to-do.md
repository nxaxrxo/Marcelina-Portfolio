# To-do

Handover checklist after the full site build. The site is finished and runs from
`index.html`; everything left is content, not code.

## Done
- [x] Complete vanilla HTML/CSS/JS site — hero, category explorer, 7 portfolio scenes,
      contact and footer, all built from `data/content.js`
- [x] Native scroll with damped motion, single rAF engine, no scroll hijack
- [x] Carousel, lightbox, anchor + project navigation, reduced-motion support
- [x] `data/media-manifest.js` + `tools/build-manifest.js` image scanner
- [x] `tools/check.js` static consistency checker (prints PASS)
- [x] `docs/image-guide.md` client handoff guide

## What remains
- [ ] **Drop in real images.** Portraits into `assets/img/hero/` and `assets/img/contact/`,
      island covers into `assets/img/categories/`, and project pictures into
      `assets/img/projects/<category>/<project>/`. See `docs/image-guide.md`.
- [ ] **Run the manifest rebuild.** After any image change, run
      `node tools/build-manifest.js` so the site picks the new files up.
- [ ] **Replace the lorem copy.** Open `data/content.js` and replace every "lorem ipsum…"
      string with real text (hero tagline, explorer intro, project titles/descriptions/specs,
      contact message, footer). Keep all `id` values and key names unchanged.
- [ ] **Set `site.url`.** In `data/content.js`, once a domain exists, so the canonical link
      and social previews fill in.

## Before launch
- [ ] `node tools/check.js` prints PASS.
- [ ] Open `index.html` from disk and from a local server — console clean, and every image
      slot shows either its image or the pastel placeholder (never a gap).
