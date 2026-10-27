---
name: WasteWise Botanical Editorial FoodTech Design System
description: Botanical editorial atmosphere with layered foliage, textured forest surfaces, muted teal sage, warm cream, and earthy terracotta for intelligent canteen demand planning.
colors:
  forest-950: "#14392F"
  forest-900: "#1D4A3B"
  primary: "#1B4D3E"
  primary-dark: "#0F291E"
  sage-teal: "#78A395"
  sage-muted: "#5E8B7E"
  moss-accent: "#91A578"
  sage-surface: "#DFE8DC"
  ground: "#F8F1E5"
  surface: "#FFFDF8"
  raised: "#F4EFE6"
  cream-pill: "#F1E3CD"
  sand-accent: "#D5B89A"
  terracotta: "#805142"
  copper-accent: "#B87D4B"
  bark-dark: "#3D2B1F"
  ink: "#181D19"
  muted: "#667168"
  border: "#E3DCCF"
  border-forest: "rgba(120, 163, 149, 0.25)"
  warning: "#D97736"
  danger: "#C25438"
  success: "#3C674C"
typography:
  headline-display:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "44px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline-section:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, Source Sans 3, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Plus Jakarta Sans, Source Sans 3, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  tabular:
    fontFamily: "Plus Jakarta Sans, JetBrains Mono, monospace"
    fontVariantNumeric: "tabular-nums"
    fontSize: "14px"
---

# WasteWise AI — Botanical Editorial Design System

## 1. Visual Manifesto & Provenance

The WasteWise AI visual language blends **Botanical Editorial Poise** with **High-Precision Food Operations**:
- **Natural Heritage**: Grounded in organic forest-green canopies (`#14392F`, `#1D4A3B`), tactile rippled moss backgrounds, soft sage surfaces (`#DFE8DC`), and warm cream/ivory substrates (`#F8F1E5`).
- **Operational Clarity**: High-contrast editorial typography (*Newsreader* serif paired with *Plus Jakarta Sans*) delivers instant scanability for culinary portioning, Newsvendor batch thresholds, and HACCP temperature logging.
- **Asymmetric Warping & Tactile Bento**: Distinct squircle cards with custom circular emblem badges (flower, three-leaf cluster, golden wheat sprout, faceted flower, menu lines) establish an unmistakable visual cadence inspired by the botanical reference art.
- **Zero-Friction Public Demo**: Persistent demo-only badges clearly state synthetic baseline data while empowering users to explore live demand forecasting and prep planning.

---

## 2. Color System & Token Architecture

The palette enforces a 60-30-10 distribution rule:
- **60% Structural Ground & Canvas**: Deep Forest `#14392F` for hero and capability ribbons; Warm Ivory `#F8F1E5` and `#FFFDF8` for workspace canvases.
- **30% Secondary Surfaces & Framing**: Muted Teal Sage `#78A395`, Sage Surface `#DFE8DC`, and textured moss for bento pods and secondary navigation.
- **10% Intentional Accents**: Warm Terracotta `#805142`, Golden Copper `#B87D4B`, and Cream Pill `#F1E3CD` for focal buttons and variance warnings.

### Semantic CSS Tokens

```css
:root {
  /* Brand Botanical */
  --color-brand-forest-950: #14392f;
  --color-brand-forest-900: #1d4a3b;
  --color-brand-primary: #1b4d3e;
  --color-brand-sage: #78a395;
  --color-brand-moss: #91a578;
  --color-brand-terracotta: #805142;
  --color-brand-copper: #b87d4b;
  --color-brand-bark: #3d2b1f;

  /* Surfaces & Canvases */
  --color-surface-ground: #f8f1e5;
  --color-surface-card: #fffdf8;
  --color-surface-raised: #f4efe6;
  --color-surface-cream-pill: #f1e3cd;
  --color-surface-sage: #dfe8dc;
  --color-surface-dark-glass: rgba(20, 57, 47, 0.88);

  /* Typography */
  --color-text-ink: #181d19;
  --color-text-muted: #667168;
  --color-text-ivory: #f8f1e5;
  --color-text-cream: #f1e3cd;

  /* Boundaries & Elevations */
  --color-border-subtle: #e3dccf;
  --color-border-forest: rgba(120, 163, 149, 0.25);
  --color-focus-ring: #f1e3cd;
}
```

---

## 3. Typographic Hierarchy

- **Display & Headline Titles**: `Newsreader` (self-hosted Google OFL font in `frontend/src/fonts.css`).
  - Hero display: `clamp(2.2rem, 5vw, 3.2rem)`, weight 500, letter-spacing `-0.025em`.
  - Section headlines: `clamp(1.5rem, 3vw, 2.1rem)`, weight 500, letter-spacing `-0.02em`.
- **Interface & Operational Reading**: `Plus Jakarta Sans` / `Source Sans 3`.
  - Body text: `14px / 1.6` for long-form explanations and modal guidance.
  - Controls & Buttons: `14px`, weight 600.
  - Tabular readouts: `tabular-nums` alignment for portions, weights, and INR currency values.

---

## 4. Homepage Information Architecture

1. **Hero Section**:
   - Left stage: Deep forest-to-sage angled panel with headline **"Make every portion count"**, subhead explaining AI demand forecasting, glance metric pill, and signature warm cream pill button (**"Explore kitchen overview"**).
   - Right stage: Composition of layered tropical foliage with natural depth, realistic veining, and warm dry leaf textures.
2. **4-Capability Floating Ribbon**:
   - Floating translucent forest-green container (`#14392F`) with 4 icon columns:
     1. *Demand Forecasting* (Multi-variable attendance, weather & calendar signals)
     2. *Preparation Planning* (Newsvendor asymmetric cost balancing)
     3. *Surplus-Risk Triage* (Early identification of excess portions)
     4. *Shift Reconciliation* (Physical outcome logging & audit trail)
3. **Botanical 3×2 Bento Grid**:
   - Six distinct squircle cards inspired by the reference image:
     - Card 1 (Sage): *Inflow & Turnstile Pacing* with circular spoke flower emblem.
     - Card 2 (Terracotta): *Newsvendor Formulation & Risk Tradeoffs* with dark circle leaf cluster emblem.
     - Card 3 (Golden Copper): *Statistical Variance & Spoilage Buffers* with wheat sprout emblem.
     - Card 4 (Authentic Photography): Institutional canteen prep line with *Batch 1 Prep Verified* badge.
     - Card 5 (Dark Chocolate): *Cold Storage & Ingredient Deficit Ledger* with white floral badge.
     - Card 6 (Warm Sand): *Executive Culinary Signoff & P&L Recovery* with bronze hexagon menu lines.
4. **Interactive Operational Modules**:
   - Live demand forecast workbench, preparation planner sheet, and surplus rescue queue.
5. **Authentic Canteen Workflow Gallery**:
   - Staging, HACCP holding, batch release, and surplus donation protocols.

---

## 5. Responsive Viewport Invariants

- **Desktop (1440×900)**: Multi-column bento, floating capability strip, side-by-side hero composition.
- **Tablet (768×1024)**: 2-column bento grid, responsive capability ribbon, touch targets $\ge$ 44px.
- **Mobile (375×812)**: Single-column stacked cards, compact botanical hero, bottom navigation drawer, `scrollWidth - clientWidth === 0`.
