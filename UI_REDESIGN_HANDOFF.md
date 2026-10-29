## UI Redesign Handoff

### Completed Work (Stage 1 & 2)
- Inspected `git status` and identified existing UI changes.
- Preserved all existing user changes.
- Identified and fixed JSX closing tag mismatch in `Home.tsx`.
- Fixed `palette.green` error in `Charts.tsx` by changing it to `palette.moss`.
- Consolidated `Page` and `Navigate` type definitions by importing them from `model.ts`.
- Removed unused `shouldReduceMotion` and `instant` variables/props from `CapabilityRibbon`, `ProofPoints`, `HomeSimulator`, `HomeBentoGrid`, `HomeWorkflowGallery`, `HomeEvidence`, and `HomeEndCTA` in `Home.tsx`.
- Corrected `animationDelay` and `transitionDelay` property usage in `Home.tsx` components.
- Removed unused `useScroll` and `useTransform` imports from `Home.tsx`.
- Re-added `ConfigResponse` import to `Home.tsx`.
- Verified that the frontend application now builds successfully.

### Completed Work (Stage 3)
- Refactored `Home` page components to remove unused `shouldReduceMotion` and `instant` variables/props.
- Aligned `Home` components to use `Navigate` type from `model.ts`.
- Cleaned up `Home.tsx` imports and removed unused `framer-motion` hooks.
- Verified that the build passes with these changes.

### Build Status
- **Successful**
