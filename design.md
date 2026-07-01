---
version: alpha
name: Apple Minimal
description: A premium, ultra-clean product system with spacious layouts, restrained color, and crisp typographic hierarchy.
colors:
  primary: "#0071e3"
  secondary: "#0066cc"
  tertiary: "#1d1d1f"
  neutral: "#ffffff"
  surface: "#f5f5f7"
  on-surface: "#1d1d1f"
  border: "#e5e7eb"
  muted: "#6e6e73"
  error: "#d92d20"
typography:
  headline-display:
    fontFamily: "SF Pro Text"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: "58px"
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "SF Pro Display"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: "52px"
    letterSpacing: "-0.1px"
  headline-md:
    fontFamily: "SF Pro Display"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "0.06px"
  headline-sm:
    fontFamily: "SF Pro Text"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: "35px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "SF Pro Display"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "36px"
    letterSpacing: "0.22px"
  body-md:
    fontFamily: "SF Pro Text"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "SF Pro Text"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "SF Pro Text"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  label-md:
    fontFamily: "SF Pro Text"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
  label-sm:
    fontFamily: "SF Pro Text"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0px"
  nav-sm:
    fontFamily: "SF Pro Text"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 24px
  lg: 44px
  xl: 62px
  gutter: 24px
  section: 62px
  page: 24px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "11px 21px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "11px 21px"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "11px 21px"
    height: "44px"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: "16px"
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.nav-sm}"
    padding: "0px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

# Apple Minimal

## Overview
This system feels premium, restrained, and product-first, with a strong emphasis on clarity over decoration. It is built for a broad consumer audience and communicates confidence through generous white space, precise alignment, and understated motion-ready forms. The tone is professional and aspirational rather than playful, with a dense information structure softened by airy sectioning and oversized hero moments.

## Colors
- **Primary (#0071e3):** The signature Apple blue used for primary calls to action and interactive emphasis. It reads as crisp, modern, and highly trustworthy.
- **Secondary (#0066cc):** A slightly deeper action blue for secondary buttons, links, and interactive text. It keeps the interface feeling active without competing with the primary hue.
- **Tertiary (#1d1d1f):** The near-black used for major headlines, body copy, and navigation. It provides strong contrast while staying softer than pure black.
- **Neutral (#ffffff):** The dominant background color that creates the signature clean, gallery-like presentation. It keeps product imagery and typography highly legible.
- **Surface (#f5f5f7):** A subtle cool tint for layered backgrounds or low-emphasis panels. It helps separate sections without introducing heavy visual noise.
- **On-surface (#1d1d1f):** The main text color for readable content on light surfaces. It supports the calm, editorial feel of the system.
- **Border (#e5e7eb):** A light divider tone for cards, inputs, and understated framing. It is present but never forceful.
- **Muted (#6e6e73):** A quiet supporting gray for secondary metadata and de-emphasized labels. It avoids stealing focus from product and headline content.
- **Error (#d92d20):** Reserved for destructive states and validation feedback. It should appear sparingly to preserve the serene palette.

## Typography
SF Pro Text and SF Pro Display define the voice of the interface, with Text used for navigation, body copy, and buttons, and Display reserved for larger marketing-style headings. Headings are bold to semibold, compact, and highly tuned for visual rhythm: `headline-display` and `headline-lg` carry the hero presence, while `headline-md` and `headline-sm` support product sections and subheads. Body styles remain calm and highly legible, with `body-lg` used for elevated promotional copy and `body-md`/`body-sm` for general content. Labels and navigation are set in SF Pro Text with minimal letter spacing and no uppercase convention, keeping the interface clean rather than editorially forced.

## Layout & Spacing
The layout relies on a centered, fixed-max-width hero structure with expansive horizontal breathing room and vertically stacked section blocks. Spacing follows a restrained rhythm: `xs` and `sm` for tight UI details, `md` for standard content separation, and `lg` to `xl` for major section transitions and marketing panels. Buttons and interactive clusters are close enough to read as a single action group, while major promotional zones are separated by generous vertical whitespace. Use broad page padding and align content to a centered content column for campaign pages and product announcements.

## Elevation & Depth
The system is mostly flat, with depth coming from contrast, image compositing, and subtle borders rather than dramatic shadow stacks. The only notable shadow treatment is a soft, low-opacity lift used sparingly on rendered products or layered objects. Cards and controls should prefer hairline borders, tonal separation, and generous whitespace over heavy drop shadows. This keeps the interface feeling polished and gallery-like.

## Shapes
The shape language is soft and highly rounded, especially on actions where `rounded.full` creates the familiar pill button silhouette. Cards use modest rounding via `rounded.sm` for a gentle, almost invisible softness. Overall, the system balances industrial precision with approachable curves, avoiding sharp corners in visible interactive elements.

## Components
- **Buttons:** Primary actions use `button-primary` with a filled blue background, white text, `rounded.full`, and a 44px touch target. Secondary actions use `button-secondary` as an outline button with transparent fill and blue stroke/text. Link-style actions use `button-link` for inline navigation and tertiary CTA patterns. Hover states should deepen the blue slightly, but never add heavy shadows or transforms.
- **Cards:** Use `card` for content grouping with a white background, 1px border, `rounded.sm`, and 16px padding. Cards should feel clean and quiet; avoid adding decorative shadows unless the content absolutely needs separation.
- **Inputs:** Inputs should match card logic: white background, light border, `rounded.sm`, and comfortable padding. Focus states should be expressed with blue border or ring treatment rather than filled backgrounds.
- **Navigation items:** `nav-item` is small, text-only, and visually light. Keep the top-level nav understated so the product hero remains the focal point.
- **Chips:** `chip` should use a soft surface background, small text, and pill rounding. Use them for filters, metadata, or lightweight categorization only.
- **Lists:** Keep list rows simple with clear spacing and minimal separators. Favor typographic hierarchy over chrome.
- **Tooltips and helpers:** Use the neutral dark text color on light surfaces, with restrained radius and no strong elevation. They should feel informational, not promotional.

## Do's and Don'ts
- Do keep layouts spacious, centered, and editorial.
- Do use the primary blue only for clear interactive emphasis.
- Do maintain a calm hierarchy with near-black text and lots of white space.
- Do prefer pills and subtle rounding for actions and metadata.
- Don't introduce gradients, heavy shadows, or noisy textures.
- Don't use many competing accent colors or saturated UI chrome.
- Don't make buttons square or overly dense.
- Don't overcrowd sections; let imagery and headings breathe.
