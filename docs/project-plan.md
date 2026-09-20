# Project Plan — Marcelina Miani Interactive Portfolio

## 1\. Project Overview

Build a single-page, cinematic portfolio website for **Marcelina Miani**.

The website should feel less like a conventional portfolio and more like an interactive visual presentation. The entire experience is one continuous vertical page divided into full-screen scenes.

Scrolling controls the visual state of each scene. Elements should smoothly enter, move, settle, and leave the viewport according to scroll progress.

The overall aesthetic combines:

-   Editorial fashion-portfolio energy
-   Large, confident typography
-   Soft pastel colors
-   Pink and violet gradients
-   Organic shapes
-   Photography-led composition
-   Subtle 3D depth
-   Smooth, cinematic motion
-   Minimal UI

The supplied visual references should influence the visual language, but **their layouts should not be copied**.

* * *

# 2\. Primary Experience

The user enters at the hero scene.

As the user scrolls:

1.  The hero transitions into the category browser.
2.  Categories appear as floating organic image islands.
3.  Clicking a category smoothly navigates to its corresponding portfolio section.
4.  Each portfolio category behaves like a full-screen presentation.
5.  Projects contain text plus image/video media.
6.  Project media can contain its own carousel.
7.  Images can be opened in a fullscreen zoomable viewer.
8.  Portfolio scenes can progress automatically, approximately every 30 seconds.
9.  Individual media items can progress approximately every 5 seconds.
10.  The final scene is a dedicated contact section.
11.  A simple footer closes the experience.

The experience must work with mouse, trackpad, keyboard, touch, and mobile scrolling.

* * *

# 3\. Core Design Principle

The site should feel:

> **Pastel, cinematic, editorial, and alive — but not childish.**

Avoid excessive decoration.

Animation should communicate depth and progression rather than exist purely for spectacle.

* * *

# 4\. Site Structure

The page should conceptually contain:

```text
ROOT
│
├── HERO
│
├── CATEGORY EXPLORER
│
├── CATEGORY / PORTFOLIO SCENES
│   ├── Category 01
│   │    ├── Project 01
│   │    ├── Project 02
│   │    └── ...
│   │
│   ├── Category 02
│   │    ├── Project 01
│   │    └── ...
│   │
│   └── ...
│
├── CONTACT
│
└── FOOTER

The number of categories and projects must not be hard-coded into the visual system.

Adding content should require adding data, not rebuilding the website.

5. Hero Scene
Content

The opening screen should prominently display:

MARCELINA

with:

MIANI

positioned subtly near the lower-right portion of the name.

The client's transparent PNG portrait should be the primary visual subject in the center of the screen.

Background

Use a full-viewport pink-to-violet gradient.

Recommended direction:

Pink → soft magenta → violet

The gradient may contain extremely subtle atmospheric shapes or grain.

Typography

The word "MARCELINA" should use a large, bold display typeface.

It should feel editorial and confident rather than corporate.

The name may overlap or interact with the portrait slightly.

Animation

On initial load:

Background appears first.
Large typography fades/slides into position.
Portrait enters with a subtle scale and opacity transition.
Decorative elements appear last.

During scrolling:

Typography can subtly move through depth.
Portrait can scale/move slightly.
Background can shift subtly.
Hero elements should gradually leave as the next scene enters.

Avoid excessive spinning, bouncing, or dramatic transformations.

Scroll prompt

Optionally display a tiny:

SCROLL TO EXPLORE

near the bottom.

It should disappear as soon as scrolling begins.

6. Scroll Architecture

The website should use a centralized scroll-progress system.

Do not implement hundreds of unrelated scroll listeners.

Conceptually:

Scroll Position
      ↓
Global Scroll Controller
      ↓
Current Scene Progress
      ↓
Animation State
      ↓
Element Interpolation

Each scene should expose a normalized progress value.

Example:

0.00 = scene hidden
0.25 = scene entering
0.50 = scene established
0.75 = scene beginning to exit
1.00 = scene gone

Animations should interpolate based on this progress.

This is preferable to simple:

element entered viewport → play animation once

because the desired experience requires animations to respond naturally to both scrolling down and scrolling up.

7. Smooth Scrolling

Scrolling must feel smooth, controlled, and elegant.

Requirements:

Smooth scrolling
No visible stutter
No sudden jumps
No excessive scroll acceleration
Animations remain synchronized with scroll position
Upward scrolling reverses animations naturally
Anchor navigation should scroll smoothly

If a custom smooth-scroll system is used, it must not interfere with native accessibility or touch behavior.

Native scrolling should remain available where appropriate.

8. Full-Screen Scene System

Every major scene should occupy at least one viewport.

Conceptually:

height: 100svh
min-height: 100vh

However, do not assume that 100vh alone is sufficient on mobile.

Use modern viewport units such as:

svh
dvh
lvh

where appropriate.

The layout must adapt to:

Desktop landscape
Laptop
Tablet landscape
Tablet portrait
Mobile portrait
Mobile landscape
Very wide displays
Small-height displays

Do not allow content to become inaccessible because a viewport is unusually short.

9. Header

The hero should initially have no conventional navigation header.

Once the user starts scrolling, the header should appear.

Header behavior
Fixed/sticky near the top
Smooth entrance
Subtle background or backdrop treatment
Remains unobtrusive
Disappears or simplifies when appropriate
Content

Left:

MARCELINA MIANI

Right:

Categories
My Works
Contact Me

The exact naming can be adjusted during implementation.

Navigation

Each navigation item should anchor to the appropriate scene.

Use smooth scrolling.

Optionally update the URL hash for direct linking:

/#categories
/#art
/#photography
/#design
/#contact
10. Category Explorer

The second major scene introduces the portfolio categories.

Instead of conventional rectangular cards, categories should appear as floating organic "islands."

Examples:

Art
Photography
Design
Fashion
Video
Creative Direction

The actual categories must be configurable.

11. Category Islands

Each island is a clickable visual object.

Appearance

Each island should:

Use an image as its background
Crop images automatically
Work with any source aspect ratio
Have an organic/cloud-like silhouette
Contain the category title
Have subtle depth
Cast a soft shadow
Respond to hover
Be clickable
Image cropping

Images must use a masking/cropping strategy similar to:

object-fit: cover

combined with the island's shape mask.

Do not require the source image to have a specific aspect ratio.

12. Organic Shape System

Do not use completely random shapes at runtime.

Instead, create a controlled collection of organic shape presets.

For example:

blob-01
blob-02
blob-03
blob-04
blob-05
blob-06

Each preset can define:

Shape
Size
Rotation
Position
Border radius
Shadow
Animation offset

This creates controlled randomness.

The visual result should feel organic while remaining predictable and usable.

13. Category Island Motion

Islands can have extremely subtle idle movement.

Examples:

Small vertical drift
Tiny rotation
Slight scale variation
Gentle parallax

Movement should be slow.

Do not make the category explorer look like a collection of bouncing bubbles.

The motion should suggest floating objects.

14. Category Interaction

On desktop:

Hover should slightly enlarge/lift the island.
Cursor interaction can subtly affect the object.
The category title may become more prominent.

On mobile:

No hover-dependent information.
Tap should activate the category.
Touch interactions must remain natural.

Clicking a category should smoothly navigate to its corresponding portfolio scene.

15. Portfolio Category Scenes

Each category should be a full-screen presentation scene.

General composition:

┌─────────────────────────────────────────────┐
│                                             │
│   CATEGORY                    MEDIA         │
│                                             │
│   Description                IMAGE / VIDEO  │
│                                             │
│   Metadata                                  │
│                                             │
│                              ● ○ ○ ○        │
│                                             │
└─────────────────────────────────────────────┘

The exact layout may vary between categories.

The important rule is:

text and media should feel like two coordinated visual layers rather than two rigid columns.

16. Category Scene Content

Each scene can contain:

Category title
Project title
Description
Year
Client
Medium
Credits
Images
Video
External media
Navigation controls

Not every field needs to be displayed for every project.

Content should be optional.

17. Project Data Architecture

The portfolio should be data-driven.

Conceptually:

site
 ├── hero
 ├── categories
 │    ├── category
 │    │    ├── projects
 │    │    │    ├── title
 │    │    │    ├── description
 │    │    │    ├── metadata
 │    │    │    └── media
 │    │
 ├── contact
 └── footer

A category should be addable without modifying the animation engine.

A project should be addable without creating a new component manually.

18. Media Types

The media system should support at minimum:

Static images
Image galleries
Local videos
YouTube videos
Google Drive-hosted media where technically embeddable
External video URLs where appropriate

The implementation should use an abstraction such as:

Media
 ├── image
 ├── video
 ├── youtube
 └── external

rather than creating separate visual systems for each.

19. Project Image Carousel

Projects may contain multiple images.

The media area should support a miniature carousel independent from the main page navigation.

Visual concept:

       ┌─────────────┐
      │ CURRENT IMAGE │
      └─────────────┘
       ┌───────────┐
      │ next image │
       └───────────┘

          ● ○ ○ ○

The effect should feel somewhat like overlapping poker cards.

20. Image Carousel Interaction

Support:

Mouse drag
Touch swipe
Previous/next arrows
Pagination dots
Automatic progression

The current image should be visually dominant.

Adjacent images may be slightly offset, scaled, rotated, or layered behind it.

Do not make the effect so elaborate that it compromises image visibility.

21. Media Timing

Individual images should automatically advance approximately every:

5 seconds

The timer should reset after manual interaction.

If the user interacts with the carousel:

Pause automatic advancement briefly.
Reset the timer.
Resume after inactivity.

Videos should not automatically advance while the user is actively watching them.

22. Project / Scene Timing

Major portfolio scenes may automatically progress approximately every:

30 seconds

However, automatic progression must pause when the user is actively interacting with the scene.

Examples:

User is dragging an image
User is using carousel controls
User is viewing a video
User is hovering over an interactive desktop element
User has keyboard focus on an interactive element

The user must always remain in control.

23. Fullscreen Image Viewer

Every portfolio image should be clickable.

Clicking opens a fullscreen lightbox.

Requirements:

Large image
Zoom
Pan
Previous/next
Close
Keyboard navigation
Escape to close
Touch swipe
Mobile-friendly controls

The lightbox should prevent accidental background scrolling while open.

24. 3D / Depth System

The site should feel three-dimensional without becoming a WebGL-heavy experience unless later required.

Use multiple visual depth layers:

BACKGROUND
    ↓
ATMOSPHERE
    ↓
DECORATION
    ↓
TYPOGRAPHY
    ↓
PRIMARY PHOTOGRAPHY
    ↓
FOREGROUND ELEMENTS

Different layers should respond to scroll by different amounts.

This creates a parallax/depth effect.

Keep movement subtle.

25. Optional Cursor Effects

On desktop, consider a subtle cursor interaction.

Possible behavior:

Nearby islands shift by a few pixels.
Decorative elements respond slightly.
Buttons can have a subtle magnetic effect.

Do not implement aggressive cursor effects.

Disable or simplify these interactions on touch devices.

26. Scene Transitions

Scenes should overlap visually.

Avoid:

Scene A ends
↓
blank gap
↓
Scene B begins

Prefer:

Scene A fading/moving away
        +
Scene B emerging
        =
continuous transition

This overlap is important to the cinematic feel.

27. Contact Scene

The final major scene is dedicated to contacting Marcelina.

Composition:

Large portrait/body image on one side
Contact information on the other
Strong final heading
Social links
Email
Optional phone
Optional location
Short personal message
Primary contact CTA

The scene should feel warmer and calmer than the portfolio scenes.

28. Contact Information

Support configurable contact methods:

Email
Instagram
Other social networks
Phone
Website
Location

Do not display fields that have not been provided.

Email should use:

mailto:

Phone should use:

tel:

where appropriate.

29. Contact Message

Include a short personal paragraph from the client.

Tone should be:

Personal
Grateful
Concise
Genuine

Avoid overly corporate copy.

30. Footer

The footer should be visually minimal.

Suggested content:

© 2026 Marcelina Miani

Optional:

Social links
Privacy link
Back to top

The footer should not compete with the contact scene.

31. Visual Design System

Use the companion pastel design system as the visual source of truth.

Core palette:

Blush       #F7DDE5
Rose        #E96B93
Rose Deep   #D94F7A
Lavender    #E7DDF4
Periwinkle  #DDE7F7
Peach       #F8E0D2
Butter      #F6EBCB
Mint        #DDEDE3
Cream       #FFF8F5
Warm White  #FFFCFA
Plum        #3D2945
Mauve       #6B596D
Line        #EEDDE4

The site should not be exclusively pink.

Pink is the signature accent; lavender, peach, butter, mint, and periwinkle should create variation.

32. Typography

Recommended direction:

Display

A bold editorial serif/sans combination or similarly expressive display type.

Potential families:

DM Serif Display
Playfair Display
Cormorant Garamond
UI/body

A clean modern sans-serif.

Potential families:

Manrope
DM Sans
Plus Jakarta Sans
Nunito Sans

Use a maximum of two primary typefaces.

Script typography should only be decorative.

33. Buttons

Primary button:

Rose background
White text
Pill shape
Subtle hover lift

Secondary button:

Transparent/cream
Rose border
Rose text
Pill shape

Tertiary action:

Text link
Rose Deep
Optional arrow

Buttons should generally be:

44–50px desktop height
42–46px mobile height
18–24px horizontal padding
34. Cards & Surfaces

Cards should use:

16–22px corner radius
Soft borders
Very subtle shadows
Warm white or pale pastel surfaces

Avoid heavy shadows.

35. Accessibility

The site must remain usable despite its visual complexity.

Requirements:

Keyboard navigation
Visible focus states
Semantic HTML
Meaningful alt text
Proper button/link semantics
Sufficient text contrast
No information communicated only through color
Respect prefers-reduced-motion
Avoid inaccessible hover-only interactions

When reduced motion is enabled:

Disable large parallax movement
Reduce scene transitions
Remove floating idle animations
Keep opacity/short transitions where appropriate
36. Responsive Design

The site must be genuinely responsive rather than simply shrinking the desktop design.

Desktop

Use the full cinematic composition.

Support:

Large portrait images
Large typography
Floating islands
Side-by-side text/media
Cursor interactions
Tablet

Reduce:

Typography scale
Depth movement
Island size
Decorative density

Maintain the core composition.

Mobile

The composition should become vertically focused.

Possible adaptations:

Hero typography scales down
Portrait remains the primary visual anchor
Category islands become smaller and may form a loose vertical arrangement
Category content becomes stacked
Media becomes full-width or near-full-width
Carousels become touch-first
Navigation becomes a compact menu

Do not force a desktop two-column composition onto a narrow screen.

37. Performance & Media Loading

Do not load every portfolio asset immediately.

Recommended strategy:

Initial load

Preload:

Hero background
Hero portrait
First category assets
Near-future content

Preload the next likely category/project.

Distant content

Lazy-load.

Images should use:

Responsive image sizes
Modern formats such as WebP/AVIF where supported
Appropriate compression
Explicit dimensions/aspect-ratio to reduce layout shift

Videos should not automatically download large files unnecessarily.

Use thumbnails/posters until video playback is required.

38. Loading Experience

The initial page should feel fast.

A simple loading state may be used.

Do not create a long animated loading screen.

The user should reach the hero as quickly as possible.

39. Browser & Device Requirements

The site should be tested on:

Chrome
Safari
Firefox
Edge
iOS Safari
Android Chrome

Test at minimum:

Desktop landscape
Laptop
Tablet portrait
Tablet landscape
Mobile portrait
Mobile landscape

Also test unusually short desktop viewports.

40. Interaction Safety

Automatic movement must never make the site feel like it is fighting the user.

If the user is manually scrolling:

manual control wins.

If the user is interacting with a component:

component interaction wins.

Automatic progression should resume only after an appropriate idle period.

41. URL / Navigation Behavior

Anchor destinations should have stable identifiers.

Example:

/#categories
/#art
/#photography
/#design
/#fashion
/#video
/#contact

Direct links should load the relevant section.

The page should scroll smoothly to the target.

42. Content Management Philosophy

The programmer should separate:

Content

Images, titles, descriptions, categories, URLs, videos.

from:

Presentation

Animations, transitions, shapes, spacing, colors.

This allows the portfolio to grow without requiring major frontend changes.

43. Suggested Content Schema

Conceptually:

site
{
  hero: {
    name,
    secondaryName,
    portrait,
    background
  },

  categories: [
    {
      id,
      title,
      coverImage,

      projects: [
        {
          id,
          title,
          description,
          year,
          metadata,

          media: [
            {
              type,
              source,
              thumbnail
            }
          ]
        }
      ]
    }
  ],

  contact: {
    portrait,
    email,
    phone,
    socials,
    message
  }
}

The exact implementation language/framework is up to the programmer.

44. Component Architecture

Recommended reusable components:

App
├── ScrollController
├── Header
├── HeroScene
├── CategoryExplorer
│   └── CategoryIsland
├── PortfolioScene
│   ├── ProjectInfo
│   └── MediaViewer
│       ├── ImageCarousel
│       ├── VideoPlayer
│       └── ExternalMedia
├── Lightbox
├── ContactScene
└── Footer

Animation logic should be reusable rather than duplicated between scenes.

45. Animation Rules

General animation philosophy:

Slow, smooth, precise.

Preferred:

Opacity
Translate
Scale
Subtle rotation
Parallax
Mask/reveal
Soft blur transitions where performance permits

Avoid:

Excessive bounce
Random movement
Large rotations
Flashing
Constant animation
Animations that delay access to content
46. Suggested Motion Curve

Use a smooth interpolation/easing curve rather than a linear feeling.

The exact curve can be tuned visually.

The desired sensation is:

slow entry
     ↓
smooth acceleration
     ↓
soft settling

For scroll-driven animation, interpolation should be damped enough to feel fluid but responsive enough that the interface never feels disconnected from the user's scroll.

47. Error Handling

If an image fails:

Show a neutral pastel fallback
Preserve its layout dimensions
Do not collapse the scene

If a video fails:

Show its poster image
Provide an optional external/open link

If external content cannot load:

Do not break the surrounding scene.
48. SEO Basics

Although the experience is highly visual, it should remain a real website.

Implement:

Proper page title
Meta description
Semantic headings
Image alt text
Open Graph metadata
Favicon
Canonical URL where appropriate

Do not hide all meaningful text inside canvas/WebGL.

49. Analytics

If analytics are required, track meaningful interactions such as:

Category selection
Project opened
Image opened
Contact link clicked
Social link clicked

Avoid tracking every scroll frame.

50. Development Phases
Phase 1 — Foundation

Build:

Project structure
Global styling
Typography
Color system
Responsive foundations
Basic routing/anchors
Phase 2 — Hero

Implement:

Gradient
Large name
Client portrait
Initial animation
Scroll transition
Phase 3 — Scroll Engine

Implement:

Scene progress
Smooth scrolling
Scroll-linked interpolation
Scene transitions
Reduced-motion behavior
Phase 4 — Category Explorer

Implement:

Organic islands
Image masks
Configurable categories
Hover/touch behavior
Anchor navigation
Phase 5 — Portfolio Scenes

Implement:

Category scenes
Project information
Media system
Scene navigation
Automatic progression
Phase 6 — Media Carousel

Implement:

Image stacking
Drag/swipe
Arrows
Dots
5-second timer
Interaction pause
Phase 7 — Lightbox

Implement:

Fullscreen image
Zoom
Pan
Navigation
Keyboard support
Mobile gestures
Phase 8 — Contact & Footer

Implement:

Contact scene
Social links
Email
Optional phone
Personal message
Footer
Phase 9 — Responsive Optimization

Test and adjust:

Desktop
Tablet
Mobile
Landscape
Short-height screens
Phase 10 — Performance & QA

Optimize:

Images
Videos
Loading
Animation performance
Accessibility
Browser compatibility
Broken media handling
51. Definition of Done

The website is complete when:

The hero works at all target viewport sizes.
Marcelina's name and portrait form the visual opening.
The category explorer is configurable.
Category islands support arbitrary image aspect ratios.
Clicking an island navigates to the correct scene.
Portfolio scenes occupy the intended viewport experience.
Text and media animate according to scroll progress.
Animations reverse naturally when scrolling upward.
Images support carousel interaction.
Images automatically progress approximately every 5 seconds.
Major scenes can progress approximately every 30 seconds.
User interaction pauses automatic progression.
Images open in a zoomable fullscreen viewer.
Video media can be displayed.
Header appears after scrolling begins.
Navigation anchors work.
Contact links work.
Footer works.
Responsive layouts work on desktop, tablet, and mobile.
Reduced-motion preferences are respected.
Media loading is optimized.
No major layout shift occurs during loading.
Keyboard navigation works.
The site remains usable without hover.
Adding a category/project does not require rewriting the animation architecture.
52. Final Creative Direction

The final result should feel like entering a living editorial portfolio.

The user should never feel that they are simply scrolling through boxes of content.

Instead:

Scroll → scene changes → objects move → typography emerges → photography settles → the user explores → the next scene arrives.

The visual language should combine:

fashion editorial + pastel atmosphere + interactive presentation + subtle 3D depth + elegant motion.

The technology should remain subordinate to the experience.

The most important requirement is not to maximize the number of animations.

It is to make every transition feel intentional, smooth, and physically coherent.
```