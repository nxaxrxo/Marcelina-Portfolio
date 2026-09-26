/* ============================================================================
   content.js — EVERY WORD ON THE SITE LIVES IN THIS ONE FILE
   ============================================================================

   Change the WORDS between the quote marks. Do NOT rename the words to the
   LEFT of the colon (labels like title, lede, description) and do NOT rename
   any id — ids are used for links and folder names.

   ============================================================================ */

window.MP_DATA = {

  site: {
    title: "Marcelina Miani — Portfolio",
    description: "Portfolio of Marcelina Miani — card design, level design, photography, pixel art, sketches and paintings.",
    url: "",
    updateHashOnScroll: true,
    preloadScenes: 2
  },

  hero: {
    name: "MARCELINA",
    surname: "MIANI",
    tagline: "A sketchbook in one hand, a world in the other.",
    portrait: "assets/img/hero/MainPage_BodyPortrait.png",
    portraitAlt: "Portrait of the artist, Marcelina Miani"
  },

  explorer: {
    eyebrow: "The Work",
    title: "Start anywhere",
    lede: "Five ways of working and one pair of hands — from a paintable card game to a level you could actually walk through. Have a wander; nothing here was made in a hurry."
  },

  categories: [

    /* ======================== 1. PIXEL ART ======================== */
    {
      id: "pixel-art",
      title: "Pixel Art",
      tint: "lavender",
      cover: "assets/img/categories/pixel-art.jpg",
      island: { size: "lg", preset: 0, x: 26, y: 26, rot: 5 },
      blurb: "The Curse of Ashes — my first steps into pixel art, drawn for a game I make alongside my husband.",
      projects: [
        {
          id: "pixel-art-curse-of-ashes",
          title: "The Curse of Ashes",
          description: "My current work — a game I am building with my husband. I have drawn nearly every art asset for it, which makes it some of my latest work as an artist and my first real step into pixel art. From characters and enemies to menus and combat scenes, the whole visual world is built tile by careful tile.",
          specs: [
            { label: "Project", value: "The Curse of Ashes (in development)" },
            { label: "Tools", value: "Aseprite, Resprite" }
          ],
          media: []
        }
      ]
    },

    /* ====================== 2. LEVEL DESIGN ====================== */
    {
      id: "level-design",
      title: "Level Design",
      tint: "rose",
      cover: "assets/img/categories/level-design.jpg",
      island: { size: "lg", preset: 3, x: 21, y: 79, rot: 7 },
      blurb: "Tireless — levels 8 and 9, the final two levels, designed in Unreal Engine 5.",
      projects: [
        {
          id: "level-design-tireless",
          title: "Tireless — Levels 8 & 9",
          description: "A game I worked on with my husband. I was responsible for the visual aesthetic of the final two levels and for placing every individual part of them together — including obstacles and everything in between — using Unreal Engine 5.",
          specs: [
            { label: "Project", value: "Tireless — Levels 8 & 9" },
            { label: "Tools", value: "Unreal Engine 5" }
          ],
          media: []
        }
      ]
    },

    /* ======================== 3. CARD DESIGN ======================== */
    {
      id: "sketches",
      title: "Card Design",
      tint: "mint",
      cover: "assets/img/categories/sketches.jpg",
      island: { size: "md", preset: 1, x: 50, y: 50, rot: 6 },
      blurb: "Lords of Yokai — a complete, playable card game created for my bachelor degree.",
      projects: [
        {
          id: "sketches-lords-of-yokai",
          title: "Lords of Yokai",
          description: "My bachelor thesis project, completed in 2024. This was not just artwork — it is a fully functioning card game with proper mechanics and genuinely playable gameplay. Every card, every illustration and every rule is mine, from first concept to the finished, playable game.",
          specs: [
            { label: "Project", value: "Lords of Yokai — bachelor thesis, 2024" },
            { label: "Tools", value: "Adobe Illustrator, Photoshop, Krita, InDesign" }
          ],
          media: []
        }
      ]
    },

    /* ================== 4. SKETCHES AND PAINTINGS ================== */
    {
      id: "paintings",
      title: "Sketches and Paintings",
      tint: "peach",
      cover: "assets/img/categories/paintings.jpg",
      island: { size: "xl", preset: 2, x: 83, y: 21, rot: -4 },
      blurb: "Concept art for university, and paintings drawn in free time from a lifetime of inspiration.",
      projects: [        
        {
          id: "paintings-sketches-hobby",
          title: "Hobby Sketches and Paintings",
          description: "Made in my free time, drawn from inspiration collected throughout the years. The painted portrait of a man and the painting of a cat were made in Krita; the rest were hand-painted or hand-drawn on canvas and in sketchbooks — a working mirror of the things that move me.",
          specs: [
            { label: "Project", value: "Personal / hobby work" },
            { label: "Tools", value: "Krita, canvas, sketchbook" }
          ],
          media: []
        },
        {
          id: "paintings-academic-concept",
          title: "Concept Art — The Morph",
          description: "A piece made as a project for my university study — designing a creature concept from imagination, exploring shape, colour and a believable sense of anatomy for a being that does not exist.",
          specs: [
            { label: "Project", value: "University study project" },
            { label: "Tools", value: "Mixed media" }
          ],
          media: []
        }
      ]
    },

    /* ====================== 5. PHOTOGRAPHY ====================== */
    {
      id: "photography",
      title: "Photography",
      tint: "periwinkle",
      cover: "assets/img/categories/photography.jpg",
      island: { size: "lg", preset: 4, x: 96, y: 95, rot: -3 },
      blurb: "City and nature frames shot on a Nikon D-3200 — a hobby, done simply for the love of it.",
      projects: [
        {
          id: "photography-city",
          title: "City Photography",
          description: "Shot in Katowice, Poland. A set of urban frames captured the way I see the city when I am walking through it — a hobby project, done simply for its own sake.",
          specs: [
            { label: "Project", value: "Katowice, Poland" },
            { label: "Tools", value: "Nikon D-3200, NIKKOR 18-105mm" }
          ],
          media: []
        },
        {
          id: "photography-nature",
          title: "Nature Photography",
          description: "Taken in my free time as a hobby rather than as any particular project. Same camera and lens, pointed instead at the quieter side of the world — light, growth and small moments worth stopping for.",
          specs: [
            { label: "Project", value: "Nature / personal" },
            { label: "Tools", value: "Nikon D-3200, NIKKOR 18-105mm" }
          ],
          media: []
        }
      ]
    }

  ],

  contact: {
    eyebrow: "Say hello",
    title: "Let's make something",
    message: "Whether you have a project in mind or just want to say hello, my inbox is open. Send me a note and tell me what you're working on — I'm always curious.",
    portrait: "assets/img/contact/LastPage_BodyPortrait.png",
    portraitAlt: "Portrait of the artist, Marcelina Miani",
    links: [
      { type: "email", label: "Email", value: "kulismarcelina@gmail.com", href: "mailto:kulismarcelina@gmail.com" },
      { type: "link", label: "LinkedIn", value: "marcelina-miani-96b627317", href: "https://www.linkedin.com/in/marcelina-miani-96b627317/" }
    ]
  },

  footer: {
    copy: "© 2026 Marcelina Miani — All rights reserved.",
    links: []
  }

};
