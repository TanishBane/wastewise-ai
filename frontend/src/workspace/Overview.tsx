import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCheck,
  ChefHat,
  Search,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { fetchOverview } from "../api";
import { DemandChart } from "./Charts";
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
import { money, number, useResource } from "./model";
import type { ScreenProps } from "./model";

export default function Overview({ revision, navigate }: ScreenProps) {
  const { data, loading, error, retry } = useResource(fetchOverview, revision);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  if (loading) return <Loading />;
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
    <>
      <PageHeading
        title="A little foresight. A lot less waste."
        description="Your kitchen’s next service, planned with care."
      >
        <button
          className="button primary"
          onClick={() => navigate("prep-planner")}
        >
          <ChefHat size={17} />
          Build a preparation plan
          <ArrowRight size={16} />
        </button>
      </PageHeading>
      <Stats
        items={[
          {
            label: "Expected demand",
            value: (
              <>
                {number(data.kpis.forecast_demand)}
                <small>portions</small>
              </>
            ),
            note: `Across ${data.item_details.length} menu items`,
          },
          {
            label: "Suggested preparation",
            value: (
              <>
                {number(data.kpis.recommended_prep)}
                <small>portions</small>
              </>
            ),
            note: "Overview estimate · refine in planner",
          },
          {
            label: "Potential surplus",
            value: (
              <>
                {number(data.kpis.potential_surplus)}
                <small>portions</small>
              </>
            ),
            note: `${data.kpis.surplus_pct}% of suggested preparation`,
            tone: data.kpis.potential_surplus > 0 ? "warning-ink" : "",
          },
          {
            label: "Ingredient cost at risk",
            value: money(data.kpis.cost_at_risk),
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
      <Panel
        title="The menu, ready for a second look"
        description="Review suggested batches before the kitchen starts. Review marks stay on this screen."
        action={
          <span className="review-count">
            <CheckCheck size={16} />
            {Object.values(reviewed).filter(Boolean).length} of{" "}
            {data.item_details.length} reviewed
          </span>
        }
      >
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
                <th>Menu item</th>
                <th className="numeric">Forecast</th>
                <th className="numeric">Estimate range</th>
                <th className="numeric">Suggested prep</th>
                <th>Batch allocation</th>
                <th className="numeric">Review</th>
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
        {!rows.length && <Empty />}
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
    </>
  );
}
