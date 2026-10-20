import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Leaf,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { fetchPerformance } from "../api";
import {
  Badge,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
  Panel,
  Stats,
} from "./shared";
import { date, downloadCSV, money, number, useResource } from "./model";
import type { ScreenProps } from "./model";

export default function Performance({ revision, navigate }: ScreenProps) {
  const { data, loading, error, retry } = useResource(
    fetchPerformance,
    revision,
  );
  const [sort, setSort] = useState("difference");
  if (loading)
    return (
      <Loading label="Evaluating model performance and simulated impact…" />
    );
  if (error || !data)
    return (
      <ErrorState
        message={error || "No performance data returned."}
        retry={retry}
      />
    );
  const improvement = data.baseline_metrics.wape - data.ml_metrics.wape;
  const rows = [...data.dish_comparison].sort((a, b) =>
    sort === "difference"
      ? a.wape_diff - b.wape_diff
      : sort === "error"
        ? b.ml_wape - a.ml_wape
        : a.menu_item.localeCompare(b.menu_item),
  );
  const max = Math.max(
    1,
    ...rows.flatMap((row) => [row.ml_wape, row.baseline_wape]),
  );
  const exportMetrics = () =>
    downloadCSV("wastewise-holdout-evaluation.csv", [
      [
        "Dish",
        "Model WAPE %",
        "Baseline WAPE %",
        "Model MAE portions",
        "Difference percentage points",
      ],
      ...rows.map((row) => [
        row.menu_item,
        row.ml_wape,
        row.baseline_wape,
        row.ml_mae,
        row.wape_diff,
      ]),
    ]);
  return (
    <>
      <PageHeading
        title="Better decisions need better evidence."
        description="A chronological holdout, a transparent baseline, and no invented wins."
      >
        <button className="button" onClick={exportMetrics}>
          <ArrowDownToLine size={16} />
          Export evaluation
        </button>
      </PageHeading>
      <Stats
        items={[
          {
            label: "Model forecast error",
            value: (
              <>
                {data.ml_metrics.wape}
                <small>% WAPE</small>
              </>
            ),
            note: "Lower is better",
            tone: improvement > 0 ? "positive-ink" : "",
          },
          {
            label: "Weekday baseline error",
            value: (
              <>
                {data.baseline_metrics.wape}
                <small>% WAPE</small>
              </>
            ),
            note: "Historical same-weekday average",
          },
          {
            label: "Mean absolute error",
            value: (
              <>
                {data.ml_metrics.mae}
                <small>portions</small>
              </>
            ),
            note: "Average error per menu-item day",
          },
          {
            label: "Unseen observations",
            value: number(data.ml_metrics.sample_size),
            note: `Holdout begins ${date(data.ml_metrics.split_date)}`,
          },
        ]}
      />
      <div
        className={`evidence-banner ${improvement > 0 ? "positive" : "warning"}`}
      >
        <Scale size={23} />
        <div>
          <strong>
            {improvement > 0
              ? `The model reduces error by ${improvement.toFixed(1)} percentage points.`
              : improvement < 0
                ? `The weekday baseline is better by ${Math.abs(improvement).toFixed(1)} percentage points.`
                : "The model and baseline have the same reported error."}
          </strong>
          <p>
            Compared on the same unseen service records. A lower error is useful
            evidence, not a guarantee of future performance.
          </p>
        </div>
      </div>
      <div className="performance-grid">
        <Panel
          title="Where the model earns its place"
          description="WAPE by dish · lower is better"
          action={
            <label className="compact-field">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort accuracy comparison"
              >
                <option value="difference">Model improvement</option>
                <option value="error">Highest model error</option>
                <option value="name">Dish name</option>
              </select>
            </label>
          }
        >
          <div className="legend comparison-legend">
            <span>
              <i className="green" />
              WasteWise model
            </span>
            <span>
              <i className="sage" />
              Weekday baseline
            </span>
          </div>
          <div className="comparison-list">
            {rows.map((row) => (
              <div className="comparison-row" key={row.menu_item}>
                <div>
                  <strong>{row.menu_item}</strong>
                  <span
                    className={
                      row.wape_diff < 0
                        ? "positive-ink"
                        : row.wape_diff > 0
                          ? "danger-ink"
                          : "muted"
                    }
                  >
                    {row.wape_diff > 0 ? "+" : ""}
                    {row.wape_diff.toFixed(1)} pp
                  </span>
                </div>
                <div className="comparison-bar-row">
                  <div className="comparison-track">
                    <span style={{ width: `${(row.ml_wape / max) * 100}%` }} />
                  </div>
                  <strong>{row.ml_wape}%</strong>
                </div>
                <div className="comparison-bar-row baseline">
                  <div className="comparison-track">
                    <span
                      style={{ width: `${(row.baseline_wape / max) * 100}%` }}
                    />
                  </div>
                  <span>{row.baseline_wape}%</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <div className="performance-aside">
          <Panel
            title="The evaluation, in plain terms"
            action={<ShieldCheck size={19} />}
          >
            <div className="method-list">
              <div>
                <span className="step-number">1</span>
                <div>
                  <strong>Learn from the past</strong>
                  <p>
                    The model trains on records before the holdout start date.
                  </p>
                </div>
              </div>
              <div>
                <span className="step-number">2</span>
                <div>
                  <strong>Predict unseen service days</strong>
                  <p>
                    Later records are evaluated without being included in
                    training.
                  </p>
                </div>
              </div>
              <div>
                <span className="step-number">3</span>
                <div>
                  <strong>Compare fairly</strong>
                  <p>
                    Both approaches predict the same menu-item days, using
                    portions sold as the target.
                  </p>
                </div>
              </div>
            </div>
            <div className="panel-foot">
              <button
                className="text-link"
                onClick={() => navigate("transparency")}
              >
                Read the model notes
                <ArrowRight size={14} />
              </button>
            </div>
          </Panel>
          <Notice>
            Sales are censored when food sells out. Reported accuracy against
            sales may understate the error against total customer demand.
          </Notice>
        </div>
      </div>
      <Panel
        title="What could change in the kitchen"
        description="Retrospective simulation · not measured savings"
        action={<Badge tone="warning">Simulation only</Badge>}
      >
        <Stats
          items={[
            {
              label: "Simulated waste reduction",
              value: (
                <>
                  {data.simulation.waste_reduction_pct}
                  <small>%</small>
                </>
              ),
              note: "Relative to baseline simulated surplus",
            },
            {
              label: "Ingredient cost avoided",
              value: money(data.simulation.financial_savings_inr),
              note: "Estimated ingredient waste savings",
            },
            {
              label: "Surplus portions avoided",
              value: number(data.simulation.surplus_portions_avoided),
              note: "Across the holdout window",
            },
            {
              label: "Estimated carbon avoided",
              value: (
                <>
                  {data.simulation.carbon_avoided_kg}
                  <small>kg CO₂e</small>
                </>
              ),
              note: "Illustrative mass and emission factors",
            },
          ]}
        />
        <div className="stockout-comparison">
          <div>
            <span>Stockout rate under the usual policy</span>
            <strong>{data.simulation.stockout_rate_traditional}%</strong>
          </div>
          <div>
            <span>Stockout rate under the model plan</span>
            <strong
              className={
                data.simulation.stockout_rate_wastewise >
                data.simulation.stockout_rate_traditional
                  ? "danger-ink"
                  : "positive-ink"
              }
            >
              {data.simulation.stockout_rate_wastewise}%
            </strong>
          </div>
        </div>
        <p className="panel-caption">
          Less surplus can mean less availability. Consider both outcomes.
          Ingredient savings exclude missed-sale penalties; carbon estimates use
          approximately 0.32 kg per portion and 2.5 kg CO₂e per kg of food.
        </p>
      </Panel>
      <div className="insight-strip">
        <Leaf size={24} />
        <div>
          <strong>The next proof point belongs in a real kitchen.</strong>
          <p>
            Run a measured pilot: log prepared portions, sales, discards, and
            stockouts before claiming operational savings.
          </p>
        </div>
      </div>
    </>
  );
}
