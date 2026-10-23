import MetalButton from "../MetalButton";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ChefHat,
  CloudRain,
  FlaskConical,
  Printer,
  RotateCcw,
  Sun,
  Users,
} from "lucide-react";
import { fetchForecast, fetchPlan } from "../api";
import type { ForecastResponse, PlanResponse } from "../types";
import { DistributionChart, HistoryChart } from "./Charts";
import ScenarioCompare from "./ScenarioCompare";
import { AnimatedNumber } from "../motion";
import PrintKitchenSheet from "./PrintKitchenSheet";
import {
  Badge,
  AsyncButton,
  CalculationStages,
  BatchStrip,
  Loading,
  Notice,
  PageHeading,
  Panel,
  SavedNote,
  Stats,
} from "./shared";
import { downloadCSV, money } from "./model";
import type { ScreenProps } from "./model";

export default function Scenario({
  config,
  dish,
  navigate,
  kind,
}: ScreenProps & { kind: "demand-forecast" | "prep-planner" }) {
  const [restored] = useState(() => {
    try {
      const value = JSON.parse(
        sessionStorage.getItem("wastewise-scenario") || "null",
      );
      return value &&
        value.item === dish &&
        config.days_of_week.includes(value.day) &&
        config.weather_types.includes(value.weather) &&
        Number.isFinite(value.attendance) &&
        value.attendance >= 10 &&
        value.attendance <= 180
        ? value
        : null;
    } catch {
      return null;
    }
  });
  const planning = kind === "prep-planner";
  const [item, setItem] = useState(
    config.menu_item_names.includes(dish) ? dish : config.menu_item_names[0],
  );
  const [day, setDay] = useState(restored?.day || "Monday");
  const [attendance, setAttendance] = useState<number>(
    restored?.attendance || 100,
  );
  const [weather, setWeather] = useState<string>(
    restored?.weather || config.weather_types[0],
  );
  const [event, setEvent] = useState<boolean>(restored?.event === true);
  const [stock, setStock] = useState(0);
  const [service, setService] = useState(55);
  const [excess, setExcess] = useState("");
  const [shortage, setShortage] = useState("");
  const [baseline, setBaseline] = useState("");
  const normalWeather = config.weather_types[0];
  const rainyWeather =
    config.weather_types.find((value) => value.startsWith("Rainy")) ||
    normalWeather;
  const preset =
    attendance === 130 && event && weather === normalWeather
      ? "event"
      : attendance === 80 && !event && weather === rainyWeather
        ? "rainy"
        : attendance === 100 && !event && weather === normalWeather
          ? "normal"
          : "custom";
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState(true);
  const [stage, setStage] = useState<"forecast" | "plan">("forecast");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [submittedKey, setSubmittedKey] = useState("");
  const request = useRef(0);
  const scenarioKey = JSON.stringify([
    item,
    day,
    attendance,
    weather,
    event,
    stock,
    service,
    excess,
    shortage,
    baseline,
  ]);
  const dirty = submittedKey !== scenarioKey;
  const cfg = config.menu_items.find((value) => value.name === item);

  const generate = async (formEvent?: FormEvent) => {
    formEvent?.preventDefault();
    const id = ++request.current;
    const key = scenarioKey;
    setBusy(true);
    setStage("forecast");
    setError("");
    setSaved(false);
    setForecast(null);
    setPlan(null);
    try {
      const result = await fetchForecast({
        menu_item: item,
        day_of_week: day,
        attendance_index: attendance / 100,
        weather,
        campus_event: event ? 1 : 0,
      });
      if (id !== request.current) return;
      if (planning) setStage("plan");
      const preparation = planning
        ? await fetchPlan({
            menu_item: item,
            predicted_demand: result.predicted_demand,
            lower_bound: result.lower_bound,
            upper_bound: result.upper_bound,
            current_stock: stock,
            service_level_preference: service / 100,
            ...(excess ? { custom_cost_surplus: Number(excess) } : {}),
            ...(shortage ? { custom_cost_shortage: Number(shortage) } : {}),
            ...(baseline
              ? { traditional_baseline_prep: Number(baseline) }
              : {}),
          })
        : null;
      if (id === request.current) {
        setForecast(result);
        setPlan(preparation);
        setSubmittedKey(key);
      }
    } catch (reason) {
      if (id === request.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not calculate this scenario.",
        );
    } finally {
      if (id === request.current) setBusy(false);
    }
  };
  const loadInitial = useEffectEvent(() => {
    void generate();
  });
  useEffect(() => {
    // Cancel the StrictMode probe before starting a duplicate forecast request.
    const timer = window.setTimeout(loadInitial, 0);
    return () => {
      window.clearTimeout(timer);
      request.current += 1;
    };
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "wastewise-scenario",
        JSON.stringify({ item, day, attendance, weather, event }),
      );
    } catch {
      /* Planning also works without browser storage. */
    }
  }, [item, day, attendance, weather, event]);
  const applyPreset = (value: string) => {
    setEvent(value === "event");
    setAttendance(value === "event" ? 130 : value === "rainy" ? 80 : 100);
    setWeather(
      value === "rainy"
        ? config.weather_types.find((type) => type.startsWith("Rainy")) ||
            config.weather_types[0]
        : config.weather_types[0],
    );
  };
  const savePlan = () => {
    if (!plan || dirty) return;
    downloadCSV(
      `wastewise-plan-${item.toLowerCase().replaceAll(" ", "-")}.csv`,
      [
        [
          "Dish",
          "Day",
          "Attendance %",
          "Weather",
          "Campus event",
          "Existing stock",
          "Forecast",
          "New preparation",
          "Initial batch",
          "Held for refill",
          "Refill trigger",
          "Source",
        ],
        [
          item,
          day,
          attendance,
          weather,
          event ? "Yes" : "No",
          stock,
          forecast!.predicted_demand,
          plan.recommended_total_plan,
          plan.recommended_initial_batch,
          plan.recommended_total_plan - plan.recommended_initial_batch,
          plan.refill_trigger_threshold,
          config.is_synthetic
            ? "Synthetic demonstration"
            : "Uploaded operator records",
        ],
      ],
    );
    setSaved(true);
  };

  return (
    <>
      <PageHeading
        title={planning ? "A plan for this service." : "Read the day ahead."}
        description={
          planning
            ? "Turn a demand estimate into a practical, cost-aware batch plan."
            : "Explore how the day, footfall, and weather shape demand."
        }
      >
        {!planning && (
          <MetalButton
            className="button"
            onClick={() => navigate("prep-planner", item)}
          >
            <ChefHat size={16} />
            Open planner
            <ArrowRight size={15} />
          </MetalButton>
        )}
      </PageHeading>
      <div className="scenario-layout">
        <Panel
          title="Set the service conditions"
          description="Choose a dish, then make the day your own."
          className="scenario-controls"
        >
          <form onSubmit={generate}>
            <div className="preset-buttons" aria-label="Scenario presets">
              {[
                { id: "normal", label: "Normal", icon: Sun },
                { id: "event", label: "Event", icon: Users },
                { id: "rainy", label: "Rainy", icon: CloudRain },
              ].map(({ id, label, icon: Icon }) => (
                <MetalButton
                  type="button"
                  className={preset === id ? "selected" : ""}
                  aria-pressed={preset === id}
                  key={id}
                  onClick={() => applyPreset(id)}
                >
                  <Icon size={16} />
                  {label}
                </MetalButton>
              ))}
            </div>
            <label className="field">
              Menu item
              <select value={item} onChange={(e) => setItem(e.target.value)}>
                {config.menu_item_names.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Service day
              <select value={day} onChange={(e) => setDay(e.target.value)}>
                {config.days_of_week.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="field range-field">
              <span>
                Expected attendance<strong>{attendance}%</strong>
              </span>
              <input
                type="range"
                min={10}
                max={180}
                step={5}
                value={attendance}
                onChange={(e) => {
                  setAttendance(Number(e.target.value));
                }}
              />
              <small>100% is a typical day · scenario assumption</small>
            </label>
            <label className="field">
              Weather
              <select
                value={weather}
                onChange={(e) => {
                  setWeather(e.target.value);
                }}
              >
                {config.weather_types.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={event}
                onChange={(e) => {
                  setEvent(e.target.checked);
                }}
              />
              <span>
                Campus event or festival
                <small>Account for a different service pattern</small>
              </span>
            </label>
            {planning && (
              <>
                <div className="form-divider" />
                <label className="field">
                  Ready-to-serve stock{" "}
                  <span className="field-unit">portions</span>
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step={1}
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                  />
                  <small>
                    Only include stock your kitchen considers safe to serve.
                  </small>
                </label>
                <label className="field range-field">
                  <span>
                    Service preference<strong>{service}%</strong>
                  </span>
                  <input
                    type="range"
                    min={30}
                    max={80}
                    value={service}
                    onChange={(e) => setService(Number(e.target.value))}
                  />
                  <small>Lower waste ← → greater availability</small>
                </label>
                <details className="advanced">
                  <summary>Cost & baseline settings</summary>
                  <label className="field">
                    Excess cost per portion (₹)
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder={String(cfg?.cost_per_portion || 35)}
                      value={excess}
                      onChange={(e) => setExcess(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Shortage cost per portion (₹)
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder={String(
                        Math.max(
                          10,
                          (cfg?.selling_price || 60) -
                            (cfg?.cost_per_portion || 35),
                        ),
                      )}
                      value={shortage}
                      onChange={(e) => setShortage(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Usual new preparation (portions)
                    <input
                      type="number"
                      min={0}
                      step={1}
                      placeholder={String(
                        Math.round((cfg?.base_demand || 50) * 1.15),
                      )}
                      value={baseline}
                      onChange={(e) => setBaseline(e.target.value)}
                    />
                  </label>
                </details>
              </>
            )}
            <AsyncButton
              type="submit"
              className="button primary full-width"
              busy={busy}
              busyLabel={
                stage === "plan"
                  ? "Sizing preparation batches…"
                  : "Estimating demand…"
              }
            >
              {busy
                ? "Calculating…"
                : planning
                  ? "Calculate preparation plan"
                  : "Generate forecast"}
              <ArrowRight size={16} />
            </AsyncButton>
            <p className="form-note">
              <FlaskConical size={14} />
              {config.is_synthetic
                ? "Scenario based on synthetic training data."
                : "Scenario based on your uploaded records."}
            </p>
          </form>
        </Panel>
        <div className="scenario-results">
          {error && (
            <div className="inline-error" role="alert">
              <strong>Calculation failed</strong>
              <p>{error}</p>
              <MetalButton className="button" onClick={() => generate()}>
                <RotateCcw size={15} />
                Try again
              </MetalButton>
            </div>
          )}
          {busy ? (
            <>
              <CalculationStages stage={stage} planning={planning} />
              <Loading
                variant="scenario"
                showIndicator={false}
                label={
                  planning
                    ? "Balancing preparation, stock, and cost…"
                    : "Estimating demand for your scenario…"
                }
              />
            </>
          ) : (
            forecast && (
              <>
                {dirty ? (
                  <Notice tone="warning">
                    Conditions changed. Calculate again to see a plan for these
                    conditions.
                  </Notice>
                ) : (
                  <>
                    <Panel
                      title={
                        planning
                          ? "Your next batch, thoughtfully sized"
                          : `${forecast.menu_item} · demand estimate`
                      }
                      action={
                        <Badge tone="positive">
                          {planning
                            ? "Preparation scenario"
                            : "Forecast scenario"}
                        </Badge>
                      }
                    >
                      <Stats
                        items={
                          planning && plan
                            ? [
                                {
                                  label: "New preparation",
                                  value: (
                                    <>
                                      <AnimatedNumber
                                        value={plan.recommended_total_plan}
                                        loading={busy}
                                      />
                                      <small>portions</small>
                                    </>
                                  ),
                                  note: "After accounting for existing stock",
                                },
                                {
                                  label: "Cook in the first batch",
                                  value: (
                                    <>
                                      <AnimatedNumber
                                        value={plan.recommended_initial_batch}
                                        loading={busy}
                                      />
                                      <small>portions</small>
                                    </>
                                  ),
                                  note: "Hold the remainder for replenishment",
                                },
                                {
                                  label: "Demand estimate",
                                  value: (
                                    <>
                                      <AnimatedNumber
                                        value={forecast.predicted_demand}
                                        loading={busy}
                                      />
                                      <small>portions</small>
                                    </>
                                  ),
                                  note: `${forecast.lower_bound}–${forecast.upper_bound} ensemble range`,
                                },
                              ]
                            : [
                                {
                                  label: "Expected demand",
                                  value: (
                                    <>
                                      <AnimatedNumber
                                        value={forecast.predicted_demand}
                                        loading={busy}
                                      />
                                      <small>portions</small>
                                    </>
                                  ),
                                  note: "Random Forest point estimate",
                                },
                                {
                                  label: "Estimate range",
                                  value: `${forecast.lower_bound}–${forecast.upper_bound}`,
                                  note: "10th–90th tree prediction percentiles",
                                },
                                {
                                  label: "Weekday baseline",
                                  value: (
                                    <>
                                      <AnimatedNumber
                                        value={forecast.weekday_baseline}
                                        loading={busy}
                                      />
                                      <small>portions</small>
                                    </>
                                  ),
                                  note: `${forecast.baseline_diff >= 0 ? "+" : ""}${forecast.baseline_diff} portions vs weekday average`,
                                },
                              ]
                        }
                      />
                      {planning && plan ? (
                        <div className="batch-detail">
                          <div className="row-between">
                            <h3>
                              {plan.recommended_total_plan === 0
                                ? "No new cooking is recommended."
                                : plan.recommended_total_plan >
                                    plan.recommended_initial_batch
                                  ? "One plan. Two moments to cook."
                                  : "A single batch for this service."}
                            </h3>
                            <span>
                              {plan.recommended_total_plan} new portions
                            </span>
                          </div>
                          <BatchStrip
                            initial={plan.recommended_initial_batch}
                            total={plan.recommended_total_plan}
                            stock={stock}
                          />
                          {plan.recommended_total_plan === 0 ? (
                            <p>
                              This cost-adjusted plan calls for no additional
                              prep. Use existing stock cleared by the kitchen
                              and monitor actual demand before cooking more.
                            </p>
                          ) : (
                            <div className="batch-instructions">
                              <div>
                                <span className="step-number">1</span>
                                <div>
                                  <strong>
                                    Start with {plan.recommended_initial_batch}{" "}
                                    portions
                                  </strong>
                                  <p>
                                    {plan.recommended_total_plan >
                                    plan.recommended_initial_batch
                                      ? "Keep the remaining ingredients ready, without cooking them early."
                                      : "No second cooking batch is included. Monitor actual demand during service."}
                                  </p>
                                </div>
                              </div>
                              {plan.recommended_total_plan >
                                plan.recommended_initial_batch && (
                                <div>
                                  <span className="step-number">2</span>
                                  <div>
                                    <strong>
                                      {plan.recommended_total_plan >
                                      plan.recommended_initial_batch
                                        ? `Check demand at ${plan.refill_trigger_threshold} portions remaining`
                                        : "Single batch recommended"}
                                    </strong>
                                    <p>
                                      {plan.recommended_total_plan >
                                      plan.recommended_initial_batch
                                        ? `Prepare up to ${plan.recommended_total_plan - plan.recommended_initial_batch} more if actual sales support it.`
                                        : "No second cooking batch is included in this plan."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <Notice>{plan.recommendation_reason}</Notice>
                          <div className="button-row">
                            <MetalButton
                              className="button primary"
                              disabled={dirty}
                              onClick={savePlan}
                            >
                              <ArrowDownToLine size={16} />
                              Export this plan
                            </MetalButton>
                            <MetalButton
                              className="button"
                              disabled={dirty || !plan}
                              onClick={() => setPrintModalOpen(true)}
                              title="Print preparation sheet for this dish"
                            >
                              <Printer size={16} />
                              Print prep sheet
                            </MetalButton>
                            <span className="muted">
                              Review in the kitchen before use.
                            </span>
                          </div>
                          {saved && (
                            <SavedNote>
                              Plan exported. No kitchen dispatch was sent.
                            </SavedNote>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="forecast-range">
                            <div className="range-end">
                              <span>Lower estimate</span>
                              <strong>{forecast.lower_bound}</strong>
                            </div>
                            <div className="range-visual">
                              <span />
                              <i
                                style={{
                                  left: `${forecast.upper_bound > forecast.lower_bound ? Math.max(0, Math.min(100, ((forecast.predicted_demand - forecast.lower_bound) / (forecast.upper_bound - forecast.lower_bound)) * 100)) : 50}%`,
                                }}
                              />
                              <strong
                                style={{
                                  left: `${forecast.upper_bound > forecast.lower_bound ? Math.max(0, Math.min(100, ((forecast.predicted_demand - forecast.lower_bound) / (forecast.upper_bound - forecast.lower_bound)) * 100)) : 50}%`,
                                }}
                              >
                                {forecast.predicted_demand}
                              </strong>
                            </div>
                            <div className="range-end">
                              <span>Upper estimate</span>
                              <strong>{forecast.upper_bound}</strong>
                            </div>
                          </div>
                          <p className="panel-caption">
                            Ensemble spread describes model variation; it is not
                            a calibrated promise of real-world demand coverage.
                          </p>
                        </>
                      )}
                    </Panel>
                    {planning && plan ? (
                      <>
                        <div className="two-columns">
                          <Panel
                            title="Cost of the decision"
                            description="Expected costs in the simulated demand scenario"
                          >
                            <dl className="key-values">
                              <div>
                                <dt>Usual preparation policy</dt>
                                <dd>
                                  {money(plan.current_policy_expected_cost)}
                                </dd>
                              </div>
                              <div>
                                <dt>WasteWise preparation</dt>
                                <dd>{money(plan.wastewise_expected_cost)}</dd>
                              </div>
                              <div className="total">
                                <dt>Estimated cost avoided</dt>
                                <dd
                                  className={
                                    plan.net_cost_avoided >= 0
                                      ? "positive-ink"
                                      : "danger-ink"
                                  }
                                >
                                  {money(plan.net_cost_avoided)}
                                </dd>
                              </div>
                            </dl>
                          </Panel>
                          <Panel
                            title="Availability & leftovers"
                            description="Expected portions across simulated demand"
                          >
                            <dl className="key-values">
                              <div>
                                <dt>Potential surplus</dt>
                                <dd>{plan.wastewise_expected_surplus}</dd>
                              </div>
                              <div>
                                <dt>Unmet demand</dt>
                                <dd>{plan.wastewise_expected_shortage}</dd>
                              </div>
                              <div>
                                <dt>Planning quantile</dt>
                                <dd>
                                  {Math.round(plan.critical_ratio * 100)}%
                                </dd>
                              </div>
                            </dl>
                          </Panel>
                        </div>
                        <Panel
                          title="A range of possible service days"
                          description="Simulated draws from an approximate demand distribution"
                        >
                          <DistributionChart
                            rows={plan.distribution}
                            target={plan.recommended_total_plan}
                          />
                          <p className="panel-caption">
                            The line marks new preparation. Existing stock is
                            additional available supply.
                          </p>
                        </Panel>
                      </>
                    ) : (
                      <>
                        <Panel
                          title="What the history actually says"
                          description="Recorded sales · last 30 observations · portions sold"
                        >
                          <HistoryChart rows={forecast.trajectory} />
                          <p className="panel-caption">
                            Historical sales can be limited by stockouts. They
                            are not the same as total customer demand.
                          </p>
                          <details className="history-data">
                            <summary>View recorded sales</summary>
                            <div className="table-scroll">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Service date</th>
                                    <th className="numeric">Portions sold</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {forecast.trajectory.map((row) => (
                                    <tr key={row.date}>
                                      <td>{row.date}</td>
                                      <td className="numeric">
                                        {row.actual_sold}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </details>
                        </Panel>
                        <Panel
                          title="What the model pays attention to"
                          description="Global model feature importance extracted from fitted Random Forest estimators · not an explanation of this individual prediction"
                        >
                          <div className="feature-list">
                            {forecast.features.map((feature) => (
                              <div key={feature.feature}>
                                <span>{feature.feature}</span>
                                <div className="feature-track">
                                  <span
                                    style={{
                                      width: `${Math.max(0, Math.min(100, feature.importance_pct))}%`,
                                    }}
                                  />
                                </div>
                                <strong>{feature.importance_pct}%</strong>
                              </div>
                            ))}
                          </div>
                        </Panel>
                      </>
                    )}
                    <ScenarioCompare item={item} day={day} config={config} />
                  </>
                )}
              </>
            )
          )}
        </div>
      </div>

      {planning && plan && (
        <PrintKitchenSheet
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          serviceDate={
            config.latest_date || new Date().toISOString().slice(0, 10)
          }
          singlePlan={{
            item,
            category: cfg?.category,
            plan,
            stock,
          }}
        />
      )}
    </>
  );
}
