import { useState, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Calculator,
  ChefHat,
  CloudRain,
  Flame,
  Leaf,
  RefreshCw,
  Sun,
  TrendingDown,
  Users,
} from "lucide-react";
import MetalButton from "../MetalButton";
import type { Navigate } from "./model";

interface CanteenSimulatorProps {
  navigate: Navigate;
}

export default function CanteenSimulator({ navigate }: CanteenSimulatorProps) {
  const shouldReduceMotion = useReducedMotion();
  const footfallId = useId();

  // Interactive controls
  const [footfall, setFootfall] = useState<number>(1250);
  const [weatherCondition, setWeatherCondition] = useState<
    "sunny" | "rainy" | "exam"
  >("sunny");
  const [portionCost, setPortionCost] = useState<number>(45); // Avg ingredient cost in ₹

  // Domain Newsvendor calculation
  // Weather impact multiplier
  const weatherMultipliers = {
    sunny: 1.0,
    rainy: 1.09, // Rain brings more students inside the campus canteen
    exam: 0.88, // Exam week reduces midday sit-down dining
  };

  const attendanceMultiplier = weatherMultipliers[weatherCondition];
  const effectiveFootfall = Math.round(footfall * attendanceMultiplier);
  const conversionRate = 0.62; // 62% of campus footfall orders hot lunch
  const expectedPortions = Math.round(effectiveFootfall * conversionRate);

  // Newsvendor two-batch allocation (65% initial kettle buffer, 35% flexible refill)
  const batch1Portions = Math.round(expectedPortions * 0.65);
  const batch2Reserve = expectedPortions - batch1Portions;

  // Waste prevention metrics compared to naive over-preparation baseline (+25% blind buffer)
  const naivePrep = Math.round(expectedPortions * 1.25);
  const preventedSurplusPortions = naivePrep - expectedPortions;
  const costSaved = preventedSurplusPortions * portionCost;
  const carbonAvoidedKg = Math.round(preventedSurplusPortions * 0.42 * 2.5); // 0.42 kg meal avg * 2.5 kg CO2e/kg

  return (
    <div
      className="canteen-sim-card"
      role="region"
      aria-label="Interactive Canteen Prep Simulator"
    >
      {/* Top Header */}
      <div className="canteen-sim-header">
        <div className="sim-title-group">
          <div className="sim-icon-badge" aria-hidden="true">
            <Calculator size={18} />
          </div>
          <div>
            <h3 className="sim-title">
              Live Kitchen Prep &amp; Waste Simulator
            </h3>
            <p className="sim-subtitle">
              Simulate daily attendance shifts and observe the Newsvendor
              two-batch hedge in real time.
            </p>
          </div>
        </div>
        <span className="sim-badge">
          <ChefHat size={13} aria-hidden="true" />
          <span>Newsvendor Logic</span>
        </span>
      </div>

      <div className="canteen-sim-body">
        {/* Controls Column */}
        <div className="canteen-sim-controls">
          {/* Slider 1: Expected Footfall */}
          <div className="sim-control-group">
            <div className="sim-label-row">
              <label htmlFor={footfallId} className="sim-label">
                <Users size={14} aria-hidden="true" />
                <span>Campus / Canteen Attendance</span>
              </label>
              <strong className="sim-value-pill">
                {footfall.toLocaleString("en-IN")} attendees
              </strong>
            </div>
            <input
              id={footfallId}
              type="range"
              min={400}
              max={3000}
              step={50}
              value={footfall}
              onChange={(e) => setFootfall(Number(e.target.value))}
              className="sim-range-slider"
              aria-valuemin={400}
              aria-valuemax={3000}
              aria-valuenow={footfall}
              aria-valuetext={`${footfall} attendees`}
            />
            <div className="sim-range-bounds">
              <span>400 min</span>
              <span>1,700 mid</span>
              <span>3,000 peak</span>
            </div>
          </div>

          {/* Condition Selector */}
          <div className="sim-control-group">
            <span className="sim-label">
              <Sun size={14} aria-hidden="true" />
              <span>Service Condition Signal</span>
            </span>
            <div
              className="sim-condition-pills"
              role="radiogroup"
              aria-label="Service condition"
            >
              <button
                type="button"
                role="radio"
                aria-checked={weatherCondition === "sunny"}
                className={`sim-pill-btn ${weatherCondition === "sunny" ? "active" : ""}`}
                onClick={() => setWeatherCondition("sunny")}
              >
                <Sun size={13} aria-hidden="true" />
                <span>Mild / Clear (1.0x)</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={weatherCondition === "rainy"}
                className={`sim-pill-btn ${weatherCondition === "rainy" ? "active" : ""}`}
                onClick={() => setWeatherCondition("rainy")}
              >
                <CloudRain size={13} aria-hidden="true" />
                <span>Monsoon / Rain (+9%)</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={weatherCondition === "exam"}
                className={`sim-pill-btn ${weatherCondition === "exam" ? "active" : ""}`}
                onClick={() => setWeatherCondition("exam")}
              >
                <Flame size={13} aria-hidden="true" />
                <span>Exam Week (-12%)</span>
              </button>
            </div>
          </div>

          {/* Average Meal Cost */}
          <div className="sim-control-group">
            <div className="sim-label-row">
              <span className="sim-label">Raw Ingredient Cost / Meal</span>
              <div className="sim-cost-options">
                {[35, 45, 60].map((cost) => (
                  <button
                    key={cost}
                    type="button"
                    className={`sim-cost-btn ${portionCost === cost ? "active" : ""}`}
                    onClick={() => setPortionCost(cost)}
                  >
                    ₹{cost}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Telemetry Results Column */}
        <div className="canteen-sim-results">
          {/* Main Prep Target */}
          <div className="sim-target-banner">
            <div className="sim-target-left">
              <span className="sim-target-eyebrow">
                Calculated Batch Target
              </span>
              <motion.div
                key={expectedPortions}
                initial={
                  shouldReduceMotion ? false : { scale: 0.96, opacity: 0.6 }
                }
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="sim-target-number"
              >
                {expectedPortions.toLocaleString("en-IN")}
                <span className="sim-target-unit">portions</span>
              </motion.div>
            </div>
            <div className="sim-target-meta">
              <span className="sim-badge-live">
                <span className="sim-live-dot" /> Live Calibrated
              </span>
              <span className="sim-meta-sub">
                Based on {effectiveFootfall.toLocaleString("en-IN")} effective
                footfall
              </span>
            </div>
          </div>

          {/* Batch 1 vs Batch 2 Distribution Bar */}
          <div className="sim-batch-breakdown">
            <div className="sim-batch-labels">
              <span>
                <strong>Batch 1 (65% Kettle buffer):</strong> {batch1Portions}{" "}
                portions
              </span>
              <span>
                <strong>Batch 2 (On-demand reserve):</strong> {batch2Reserve}{" "}
                portions
              </span>
            </div>
            <div className="sim-batch-track" aria-hidden="true">
              <div className="sim-batch-bar-1" style={{ width: "65%" }} />
              <div className="sim-batch-bar-2" style={{ width: "35%" }} />
            </div>
            <span className="sim-batch-hint">
              Batch 1 commits to initial steam tables; Batch 2 fires only if
              12:30 PM counter count exceeds 60%.
            </span>
          </div>

          {/* Impact Metric Grid */}
          <div className="sim-kpi-grid">
            <div className="sim-kpi-tile">
              <div className="sim-kpi-label">
                <TrendingDown
                  size={14}
                  className="text-green"
                  aria-hidden="true"
                />
                <span>Avoided Overprep</span>
              </div>
              <strong className="sim-kpi-val">
                {preventedSurplusPortions} portions
              </strong>
              <span className="sim-kpi-sub">vs. naive +25% rule-of-thumb</span>
            </div>

            <div className="sim-kpi-tile">
              <div className="sim-kpi-label">
                <Leaf size={14} className="text-green" aria-hidden="true" />
                <span>Estimated Margin Saved</span>
              </div>
              <strong className="sim-kpi-val">
                ₹{costSaved.toLocaleString("en-IN")}
              </strong>
              <span className="sim-kpi-sub">in wasted ingredients</span>
            </div>

            <div className="sim-kpi-tile">
              <div className="sim-kpi-label">
                <RefreshCw
                  size={14}
                  className="text-green"
                  aria-hidden="true"
                />
                <span>Carbon Abated</span>
              </div>
              <strong className="sim-kpi-val">{carbonAvoidedKg} kg CO₂e</strong>
              <span className="sim-kpi-sub">landfill emissions avoided</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="sim-action-row">
            <MetalButton
              className="button primary"
              onClick={() => navigate("prep-planner")}
            >
              Open Full Preparation Planner
              <ArrowRight size={15} />
            </MetalButton>
            <MetalButton
              className="button"
              onClick={() => navigate("overview")}
            >
              Explore Live Overview
            </MetalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
