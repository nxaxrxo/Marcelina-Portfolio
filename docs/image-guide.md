# How to add your images

Hello! This guide is for you — no coding needed.

You never have to touch code to add artwork. You **drop image files into folders**, run **one short command**, and the website finds them automatically and puts them in the right place.

If you only remember one thing, remember this:

> **Put the picture in the right folder, then run `node tools/build-manifest.js`.**

Everything else is detail.

---

## 1. The big picture

All images live inside one folder: `assets/img`. Inside it there are four places that matter to you:

- **`hero/`** — the big portrait on the very first screen.
- **`contact/`** — the portrait on the final "get in touch" screen.
- **`categories/`** — the picture shown on each floating island in the category menu.
- **`projects/`** — every portfolio image, sorted by category and then by project.

Here is the whole map:

```text
marcelina-portfolio/
└── assets/
    └── img/
        ├── _placeholder.svg        <- the pretty fallback image. Please don't touch.
        ├── hero/
        │   └── portrait.png        <- the opening-screen portrait
        ├── contact/
        │   └── portrait.png        <- the contact-screen portrait
        ├── categories/
        │   ├── pixel-art.jpg       <- island picture for "Pixel Art"
        │   ├── paintings.jpg
        │   ├── sketches.jpg        <- island picture for "Sketches"
        │   ├── photography.jpg
        │   └── level-design.jpg
        └── projects/
            ├── pixel-art/
            │   ├── pixel-art-lorem-ipsum/
            │   │   ├── 01.jpg
            │   │   ├── 02.jpg
            │   │   └── 03.jpg
            │   ├── pixel-art-sed-eiusmod/
            │   └── pixel-art-tempor-incididunt/
            ├── paintings/
            ├── sketches/
            ├── photography/
            └── level-design/
```

You don't need to memorise it. Bookmark this page.

---

## 2. What you can drop in

| Question | Answer |
|---|---|
| Which picture formats? | `.jpg` `.jpeg` `.png` `.webp` `.avif` `.gif` `.svg` (and videos: `.mp4` `.webm` `.mov`) |
| What size / shape? | **Anything.** Any width, any height, any aspect ratio. Portrait, landscape, square — all fine. |
| Do I need to resize or crop? | **No.** The website crops and frames every image automatically so it always looks tidy. |
| Is there a size limit? | No hard limit. For a fast website, keep photos under ~2 MB each where you can. |
| Are special file names required? | Only for the island covers (section 5) and the two portraits. Project images can be named anything. |
| Can I prepare images later? | Yes. The site shows a soft pastel placeholder wherever an image is missing — nothing ever breaks. |

**One thing to avoid:** files whose name starts with an underscore `_` or a dot `.` are ignored on purpose (they're treated as hidden/unfinished). That's why the fallback is called `_placeholder.svg`.

---

## 3. The opening and contact portraits

Drop **one** portrait file each here:

- `assets/img/hero/portrait.png` — shown on the opening screen.
- `assets/img/contact/portrait.png` — shown on the contact screen.

A transparent PNG of the artwork/artist works best, but any image is accepted.

If you prefer a different file name, that is fine — just make sure the same name is written in `data/content.js` (see section 8). If you do nothing, a placeholder shows instead and nothing breaks.

Optional extra: you may add a `background.jpg` inside `hero/` if you want a custom hero backdrop.

---

## 4. Project images — the everyday job

This is where you'll spend most of your time. Each **project** has its **own folder**, and you simply drop its pictures inside.

**Folder pattern:**

```text
assets/img/projects/<category-id>/<project-id>/
```

For example:

```text
assets/img/projects/paintings/paintings-ut-labore/01.jpg
assets/img/projects/paintings/paintings-ut-labore/02.jpg
assets/img/projects/paintings/paintings-ut-labore/03.jpg
```

**Naming your pictures:** name them `01.jpg`, `02.jpg`, `03.jpg`, `04.jpg` … The site shows them in that order.

- You can use any names (`sunset-final.jpg`, `detail-a.jpg`) — the site sorts them sensibly.
- But numbering (`01`, `02`, `03`, … `10`) always keeps things in the order you expect.
- The first image is the one shown as the project's main picture.

You can drop **as many or as few** as you like. One image, ten images — both fine. The site turns them into a swipeable carousel automatically.

---

## 5. Island covers — the floating category pictures

In the category menu, each floating island shows one picture. To replace it:

1. Put a picture in `assets/img/categories/`.
2. Name it **exactly** after the category, using its id:

| Category name | Put this file in `assets/img/categories/` |
|---|---|
| Pixel Art | `pixel-art.jpg` |
| Paintings | `paintings.jpg` |
| Sketches | `sketches.jpg` |
| Photography | `photography.jpg` |
| Level Design | `level-design.jpg` |

Any format is fine (`.jpg`, `.png`, `.webp`…), but the **name before the dot** must match the category id **exactly** — all lowercase, hyphens instead of spaces.

So `assets/img/categories/photography.jpg` ✓ works, but `photography cover.jpg` ✗ does not (space and extra word).

Again: any aspect ratio is fine, the island crops it.

### How your picture sits in the shape

1. The island is a **square**. Your picture is scaled to *cover* that square (`object-fit: cover`) and the overflow is trimmed from the sides — exactly like a background image.
2. That square is then cut with the island's **organic silhouette**, so the picture only shows inside the blob.
3. The **category pill sits in the middle** of the shape. Keep the important part of the picture away from the exact centre, or accept that the pill will sit on it.

Practical sizes: the island runs from ~150px wide on a small window up to ~510px on a large screen, so **1200×1200 or bigger** keeps it sharp on a high-resolution display. A square picture is ideal; a portrait or landscape one works too, just remember the middle square is what survives.

Until a picture exists, the island is not broken: it falls back to the pastel placeholder at very low opacity, so the shape still reads as a soft tinted object.

> Want a **different** blob shape per category? `data/content.js` takes `preset: 0`–`6` (and `size`, `x`, `y`, `rot`) per category. See `docs/architecture.md` §9.

---

## 6. The magic command

After you add, rename or delete any image, run **one command** to update the site's index of images.

1. Open a terminal (Windows: **PowerShell**) in the project folder — the folder that contains `index.html` and the `tools` folder.
2. Type this and press Enter:

```text
node tools/build-manifest.js
```

You'll see a friendly summary, for example:

```text
build-manifest — scanning assets/img
  hero        : 1 file(s)
  contact     : 0 file(s)
  categories  : 5 cover id(s)
  projects    : 3 project folder(s) across 1 category(ies)
  skipped     : 1
                - assets/img/hero/notes.txt (unsupported type)
wrote data/media-manifest.js
```

That's it. Refresh the browser and your images appear. You can run the command as many times as you like — it is always safe.

- `skipped` lists anything it ignored (wrong file type, or a name starting with `_` or `.`).
- It never crashes, even if a folder is missing or empty.

> **Why the command exists:** updating everything by hand would be slow and error-prone. This builds the list for you. You never edit `data/media-manifest.js` — it says so at the top — because it gets overwritten every run.

---

## 7. Adding a whole new category

This site already ships with five categories: Pixel Art, Paintings, Sketches, Photography and Level Design. To add another, here's what to do.

**Step 1 — Create the folders.**
Make a new folder in `assets/img/projects/` named after your new category id, for example `concept-art`. Inside it, make a folder for each project.

**Step 2 — Add a cover picture.**
Put it in `assets/img/categories/` named exactly `concept-art.jpg`.

**Step 3 — Add the words.**
Open `data/content.js`, find the `CATEGORIES` section, copy one whole category block (from a `{` that contains `id:` down to its closing `},`) and paste it before the closing `]`. Change:

- `id` → `"concept-art"` (lowercase, hyphens, no spaces — this must match your folder name),
- `title` → `"Concept Art"` (what visitors see),
- `tint` → pick one of `blush | lavender | peach | butter | mint | periwinkle | rose`,
- `blurb` and the `projects` → your own words and project ids.

**Step 4 — Run the command.**

```text
node tools/build-manifest.js
```

The new island, its menu entry, and its scene all appear automatically. Nothing else needs changing.

---

## 8. Adding a new project to an existing category

**Step 1 — Copy a project.**

In `data/content.js`, find your category and copy one project object (from `{` to `},`). Change its `id`, `title`, `description` and `specs`. Leave `media: []` as it is (that's for advanced links only).

> **The one naming rule:** a project's `id` must **start with its category's id**. So a new project in `paintings` could be `paintings-new-piece`, but not `new-piece`.

**Step 2 — Create its folder.**

```text
assets/img/projects/paintings/paintings-new-piece/
```

**Step 3 — Drop the pictures in** (`01.jpg`, `02.jpg`, …).

**Step 4 — Run the command.**

```text
node tools/build-manifest.js
```

---

## 9. A complete worked example

Say you finished a new painting called *Golden Hour* and want it on the site.

1. **Make the folder:**

   ```text
   assets/img/projects/paintings/paintings-golden-hour/
   ```

2. **Copy three photos into it:**

   ```text
   assets/img/projects/paintings/paintings-golden-hour/01.jpg
   assets/img/projects/paintings/paintings-golden-hour/02.jpg
   assets/img/projects/paintings/paintings-golden-hour/03.jpg
   ```

3. **Open `data/content.js`**, find the `paintings` category, and add this project next to the others (notice the id starts with `paintings`):

   ```js
   {
     id: "paintings-golden-hour",
     title: "Golden Hour",
     description: "A study of warm light across the harbour, painted over three evenings.",
     specs: [
       { label: "Year", value: "2026" },
       { label: "Medium", value: "Oil on canvas" }
     ],
     media: []
   }
   ```

4. **Run the command:**

   ```text
   node tools/build-manifest.js
   ```

5. **Refresh the browser.** Your painting now appears in the Paintings scene, in its own swipeable carousel, and is clickable to open full-screen.

Done.

---

## 10. Swapping the placeholder words for your real words

All the text on the site lives in **one file**: `data/content.js`.

Open it in any plain text editor (Notepad, VS Code, TextEdit — anything). At the very top there are instructions. The short version:

- Anything still saying **"lorem ipsum…"** is placeholder text. Replace it with your own writing.
- Change **only the words between the quote marks** `"like this"`.
- **Do not** rename the labels on the left (`title`, `lede`, `description`) and **do not** change any `id`. Those act like addresses and image folder names.
- The file is split into labelled sections, so it's easy to find what you need:

| You want to change… | Look for… |
|---|---|
| Browser tab title / search description | `SITE META` |
| Your name and opening tagline | `HERO SCENE` |
| The intro above the islands | `CATEGORY EXPLORER` |
| Category names, blurbs, projects, specs | `CATEGORIES` |
| Contact heading, message and links | `CONTACT SCENE` |
| Copyright line and footer links | `FOOTER` |

The contact links live in the `CONTACT SCENE` section: the email is set to `kulismarcelina@gmail.com` and LinkedIn points at the real profile. Change the words between the quote marks to use different details, or delete a line you don't use — the site simply hides anything you remove.

Nothing you type here can "break" the code as long as you stay between the quote marks.

---

## 11. What happens if an image is missing or broken?

Nothing bad. This is by design.

| Situation | What visitors see |
|---|---|
| A project folder has no images | A soft pastel placeholder in the media area, at the correct size |
| An image file is corrupted or won't load | The same pastel placeholder appears in its place |
| You forgot to run the command | The old list is used until you run it again |
| A whole folder is missing | Treated as empty — the site keeps working |

The layout never collapses or jumps. That means you can build the site up gradually, image by image, and it always looks intentional.

---

## 12. Quick reference

```text
Opening portrait .......... assets/img/hero/portrait.png
Contact portrait .......... assets/img/contact/portrait.png
Island cover .............. assets/img/categories/<category-id>.jpg
Project pictures .......... assets/img/projects/<category-id>/<project-id>/01.jpg
Allowed types ............. .jpg .jpeg .png .webp .avif .gif .svg .mp4 .webm .mov
Hidden (ignored) names .... anything starting with _ or .
Update the image list ..... node tools/build-manifest.js
Edit the words ............ data/content.js
```

That's everything. Add pictures, run the command, refresh. Enjoy.
