/** Palette shared by the workspace and chart rendering. CSS is in index.css. */
export const palette = {
  ground: "#eeeae1",
  surface: "#fffdf7",
  raised: "#f5f1e8",
  ink: "#24362d",
  muted: "#626b60",
  border: "#deddd0",
  green: "#24533d",
  sage: "#7c9076",
  warning: "#885514",
  danger: "#a44537",
} as const;

export const chartTokens = {
  fontFamily: "var(--font-body)",
  labelSize: 12,
  valueSize: 14,
  lineWidth: 2,
  barRadius: [0, 0, 0, 0] as [number, number, number, number],
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
