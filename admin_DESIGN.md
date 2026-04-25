# Design System Strategy: The Heritage Modernist

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Curator."** 

The University of Nigeria Nsukka Secondary School Alumni Association (UNNSSAA) is a bridge between prestigious heritage and a dynamic future. This system rejects the "template" look of traditional academic portals. Instead, it adopts an editorial, high-end digital experience—blending the authoritative weight of a legacy institution with the sleek, airy performance of a modern tech brand. 

We break the grid through **Intentional Asymmetry**. Large, bold typography serves as an anchor, while glassmorphism panels and "floating" content blocks create a sense of depth and lightness. The goal is to make every page feel like a bespoke digital magazine, where white space is as important as the content itself.

---

### 2. Colors: Tonal Depth over Borders
This system moves away from "boxed-in" design. Color is used to define space, not lines.

*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background creates a sophisticated, soft edge that a line cannot achieve.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers. Use the `surface-container` tiers (Lowest to Highest) to create "nested" depth. 
    *   *Example:* A `surface-container-lowest` card nested within a `surface-container-low` section provides a subtle, natural lift.
*   **The "Glass & Gradient" Rule:** Use Glassmorphism for floating navigation and high-priority overlays. Utilize semi-transparent versions of `surface` with a `backdrop-blur` of 20px–40px. 
*   **Signature Textures:** For Hero sections and CTAs, use a subtle radial gradient transitioning from `primary` (#00342b) to `primary_container` (#004d40) at a 45-degree angle. This provides a "soul" and professional depth that flat hex codes lack.

| Role | Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `primary` | #00342b | Deep heritage green for authority. |
| **Secondary** | `secondary` | #735c00 | Gold accent for prestige and call-to-outs. |
| **Background** | `background` | #fcf9f8 | Warm, off-white "fine paper" feel. |
| **Surface** | `surface_container` | #f0edec | For subtle sectioning. |
| **Tertiary** | `tertiary` | #1c2f40 | Charcoal for high-contrast text and footers. |

---

### 3. Typography: Editorial Authority
We utilize **Inter** (or SF Pro) with an aggressive scale to create visual hierarchy.

*   **Display Scale:** Use `display-lg` (3.5rem) for hero statements. These should be set with `-0.02em` letter spacing and `800` (Extra Bold) weight to mimic premium print.
*   **Contrast Pairing:** Large headlines must be paired with generous leading in body text (`body-lg` at 1.6x line-height).
*   **Labeling:** Use `label-md` in all-caps with `0.1em` letter spacing for section headers or small metadata to provide a "branded" corporate feel.

| Type | Scale | Weight | Tracking |
| :--- | :--- | :--- | :--- |
| **Display LG** | 3.5rem | 800 | -0.04em |
| **Headline MD** | 1.75rem | 600 | -0.01em |
| **Title LG** | 1.375rem | 500 | 0 |
| **Body LG** | 1rem | 400 | 0 |
| **Label MD** | 0.75rem | 700 | 0.1em |

---

### 4. Elevation & Depth: The Layering Principle
We convey hierarchy through **Tonal Layering** rather than traditional structural shadows.

*   **The Layering Principle:** Depth is achieved by stacking. A `surface-container-lowest` card placed on a `surface-container-low` section creates a soft lift.
*   **Ambient Shadows:** When a "floating" effect is mandatory (e.g., a primary CTA button or a Glassmorphism panel), use a highly diffused shadow:
    *   `box-shadow: 0 20px 40px rgba(28, 27, 27, 0.06);`
    *   The shadow color is a tinted version of `on-surface` (#1c1b1b) at very low opacity to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.
*   **Glassmorphism:** Apply to navigation bars. 
    *   `background: rgba(252, 249, 248, 0.7);`
    *   `backdrop-filter: blur(24px);`

---

### 5. Components: Precision & Softness

*   **Buttons:**
    *   *Primary:* `primary` background with `on_primary` text. Use `xl` (1.5rem) roundedness. 
    *   *Secondary:* `secondary_container` background. On hover, transition to `secondary` with a 200ms ease-out.
*   **Cards & Lists:** **Forbid divider lines.** Use vertical white space (Spacing `8` or `10`) to separate items. Card corners must strictly use `xl` (1.5rem / 24px) for a modern, friendly feel.
*   **Input Fields:** Ghost-style inputs using `surface_container_high` with no border. On focus, a subtle 1px "Ghost Border" of `primary` at 20% opacity.
*   **Alumni Chips:** Use `secondary_fixed` for status tags (e.g., "Class of '98"). These should have `full` roundedness and `label-sm` typography.

---

### 6. Animation: The "Fluid Motion" Signature
To achieve the "Stripe/Apple" feel, animations must feel physics-based, not linear.

*   **Smooth Scroll:** Implement a dampened smooth scroll for the main container to give a "luxurious" weight to the page movement.
*   **Hover States:** When hovering over a card, it should not just change color. It should subtly lift (Y-axis: -4px) and the shadow should expand by 10% in blur.
*   **Staggered Entrances:** Content blocks should fade-in and slide-up (20px) using a `cubic-bezier(0.23, 1, 0.32, 1)` easing function as the user scrolls into view.

---

### 7. Do's and Don'ts

*   **DO:** Use asymmetrical layouts where images overlap the boundaries of two background color sections.
*   **DO:** Lean heavily on the Spacing Scale (especially `16` and `20`) to let elements "breathe."
*   **DON'T:** Use 1px borders to separate content.
*   **DON'T:** Use pure black (#000000) for text. Always use `on_surface` (#1c1b1b) or `tertiary` (#1c2f40) for a softer, premium look.
*   **DON'T:** Use sharp corners. Every container must adhere to the `lg` or `xl` roundedness scale.