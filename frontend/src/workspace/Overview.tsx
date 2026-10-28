import MetalButton from "../MetalButton";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCheck,
  ChefHat,
  ClipboardList,
  Clock,
  Printer,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  Utensils,
} from "lucide-react";
import { fetchOverview } from "../api";
import { DemandChart } from "./Charts";
import { AnimatedNumber } from "../motion";
import PrintKitchenSheet from "./PrintKitchenSheet";
import CanteenBentoDashboard from "./CanteenBentoDashboard";
import { Sparkles } from "lucide-react";
import {
  Badge,
  BatchStrip,
  Empty,
  ErrorState,
  Loading,
  PageHeading,
  Panel,
  RiskBadge,
  Stats,
  TextLink,
} from "./shared";
import { money, useResource } from "./model";
import type { ScreenProps } from "./model";

export default function Overview({ revision, navigate }: ScreenProps) {
  const [arrival] = useState(() => {
    try {
      const seen = sessionStorage.getItem("wastewise-journal-seen");
      return !seen;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem("wastewise-journal-seen", "true");
    } catch {
      /* Overview works without storage. */
    }
  }, []);
  const { data, loading, error, retry } = useResource(fetchOverview, revision);
  const [viewMode, setViewMode] = useState<"bento" | "ledger">("bento");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [printModalOpen, setPrintModalOpen] = useState(false);
  if (loading && !data) return <Loading />;
  if (error || !data)
    return (
      <ErrorState message={error || "No overview returned."} retry={retry} />
    );
  const rows = data.item_details.filter(
    (row) =>
      row.menu_item.toLowerCase().includes(query.toLowerCase()) &&
      (category === "all" || row.category === category),
  );
  return (
    <div className={`overview-page ${arrival ? "first-arrival" : ""}`}>
      <PageHeading
        title="Kitchen Command Center"
        description={`${data.item_details.length} menu items scheduled. Check forecast demand, inspect priority risk items, and review preparation targets before firing the first batch.`}
      >
        <div className="overview-heading-actions">
          <MetalButton
            className="button primary"
            onClick={() => navigate("prep-planner")}
          >
            <ChefHat size={16} />
            Build preparation plan
            <ArrowRight size={15} />
          </MetalButton>
          <MetalButton
            className="button"
            onClick={() => setPrintModalOpen(true)}
            title="Open printable kitchen preparation sheet"
          >
            <Printer size={15} />
            Print kitchen sheet
          </MetalButton>
          <MetalButton
            className="button"
            onClick={() => navigate("waste-risk")}
            title="Log shift outcome in surplus rescue"
          >
            <ClipboardList size={15} />
            Log shift outcome
          </MetalButton>
        </div>
      </PageHeading>
      <div
        className="service-context-bar"
        aria-label="Service operating parameters"
      >
        <div className="service-context-item">
          <Clock size={13} />
          <span>
            Shift: <strong>Lunch Service</strong> (11:30 – 14:00)
          </span>
        </div>
        <div className="service-context-divider">·</div>
        <div className="service-context-item">
          <Calendar size={13} />
          <span>
            Date: <strong>{data.service_date}</strong>
          </span>
        </div>
        <div className="service-context-divider">·</div>
        <div className="service-context-item">
          <Utensils size={13} />
          <span>
            Venue: <strong>Campus Green Canteen</strong>
          </span>
        </div>
        <div className="service-context-divider">·</div>
        <div className="service-context-item">
          <span className="live-status-dot" />
          <span>
            Source:{" "}
            <strong>
              {data.is_synthetic ? "Synthetic Demo Data" : "Operator Records"}
            </strong>
          </span>
        </div>
      </div>
      <div className="bento-mode-switcher-row">
        <button
          type="button"
          className={`bento-switch-pill ${viewMode === "bento" ? "active" : ""}`}
          onClick={() => setViewMode("bento")}
          aria-pressed={viewMode === "bento"}
        >
          <Sparkles size={14} />
          <span>Bento Command Grid</span>
        </button>
        <button
          type="button"
          className={`bento-switch-pill ${viewMode === "ledger" ? "active" : ""}`}
          onClick={() => setViewMode("ledger")}
          aria-pressed={viewMode === "ledger"}
        >
          <ClipboardList size={14} />
          <span>Classic Ledger &amp; Targets</span>
        </button>
      </div>

      {viewMode === "bento" ? (
        <CanteenBentoDashboard overviewData={data} navigate={navigate} />
      ) : (
        <>
          <Stats
            items={[
              {
                label: "Expected demand",
                value: (
                  <>
                    <AnimatedNumber
                      value={data.kpis.forecast_demand}
                      loading={loading}
                    />
                    <small>portions</small>
                  </>
                ),
                note: `Across ${data.item_details.length} menu items`,
              },
              {
                label: "Suggested preparation",
                value: (
                  <>
                    <AnimatedNumber
                      value={data.kpis.recommended_prep}
                      loading={loading}
                    />
                    <small>portions</small>
                  </>
                ),
                note: "Overview estimate · refine in planner",
              },
              {
                label: "Potential surplus",
                value: (
                  <>
                    <AnimatedNumber
                      value={data.kpis.potential_surplus}
                      loading={loading}
                    />
                    <small>portions</small>
                  </>
                ),
                note: `${data.kpis.surplus_pct}% of suggested preparation`,
                tone: data.kpis.potential_surplus > 0 ? "warning-ink" : "",
              },
              {
                label: "Ingredient cost at risk",
                value: (
                  <AnimatedNumber
                    value={data.kpis.cost_at_risk}
                    prefix="₹"
                    loading={loading}
                  />
                ),
                note: "Exposure under the baseline prep policy",
                tone: "warning-ink",
              },
            ]}
          />
          <div className="overview-grid">
            <Panel
              title="Demand, meet preparation"
              description="Portions by dish for the active service date"
              action={
                <div className="legend">
                  <span>
                    <i className="green" />
                    Forecast
                  </span>
                  <span>
                    <i className="sage" />
                    Suggested prep
                  </span>
                </div>
              }
            >
              <DemandChart rows={data.item_details} />
              <div className="panel-foot">
                <span>Forecasts are estimates, not confirmed orders.</span>
                <TextLink onClick={() => navigate("demand-forecast")}>
                  Explore forecast
                </TextLink>
              </div>
            </Panel>
            <Panel
              title="Needs a kitchen decision"
              description="Prioritized by ingredient cost at risk"
              action={
                <span className="count-label">
                  {data.prioritized_alerts.length} priorities
                </span>
              }
              className="priorities-panel"
            >
              <div className="priorities">
                {data.prioritized_alerts.length ? (
                  data.prioritized_alerts.slice(0, 2).map((item) => (
                    <div className="priority" key={item.menu_item}>
                      <div className="row-between">
                        <strong>{item.menu_item}</strong>
                        <RiskBadge level={item.risk_level} />
                      </div>
                      <p>
                        {item.potential_surplus} potential extra portions{" "}
                        <span>·</span> {money(item.cost_at_risk)} exposed
                      </p>
                      <div className="priority-action">
                        <TriangleAlert size={15} />
                        <span>{item.action}</span>
                      </div>
                      <TextLink
                        onClick={() => navigate("prep-planner", item.menu_item)}
                      >
                        Review preparation
                      </TextLink>
                    </div>
                  ))
                ) : (
                  <Empty
                    title="No active priorities"
                    text="Review the menu plan before service."
                  />
                )}
              </div>
              <div className="panel-foot">
                <TextLink onClick={() => navigate("waste-risk")}>
                  Open surplus rescue
                </TextLink>
              </div>
            </Panel>
          </div>
        </>
      )}
      <Panel
        title="The menu, ready for a second look"
        description="Review suggested batches before the kitchen starts. Review marks stay on this screen."
        action={
          <span className="review-meter">
            <progress
              value={Object.values(reviewed).filter(Boolean).length}
              max={data.item_details.length}
              aria-label="Menu review progress"
            />
            <span className="review-count" role="status">
              <CheckCheck size={16} />
              {Object.values(reviewed).filter(Boolean).length} of{" "}
              {data.item_details.length} reviewed
            </span>
          </span>
        }
      >
        <div className="review-status">
          <div>
            <strong>
              {Object.values(reviewed).filter(Boolean).length ===
              data.item_details.length
                ? "Every dish has had a second look."
                : "Give each dish a kitchen check."}
            </strong>
            <p>
              Confirm the batch, then mark it reviewed. This is a local
              checklist, not a kitchen dispatch.
            </p>
          </div>
          <div className="review-actions">
            <MetalButton
              className="button"
              disabled={
                Object.values(reviewed).filter(Boolean).length ===
                data.item_details.length
              }
              onClick={(event) => {
                setQuery("");
                setCategory("all");
                requestAnimationFrame(() => {
                  const next = document.querySelector<HTMLButtonElement>(
                    ".menu-table .review-button:not(.is-reviewed)",
                  );
                  if (next) {
                    next.focus({ preventScroll: true });
                    next.scrollIntoView({
                      block: "center",
                      behavior:
                        event.detail === 0 ||
                        matchMedia("(prefers-reduced-motion: reduce)").matches
                          ? "instant"
                          : "smooth",
                    });
                  }
                });
              }}
            >
              Review next dish
              <ArrowRight size={14} />
            </MetalButton>
            <MetalButton
              className="button print-prep-btn"
              onClick={() => setPrintModalOpen(true)}
              title="Open printable kitchen preparation sheet"
            >
              <Printer size={14} />
              Print Prep Sheet (PDF)
            </MetalButton>
          </div>
        </div>
        <div className="table-toolbar">
          <div className="input-search">
            <Search size={16} />
            <input
              aria-label="Search menu"
              placeholder="Search a dish…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <label className="filter-select">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Filter menu category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">All categories</option>
              {[...new Set(data.item_details.map((row) => row.category))].map(
                (value) => (
                  <option key={value}>{value}</option>
                ),
              )}
            </select>
          </label>
          <span className="muted results-count">{rows.length} dishes</span>
        </div>
        <div className="table-scroll">
          <table className="menu-table">
            <thead>
              <tr>
                <th scope="col">Menu item</th>
                <th scope="col" className="numeric">
                  Forecast
                </th>
                <th scope="col" className="numeric">
                  Estimate range
                </th>
                <th scope="col" className="numeric">
                  Suggested prep
                </th>
                <th scope="col">Batch allocation</th>
                <th scope="col" className="numeric">
                  Review
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.menu_item}>
                  <td>
                    <button
                      className="dish-link"
                      onClick={() => navigate("prep-planner", row.menu_item)}
                    >
                      {row.menu_item}
                      <ArrowRight size={13} />
                    </button>
                    <small>{row.category}</small>
                  </td>
                  <td className="numeric strong">
                    {row.predicted_demand}
                    <small>portions</small>
                  </td>
                  <td className="numeric">
                    {row.lower_bound}–{row.upper_bound}
                    <small>ensemble estimate</small>
                  </td>
                  <td className="numeric strong">
                    {row.recommended_prep}
                    <small>portions</small>
                  </td>
                  <td>
                    <BatchStrip
                      initial={row.initial_batch}
                      total={row.recommended_prep}
                    />
                    <small className="batch-trigger-hint">
                      Trigger:{" "}
                      {row.refill_trigger_label ||
                        (row.refill_trigger
                          ? `<${row.refill_trigger} portions`
                          : "Single batch")}
                    </small>
                  </td>
                  <td className="numeric">
                    <button
                      className={`review-button ${reviewed[row.menu_item] ? "is-reviewed" : ""}`}
                      aria-label={`${reviewed[row.menu_item] ? "Undo review of" : "Mark reviewed:"} ${row.menu_item}`}
                      aria-pressed={!!reviewed[row.menu_item]}
                      onClick={() =>
                        setReviewed((prev) => ({
                          ...prev,
                          [row.menu_item]: !prev[row.menu_item],
                        }))
                      }
                    >
                      <Check size={15} />
                      {reviewed[row.menu_item] ? "Reviewed" : "Review"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title="No dishes match your filter"
            text={
              query || category !== "all"
                ? `No dishes found matching "${query}" in category "${category}".`
                : "No dishes currently scheduled for this service."
            }
            action={
              query || category !== "all" ? (
                <MetalButton
                  className="button small"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  Clear filters
                </MetalButton>
              ) : undefined
            }
          />
        )}
        <div className="panel-foot">
          <span>
            <ChefHat size={14} />
            Cook the first batch. Hold the rest for demand.
          </span>
          <Badge>Operator review required</Badge>
        </div>
      </Panel>
      <div className="insight-strip">
        <CheckCheck className="insight-icon" size={24} strokeWidth={1.5} />
        <div>
          <strong>Good decisions start with honest estimates.</strong>
          <p>
            Holdout error: {data.benchmark.ml_wape} WAPE · Weekday baseline:{" "}
            {data.benchmark.base_wape}. Review model limitations before acting.
          </p>
        </div>
        <TextLink onClick={() => navigate("performance")}>
          See the evidence
        </TextLink>
      </div>

      <PrintKitchenSheet
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        serviceDate={data.service_date}
        items={data.item_details}
      />
    </div>
  );
}
