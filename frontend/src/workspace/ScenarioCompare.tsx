import { useEffect, useRef, useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { fetchForecast, fetchPlan } from "../api";
import { AsyncButton, Badge, Panel } from "./shared";
import { number } from "./model";
import type { ConfigResponse } from "../types";

interface Result {
  label: string;
  attendance: number;
  demand: number;
  low: number;
  high: number;
  initial: number;
  total: number;
}
export default function ScenarioCompare({
  item,
  day,
  config,
}: {
  item: string;
  day: string;
  config: ConfigResponse;
}) {
  const [rows, setRows] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultKey, setResultKey] = useState("");
  const id = useRef(0);
  const key = `${item}|${day}`;
  useEffect(
    () => () => {
      id.current += 1;
    },
    [],
  );
  const compare = async () => {
    const current = ++id.current;
    setBusy(true);
    setError("");
    setRows([]);
    try {
      const results = await Promise.all(
        [
          {
            label: "Normal service",
            attendance: 100,
            event: 0,
            weather: config.weather_types[0],
          },
          {
            label: "Campus event",
            attendance: 130,
            event: 1,
            weather: config.weather_types[0],
          },
          {
            label: "Rainy day",
            attendance: 80,
            event: 0,
            weather:
              config.weather_types.find((value) => value.startsWith("Rainy")) ||
              config.weather_types[0],
          },
        ].map(async (scenario) => {
          const forecast = await fetchForecast({
            menu_item: item,
            day_of_week: day,
            attendance_index: scenario.attendance / 100,
            campus_event: scenario.event,
            weather: scenario.weather,
          });
          const plan = await fetchPlan({
            menu_item: item,
            predicted_demand: forecast.predicted_demand,
            lower_bound: forecast.lower_bound,
            upper_bound: forecast.upper_bound,
            service_level_preference: 0.55,
          });
          return {
            label: scenario.label,
            attendance: scenario.attendance,
            demand: forecast.predicted_demand,
            low: forecast.lower_bound,
            high: forecast.upper_bound,
            initial: plan.recommended_initial_batch,
            total: plan.recommended_total_plan,
          };
        }),
      );
      if (id.current === current) {
        setRows(results);
        setResultKey(key);
      }
    } catch (reason) {
      if (id.current === current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Comparison failed. Try again.",
        );
    } finally {
      if (id.current === current) setBusy(false);
    }
  };
  const valid = key === resultKey;
  return (
    <Panel
      title="Make room for a different kind of day"
      description={`${item} · ${day} · three service scenarios, compared fairly`}
      action={<Badge>What-if comparison</Badge>}
    >
      <div className="compare-intro">
        <p>
          How much would the plan change if a campus event brings more people,
          or rain keeps them away?
        </p>
        <AsyncButton
          className="button"
          busy={busy}
          busyLabel="Comparing scenarios…"
          onClick={compare}
        >
          <GitCompareArrows size={16} />
          {busy
            ? "Comparing scenarios…"
            : rows.length && valid
              ? "Recalculate comparison"
              : "Compare three scenarios"}
        </AsyncButton>
      </div>
      {error && (
        <div className="inline-error comparison-error" role="alert">
          {error}
        </div>
      )}
      {rows.length > 0 && valid && (
        <div className="table-scroll">
          <table className="scenario-comparison-table">
            <thead>
              <tr>
                <th scope="col">Service scenario</th>
                <th scope="col" className="numeric">Attendance</th>
                <th scope="col" className="numeric">Forecast</th>
                <th scope="col" className="numeric">Estimate range</th>
                <th scope="col" className="numeric">New prep</th>
                <th scope="col" className="numeric">First batch</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td>
                    <strong>{row.label}</strong>
                  </td>
                  <td className="numeric">{row.attendance}%</td>
                  <td className="numeric">{number(row.demand)}</td>
                  <td className="numeric">
                    {row.low}–{row.high}
                  </td>
                  <td className="numeric">{row.total}</td>
                  <td className="numeric">{row.initial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="panel-caption">
        Portions except attendance. Fixed comparison assumptions: zero existing
        stock, default costs, 55% service preference. Scenarios are estimates,
        not scheduled events.
      </p>
    </Panel>
  );
}
