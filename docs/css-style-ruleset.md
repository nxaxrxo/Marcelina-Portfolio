# Pastel Portfolio — Visual Design System

A reusable visual rulebook for a soft, feminine, polished portfolio aesthetic inspired by the supplied reference.

**Important:** This system defines the visual language only. It does not prescribe the page layout.

---

## 1. Design Direction

**Keywords:** soft · creative · warm · editorial · playful · premium · approachable

The reference is strongly pink, but this system broadens the aesthetic into a pastel spectrum. Pink remains the signature accent, while lavender, peach, butter, mint, and powder blue provide variation.

### Core principle

> **Pastel, but not childish.**

Balance soft colors and playful details with dark plum typography, clean spacing, restrained decoration, and crisp interaction states.

---

## 2. Color Palette

| Color | Hex | Primary Use |
|---|---|---|
| **Blush** | `#F7DDE5` | Soft surfaces, cards |
| **Rose** | `#E96B93` | Primary accent, CTAs |
| **Rose Deep** | `#D94F7A` | Hover states, emphasis |
| **Lavender** | `#E7DDF4` | Secondary accent |
| **Periwinkle** | `#DDE7F7` | Information, cool sections |
| **Peach** | `#F8E0D2` | Warm secondary accent |
| **Butter** | `#F6EBCB` | Highlights, badges |
| **Mint** | `#DDEDE3` | Success states, alternate accent |
| **Cream** | `#FFF8F5` | Main background |
| **Warm White** | `#FFFCFA` | Cards, high-contrast surfaces |
| **Plum** | `#3D2945` | Primary text |
| **Mauve** | `#6B596D` | Secondary text |
| **Line** | `#EEDDE4` | Borders, dividers |

### Recommended color ratio

- **60%** Cream / Warm White
- **20%** Blush
- **10%** Plum neutrals
- **10%** rotating pastel accents

Use Rose and Rose Deep selectively for actions rather than making the entire interface pink.

---

## 3. Typography

### Display / Headlines

Use a refined serif or expressive handwritten accent.

Good directions:

- DM Serif Display
- Playfair Display
- Cormorant Garamond
- A tasteful script font for very short decorative phrases

Handwritten/script typography should be decorative, not functional.

### UI / Body

Use a clean, rounded sans-serif.

Good directions:

- Manrope
- DM Sans
- Plus Jakarta Sans
- Nunito Sans

### Typography rules

- Maximum **two primary typefaces**
- Keep body copy highly legible
- Use script fonts only for 1–3 words at a time
- Use italic or serif emphasis sparingly
- Avoid overly decorative fonts in navigation or functional UI

### Suggested hierarchy

| Element | Size / Weight | Treatment |
|---|---|---|
| H1 | 44–64px / 700 | Plum, generous line-height |
| H2 | 28–40px / 700 | Plum, compact |
| H3 | 18–24px / 700 | Plum or Rose Deep |
| Body | 15–17px / 400–500 | Mauve, 1.55–1.7 line-height |
| Label | 11–13px / 700 | Slight tracking, uppercase or title case |
| Button | 13–15px / 700 | Short, direct wording |

---

## 4. Buttons & Controls

### Primary CTA

- Rose background
- White text
- Fully rounded pill
- Optional small arrow/icon
- Subtle lift on hover

### Secondary CTA

- Cream or transparent background
- Rose border
- Rose text
- Same dimensions as the primary CTA

### Tertiary action

- Text-only
- Rose Deep
- Optional understated arrow or icon

### Shape

- Buttons: pill-shaped, approximately `28px–999px` border radius
- Cards: approximately `16px–22px`
- Inputs: approximately `12px–18px`

### Dimensions

- Desktop button height: `44–50px`
- Mobile button height: `42–46px`
- Horizontal padding: approximately `18–24px`

### Interaction

**Hover:**
- Slightly darker accent
- `1–2px` upward movement
- Optional subtle shadow

**Active:**
- Return to base position
- Slightly reduce shadow

**Focus:**
- Clearly visible `2px` focus ring
- Use Lavender or Rose

---

## 5. Cards, Surfaces & Borders

Use warm white or very pale tinted surfaces rather than pure white.

Cards should feel soft and tactile rather than glassy or overly glossy.

### Card rules

- Border radius: `16–22px`
- Border: `1px solid #EEDDE4` when needed
- Shadow: very soft and low-opacity
- Avoid dark drop shadows
- Use pastel accents through small badges, icons, illustrations, or subtle borders

### Avoid

- Heavy shadows
- Strong black borders
- Excessive glassmorphism
- Highly saturated card backgrounds

---

## 6. Icons & Illustrations

Prefer rounded-line icons with a consistent stroke weight.

Icons can sit inside:

- Pastel circles
- Soft squircles
- Rounded containers

Illustrations should use the same muted pastel palette and warm overall tone.

### Avoid

- Neon colors
- Highly saturated accents
- Mixing radically different icon styles
- Very sharp, technical iconography

---

## 7. Photography & Imagery

Favor imagery with:

- Bright, airy lighting
- Warm highlights
- Soft contrast
- Gentle pink, peach, lavender, or cream accents
- Uncluttered backgrounds

Use rounded image crops.

A subtle pastel tint or light grain can help unify photography with the interface, but never at the expense of image clarity.

---

## 8. Spacing & Shape Language

Use an **8px spacing system**:

`8 / 16 / 24 / 32 / 48 / 64 / 96`

### Shape language

Favor:

- Rounded corners
- Pills
- Circles
- Organic curves
- Soft blobs
- Occasional hand-drawn underlines
- Small hearts/stars/doodles

Decorative shapes should be asymmetric and sparse.

The goal is **playful sophistication**, not visual clutter.

---

## 9. Motion

Motion should feel gentle rather than flashy.

### Timing

- Small interactions: `160–240ms`
- Larger entrance effects: `300–500ms`

### Preferred effects

- Slight `translateY`
- Opacity fade
- Subtle scale: `1.01–1.03`
- Gentle shadow changes

### Avoid

- Aggressive bouncing
- Excessive spring animations
- Constant floating elements
- Long, distracting transitions

---

## 10. Accessibility Guardrails

Pastels should primarily be used for **surfaces and accents**, not small text.

### Rules

- Primary text should use Plum or another sufficiently dark neutral.
- Secondary text must remain readable against its background.
- Do not rely on color alone to communicate states.
- Every interactive element needs a visible focus state.
- Check contrast whenever Rose, Lavender, Peach, Butter, or other light colors are used behind text.

---

## 11. Do / Don't

| DO | DON'T |
|---|---|
| Use several pastel families with one pink signature accent. | Make every component pink. |
| Use dark plum text for readability. | Use light pink/lavender for paragraph text. |
| Use rounded geometry consistently. | Mix sharp corporate shapes with soft decorative shapes. |
| Keep decoration small and intentional. | Fill every empty area with hearts, stars, or doodles. |
| Use restrained shadows and borders. | Use heavy black shadows. |
| Let typography create hierarchy. | Use script fonts for long paragraphs or navigation. |
| Keep pastel colors slightly muted. | Use neon or highly saturated colors. |
| Use warm whites instead of harsh pure white. | Make every section pure white. |
| Use pink strategically for actions. | Use pink as the background for everything. |

---

## 12. Overall Visual Formula

A strong implementation should roughly feel like:

**60% clean + 25% soft pastel + 10% playful + 5% decorative**

The website should look:

- Creative, but not chaotic
- Feminine, but not overly cute
- Pastel, but still professional
- Warm, but still modern
- Decorative, but still readable
- Personal, but not amateurish

The supplied reference should be treated as **inspiration for the visual mood**, not as a layout to reproduce.
