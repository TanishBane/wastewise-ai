import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Calendar,
  ChefHat,
  Flame,
  HeartHandshake,
  Leaf,
  Sparkles,
} from "lucide-react";
import type { Navigate } from "./model";

interface CanteenBentoGridProps {
  navigate: Navigate;
}

export default function CanteenBentoGrid({ navigate }: CanteenBentoGridProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="bento-grid-container"
      role="region"
      aria-label="WasteWise Capabilities Bento Grid"
    >
      <div className="bento-grid">
        {/* Bento Tile 1: Demand Uncertainty & Machine Learning Forecaster */}
        <motion.article
          className="bento-card bento-card-large bento-photo-card"
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -4, transition: { duration: 0.2 } }
          }
        >
          {/* Authentic Canteen Photography Background with Gradient Scrim & JPG Fallback */}
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
            <div className="bento-scrim" />
          </div>

          <div className="bento-card-content">
            <div className="bento-badge-row">
              <span className="bento-pill">
                <Sparkles size={12} aria-hidden="true" />
                <span>Random Forest Regressor</span>
              </span>
              <span className="bento-stat-pill">8.4% Holdout WAPE</span>
            </div>

            <div className="bento-text-group">
              <h3 className="bento-card-title">
                Machine learning tailored to kitchen reality.
              </h3>
              <p className="bento-card-desc">
                Daily food consumption is not random. WasteWise ingests campus
                calendar schedules, real-time weather shifts, exam periods, and
                historical dish velocity to predict expected portions alongside
                calibrated 80% confidence intervals.
              </p>
            </div>

            <div className="bento-signals-strip">
              <div className="signal-chip">
                <Calendar size={13} aria-hidden="true" />
                <span>Timetable &amp; Exam Feeds</span>
              </div>
              <div className="signal-chip">
                <Flame size={13} aria-hidden="true" />
                <span>Monsoon Rain Shifts (+9%)</span>
              </div>
              <div className="signal-chip">
                <Activity size={13} aria-hidden="true" />
                <span>Dish-Level Variance Bounds</span>
              </div>
            </div>

            <div className="bento-card-action">
              <button
                type="button"
                className="bento-cta-btn"
                onClick={() => navigate("demand-forecast")}
              >
                <span>Inspect Demand Models</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.article>

        {/* Bento Tile 2: Newsvendor Operational Buffer Planner */}
        <motion.article
          className="bento-card bento-photo-card"
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -4, transition: { duration: 0.2 } }
          }
        >
          <div className="bento-img-wrap" aria-hidden="true">
            <picture className="bento-bg-picture">
              <source
                srcSet="/images/canteen/commercial-kitchen.webp"
                type="image/webp"
              />
              <img
                src="/images/canteen/commercial-kitchen.jpg"
                alt="Stainless steel commercial kitchen steam stations"
                className="bento-bg-img"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="bento-scrim" />
          </div>

          <div className="bento-card-content">
            <div className="bento-badge-row">
              <span className="bento-pill">
                <ChefHat size={12} aria-hidden="true" />
                <span>Newsvendor Optimization</span>
              </span>
              <span className="bento-stat-pill">65 / 35 Batch Split</span>
            </div>

            <div className="bento-text-group">
              <h3 className="bento-card-title">
                Two-batch hedging stops overproduction cold.
              </h3>
              <p className="bento-card-desc">
                Instead of cooking 100% of the day’s volume at once, the engine
                balances underage cost against overage cost. Kitchens fire a 65%
                Batch 1 buffer, holding 35% in reserve for mid-service
                replenishment.
              </p>
            </div>

            <div className="bento-card-action">
              <button
                type="button"
                className="bento-cta-btn"
                onClick={() => navigate("prep-planner")}
              >
                <span>Launch Prep Planner</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.article>

        {/* Bento Tile 3: Cold-Chain Surplus Rescue Network */}
        <motion.article
          className="bento-card bento-photo-card"
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -4, transition: { duration: 0.2 } }
          }
        >
          <div className="bento-img-wrap" aria-hidden="true">
            <picture className="bento-bg-picture">
              <source
                srcSet="/images/canteen/fresh-prep.webp"
                type="image/webp"
              />
              <img
                src="/images/canteen/fresh-prep.jpg"
                alt="Fresh vegetable preparation and culinary mise-en-place"
                className="bento-bg-img"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="bento-scrim" />
          </div>

          <div className="bento-card-content">
            <div className="bento-badge-row">
              <span className="bento-pill">
                <HeartHandshake size={12} aria-hidden="true" />
                <span>Zero-Landfill Protocol</span>
              </span>
              <span className="bento-stat-pill">4h Safety Window</span>
            </div>

            <div className="bento-text-group">
              <h3 className="bento-card-title">
                Surplus rescue before food cools.
              </h3>
              <p className="bento-card-desc">
                When unavoidable surplus occurs, the system logs portions at
                14:30 and alerts verified campus hostel cafeterias and local
                food rescue partners before the cold-chain safety window lapses.
              </p>
            </div>

            <div className="bento-card-action">
              <button
                type="button"
                className="bento-cta-btn"
                onClick={() => navigate("waste-risk")}
              >
                <span>View Rescue Dispatch</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.article>

        {/* Bento Tile 4: Institutional Impact & Carbon Telemetry */}
        <motion.article
          className="bento-card bento-card-large bento-photo-card"
          whileHover={
            shouldReduceMotion
              ? undefined
              : { y: -4, transition: { duration: 0.2 } }
          }
        >
          <div className="bento-img-wrap" aria-hidden="true">
            <picture className="bento-bg-picture">
              <source
                srcSet="/images/canteen/canteen-service.webp"
                type="image/webp"
              />
              <img
                src="/images/canteen/canteen-service.jpg"
                alt="Active canteen service counter with portion trays"
                className="bento-bg-img"
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="bento-scrim" />
          </div>

          <div className="bento-card-content">
            <div className="bento-badge-row">
              <span className="bento-pill">
                <Leaf size={12} aria-hidden="true" />
                <span>ESG &amp; Carbon Audit</span>
              </span>
              <span className="bento-stat-pill">-34% Food Waste</span>
            </div>

            <div className="bento-text-group">
              <h3 className="bento-card-title">
                Every kilogram accounted for. Every rupee protected.
              </h3>
              <p className="bento-card-desc">
                Canteen administrators and sustainability heads receive
                audit-ready logs tracking avoided methane emissions, meals
                diverted from dumpsters, and margin expansion directly tied to
                scientifically validated forecasting models.
              </p>
            </div>

            <div className="bento-kpi-row">
              <div className="bento-kpi-item">
                <strong className="kpi-num">34%</strong>
                <span className="kpi-label">Average Food Waste Cut</span>
              </div>
              <div className="bento-kpi-item">
                <strong className="kpi-num">2.5 kg</strong>
                <span className="kpi-label">CO₂e Abated / kg Food</span>
              </div>
              <div className="bento-kpi-item">
                <strong className="kpi-num">₹14,280</strong>
                <span className="kpi-label">Avg Weekly Margin Saved</span>
              </div>
            </div>

            <div className="bento-card-action">
              <button
                type="button"
                className="bento-cta-btn"
                onClick={() => navigate("performance")}
              >
                <span>Review Impact Telemetry</span>
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
