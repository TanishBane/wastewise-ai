---
name: WasteWise workspace
description: A framed planning sheet for thoughtful kitchen preparation.
colors:
  ground: "#eef2ed"
  surface: "#ffffff"
  raised: "#f7f9f5"
  active: "#e2e9e0"
  ink: "#202c26"
  muted: "#647068"
  border: "#e4e9e3"
  control: "#c7d1c5"
  forest: "#276445"
  forest-dark: "#1d5036"
  forest-pale: "#edf5ee"
  sage: "#7e967e"
  warning: "#91621a"
  warning-pale: "#fcf5e8"
  danger: "#b3453e"
  danger-pale: "#fcf0ed"
typography:
  headline:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "clamp(24px, 2.05vw, 30px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  figure:
    fontFamily: "IBM Plex Sans, sans-serif"
    fontSize: "34px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.025em"
rounded:
  badge: "4px"
  field: "6px"
  control: "7px"
  panel: "12px"
  dialog: "14px"
  sheet: "16px"
spacing:
  compact: "8px"
  control: "12px"
  panel: "21px"
  gap: "24px"
  sheet: "26px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
  button-primary-hover:
    backgroundColor: "{colors.forest-dark}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "8px 13px"
  field:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.field}"
    padding: "7px 10px"
    height: "38px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
  navigation-active:
    backgroundColor: "{colors.active}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  badge-positive:
    backgroundColor: "{colors.forest-pale}"
    textColor: "{colors.forest}"
    rounded: "{rounded.badge}"
    padding: "3px 7px"
---

# Design System: WasteWise workspace

## Overview

**Creative North Star: "The kitchen planning sheet"**

A green-gray frame holds a white working sheet. Forest-green data, restrained rules, compact controls, and readable numerical rows give a daily kitchen workspace its identity. This records the code-led rebuild rather than an approved visual comp.

Source identity remains visible while operators move between forecasts, preparation, rescue, evidence, and data. Synthetic demonstration records and operator records receive explicit source labels; local review state must not resemble a kitchen dispatch.

**Key Characteristics:**

- A framed white sheet with labeled navigation.
- Quiet forest-green decisions and sage comparisons.
- Compact operational typography with tabular figures.
- Flat panels, hairline rules, and explicit source context.

## Colors

The palette combines cool green-gray paper, forest ink, and warm exception colors.

### Primary

- **Forest:** primary actions, active data series, links, focus outlines, and positive states.
- **Deep forest:** primary-button hover.
- **Pale forest:** positive badges, selected presets, and saved-state notes.
- **Sage:** comparison data and the second preparation batch.

### Secondary

- **Harvest amber:** warnings and synthetic-source indicators, with pale amber notice backgrounds.
- **Clay red:** errors and high-risk badges, with pale clay backgrounds.

### Neutral

- **Green-gray ground:** surrounding navigation and workspace frame.
- **White sheet:** working surfaces and fields.
- **Raised paper:** explanatory strips and understated chart tracks.
- **Active paper:** selected navigation and compact hover treatments.
- **Kitchen ink / muted ink:** primary content and supporting context.
- **Border / control:** panel boundaries and interactive-field strokes.

**The Source Context Rule.** Pair operational figures with their source and qualification; color alone does not distinguish demonstration data, forecasts, and recorded outcomes.

## Typography

**Display Font:** IBM Plex Sans, with sans-serif fallback.
**Body Font:** IBM Plex Sans, self-hosted in regular, medium, semibold, and bold weights.

One family supports concise page headings and dense planning data. Figures use tabular numerals; headings use restrained negative tracking.

### Hierarchy

- **Headline:** responsive page heading; narrow screens override it to 27px.
- **Title:** section heading; panel headings usually use a 16px variant.
- **Body:** base interface text, with 12–13px explanatory paragraphs.
- **Label:** medium control and metric labels; supporting metadata commonly uses 11px.
- **Figure:** overview totals; responsive and scenario variants reduce size to fit columns.

**The Comparable Figures Rule.** Use tabular figures in tables, statistics, batch labels, comparisons, and key-value lists.

## Layout

Desktop uses a sticky 228px navigation column beside the sheet. The workspace bar is 62px high; the sheet has 26px horizontal gutters and 24px panel gaps. Panels use 21px internal horizontal padding. The overview pairs a larger chart with priorities; the scenario pairs a 295px control column with results. Numerical tables scroll horizontally inside their container.

At 1250px navigation becomes 205px and the overview stacks. At 1000px evidence and data grids stack and statistics use two columns. At 760px the sidebar becomes navigation inside a native modal, the bar is 56px, sheet gutters are 18px, and controls precede results. At 1600px sheet gutters expand to 36px. Print removes navigation and action chrome.

## Elevation & Depth

Resting panels are flat: white surfaces, fine borders, and tonal grounds carry separation. Only modal dialogs use a diffuse shadow over a dark translucent backdrop.

### Shadow Vocabulary

- **Modal separation** (`0 18px 65px #18321d26`): native dialog above the workspace.

**The Flat Workspace Rule.** Use borders and tone for ordinary working surfaces; reserve the shipped shadow for modal separation.

## Shapes

The sheet has the broadest corners; panels use a smaller continuous curve and controls are more compact. Badges are small rounded rectangles, while source dots, step markers, and the operator avatar are circular. Batch tracks are low segmented horizontal strips.

## Components

### Buttons

Compact labeled controls use a fine stroke and medium text. Primary actions have forest fill and white text; secondary actions remain white. Hover darkens primary actions and strengthens secondary contrast. Keyboard focus uses a two-pixel forest outline with a three-pixel offset. Disabled controls reduce opacity. Mobile buttons increase to a 40px minimum height.

### Chips

Small badges combine a text label and status dot. Positive, warning, and danger variants pair pale fill with corresponding semantic ink. Preserve text so status remains understandable without color.

### Cards / Containers

Panels have a fine border, white background, and rounded corners. Headings, captions, and footers share aligned gutters. Statistics sit in one divided strip rather than unrelated floating tiles.

### Inputs / Fields

Native fields use a white background, control stroke, visible labels, and supporting text. Search fields include a small icon and input label. Range and checkbox controls use forest accents. Inline errors retain a recovery action where one exists.

### Navigation

Labeled links combine line icons and text. Active destinations receive a green-gray fill, stronger ink, and small forest dot. Mobile navigation reuses the links in a native dialog. Search opens a page finder with Ctrl K.

### Batch preparation strip

Forest indicates the initial batch and sage indicates refill quantity. Visible labels name both amounts, and existing stock appears separately. The graphic supports the numbers.

### Dialogs and motion

Native dialogs provide Escape handling and focus containment. Entry uses opacity and six-pixel upward translation with a slight scale change over 180ms. Reduced motion receives short opacity-only entry. Buttons use 150ms color transitions; loading indicators rotate unless reduced motion is requested. Navigation and chart data do not animate.

## Do's and Don'ts

### Do:

- **Do** preserve source labels and uncertainty beside the decisions they qualify.
- **Do** align repeated panel gutters and use tabular numerical comparisons.
- **Do** use forest for primary decisions and amber or clay for labeled exceptions.
- **Do** retain keyboard focus, native control semantics, and reduced-motion behavior.

### Don't:

- **Don't** replace zero or unavailable values with invented success metrics.
- **Don't** present forecasts or retrospective simulations as recorded operating results.
- **Don't** add decorative gradients, blocking introductions, or illustrations to this operational world.
- **Don't** use modal shadows for ordinary panels.
