import MetalButton from "../MetalButton";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ClipboardList,
  Leaf,
  Plus,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { fetchOutcomes, fetchPerformance, recordOutcome } from "../api";
import { AnimatedNumber } from "../motion";
import type { ActualOutcomeItem } from "../types";
import {
  Badge,
  Dialog,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
  Panel,
  Stats,
} from "./shared";
import { date, downloadCSV, useResource } from "./model";
import type { ScreenProps } from "./model";

export default function Performance({ revision, navigate }: ScreenProps) {
  const { data, loading, error, retry } = useResource(
    fetchPerformance,
    revision,
  );
  const [sort, setSort] = useState("difference");
  const [outcomes, setOutcomes] = useState<ActualOutcomeItem[]>([]);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [formDish, setFormDish] = useState("Pav Bhaji");
  const [formDate, setFormDate] = useState("2026-10-22");
  const [formPrep, setFormPrep] = useState("150");
  const [formSold, setFormSold] = useState("142");
  const [formLeftover, setFormLeftover] = useState("8");
  const [formCause, setFormCause] = useState("Over-preparation");
  const [formDiscard, setFormDiscard] = useState("1.6");
  const [formNotes, setFormNotes] = useState("");
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [outcomeSuccess, setOutcomeSuccess] = useState("");
  const [outcomeError, setOutcomeError] = useState("");

  useEffect(() => {
    fetchOutcomes()
      .then(setOutcomes)
      .catch(() => {});
  }, [revision]);

  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(formPrep, 10) || 0;
    const s = parseInt(formSold, 10) || 0;
    const l = parseInt(formLeftover, 10) || 0;
    if (s + l !== p) {
      setOutcomeError(
        "Prepared portions must equal portions sold plus leftover portions.",
      );
      return;
    }
    setSavingOutcome(true);
    setOutcomeSuccess("");
    setOutcomeError("");
    try {
      await recordOutcome({
        service_date: formDate,
        target_meal: "Lunch",
        menu_item: formDish,
        portions_prepared: p,
        portions_sold: s,
        portions_leftover: l,
        waste_cause: formCause,
        discarded_kg: parseFloat(formDiscard) || 0,
        notes: formNotes,
      });
      setOutcomeSuccess("Outcome recorded successfully.");
      const updated = await fetchOutcomes();
      setOutcomes(updated);
      setTimeout(() => {
        setOutcomeModalOpen(false);
        setOutcomeSuccess("");
      }, 1000);
    } catch (err: unknown) {
      setOutcomeError(
        err instanceof Error ? err.message : "Failed to record outcome.",
      );
    } finally {
      setSavingOutcome(false);
    }
  };
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
        title="The numbers behind the plan."
        description="A chronological holdout, a transparent baseline, and no invented wins."
      >
        <MetalButton className="button" onClick={exportMetrics}>
          <ArrowDownToLine size={16} />
          Export evaluation
        </MetalButton>
      </PageHeading>
      <Stats
        items={[
          {
            label: "Model forecast error",
            value: (
              <>
                <AnimatedNumber value={data.ml_metrics.wape} decimals={1} />
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
                <AnimatedNumber
                  value={data.baseline_metrics.wape}
                  decimals={1}
                />
                <small>% WAPE</small>
              </>
            ),
            note: "Historical same-weekday average",
          },
          {
            label: "Mean absolute error",
            value: (
              <>
                <AnimatedNumber value={data.ml_metrics.mae} decimals={1} />
                <small>portions</small>
              </>
            ),
            note: "Average error per menu-item day",
          },
          {
            label: "Unseen observations",
            value: <AnimatedNumber value={data.ml_metrics.sample_size} />,
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
                    <span
                      style={{
                        width: `${(row.ml_wape / max) * 100}%`,
                        transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    />
                  </div>
                  <strong>{row.ml_wape}%</strong>
                </div>
                <div className="comparison-bar-row baseline">
                  <div className="comparison-track">
                    <span
                      style={{
                        width: `${(row.baseline_wape / max) * 100}%`,
                        transition: "width 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
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
                  <AnimatedNumber
                    value={data.simulation.waste_reduction_pct}
                    decimals={1}
                  />
                  <small>%</small>
                </>
              ),
              note: "Relative to baseline simulated surplus",
            },
            {
              label: "Ingredient cost avoided",
              value: (
                <AnimatedNumber
                  value={data.simulation.financial_savings_inr}
                  prefix="₹"
                />
              ),
              note: "Simulated on synthetic data. Not measured.",
            },
            {
              label: "Surplus portions avoided",
              value: (
                <AnimatedNumber
                  value={data.simulation.surplus_portions_avoided}
                />
              ),
              note: "Across the holdout window",
            },
            {
              label: "Estimated carbon avoided",
              value: (
                <>
                  <AnimatedNumber
                    value={data.simulation.carbon_avoided_kg}
                    decimals={1}
                  />
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
          Simulated on synthetic data. Not measured. Assumptions: Replays
          historical holdout demand against Newsvendor 55% service level; 16%
          traditional baseline safety buffer; raw ingredient costs without
          retail markups or missed-sale penalties; carbon estimates assume 0.32
          kg/portion and 2.5 kg CO₂e/kg of food.
        </p>
      </Panel>
      <Panel
        title="Operational Service Outcomes"
        description="Measured kitchen feedback captured post-service to validate live performance."
        action={
          <MetalButton
            className="button"
            onClick={() => setOutcomeModalOpen(true)}
          >
            <Plus size={16} />
            Log service outcome
          </MetalButton>
        }
      >
        {outcomes.length === 0 ? (
          <div className="empty-state" style={{ padding: "var(--space-6) 0" }}>
            <ClipboardList
              size={32}
              style={{ opacity: 0.5, marginBottom: "var(--space-2)" }}
            />
            <p>No operational service outcomes logged yet.</p>
            <small className="muted">
              Log your daily service results after lunch or dinner service.
            </small>
          </div>
        ) : (
          <div className="table-wrap">
            <div className="outcome-metrics-strip">
              <div className="outcome-stat">
                <span>Logged Portions Prepared</span>
                <strong>
                  {outcomes.reduce((acc, o) => acc + o.portions_prepared, 0)}
                </strong>
              </div>
              <div className="outcome-stat">
                <span>Portions Sold</span>
                <strong>
                  {outcomes.reduce((acc, o) => acc + o.portions_sold, 0)}
                </strong>
              </div>
              <div className="outcome-stat">
                <span>Service Efficiency</span>
                <strong>
                  {Math.round(
                    (outcomes.reduce((acc, o) => acc + o.portions_sold, 0) /
                      Math.max(
                        1,
                        outcomes.reduce(
                          (acc, o) => acc + o.portions_prepared,
                          0,
                        ),
                      )) *
                      100,
                  )}
                  %
                </strong>
              </div>
              <div className="outcome-stat">
                <span>Recorded Leftovers</span>
                <strong>
                  {outcomes.reduce((acc, o) => acc + o.portions_leftover, 0)}
                </strong>
              </div>
            </div>
            <table className="menu-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dish</th>
                  <th>Prepared</th>
                  <th>Sold</th>
                  <th>Leftover</th>
                  <th>Waste Cause</th>
                  <th>Discarded</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.service_date}</strong>
                    </td>
                    <td>{o.menu_item}</td>
                    <td>{o.portions_prepared}</td>
                    <td>{o.portions_sold}</td>
                    <td>{o.portions_leftover}</td>
                    <td>
                      <span className="cause-tag">
                        {o.waste_cause || "Over-prep"}
                      </span>
                    </td>
                    <td>{o.discarded_kg} kg</td>
                    <td className="muted">{o.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      <Dialog
        open={outcomeModalOpen}
        onClose={() => setOutcomeModalOpen(false)}
        title="Log Canteen Service Outcome"
      >
        <form
          onSubmit={handleSaveOutcome}
          style={{ padding: "var(--space-5)" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "var(--space-4)",
              marginBottom: "var(--space-4)",
            }}
          >
            <div>
              <label className="field-label">Service date</label>
              <input
                type="date"
                className="input"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Menu item</label>
              <select
                className="select"
                value={formDish}
                onChange={(e) => setFormDish(e.target.value)}
              >
                {data.dish_comparison.map((d) => (
                  <option key={d.menu_item} value={d.menu_item}>
                    {d.menu_item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: "var(--space-3)",
              marginBottom: "var(--space-4)",
            }}
          >
            <div>
              <label className="field-label">Prepared</label>
              <input
                type="number"
                className="input"
                min="0"
                value={formPrep}
                onChange={(e) => setFormPrep(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Sold</label>
              <input
                type="number"
                className="input"
                min="0"
                value={formSold}
                onChange={(e) => setFormSold(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Leftover</label>
              <input
                type="number"
                className="input"
                min="0"
                value={formLeftover}
                onChange={(e) => setFormLeftover(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label">Discard (kg)</label>
              <input
                type="number"
                step="0.1"
                className="input"
                min="0"
                value={formDiscard}
                onChange={(e) => setFormDiscard(e.target.value)}
              />
            </div>
          </div>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <label className="field-label">Observed waste cause</label>
            <select
              className="select"
              value={formCause}
              onChange={(e) => setFormCause(e.target.value)}
            >
              <option value="Over-preparation">
                Over-preparation (excess initial fire)
              </option>
              <option value="Unexpected low footfall">
                Unexpected low footfall / weather dip
              </option>
              <option value="Quality / holding limit">
                Quality / holding time limit reached
              </option>
              <option value="Late replenishment">
                Replenishment fired too late in shift
              </option>
              <option value="Accidental spoilage">
                Preparation loss / kitchen spill
              </option>
            </select>
          </div>
          <div style={{ marginBottom: "var(--space-5)" }}>
            <label className="field-label">Kitchen notes (optional)</label>
            <input
              type="text"
              className="input"
              style={{ width: "100%" }}
              placeholder="e.g. Weather turned rainy at 1:30 PM, leftover donated."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>
          {outcomeSuccess && (
            <div
              style={{
                color: "var(--green)",
                marginBottom: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Check size={16} />
              <span>{outcomeSuccess}</span>
            </div>
          )}
          {outcomeError && (
            <div className="inline-error" role="alert">
              {outcomeError}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "var(--space-3)",
            }}
          >
            <button
              type="button"
              className="button"
              onClick={() => setOutcomeModalOpen(false)}
            >
              Cancel
            </button>
            <MetalButton
              type="submit"
              className="button primary"
              disabled={savingOutcome}
            >
              {savingOutcome ? "Saving…" : "Save outcome"}
            </MetalButton>
          </div>
        </form>
      </Dialog>
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
