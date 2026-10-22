/** Palette shared by the workspace and chart rendering. CSS is in index.css. */
export const palette = {
  ground: "#f6f5ef",
  surface: "#fffefa",
  raised: "#f0f1e9",
  ink: "#1d2b24",
  muted: "#667168",
  border: "#e3e5dc",
  green: "#367a59",
  sage: "#76947f",
  warning: "#885514",
  danger: "#a44537",
} as const;

export const chartTokens = {
  fontFamily: "var(--font-body)",
  labelSize: 12,
  valueSize: 14,
  lineWidth: 2,
  barRadius: [6, 6, 0, 0] as [number, number, number, number],
  tooltip: {
    background: "var(--surface)",
    border: "none",
    borderRadius: "var(--radius-control)",
    padding: "var(--space-4)",
    fontSize: "var(--text-sm)",
    boxShadow: "var(--shadow-floating)",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },
} as const;
