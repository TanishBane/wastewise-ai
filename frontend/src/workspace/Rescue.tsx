import MetalButton from "../MetalButton";
import { useState } from "react";
import { ArrowRight, Check, Search, ShieldCheck } from "lucide-react";
import { fetchWasteRisks } from "../api";
import { AnimatedNumber } from "../motion";
import OutcomeLogger from "./OutcomeLogger";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  Notice,
  PageHeading,
  Panel,
  RiskBadge,
  Stats,
} from "./shared";
import { money, useResource } from "./model";
import type { ScreenProps } from "./model";

export default function Rescue({
  config,
  revision,
  navigate,
  onDataChange,
}: ScreenProps) {
  const { data, loading, error, retry } = useResource(
    () => fetchWasteRisks(),
    revision,
  );
  const [tier, setTier] = useState("All");
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  if (loading && !data)
    return <Loading label="Finding the dishes that need attention…" />;
  if (error || !data)
    return (
      <ErrorState message={error || "No rescue data returned."} retry={retry} />
    );
  const rows = data.items.filter(
    (item) =>
      (tier === "All" || item.risk_level === tier) &&
      item.menu_item.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Surplus, before the rush."
        description="Spot surplus exposure early. Make the next kitchen decision count."
      />
      <Notice tone="warning">
        These are projected risks under a baseline preparation scenario, not
        measured end-of-service leftovers. Confirm actual stock and sales before
        acting.
      </Notice>
      <Stats
        items={[
          {
            label: "High-risk dishes",
            value: (
              <AnimatedNumber
                value={data.summary.high_risk_count}
                loading={loading}
              />
            ),
            note: "Review these first",
            tone: data.summary.high_risk_count ? "danger-ink" : "",
          },
          {
            label: "Moderate-risk dishes",
            value: (
              <AnimatedNumber
                value={data.summary.mod_risk_count}
                loading={loading}
              />
            ),
            note: "Watch replenishment closely",
            tone: "warning-ink",
          },
          {
            label: "Potential surplus",
            value: (
              <>
                <AnimatedNumber
                  value={data.summary.total_surplus_exposure}
                  loading={loading}
                />
                <small>portions</small>
              </>
            ),
            note: "Across the full menu",
          },
          {
            label: "Ingredient exposure",
            value: (
              <AnimatedNumber
                value={data.summary.total_ingredient_cost_at_risk}
                prefix="₹"
                loading={loading}
              />
            ),
            note: "Estimated cost of potential excess",
          },
        ]}
      />
      <Panel
        title="A practical rescue queue"
        description="Highest ingredient exposure first. Review marks are local to this view."
        action={<Badge>{data.items.length} dishes assessed</Badge>}
      >
        <div className="table-toolbar">
          <div className="tabs" aria-label="Risk filter">
            {["All", "High", "Moderate", "Low"].map((value) => (
              <button
                key={value}
                className={tier === value ? "selected" : ""}
                aria-pressed={tier === value}
                onClick={() => setTier(value)}
              >
                {value}
                {value !== "All" ? " risk" : " dishes"}
                <span>
                  {value === "All"
                    ? data.items.length
                    : data.items.filter((item) => item.risk_level === value)
                        .length}
                </span>
              </button>
            ))}
          </div>
          <div className="input-search">
            <Search size={16} />
            <input
              aria-label="Search rescue queue"
              placeholder="Find a dish…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="rescue-list">
          {rows.map((item) => (
            <article key={item.menu_item} className="rescue-row">
              <div className="rescue-identity">
                <RiskBadge level={item.risk_level} />
                <h3>{item.menu_item}</h3>
                <span className="muted">{item.category}</span>
              </div>
              <div className="rescue-facts">
                <div>
                  <span>Planned / forecast</span>
                  <strong>
                    {item.planned_preparation} / {item.predicted_demand}
                    <small> portions</small>
                  </strong>
                </div>
                <div>
                  <span>Potential extras</span>
                  <strong>
                    {item.potential_surplus}
                    <small> portions</small>
                  </strong>
                </div>
                <div>
                  <span>Ingredient exposure</span>
                  <strong>{money(item.ingredient_cost_at_risk)}</strong>
                </div>
              </div>
              <div className="rescue-guidance">
                <strong>{item.primary_action}</strong>
                <p>{item.kitchen_guidance}</p>
                <details>
                  <summary>Food handling reminder</summary>
                  <p>
                    Configured shelf-life assumption: {item.shelf_life_hours}{" "}
                    hours. This is not a food safety clearance. Follow your
                    kitchen’s temperature, time, allergen, and donation
                    procedures.
                  </p>
                </details>
              </div>
              <div className="rescue-actions">
                <MetalButton
                  className="button"
                  onClick={() => navigate("prep-planner", item.menu_item)}
                >
                  Adjust plan
                  <ArrowRight size={14} />
                </MetalButton>
                <button
                  className={`review-button ${reviewed[item.menu_item] ? "is-reviewed" : ""}`}
                  aria-pressed={!!reviewed[item.menu_item]}
                  onClick={() =>
                    setReviewed((prev) => ({
                      ...prev,
                      [item.menu_item]: !prev[item.menu_item],
                    }))
                  }
                >
                  <Check size={15} />
                  {reviewed[item.menu_item] ? "Reviewed" : "Mark reviewed"}
                </button>
              </div>
            </article>
          ))}
          {!rows.length && (
            <Empty
              title="No dishes in this rescue queue"
              text={
                query || tier !== "All"
                  ? `No dishes found matching "${query}" under ${tier} risk.`
                  : "All dishes are currently within safe surplus limits."
              }
              action={
                query || tier !== "All" ? (
                  <MetalButton
                    className="button small"
                    onClick={() => {
                      setQuery("");
                      setTier("All");
                    }}
                  >
                    Reset filters
                  </MetalButton>
                ) : undefined
              }
            />
          )}
        </div>
      </Panel>

      {/* Operational Outcome Logger */}
      <OutcomeLogger
        config={config}
        activeDish={rows[0]?.menu_item}
        onOutcomeLogged={onDataChange}
      />

      <div className="insight-strip">
        <ShieldCheck size={24} />
        <div>
          <strong>
            Forecasting can reduce waste. It cannot certify food safety.
          </strong>
          <p>
            Donate or discount only after your kitchen’s food handling checks.
            No rescue action is sent automatically.
          </p>
        </div>
      </div>
    </>
  );
}
