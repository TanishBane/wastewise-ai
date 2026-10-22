---
name: WasteWise kitchen journal
description: Warm paper, editorial headings, and clear feedback for daily kitchen decisions.
colors:
  ground: "#eeeae1"
  surface: "#fffdf7"
  raised: "#f5f1e8"
  active: "#e5e9db"
  ink: "#24362d"
  muted: "#626b60"
  border: "#deddd0"
  rule: "#ebe7dc"
  control: "#bdc2af"
  forest: "#24533d"
  forest-dark: "#1b3d2e"
  forest-pale: "#eaf0e3"
  sage: "#7c9076"
  warning: "#885514"
  warning-pale: "#f9eed7"
  danger: "#a44537"
  danger-pale: "#f9eae3"
  rail: "#19382c"
  rail-active: "#2b4b3c"
  rail-ink: "#f1f2e6"
  rail-muted: "#b2c5b4"
  skeleton: "#e7e4d8"
typography:
  headline:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  prose:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  label:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
  figure:
    fontFamily: "Source Sans 3, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
rounded:
  surface: "0px"
  control: "4px"
  circle: "50%"
  metal-action: "999px"
spacing:
  space-0: "0px"
  space-1: "2px"
  space-2: "4px"
  space-3: "8px"
  space-4: "12px"
  space-5: "16px"
  space-6: "20px"
  space-7: "24px"
  space-8: "28px"
  space-9: "32px"
  space-10: "40px"
  space-11: "48px"
  space-12: "64px"
  space-13: "96px"
components:
  button-primary:
    backgroundColor: "var(--metal-face-primary)"
    textColor: "{colors.forest-dark}"
    rounded: "{rounded.metal-action}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "var(--metal-face-primary-hover)"
  button-secondary:
    backgroundColor: "var(--metal-face)"
    borderColor: "var(--metal-rim)"
    textColor: "{colors.ink}"
    rounded: "{rounded.metal-action}"
    padding: "8px 16px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
  navigation-active:
    backgroundColor: "{colors.rail-active}"
    textColor: "{colors.rail-ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  badge-positive:
    backgroundColor: "{colors.forest-pale}"
    textColor: "{colors.forest}"
    rounded: "{rounded.control}"
    padding: "2px 8px"
---

# Design System: WasteWise kitchen journal

## Overview

**Creative North Star: "The kitchen planning journal"**

Warm mineral ground, paper working surfaces, and a deep forest navigation rail give daily planning an authored but practical setting. Newsreader supplies the editorial voice for the wordmark and page titles; Source Sans 3 carries controls, prose, data, and charts. Square panels and soft offset depth replace the earlier curved sheet.

Feedback follows real work: checked dishes drive review progress, pending requests drive activity, and completed API responses advance calculation stages. Daily operations remain primary, with synthetic demonstration data explicitly labeled. This is a code-led, user-pinned refinement; no raster composition governs it.

**Key Characteristics:**

- Warm paper surfaces and a dark forest rail.
- Editorial titles paired with readable operational data.
- Square panels, compact control corners, and offset soft shadows.
- Immediate feedback grounded in actual operations.

Evidence: frontend/src/index.css owns CSS primitives and the current refinement cascade; frontend/src/tokens.ts mirrors chart colors and typography; frontend/src/fonts.css defines self-hosted fonts. App.tsx and workspace/shared.tsx establish navigation and feedback primitives. workspace/Overview.tsx and workspace/Scenario.tsx establish real progress behavior. DESIGN_REFINEMENT.md records the user's current checklist and its Laws of UX applications.

## Colors

Warm neutrals support forest decisions and labeled amber or clay exceptions.

### Primary

- **Forest:** primary actions, current calculations, focus outlines, and the main chart series.
- **Deep forest:** primary hover.
- **Pale forest:** positive status and selected presets.
- **Sage:** comparison series and refill quantities.

### Secondary

- **Amber:** warnings and synthetic-source indicators, paired with pale amber backgrounds.
- **Clay:** high-risk and error states, paired with pale clay backgrounds.

### Neutral

- **Mineral ground:** the main workspace background.
- **Paper:** panels, fields, dialogs, and statistics.
- **Raised paper:** table headings and explanatory tracks.
- **Ink / muted ink:** primary content and supporting context.
- **Border / rule / control:** structural dividers, quiet internal rules, and interactive strokes.
- **Deep rail / active rail:** navigation ground and current destination.
- **Rail ink / muted rail ink:** rail labels and supporting text.
- **Skeleton:** structural loading placeholders.

**The Source Context Rule.** Pair figures with their source and qualification; color alone does not distinguish demonstration data, forecasts, and recorded outcomes.

## Typography

**Display Font:** Newsreader, with Georgia and serif fallbacks.
**Body Font:** Source Sans 3, with sans-serif fallback.

Both families are self-hosted WOFF2 with swap display. Newsreader supports weights 400–600; Source Sans 3 supports 400–700. Editorial hierarchy belongs to page titles and the wordmark; data remains in the sans family.

### Hierarchy

- **Headline:** medium editorial page titles; descriptions use body text and a 70ch maximum width.
- **Title:** semibold sans section headings.
- **Body / prose:** base operational text and more spacious guide/dialog prose respectively.
- **Label:** semibold control labels; 12px metadata and 13px supporting content use shared size tokens.
- **Figure:** semibold totals, reduced to the title size on narrower layouts.
- **Other shared roles:** 24px subheadings and 12/13/14/16/18/24/32/36px type sizes; regular/medium/semibold/bold weight tokens.

**The Comparable Figures Rule.** Use tabular figures in tables, statistics, batch labels, comparisons, and key-value lists.

## Layout

The desktop rail is 232px wide and the workspace bar is 64px high. Workspace gutters are 28px, panel gaps 24px, and panel headings use 20px vertical and 24px horizontal spacing. The overview pairs a wider chart with priorities. Scenario controls use a named 304px form size.

Spacing follows the shared four-pixel rhythm with a two-pixel optical step. Layout sizes, type, weights, radii, colors, and authored timings reference shared tokens. Primary and secondary buttons, fields, navigation, and review controls use 44px targets.

At 1200px the overview stacks. At 1080px the rail becomes 208px, workspace gutters become 20px, scenarios stack with two-column forms, and evidence/data grids stack. At 760px the rail becomes native-dialog navigation, mobile home branding appears, gutters become 16px, and statistics become two columns. At 380px forms become one column. Wide screens at 1600px use 40px gutters. Tables scroll within their container.

Navigation separates “Plan this service” from “Learn & maintain,” applying Hick's Law. Labels, units, explanations, and related values stay together, applying proximity. These applications do not claim measured usability improvement.

## Elevation & Depth

Paper panels and statistics use a small offset soft shadow with no outer panel border. Dialogs and chart tooltips use the larger floating shadow. Internal rules remain quiet and square. Depth comes from physical separation, never colored underlighting or illuminated borders.

### Shadow Vocabulary

- **Surface:** `0 3px 12px var(--shadow-color)`, with shadow color `#25311c12`.
- **Floating:** `0 12px 36px var(--shadow-modal-color)`, with shadow color `#15251c30`.

**The Offset Depth Rule.** Use the shared offset soft shadows; never add glow or luminous edge effects.

## Shapes

Panels, statistics, chart bars, and preparation tracks remain square. Badges, fields, and dialogs use four-pixel corners; source dots and avatars use circles. The corrected liquid metal brief adds a capsule profile only for metal actions, including buttons, scenario presets, search, and the tour action.

## Components

### Buttons

Primary actions use sculpted silver faces, three-pixel reflective chrome rims and bold forest labels. Secondary actions use two-pixel chrome rims and ink labels. Shared padding supports 44px targets. Focus uses a two-pixel forest outline with a three-pixel offset; the dark rail uses light focus ink. Hover shifts face reflections and lifts primary actions by two pixels; pressing recesses the face with the shared optical step.

AsyncButton disables the action immediately, exposes aria-busy, displays an activity icon and pending label, and shows an indeterminate bottom strip. This signals a real pending request, never a completion percentage.

### Chips

Positive, warning, and danger badges pair pale backgrounds with corresponding semantic ink. Text and a dot preserve meaning without color. All use control corners.

### Cards / Containers

Paper containers have square corners, no outer border, and the shared surface shadow. Section headings and body/footer regions share aligned gutters; fine internal rules separate related information. Statistics remain a shared divided strip.

### Inputs / Fields

Native labeled fields, selects, ranges, and checkboxes preserve familiar behavior. Search and filter controls use control strokes and 44px targets. Labels, units, and hints remain nearby. Advanced cost adjustments stay inside a named disclosure; scenario presets offer three starting points.

### Navigation

The dark rail groups daily planning separately from learning and maintenance. Active links use lighter forest fill and rail ink; supporting labels use muted rail ink. Both desktop wordmark and mobile wordmark are home links. Mobile navigation uses a native dialog; command search opens immediately. The route-preserving skip link remains available.

### Review progress

A native progress element counts actually reviewed dishes. Review buttons expose pressed state. “Review next dish” clears obstructing filters and focuses an unfinished row. Completion is labeled as a local checklist, never a server dispatch. This applies the Goal-Gradient Effect to an observable task.

### Loading and calculation stages

Structured skeletons reserve statistics, chart, priorities, and table shapes while a request is pending. Their gentle breathing and button activity share the activity timing. “Estimate demand” becomes complete only after the forecast response; “Balance stock & cost” becomes current while the planning request runs. No artificial delay or invented percentage is added.

### Motion and dialogs

Press feedback uses 120ms; state transitions use 160ms; occasional dialog entry uses 200ms. First overview arrival uses 240ms and a 40ms stagger. The shared ease-out and ease-in-out curves govern authored motion. Charts stay static for reading; command search has no entry delay.

Reduced motion removes transforms, stagger, pulsing, and spinners while retaining status labels, static skeletons, focus rings, and disabled states. Native dialogs retain focus containment and Escape handling. Keyboard interaction also suppresses overview arrival movement.

## Do's and Don'ts

### Do:

- **Do** use shared color, space, radius, typography, weight, and motion tokens.
- **Do** preserve source labels, uncertainty, stock accounting, and simulation limitations.
- **Do** keep 44px primary targets and related labels close to controls.
- **Do** derive progress from checked work and completed API stages.
- **Do** retain native semantics, keyboard focus, and reduced-motion feedback.

### Don't:

- **Don't** introduce curved panels or colored glows. Reflective capsule buttons follow the explicitly requested liquid metal reference.
- **Don't** invent completion percentages, savings, sales, people, or live status.
- **Don't** present local review completion as a kitchen dispatch.
- **Don't** animate charts or delay command search.
- **Don't** represent Laws of UX applications as measured operator outcomes.

## Liquid metal button refinement

The corrected user brief explicitly requests uixamjad's liquid metal buttons. This supersedes the prior transparent button treatment. See DESIGN_REFINEMENT.md for the inspected reference and material contract. Buttons use sculpted silver faces, 2px reflective chrome rims (3px on primary actions), and capsule profiles. Primary labels are bold forest; selected presets retain forest faces. Panel and field geometry is unchanged. Existing focus, pending feedback, reduced-motion, and 44px targets remain. Material colors and gradients are centralized in --metal-* CSS tokens.
