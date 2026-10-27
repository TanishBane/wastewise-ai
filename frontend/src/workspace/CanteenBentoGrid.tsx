import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Calendar,
  ChefHat,
  Flame,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
} from "lucide-react";
import type { Navigate } from "./model";

interface CanteenBentoGridProps {
  navigate: Navigate;
}

export default function CanteenBentoGrid({ navigate }: CanteenBentoGridProps) {
  const shouldReduceMotion = useReducedMotion();

  const hoverMotion = shouldReduceMotion
    ? undefined
    : { y: -4, transition: { duration: 0.2 } };

  return (
    <div
      className="bento-grid-container"
      role="region"
      aria-label="WasteWise Botanical Capabilities Bento Grid"
    >
      <div className="bento-grid bento-grid-botanical">
        {/* Card 1: Sage Surface — Probabilistic Demand Forecasting */}
        <motion.article
          className="bento-card bento-card-sage"
          whileHover={hoverMotion}
        >
          <div className="bento-card-header">
            <div className="bento-badge-row">
              <span className="bento-pill bento-pill-sage">
                <Sparkles size={12} aria-hidden="true" />
                <span>Random Forest Regressor</span>
              </span>
              <span className="bento-stat-pill bento-stat-sage">
                8.4% Holdout WAPE
              </span>
            </div>
            <div className="bento-emblem bento-emblem-sage" aria-hidden="true">
              <Sprout size={18} />
            </div>
          </div>

          <div className="bento-card-body">
            <h3 className="bento-card-title">
              Machine learning tailored to kitchen reality.
            </h3>
            <p className="bento-card-desc">
              Daily food consumption is not random. WasteWise ingests campus
              calendar schedules, weather shifts, exam periods, and historical
              dish velocity to predict expected portions with 80% confidence
              intervals.
            </p>

            <div className="bento-signals-strip">
              <div className="signal-chip signal-chip-sage">
                <Calendar size={13} aria-hidden="true" />
                <span>Timetable &amp; Exam Feeds</span>
              </div>
              <div className="signal-chip signal-chip-sage">
                <Flame size={13} aria-hidden="true" />
                <span>Rain Baseline Shifts (+9%)</span>
              </div>
              <div className="signal-chip signal-chip-sage">
                <Activity size={13} aria-hidden="true" />
                <span>Dish Variance Bounds</span>
              </div>
            </div>
          </div>

          <div className="bento-card-footer">
            <button
              type="button"
              className="bento-cta-btn bento-cta-sage"
              onClick={() => navigate("demand-forecast")}
            >
              <span>Inspect Demand Models</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.article>

        {/* Card 2: Warm Terracotta — Newsvendor Two-Batch Hedging */}
        <motion.article
          className="bento-card bento-card-terracotta"
          whileHover={hoverMotion}
        >
          <div className="bento-card-header">
            <div className="bento-badge-row">
              <span className="bento-pill bento-pill-terracotta">
                <ChefHat size={12} aria-hidden="true" />
                <span>Newsvendor Optimization</span>
              </span>
              <span className="bento-stat-pill bento-stat-terracotta">
                65 / 35 Batch Split
              </span>
            </div>
            <div
              className="bento-emblem bento-emblem-terracotta"
              aria-hidden="true"
            >
              <ChefHat size={18} />
            </div>
          </div>

          <div className="bento-card-body">
            <h3 className="bento-card-title">
              Two-batch hedging stops overproduction cold.
            </h3>
            <p className="bento-card-desc">
              Instead of cooking 100% of daily volume at once, the engine
              balances underage versus overage cost. Kitchens fire a 65% Batch 1
              buffer, holding 35% in reserve for mid-service replenishment.
            </p>

            <div className="bento-metrics-mini">
              <div className="mini-stat">
                <strong>65%</strong>
                <span>Batch 1 Initial Buffer</span>
              </div>
              <div className="mini-stat">
                <strong>35%</strong>
                <span>Batch 2 Contingency</span>
              </div>
              <div className="mini-stat">
                <strong>&lt;5</strong>
                <span>Refill Trigger Unit</span>
              </div>
            </div>
          </div>

          <div className="bento-card-footer">
            <button
              type="button"
              className="bento-cta-btn bento-cta-terracotta"
              onClick={() => navigate("prep-planner")}
            >
              <span>Launch Prep Planner</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.article>

        {/* Card 3: Golden Copper — Live Shift Variance Control */}
        <motion.article
          className="bento-card bento-card-copper"
          whileHover={hoverMotion}
        >
          <div className="bento-card-header">
            <div className="bento-badge-row">
              <span className="bento-pill bento-pill-copper">
                <TrendingUp size={12} aria-hidden="true" />
                <span>Variance Control</span>
              </span>
              <span className="bento-stat-pill bento-stat-copper">
                +4.3% Safety Buffer
              </span>
            </div>
            <div
              className="bento-emblem bento-emblem-copper"
              aria-hidden="true"
            >
              <Activity size={18} />
            </div>
          </div>

          <div className="bento-card-body">
            <h3 className="bento-card-title">
              Shift variance calibrated in real time.
            </h3>
            <p className="bento-card-desc">
              Sudden attendance swings and weather shifts are converted into
              real-time kettle adjustments, so cooks never run out during rush
              hours or overcook on low-turnout days.
            </p>

            <div className="bento-metrics-mini">
              <div className="mini-stat">
                <strong>161</strong>
                <span>Expected Portions</span>
              </div>
              <div className="mini-stat">
                <strong>168</strong>
                <span>Hedged Prep Plan</span>
              </div>
              <div className="mini-stat">
                <strong>₹887</strong>
                <span>Cost At Risk</span>
              </div>
            </div>
          </div>

          <div className="bento-card-footer">
            <button
              type="button"
              className="bento-cta-btn bento-cta-copper"
              onClick={() => navigate("overview")}
            >
              <span>Review Shift Overview</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.article>

        {/* Card 4: Authentic Canteen Photography — Real Kitchen Floor */}
        <motion.article
          className="bento-card bento-card-photo"
          whileHover={hoverMotion}
        >
          <div className="bento-img-wrap" aria-hidden="true">
            <picture className="bento-bg-picture">
              <source
                srcSet="/images/canteen/kitchen-prep.webp"
                type="image/webp"
              />
              <img
                src="/images/canteen/kitchen-prep.jpg"
                alt="Chefs preparing culinary batches in commercial kitchen"
                className="bento-bg-img"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="bento-scrim bento-scrim-forest" />
          </div>

          <div className="bento-card-header bento-photo-header">
            <div className="bento-badge-row">
              <span className="bento-pill bento-pill-photo">
                <ShieldCheck size={12} aria-hidden="true" />
                <span>Institutional Kitchens</span>
              </span>
              <span className="bento-stat-pill bento-stat-photo">
                Production Floor
              </span>
            </div>
          </div>

          <div className="bento-card-body bento-photo-body">
            <h3 className="bento-card-title">
              Engineered for the speed and heat of real kitchens.
            </h3>
            <p className="bento-card-desc">
              Built for high-volume dining, university cafeterias, and hospital
              meal centers. Fast, tactile controls and immediate batch targets
              without complex ERP hurdles.
            </p>
          </div>

          <div className="bento-card-footer bento-photo-footer">
            <button
              type="button"
              className="bento-cta-btn bento-cta-photo"
              onClick={() => navigate("overview")}
            >
              <span>Explore Kitchen Floor</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.article>

        {/* Card 5: Dark Bark — Cold-Chain Surplus Rescue Network */}
        <motion.article
          className="bento-card bento-card-bark"
          whileHover={hoverMotion}
        >
          <div className="bento-card-header">
            <div className="bento-badge-row">
              <span className="bento-pill bento-pill-bark">
                <HeartHandshake size={12} aria-hidden="true" />
                <span>Zero-Landfill Protocol</span>
              </span>
              <span className="bento-stat-pill bento-stat-bark">
                4h Safety Window
              </span>
            </div>
            <div className="bento-emblem bento-emblem-bark" aria-hidden="true">
              <HeartHandshake size={18} />
            </div>
          </div>

          <div className="bento-card-body">
            <h3 className="bento-card-title">
              Surplus rescue before food cools.
            </h3>
            <p className="bento-card-desc">
              When unavoidable surplus occurs, the system logs portions at 14:30
              and alerts campus hostel cafeterias and verified food rescue
              partners before the safety window lapses.
            </p>

            <div className="bento-signals-strip">
              <div className="signal-chip signal-chip-bark">
                <Clock size={13} aria-hidden="true" />
                <span>14:30 Automated Dispatch</span>
              </div>
              <div className="signal-chip signal-chip-bark">
                <ShieldCheck size={13} aria-hidden="true" />
                <span>Food Safety Verified</span>
              </div>
            </div>
          </div>

          <div className="bento-card-footer">
            <button
              type="button"
              className="bento-cta-btn bento-cta-bark"
              onClick={() => navigate("waste-risk")}
            >
              <span>View Rescue Dispatch</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.article>

        {/* Card 6: Warm Sand — ESG & Carbon Telemetry */}
        <motion.article
          className="bento-card bento-card-sand"
          whileHover={hoverMotion}
        >
          <div className="bento-card-header">
            <div className="bento-badge-row">
              <span className="bento-pill bento-pill-sand">
                <Leaf size={12} aria-hidden="true" />
                <span>ESG &amp; Carbon Audit</span>
              </span>
              <span className="bento-stat-pill bento-stat-sand">
                -34% Food Waste
              </span>
            </div>
            <div className="bento-emblem bento-emblem-sand" aria-hidden="true">
              <Leaf size={18} />
            </div>
          </div>

          <div className="bento-card-body">
            <h3 className="bento-card-title">
              Every kilogram accounted for. Every rupee protected.
            </h3>
            <p className="bento-card-desc">
              Canteen administrators and sustainability directors receive
              audit-ready logs tracking avoided emissions, meals diverted from
              dumpsters, and margin expansion.
            </p>

            <div className="bento-kpi-row bento-kpi-sand">
              <div className="bento-kpi-item">
                <strong className="kpi-num">34%</strong>
                <span className="kpi-label">Average Waste Cut</span>
              </div>
              <div className="bento-kpi-item">
                <strong className="kpi-num">2.5 kg</strong>
                <span className="kpi-label">CO₂e Abated / kg</span>
              </div>
              <div className="bento-kpi-item">
                <strong className="kpi-num">₹14,280</strong>
                <span className="kpi-label">Weekly Margin Saved</span>
              </div>
            </div>
          </div>

          <div className="bento-card-footer">
            <button
              type="button"
              className="bento-cta-btn bento-cta-sand"
              onClick={() => navigate("performance")}
            >
              <span>Review Impact Telemetry</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.article>
      </div>
    </div>
  );
}

function Clock(props: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
