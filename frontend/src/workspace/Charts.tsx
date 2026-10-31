import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { date } from "./model";

import { chartTokens, palette } from "../tokens";

const green = palette.moss;
const tick = {
  fill: palette.muted,
  fontSize: chartTokens.labelSize,
  fontFamily: chartTokens.fontFamily,
};
const tooltip = chartTokens.tooltip;
export function DemandChart({
  rows,
}: {
  rows: {
    menu_item: string;
    predicted_demand: number;
    recommended_prep: number;
  }[];
}) {
  return (
    <div
      className="chart demand-chart"
      role="img"
      aria-label="Forecast and recommended preparation by dish. Exact values are in the menu preparation table below."
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
          barGap={3}
        >
          <CartesianGrid vertical={false} stroke={palette.border} />
          <XAxis
            dataKey="menu_item"
            tick={{ ...tick, fontSize: chartTokens.labelSize }}
            tickFormatter={(value) =>
              String(value)
                .replace("Veg Grilled Sandwich", "Sandwich")
                .replace("Rajma Rice Bowl", "Rajma rice")
                .replace("Fresh Fruit Juice", "Fruit juice")
                .replace("Idli Sambar", "Idli")
                .replace("Masala Dosa", "Dosa")
            }
            interval={0}
            axisLine={false}
            tickLine={false}
            height={40}
          />
          <YAxis
            tick={tick}
            width={34}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip contentStyle={tooltip} cursor={{ fill: palette.raised }} />
          <Bar
            name="Forecast"
            dataKey="predicted_demand"
            fill={green}
            radius={chartTokens.barRadius}
            maxBarSize={28}
            isAnimationActive={false}
          />
          <Bar
            name="Recommended prep"
            dataKey="recommended_prep"
            fill={palette.sage}
            radius={chartTokens.barRadius}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
export function HistoryChart({
  rows,
}: {
  rows: { date: string; actual_sold: number }[];
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label="Recorded portions sold over the last 30 observations"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={rows}
          margin={{ top: 16, right: 14, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={palette.border} />
          <XAxis
            dataKey="date"
            tick={tick}
            tickFormatter={(value) => date(String(value), true)}
            minTickGap={32}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={tick}
            width={36}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={tooltip}
            labelFormatter={(value) => date(String(value))}
          />
          <Line
            type="linear"
            dataKey="actual_sold"
            name="Portions sold"
            stroke={green}
            strokeWidth={chartTokens.lineWidth}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
export function DistributionChart({
  rows,
  target,
}: {
  rows: { portions: number; frequency: number }[];
  target: number;
}) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Simulated demand distribution; recommended new preparation ${target} portions`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          margin={{ top: 24, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke={palette.border} />
          <XAxis
            dataKey="portions"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={tick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={tick} width={36} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={tooltip}
            labelFormatter={(value) => `${value} portions`}
          />
          <Bar
            name="Simulated draws"
            dataKey="frequency"
            fill={palette.sage}
            isAnimationActive={false}
          />
          <ReferenceLine
            x={target}
            stroke={green}
            strokeWidth={chartTokens.lineWidth}
            label={{
              value: "Prep target",
              fill: green,
              fontSize: chartTokens.labelSize,
              position: "insideTopRight",
            }}
            ifOverflow="extendDomain"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
