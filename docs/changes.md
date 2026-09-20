<!-- COMMIT: 0.0.1 - 2026-09-20 -->

# Changes

## [2026-09-20] City photography replaced; sketches reordered; level design moved to second

- **System:** Content layer, media assets, category order (data/content.js, ssets/img/projects/)
- **Summary:** Three changes. (1) City photography images replaced with new high-resolution versions from the shared portfolio folder. (2) Sketches and Paintings hobby project reordered so the bird on a branch image displays first. (3) Level Design category moved from position 5 to position 2, right after Pixel Art.
- **Files:**
  - ssets/img/projects/photography/photography-city/ — 4 images replaced with new versions
  - ssets/img/projects/paintings/paintings-sketches-hobby/ — 6 images renamed with numeric prefixes for display order
  - data/content.js — categories reordered: Pixel Art, Level Design, Card Design, Sketches and Paintings, Photography
  - data/media-manifest.js — regenerated
  - docs/changes.md — this entry
- **Reason:** Owner request — replace city photography with new set, reorder bird image first, move level design to second position.
- **Risk:** low — asset replacement and content reorder only.
- **Test:** 
ode tools/check.js — PASS; 
ode tools/build-manifest.js — regenerated successfully.
<!-- COMMIT: 0.0.0 - 2026-09-20 -->

# Changes

## [2026-09-20] Explorer island stacking order

- **System:** Category explorer islands (`assets/css/components.css`)
- **Summary:** The explorer's category blobs now stack by an explicit per-category z-order
  instead of DOM order. Lowest to highest: **Photography** < **Card Design** (id `sketches`)
  < **Pixel Art** < **Sketches and Paintings** (id `paintings`) < **Level Design**. Pixel Art
  now sits above Card Design, and Photography now sits below both Card Design and Sketches and
  Paintings.
- **Files:**
  - `assets/css/components.css` - `.island` now reads `z-index: var(--island-z, var(--z-deco))`;
    a new per-category stacking block sets `--island-z` per `data-category-id`
  - `docs/changes.md` - this entry
- **Reason:** Owner feedback, verbatim: "make it so that the pixel art category is above the
  card design shape, in terms of the Z-axis... then make it so that photography is also lower
  on the Z-axis than card design, as well as lower on the Z-axis than sketches and paintings."
- **Decisions:** Stacking is expressed as a per-category custom property (`--island-z`) keyed by
  `data-category-id`, so the DOM / nav / scene order from `data/content.js` is untouched and no
  JS change is needed. Level Design keeps its previous top position. The two names the owner
  used map to the stable ids `sketches` (Card Design) and `paintings` (Sketches and Paintings).
- **Risk:** low - additive CSS only; purely cosmetic and independent of layout/hit-testing.
- **Test:** `node tools/check.js` -> PASS (18 JS files, 0 warnings).

## [2026-09-20] Adaptive aspect-ratio showcase; renamed two categories

- **System:** Portfolio scene + media carousel (data/content.js, ssets/js/carousel.js, ssets/css/components.css)
- **Summary:**
  - Renamed category sketches -> **Card Design**, and paintings -> **Sketches and Paintings** (title text only; ids kept as stable keys).
  - The media showcase now adapts to any image aspect ratio. The carousel stage resizes to the active slide's natural picture ratio (clamped to 0.45-2.2) with a smooth height transition, and images use object-fit: contain so the full image is always shown - never cropped, never overflowing.
- **Files:**
  - data/content.js - category titles
  - ssets/js/carousel.js - pplyAspect()/
aturalRatio() stage-sizing, image-load probe to re-fit on load
  - ssets/css/components.css - .media__img/.media__poster object-fit: contain; stage note
  - docs/changes.md - this entry
- **Reason:** Owner feedback, verbatim: rename categories; make the showcase adapt to any image aspect ratio (horizontal, vertical) with an animated swipe and no cropping or overflowing.
- **Decisions:** Kept category ids stable (code keys) and only changed visible 	itle text. Image fitting is contain (full image always visible) rather than cover (crop). Stage height is computed from the active slide's natural ratio so horizontal stays wide, vertical goes tall, and the shape change animates.
- **Risk:** low - carousel sizing is additive; JS validated.
- **Test:** 
ode tools/check.js -> PASS (5 pre-existing image warnings); 
ode --check assets/js/carousel.js -> OK.

## [2026-09-20] Hero line sharpened; explorer lede trimmed

- **System:** Content layer + no-JS fallback (`data/content.js`, `index.html`)
- **Summary:** Follow-up to the copy pass. The hero tagline is now "A sketchbook in one
  hand, a world in the other." (was "I draw, I paint, and I build places that don't exist
  yet."), and the "Oil, ink, light, and pixels." opener was cut from the category-explorer
  lede.
- **Files:**
  - `data/content.js` - `hero.tagline`, `explorer.lede`
  - `index.html` - the matching no-JS fallbacks
  - `docs/changes.md` - this entry
- **Reason:** Owner feedback, verbatim: "The homepage text could be a little bit better ...
  something less generic, but more personal to what this portfolio is about"; "just editing
  out the oil, ink, light, and pixels text. Remove that."
- **Decisions:** The new hero line names the two poles of the practice (a sketchbook = the
  drawings and paintings; a world = the pixel art and level design) instead of a generic
  "I draw, I paint". The lede still opens on "Five ways of working and one pair of hands",
  so it reads cleanly with the dropped sentence gone.
- **Risk:** low - content + static fallback only.
- **Test:** `node tools/check.js` -> PASS; `node --check data/content.js` -> OK.

## [2026-09-20] Real copy for the hero, category explorer and contact

- **System:** Content layer + no-JS fallback (`data/content.js`, `index.html`)
- **Summary:** The lorem placeholders in the three headline areas are now written copy -
  the hero tagline, the category-explorer intro and the contact scene - plus the
  site/social description and the footer copyright line. Project titles, descriptions and
  specs stay lorem: those are the owner's to write.
- **Files:**
  - `data/content.js` - `site.description`, `hero.tagline`, `hero.portraitAlt`,
    `explorer.eyebrow/title/lede`, `contact.eyebrow/title/message`, `contact.portraitAlt`,
    `footer.copy`
  - `index.html` - the matching no-JS fallbacks (meta / og / twitter description, hero
    tagline, explorer head, contact head, footer copy)
  - `docs/changes.md` - this entry
- **Reason:** Owner request, verbatim: "change the lorem ipsum text on the homepage at the
  very top to something elegant and nice, like an introduction to the portfolio"; "edit the
  contact-page at the very bottom to say something nice"; "edit the lorem ipsum text for the
  category section ... something that will feel right on that page."
- **Decisions:**
  - **Data and static fallback were both written.** `index.html` ships the same text for the
    no-JS view, so editing only `content.js` would have desynced the two.
  - **The copy leans on her real range** (sketches, paintings, photography, pixel art, level
    design) rather than generic artist filler - e.g. "from a painting you could hang on a
    wall to a level you could actually walk through."
  - **The category `blurb` fields were left untouched.** They are not rendered anywhere
    (`categories.js` shows only the title and the project count), so they are not on the page.
  - **`footer.copy` lost its trailing lorem** ("All rights reserved"), the only other visible
    lorem outside the project copy.
- **Risk:** low - content + static fallback only. No JS, CSS, DOM hook, data key or module
  API changed.
- **Test:** `node tools/check.js` -> PASS; `node --check data/content.js` -> OK; both files
  verified as clean UTF-8 with no mojibake (no stray U+00C3).

## [2026-09-20] Project specs are now just Project + Tools

- **System:** Content layer + contract doc (`data/content.js`, `docs/architecture.md`)
- **Summary:** Every project's `specs` list is now exactly two rows - **Project** (what the
  piece was) and **Tools** (software used). Year, Medium, Format, Dimensions, Client, Role
  and Location are gone from all 15 projects.
- **Files:**
  - `data/content.js` - all 15 project `specs` arrays rewritten; values are `Lorem ipsum` placeholders
  - `docs/architecture.md` - the section 4 project-object example and the specs-count line now describe the Project + Tools pair
  - `docs/changes.md` - this entry
- **Reason:** Owner request, verbatim: "remove 'shit' from category sections, such as year,
  as well as medium. Instead, I think only put for what it was, like for what project, as
  well as tools used. ... I can add stuff like Photoshop, Blender 3D ... And that's it, no
  dimensions, no format, and bullshit like that."
- **Decisions:**
  - **Data + doc only.** The section 4 `specs` schema is a free-form `{ label, value }[]` and
    optional; `MP.data.normaliseSpecs` and `portfolio.js#buildSpecs` accept any label set -
    no JS, CSS, DOM hook or module API touched.
  - **Two rows, because the owner asked for "what it was" and "tools used".** Project carries
    the nature of the piece; Tools carries the software.
  - **Values stay `Lorem ipsum` placeholders**, matching the file's convention that any lorem
    string is copy the owner will replace.
- **Risk:** low - content + doc only.
- **Test:** `node tools/check.js` -> PASS; `node --check data/content.js` -> OK; 15 projects x
  2 spec rows verified.

## [2026-09-16] Footer carries no links; content.js re-saved as clean UTF-8

- **System:** Content layer + no-JS fallback (`data/content.js`, `index.html`)
- **Summary:** The footer nav no longer lists Instagram and Email â€” every contact method
  already lives on the contact scene, so the footer is now just the copyright line and
  "Back to top". At the same time the double-encoded punctuation in `content.js` was
  reversed, so the copyright reads "Â© 2026 Marcelina Miani Â·" and the browser tab reads
  "Marcelina Miani â€” Portfolio" instead of "Ã‚Â© â€¦ Ã‚Â·" / "Ã¢â‚¬" ".
- **Files:**
  - `data/content.js` â€” `footer.links` emptied (the key stays, so the Â§4 schema is intact);
    the 15 double-encoded code points were rewritten as real characters; the FOOTER banner
    comment and the file-map line at the top now state that the footer has no links
  - `index.html` â€” the two static footer `<li>` fallbacks are gone; `<ul
    class="site-footer__links" data-footer-links>` is kept but empty
  - `docs/to-do.md` â€” the "mangled punctuation" open item is closed (it was fixed here)
  - `docs/changes.md` â€” this entry
- **Reason:** Owner request, verbatim: "I don't want links to be on the footer at all,
  because they're already on the contact page. So, remove the Instagram and email, and also
  fix up the text for the copyright. It has some weird symbols in it."
- **Decisions:**
  - **`footer.links` stays as a key with an empty array**, rather than being deleted.
    `contact.js#renderFooter` reads `footer.links`, clears the container, then returns when
    it is not an array or is empty â€” so an empty list renders nothing and the documented
    schema (`footer: { copy, links: [...] }`) still describes the file. Dropping the key
    would have been schema drift for zero gain.
  - **The `[data-footer-links]` hook is kept in `index.html` even though nothing renders
    into it.** `tools/check.js` rule 2 requires every `[data-*]` hook that JS queries to
    exist in the document (it is not JS-generated), so removing the `<ul>` would have
    turned a green check red. It measures 0Ã—0, so the empty `nav` costs nothing visually or
    in layout.
  - **The encoding fix was done as an encoding round-trip, not a find/replace.** The file
    had been through one bad save: real UTF-8 bytes were once decoded as cp1252 and then
    re-saved as UTF-8, so "â€”" was stored as three characters (U+00E2 U+20AC U+201D) and "Â©"
    as two (U+00C2 U+00A9). Reversing it (encode the string back to cp1252, decode those
    bytes as UTF-8) restores every affected character in one pass without guessing which
    character each blob was meant to be. Only `content.js` was affected; every other file
    in the project was already correct, and the BOM and CRLF/LF state are unchanged.
  - **The em dashes inside code comments were fixed too.** They are invisible on the page,
    but leaving half of one file double-encoded is exactly how the bug comes back.
- **Risk:** low. Purely content + static fallback; no JS, no CSS, no DOM hook, no module API
  changed. `contact.js` and `MP.data` are untouched.
- **Test:** `node tools/check.js` â†’ **PASS** (18 JS files, 7 expected "image not on disk
  yet" warnings; `node --check` on the rewritten `data/content.js` passes, so the data file
  still parses). Then rendered in headless Chrome (152) over `file://` at **1440Ã—900 and
  390Ã—844**: `document.title` is `Marcelina Miani â€” Portfolio`, `footerLinkCount: 0` and
  `footerAnchorsInFooter: 0` (the footer contains no anchors at all), the copy text reads
  `Â© 2026 Marcelina Miani Â· Lorem ipsum dolor sit amet, consectetur adipiscing elit.` with
  exactly `U+A9, U+B7` as its only non-ASCII characters, the empty footer nav measures
  **0Ã—0** so the copyright stays left and "Back to top" stays right (column at 390px), the
  contact pair still measures `dW 0, dTop 0`, `hOverflow 0`, and the console is `clean`.

  ```
  node tools/check.js
  # harness (outside the project tree):
  #   chrome --headless=new --remote-debugging-port=9233 --user-data-dir=<temp>\mp\cdpF2
  #   node <temp>\mp\footer.js "file:///â€¦/marcelina-portfolio/index.html" "<temp>\mp\footer"
  ```

## [2026-09-16] Contact actions share one symmetrical row

- **System:** Presentation layer (`assets/css/scenes.css`, `assets/css/components.css`)
- **Summary:** The LinkedIn pill and the Email CTA are now one row of two equal halves
  sitting directly under the contact paragraph. The row is exactly as wide as the
  paragraph above it, the two controls are mirror images (same width, same height, same
  top edge), and the halves stretch to fill the column instead of hugging their labels.
- **Files:**
  - `assets/css/scenes.css` â€” Â§4 CONTACT: `.contact__body` became a wrapping flex line
    (`flex-wrap: wrap`, `column-gap: var(--sp-2)`); the eyebrow/title/message claim
    `flex: 0 0 100%` so they own whole lines and only the last line is the pair;
    `.contact__links` + `.contact__cta` are `flex: 1 1 0` with one shared
    `margin-block-start: var(--sp-4)`; `.contact__cta` is a flex box whose `.btn` grows;
    an empty half is dropped with `:not(:has(â€¦))`
  - `assets/css/components.css` â€” Â§7 contact links: `.contact__links li` stretches and
    `a` grows + centres, so a single pill fills its half and matches the CTA's height
  - `docs/changes.md` â€” this entry
- **Reason:** Owner request, verbatim: "Make it so that the LinkedIn and email button are
  horizontally placed next to each other, and that they extend in a way that fills the
  space nicely, so that they are perfectly symmetrical next to each other, right under the
  text paragraph above them."
- **Decisions:**
  - **CSS only.** No DOM change, no `contact.js` change, no new data key â€” the frozen
    markup contract in architecture Â§3 (`[data-contact-links]` `<ul>` + `[data-contact-cta]`
    `<div>`) is untouched, and the no-JS fallback in `index.html` keeps working as-is.
  - **Symmetry comes from the flex maths, not from a magic width.** Both halves are
    `flex: 1 1 0` (equal basis, equal grow) inside a body capped at `46ch`, so they resolve
    to `(bodyWidth âˆ’ 16px) / 2` each at every viewport â€” the two controls are identical to
    the sub-pixel, and the pair spans precisely the paragraph's left and right edges.
  - **Left/right is DOM order.** `contact.js` appends the pills first and the promoted CTA
    second, so LinkedIn lands left and Email right for free; reordering the two entries in
    `content.js` would swap them. Nothing is positioned by hand.
  - **Heights are levelled by stretching, not by a new constant.** The pill's `min-height:
    44px` grows into the CTA's 48px row height, so both read as one control set without
    hard-coding a third value (42px at â‰¤600px, per the existing ruleset band).
  - **The row still degrades honestly.** If `content.js` loses its last pill, or the email
    entry is deleted and the CTA renders empty, `:not(:has(li))` / `:not(:has(a))` hides
    that half and the surviving control takes the full line â€” a deleted method can never
    leave a dead column beside a half-width button.
  - **Mobile deliberately keeps the pair side by side.** The â‰¤860px block still centres
    the copy and widens the body to `52ch`; at 390px the row is 350px wide with two 167px
    halves, which fits "LinkedIn â†’" and "Email" without wrapping, so nothing stacks.
- **Risk:** low â€” presentation only. No module API, DOM hook, data key or copy changed;
  `node tools/check.js` is unaffected and still PASSes.
- **Test:** `node tools/check.js` â†’ **PASS**. Then measured in headless Chrome (152) over
  `file://`, scrolling to `#contact` at **1440Ã—900, 1280Ã—560, 1024Ã—768, 820Ã—1180, 768Ã—1024,
  390Ã—844 and 844Ã—390** â€” at every single size the pill and the button report
  `dTop 0, dBottom 0, dW 0` (level tops, level bottoms, identical widths), a `16px` gap
  between them, `dropFromMsg 32px` under the paragraph, and `rowVsMsg {dl: 0, dr: 0}` â€” the
  pair's left and right edges land exactly on the paragraph's. Halves measured 204.1px at
  1440Ã—900, 229.9px at 820/768/844-wide, and 167px at 390Ã—844 (44px tall there, 48px above
  700px), with `hOverflow 0` and a `clean` console at all seven sizes.

  ```
  node tools/check.js
  # harness (outside the project tree):
  #   chrome --headless=new --remote-debugging-port=9231 --user-data-dir=<temp>\mp\cdpCTA
  #   node <temp>\mp\cta.js "file:///â€¦/marcelina-portfolio/index.html" "<temp>\mp\cta"
  ```

## [2026-09-16] Contact methods are now LinkedIn + email only

- **System:** Content layer (`data/content.js`, `index.html` no-JS fallback)
- **Summary:** The contact scene no longer lists Instagram, Behance or phone. The
  remaining methods are email (still the promoted CTA button) and LinkedIn, which appears
  as the single pill.
- **Files:**
  - `data/content.js` â€” `contact.links`: the `instagram`, `behance` and `phone` entries are
    gone; one `{ type: "link" }` entry for LinkedIn was added beside the existing `email` entry
  - `index.html` â€” the static no-JS `[data-contact-links]` fallback matches the data again
    (one LinkedIn pill; email stays CTA-only, per `contact.js` dedupe)
- **Reason:** Owner request, verbatim: "on the contacts page, remove Instagram, Behance, and
  phone number, and instead replace it with LinkedIn and email."
- **Decisions:** LinkedIn uses the generic `type: "link"` from the Â§4 enum rather than a new
  type â€” `hrefFor()` reads `href` directly for any non-`email`/`phone` type, and
  `isExternal()` gives it `target="_blank" rel="noopener noreferrer"` because the href is
  absolute. No module, DOM hook or CSS changed. The `email` entry is kept in `links` because
  `ctaLink()` promotes it to the "Email me" button and `renderLinks()` then skips it as a
  pill, so email can never render twice.
- **Risk:** low â€” data + static fallback only. `node tools/check.js` still PASSes.
- **Test:** `node tools/check.js` â†’ **PASS** (18 JS files, 7 expected "image not on disk yet"
  warnings). Byte-diff of `data/content.js` against the pre-edit copy confirms the only
  changed region is the three removed lines â†’ one LinkedIn line, BOM intact and no other
  byte touched.

## [2026-09-16] Star presets replaced; the island scatter is resolved instead of guessed

- **System:** Presentation layer (`assets/js/categories.js`, `assets/css/scenes.css`,
  `assets/css/components.css`, `docs/architecture.md`)
- **Summary:** Two owner-requested changes. (1) Two of the seven blob presets were the
  pointy ones â€” a five-petal blossom and a five-point sparkle â€” and they read as stars
  next to the round shapes. Both were re-authored as smooth pebbles in the same family
  as the presets the owner named: a soft cloud pebble and a wide cushion pebble, no
  tips, no corners, no cusps. (2) The island scatter no longer piles up at any window
  size, and the shapes are bigger. The authored `island.x/y` are kept as intent, and every
  time the field changes size the cluster is re-resolved against the field's real rect:
  silhouettes are fitted to the field, dropped back on their authored spots, then settled
  until they are as large as the field can hold without swallowing each other.
- **Files:**
  - `assets/js/categories.js` â€” `blob-02`/`blob-04` re-authored; new "silhouette
    metrics" + "organic layout" sections (per-preset `rho`, fitted sizing, separation
    pass, `ResizeObserver` trigger); idle float eased (amp 8â†’6, rot 2â†’1.5)
  - `assets/css/scenes.css` â€” island width now comes from the resolved `--island-w`;
    the three explorer `--size-*` width rules are gone; the field's height floor raised
    (64svh/820 â†’ 74svh/900, short-viewport 300/440 â†’ 360/520) so the cluster has the room
    to be big
  - `assets/css/components.css` â€” `blob-04` label cap 56% â†’ 76% (its new waist is wider)
  - `docs/architecture.md` â€” Â§7 island behaviour + Â§9 preset contract (smoothness, the
    `rho` circle test and the no-pile-up rule)
  - `docs/image-guide.md` â€” Â§5 now explains how a cover lands inside the shape and what
    size to shoot for
- **Reason:** Owner feedback, verbatim: "sketches and vector art are star-shaped â€¦ I
  would like a shape kind of similar to 3D modeling, painting, and photography shapes.
  Those are the best-looking ones, simple, smooth, wavy, and just fitting"; and "whenever
  you are scaling the screen size â€¦ the icons don't overlap as much â€¦ they're supposed to
  actually be not even overlapping at all â€¦ the whole point is that they are as close as
  possible to each other, but still not screwing each other up. Not on a grid-like, it
  shouldn't be symmetrical and stuff. It should look organic, like they have been thrown
  onto the ground." Then, on the first pass: "I just want them a little bit bigger â€¦ They
  can even be overlapping, but maximum by 10 pixels â€¦ Mobile layout is perfect right now."
- **Decisions:**
  - **Smoothness is now a contract, not a preference.** `blob-02` (five-petal blossom)
    and `blob-04` (five-point sparkle) were the only presets whose chords turned hard â€”
    up to 9.6Â° at the petal tips and 111.4Â° at the genuine cusps â€” which is exactly what
    made them read as stars. Both replacements are single smooth loops that turn 6.2Â° and
    4.0Â° at their sharpest. Both were generated from a smooth polar radius profile
    (harmonic swells, no cusps possible) and emitted as closed cubic-Bezier loops, then
    uniformly fitted into the 4â€“196 box like the rest.
  - **`x`/`y` are intent, `--island-x/y` are results.** The old CSS sized islands from
    the viewport width (`25vw`) while the field's height came from `svh`, so a wide,
    short window piled seven 240â€“390px shapes into a 576px-tall band. Now
    `categories.js` measures the field and does the sizing itself.
  - **Separation is a circle test, so rotation cannot cheat it.** Each preset is measured
    once for `rho`, the furthest its edge reaches from the box centre. A circle of
    `rho Ã— width` contains the silhouette at every rotation, so "these two circles are
    far enough apart" is a proof about the two blobs, not an approximation.
  - **Bigger is the goal; a little lapping is allowed.** The owner traded the old daylight
    for size, so the separation target is now `2 Ã— drift âˆ’ overlap` = `2 Ã— 7 âˆ’ 10` = 4px
    of dedicated float head-room: the shapes come to rest touching or a couple of px
    apart, and the measured worst case is 0.3â€“9px of clearance â€” never a swallow, never a
    pile. The float was eased to `amp 6` at the same time so the motion stays inside that
    budget. Bisecting for the largest size that still resolves (rather than guessing a
    constant) is what lets the cluster go big on a roomy screen and honestly shrink on a
    cramped one.
  - **Organic, deterministic, never a grid.** Nothing is randomised: the authored spots
    carry the asymmetry and the push-apart only moves what has to move, so the same
    window always yields the same arrangement and it keeps the thrown-on-the-ground look
    (measured drift from author intent was 6â€“19%, largest where the field is smallest).
  - **One trigger, no new listeners.** A `ResizeObserver` on the field re-resolves the
    layout, which covers window resizes, the â‰¤600px breakpoint flip and the reflow when
    webfonts land â€” no per-frame polling, and no second resize listener beside
    `scroll.js`'s.
  - **â‰¤600px is untouched.** `scenes.css` still flows the islands into a wrapped flex
    layout there; the module detects the computed `position` and hands sizing back to CSS
    rather than duplicating the breakpoint. The owner called the mobile mosaic perfect, and
    it is bit-for-bit what it was: measured at 390Ã—844 it is still a 2-up 156px stack with
    `--island-w` cleared on every island and no rotation.
  - **The image path was re-proven, not assumed.** A real 1200Ã—1200 cover was dropped in,
    the manifest regenerated and the page rendered: the island picked it up at
    `opacity: 1`, `object-fit: cover`, inside `clip-path: url(#blob-07)`. Test file and
    manifest then restored byte-for-byte, so the site still ships in its placeholder state.
- **Risk:** low â€” presentation only. No data key, DOM contract or module API changed;
  `MP.categories` still exposes `init` and `presets`, and islands are still the same
  `<a class="island island--blob-0N island--size-*">` markup with an `<img>` inside the
  clipped `.island__media`.
- **Test:** `node tools/check.js` â†’ **PASS** (18 JS files; 7 warnings, all expected
  "image not on disk yet"). Silhouette separation proven programmatically against the real
  `categories.js` (loaded in a minimal DOM stub, driven through its own `ResizeObserver`)
  by sampling each preset's curves, transforming every silhouette by its resolved centre,
  width and rotation, and measuring silhouette-to-silhouette distance at 12 field sizes:
  1920Ã—1080, 1440Ã—900, 1366Ã—768, 1280Ã—800, 1200Ã—620, 1280Ã—560, 1024Ã—768, 900Ã—700,
  820Ã—1180, 700Ã—900, 601Ã—900 and 2560Ã—1440 â€” **7 islands at every size, never a swallow:
  the closest pair sits 0.3â€“9px apart, the biggest island runs 220â€“508px, the smallest
  189â€“437px.** Then the same thing in a real browser (headless Chrome via CDP) at
  1440Ã—900 and 1440Ã—1500: field 1296Ã—666 / 1296Ã—956, islands `lg` 334.6px / 383.1px and
  `md` 287.7px / 329.5px, 7 `clipPath` defs, `hOverflow: 0`, console `clean`, and the
  cluster sits in the same organic two-band scatter the author drew. At 390Ã—844 the mosaic
  is unchanged: `position: relative`, `--island-w` cleared, `rotate: 0deg`, 156px islands,
  2-up, no overflow.

  ```
  node tools/check.js
  # harnesses (outside the project tree):
  #   gen.js / gen2.js       -> author + measure candidate blob paths
  #   layout-test.js         -> drives assets/js/categories.js, reports silhouette gaps
  #   mp/islprobe.js         -> headless-Chrome geometry probe + screenshot per viewport
  ```

## [2026-09-15] Visual pass â€” hero lifted, crowded organic islands, seamless contact cut-out

- **System:** Presentation layer (`assets/css/scenes.css`, `assets/css/components.css`,
  `assets/js/categories.js`, `data/content.js`, `docs/architecture.md`)
- **Summary:** Three owner-requested changes. (1) The hero name block
  (MARCELINA / MIANI / tagline) now sits high in the frame instead of dead centre.
  (2) The category explorer no longer reads as seven lonely ovals: every blob preset
  was re-authored â€” lobed rock, five-petal blossom, lobed rounded-square, five-point
  sparkle, kidney bean, teardrop and a squared blob with a bite â€” none of them an oval,
  each fitted to fill its box, with bigger island slots and a tight zig-zag scatter so
  the shapes overlap and compete for the eye. (3) The contact portrait is no longer a
  framed card: it is a cut-out that stands on the footer line and runs the full height
  of the scene.
- **Files:**
  - `assets/js/categories.js` â€” seven new blob presets (cubic segments only)
  - `assets/css/components.css` â€” per-preset label widths, bigger island size classes,
    tighter count label
  - `assets/css/scenes.css` â€” `--hero-lift`, explorer field/slot sizes, frameless
    contact cut-out + responsive fallbacks
  - `data/content.js` â€” one distinct preset, size, position and angle per category
  - `docs/architecture.md` â€” Â§9 requirement line now matches the shipped presets
- **Reason:** Owner feedback, verbatim: "Marcelina Miani is supposed to be higher
  vertically up"; "I don't like that the categories have egg shapes â€¦ the current shape
  that is used for paintings is the ideal kind of example â€¦ there are way too many eggs
  and way too many semi-circles â€¦ make them bigger, make them all basically stuff each
  other out â€¦ they're all begging for attention now that they are 5 m apart"; "the image
  at the contact section is not a literal frame, but rather it will seamlessly fit into
  the scene â€¦ visible all the way from the top of the footer all the way across the
  verticality of the screen".
- **Decisions:**
  - **Paintings keeps its preset.** `blob-03` (the lobed rounded-square) is unchanged
    except for the shared box-fitting, because the owner named that silhouette as the
    ideal; the other six are new, and no preset repeats across the seven categories.
  - **Presets are generated, then frozen.** Each shape is sampled from a polar radius
    profile (gaussian waists, cusped tips) and emitted as a closed cubic-Bezier loop,
    then uniformly fitted into a 4â€“196 box so the normalised path can never leave the
    0â€“1 unit box. Only `C` segments are emitted, so architecture Â§9 still holds. The
    `blob-04` cusps are genuine corners (both handles pinned at the tip).
  - **Hero lift uses `translate`, never `transform`.** `.hero__title` and
    `.hero__tagline` share one `--hero-lift` distance, so the staged entrance (which
    owns `transform`) and the JS-owned parallax layers stay untouched.
  - **The cut-out is positioned against the scene.** `.contact__inner` became
    `position: static` so `inset-block: 0` measures the scene, not the grid: the PNG's
    bottom edge lands exactly on the footer's top border and its top at the scene's
    first pixel. No border, radius, surface, shadow box or `overflow: hidden`. The copy
    is pinned to grid column 2. At â‰¤860px the cut-out returns to normal flow, still
    frameless, so it can never sit behind the copy.
  - **Labels follow their silhouettes.** Each preset's pill cap was measured from its
    own waist at the label band; the count line's size floor and tracking were trimmed
    so "3 PROJECTS" holds one line down to 390px.
  - **Placeholders stay graceful.** A missing cover image still falls back to the pastel
    placeholder; in the contact slot it renders as a soft blurred ghost that spans the
    scene height, so the scene never looks empty or framed before the PNG lands.
- **Risk:** low â€” presentation only. No JS behaviour, data key or DOM contract changed.
- **Test:** `node tools/check.js` â†’ **PASS** (18 JS files; 9 warnings, all expected
  "image not on disk yet"). Blob contract re-verified programmatically: 7 presets, one
  closing `Z` each, only `C` segments, every normalised coordinate inside `0..1`.
  Headless-Chrome render + geometry probe at 1440Ã—900, 1440Ã—1120, 1280Ã—560, 820Ã—1180,
  768Ã—1024 and 390Ã—844: hero title top moved 338px â†’ 232px at 1440Ã—900; all seven
  islands read as distinct, overlapping silhouettes with every label legible; the
  explorer reflows to a 2-up mosaic at â‰¤600px with no wrapped count lines; the contact
  cut-out measures 620Ã—900 with its bottom flush on the footer and 3px clear of the copy
  column; `scrollWidth === clientWidth` at every size (no horizontal overflow).

  ```
  node tools/check.js
  # render + measurement harness (outside the project tree):
  #   shot.js  <outDir> <w> <h> <selector:label> ...   -> PNG per section
  #   probe.js                                          -> element geometry + overflow
  ```

## [2026-09-15] Full site build â€” data-driven, scroll-driven vanilla portfolio

- **System:** Entire site (`index.html`, `data/*`, `assets/css/*`, `assets/js/*`, `tools/*`)
- **Summary:** Built the complete front end from scratch as a data-driven, scroll-driven
  vanilla HTML/CSS/JS portfolio â€” no framework, no bundler, no npm dependencies. Every screen
  is composed from the single `data/content.js` payload: hero, category explorer with organic
  island links, one full-screen portfolio scene per category, contact and footer. All
  JavaScript is classic `<script defer>` attached to the `window.MP` namespace, so the site
  runs identically from `file://` (double-click) and from a local server. Presentation comes
  only from the source data; adding a category needs no code edits.
- **Files:**
  - `index.html`
  - `data/content.js`, `data/media-manifest.js`
  - `assets/css/tokens.css`, `base.css`, `layout.css`, `components.css`, `scenes.css`
  - `assets/js/util.js`, `motion.js`, `scroll.js`, `data.js`, `header.js`, `hero.js`,
    `media.js`, `carousel.js`, `lightbox.js`, `portfolio.js`, `categories.js`, `autoplay.js`,
    `contact.js`, `main.js`
  - `assets/img/_placeholder.svg`
  - `tools/build-manifest.js`, `tools/check.js`
  - `docs/architecture.md`, `project-plan.md`, `css-style-ruleset.md`, `image-guide.md`,
    `changes.md`, `to-do.md`
- **Reason:** Deliver the frozen interface contract (`docs/architecture.md`) as a working,
  client-editable portfolio whose copy and images can change without touching code.
- **Decisions:**
  - **Native scroll, no hijack.** Smoothness comes from damped interpolation of *element
    transforms* only; the page itself scrolls natively (plan Â§7 â€” accessibility, touch and
    native behaviour preserved).
  - **Single rAF engine.** `scroll.js` owns the one `requestAnimationFrame` loop with exactly
    one scroll listener and one resize listener; every module subscribes through
    `MP.scroll.add`, so no element registers its own listener (plan Â§6).
  - **Classic deferred scripts.** Ordered `<script defer>` tags â€” no ES modules, no `fetch` â€”
    chosen so the site works over `file://` as well as over HTTP.
  - **Manifest-driven images.** `data/media-manifest.js` is generated from the folder tree, so
    dropping files in and re-running the tool is the whole image workflow.
  - **Placeholder-first media.** Every image slot has a fixed `aspect-ratio` box and falls back
    to `assets/img/_placeholder.svg`, so missing media never shifts layout or shows a broken
    glyph.
- **Risk:** low
- **Test:** `node tools/check.js` exits **0** (PASS â€” 18 JS files; warnings only for
  not-yet-supplied images). Headless-Chrome render + interaction passes at desktop (1440Ã—900),
  tablet (820Ã—1180, 768Ã—1024), short viewport (1280Ã—560) and mobile (390Ã—844, 844Ã—390):
  carousel drag / arrows / dots, lightbox open / zoom / prev-next / Esc, anchor navigation and
  project prev/next all behave; `overflowCount: 0` (no horizontal overflow); the CDP `CONSOLE`
  line is `clean`; `prefers-reduced-motion` removes parallax, float and autoplay. Exact
  commands:

  ```
  node tools/build-manifest.js          # regenerate data/media-manifest.js from the image folders
  node tools/check.js                   # static consistency check â€” exits 0 on PASS

  # render/screenshot through the headless Chrome + CDP harness (server at 127.0.0.1:8099)
  Start-Process "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList `
    "--headless=new","--disable-gpu","--no-sandbox","--hide-scrollbars", `
    "--remote-debugging-port=9227","--user-data-dir=<temp>\mp\cdpF","about:blank" -WindowStyle Hidden
  $env:CDP_PORT=9227
  node "<temp>\mp\shot.js" "http://127.0.0.1:8099/index.html" "<out>.png" 1440 900 "#pixel-art" 3000
  ```

- **Fixes in the same session:** the static no-JS contact fallback no longer lists the email
  method twice â€” it now appears once, promoted to the CTA, matching `contact.js`; the portfolio
  project counter reads `Project 1 of 3` while the carousel counter keeps `1 / 3`, so the two
  are no longer ambiguous (both stay `aria-live="polite"`); stale `index.html` comments that
  credited the wrong module for the header menu markup were corrected. `docs/to-do.md` was
  refreshed for handover.

## [2026-09-15] Content layer, media manifest tooling and handoff docs

- **System:** Content + image pipeline (`data/*`, `tools/*`, `docs/image-guide.md`)
- **Summary:** Delivered the data-driven content layer and the zero-dependency tooling that
  makes image placement effortless. `data/content.js` defines `window.MP_DATA` with all seven
  categories in contract order (each with three lorem projects, 2â€“4 specs and an empty media
  array), distinct scene tints, hand-tuned island placements, and fully lorem placeholder copy.
  `data/media-manifest.js` ships empty so the site renders its placeholder state.
  `tools/build-manifest.js` scans the image folders and regenerates the manifest idempotently;
  `tools/check.js` runs the five static consistency checks and exits non-zero on failure.
- **Files:**
  - `data/content.js`
  - `data/media-manifest.js`
  - `tools/build-manifest.js`
  - `tools/check.js`
  - `docs/image-guide.md`
  - `docs/to-do.md`
  - `docs/changes.md`
- **Reason:** The contract (`docs/architecture.md` Â§4â€“6, Â§11â€“12) requires a single editable
  content file and a generated media manifest, plus a checker that keeps the parallel agent
  build honest. The client, an artist, must be able to add images with no code edits.
- **Decisions:** Manifest values are stored as **bare file names** (the bucket key supplies the
  folder), matching the literal Â§5 example and the key-per-folder structure â€” see the header
  comment in `data/media-manifest.js`. Missing content image paths are reported as WARN, not
  FAIL, because the global failure rule mandates a placeholder rather than an error. The
  generation timestamp is preserved when the scan result is unchanged, so re-runs are
  byte-identical.
- **Risk:** low
- **Test:** `node tools/build-manifest.js` (idempotent, exit 0), `node tools/check.js`
  (exit 0 when every file is present). At the time of this build `check.js` reports one FAIL â€”
  `index.html` does not exist yet â€” and warnings for not-yet-supplied images; both are expected
  until the parallel agents deliver their files.


