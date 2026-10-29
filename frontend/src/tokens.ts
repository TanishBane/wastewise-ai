/** Premium operational SaaS palette for WasteWise AI — built on the botanical editorial foundation.
 *  60% Structural Ground & Canvas  30% Secondary Surfaces & Framing  10% Intentional Accents
 */
export const palette = {
  /* 60% Structural Ground & Canvas */
  ground: "#f6f5ef",
  surface: "#fffefa",
  raised: "#f0f1e9",

  /* 30% Secondary Surfaces & Framing */
  sage: "#76947f",
  moss: "#91a578",
  cream: "#f1e3cd",
  sand: "#dfe8dc",

  /* 10% Intentional Accents */
  forest: "#14392f",
  terracotta: "#805142",
  copper: "#b87d4b",

  /* Semantic */
  ink: "#181d19",
  muted: "#667168",
  border: "#e3e5dc",
  warning: "#d97736",
  danger: "#c25438",
  success: "#3c674c",
} as const;

/** Chart-specific tokens with improved readability and accessibility */
export const chartTokens = {
  fontFamily: "var(--font-body)",
  labelSize: 12,
  valueSize: 14,
  lineWidth: 2,
  barRadius: [6, 6, 0, 0] as [number, number, number, number],
  tooltip: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-control)",
    padding: "var(--space-3)",
    fontSize: "var(--text-sm)",
    boxShadow: "var(--shadow-floating)",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },
} as const;
