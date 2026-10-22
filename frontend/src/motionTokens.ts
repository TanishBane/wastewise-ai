/** Central motion design tokens for WasteWise AI */
export const motionTokens = {
  duration: {
    micro: 0.16,
    button: 0.22,
    reveal: 0.55,
    hero: 0.85,
    route: 0.22,
  },
  ease: {
    out: [0.22, 1, 0.36, 1] as const,
    outSoft: [0.16, 1, 0.3, 1] as const,
    inOut: [0.77, 0, 0.175, 1] as const,
  },
  distance: {
    subtle: 10,
    standard: 18,
    hero: 28,
  },
} as const;

export type RevealDirection =
  "up" | "down" | "left" | "right" | "fade" | "scale";
