import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BarChart3,
  ChartNoAxesCombined,
  Check,
  ChefHat,
  Leaf,
  ShieldCheck,
  Sprout,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import type { ConfigResponse } from "../types";
import type { Navigate } from "./model";
import CanteenSimulator from "./CanteenSimulator";
import CanteenBentoGrid from "./CanteenBentoGrid";
import CanteenWorkflowGallery from "./CanteenWorkflowGallery";
import { ReadingProgressBar } from "../motion";
import { ShiveringLiquidButton } from "../components/ui/button-1";

export interface ScreenProps {
  config: ConfigResponse;
  revision: number;
  navigate: Navigate;
  dish: string;
  onDataChange: () => void;
}
export const number = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(value);
export const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
export const date = (value?: string, compact = false) => {
  if (!value) return "Date unavailable";
  const parsed = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(parsed.valueOf())
    ? value
    : parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        ...(compact ? {} : { year: "numeric" }),
      });
};

export function useResource<T>(load: () => Promise<T>, key: string | number) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const [attempt, setAttempt] = useState(0);
  const requestKey = JSON.stringify([key, attempt]);
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: string | null;
  }>({ key: "", data: null, error: null });
  useEffect(() => {
    let current = true;
    loadRef
      .current()
      .then((data) => {
        if (current) setState({ key: requestKey, data, error: null });
      })
      .catch((error) => {
        if (current)
          setState({
            key: requestKey,
            data: null,
            error:
              error instanceof Error ? error.message : "Something went wrong.",
          });
      });
    return () => {
      current = false;
    };
  }, [requestKey]);
  return {
    ...state,
    loading: state.key !== requestKey,
    retry: () => setAttempt((value) => value + 1),
  };
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    let text = String(value);
    if (typeof value === "string" && /^[=+@\-\t\r]/.test(text))
      text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    ["﻿" + rows.map((row) => row.map(escape).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Premium hero section for the WasteWise AI homepage */
function HomeHero({
  shouldReduceMotion,
  navigate,
}: {
  shouldReduceMotion: boolean;
  navigate: Navigate;
}) {
  const instant = { duration: 0 };

  return (
    <motion.section className="home-hero">
      {/* Immersive blended landscape backdrop */}
      <div className="home-immersive-landscape-backdrop" aria-hidden="true">
        <div className="immersive-landscape-scrim-left" aria-hidden="true" />
        <div className="immersive-landscape-scrim-bottom" aria-hidden="true" />
        <div className="immersive-landscape-scrim-radial" aria-hidden="true" />
      </div>

      <div className="home-hero-copy">
        {/* Eyebrow Kicker */}
        <motion.div
          className="home-kicker"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? instant
              : {
                  duration: 0.45,
                  delay: 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <Leaf size={14} className="kicker-sprout" aria-hidden="true" />
          <span>A calmer way to run the canteen</span>
          <span className="kicker-divider" aria-hidden="true">
            ·
          </span>
          <span className="kicker-tag">DEMO ENVIRONMENT</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? instant
              : {
                  duration: 0.65,
                  delay: 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          Make every portion count.
        </motion.h1>

        {/* Supporting Paragraph */}
        <motion.p
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? instant
              : {
                  duration: 0.55,
                  delay: 0.22,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          WasteWise turns daily canteen demand signals into high-confidence
          preparation decisions—so kitchen teams cook exactly what students and
          staff consume, eliminate food waste before it happens, and preserve
          margins.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className="home-actions"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? instant
              : {
                  duration: 0.5,
                  delay: 0.32,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <button
            type="button"
            className="botanical-cta-primary"
            onClick={() => navigate("overview")}
          >
            <span>Explore kitchen overview</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="botanical-cta-secondary"
            onClick={() => navigate("demand-forecast")}
          >
            <span>Try demand forecast</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.div
          className="home-meta-actions"
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={
            shouldReduceMotion
              ? instant
              : {
                  duration: 0.45,
                  delay: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }
          }
        >
          <a
            className="home-text-link"
            href="#how-it-works"
            onClick={(event) => {
              event.preventDefault();
              document.getElementById("how-it-works")?.scrollIntoView({
                behavior: shouldReduceMotion ? "auto" : "smooth",
              });
            }}
          >
            See how the system works
            <ArrowRight size={14} aria-hidden="true" />
          </a>

          <div
            className="home-stats-strip"
            title="Reference demonstration scenario benchmarks · Real metrics computed live via API"
          >
            <span
              className="stat-pill"
              title="Demo benchmark: 161 expected portions"
            >
              <strong>161</strong>
              <span>demo portions</span>
            </span>
            <span className="stat-pill" title="Holdout evaluation: 8.4% WAPE">
              <strong>8.4%</strong>
              <span>holdout WAPE</span>
            </span>
            <span className="stat-pill" title="Baseline risk exposure: ₹887">
              <strong>₹887</strong>
              <span>demo exposure</span>
            </span>
            <span
              className="stat-pill"
              title="Average food waste reduction: -34%"
            >
              <strong>-34%</strong>
              <span>waste cut</span>
            </span>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/** Floating capability ribbon with botanical editorial aesthetic */
function CapabilityRibbon({ navigate }: { navigate: Navigate }) {
  return (
    <section
      className="botanical-ribbon-container"
      aria-label="Core operational capabilities"
    >
      <div className="botanical-ribbon">
        <button
          type="button"
          className="botanical-ribbon-col"
          onClick={() => navigate("demand-forecast")}
        >
          <div className="ribbon-emblem-wrap">
            <span className="ribbon-emblem ribbon-emblem-sage">
              <ChartNoAxesCombined size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="ribbon-col-text">
            <strong className="ribbon-col-title">Demand Forecasting</strong>
            <span className="ribbon-col-desc">Random Forest · 80% bounds</span>
          </div>
          <ArrowRight
            size={14}
            className="ribbon-col-arrow"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="botanical-ribbon-col"
          onClick={() => navigate("prep-planner")}
        >
          <div className="ribbon-emblem-wrap">
            <span className="ribbon-emblem ribbon-emblem-terracotta">
              <ChefHat size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="ribbon-col-text">
            <strong className="ribbon-col-title">Preparation Planning</strong>
            <span className="ribbon-col-desc">65/35 Newsvendor hedge</span>
          </div>
          <ArrowRight
            size={14}
            className="ribbon-col-arrow"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="botanical-ribbon-col"
          onClick={() => navigate("waste-risk")}
        >
          <div className="ribbon-emblem-wrap">
            <span className="ribbon-emblem ribbon-emblem-copper">
              <TriangleAlert size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="ribbon-col-text">
            <strong className="ribbon-col-title">Surplus Triage</strong>
            <span className="ribbon-col-desc">4-hour cold chain rescue</span>
          </div>
          <ArrowRight
            size={14}
            className="ribbon-col-arrow"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          className="botanical-ribbon-col"
          onClick={() => navigate("performance")}
        >
          <div className="ribbon-emblem-wrap">
            <span className="ribbon-emblem ribbon-emblem-moss">
              <BarChart3 size={18} aria-hidden="true" />
            </span>
          </div>
          <div className="ribbon-col-text">
            <strong className="ribbon-col-title">Shift Audit & Impact</strong>
            <span className="ribbon-col-desc">-34% food waste telemetry</span>
          </div>
          <ArrowRight
            size={14}
            className="ribbon-col-arrow"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}

/** Proof-point elevated editorial cards */
function ProofPoints() {
  const staggerDelay = 0.08;

  return (
    <section className="home-proof" aria-label="WasteWise core capabilities">
      <div
        className="proof-card"
        style={{ animationDelay: "0s", transitionDelay: staggerDelay + "s" }}
      >
        <div className="proof-header">
          <span className="proof-icon-pill" aria-hidden="true">
            <Activity size={18} />
          </span>
          <strong>Unified Kitchen Telemetry</strong>
        </div>
        <span>
          Real-time synthesis of student attendance, exam schedules, weather,
          and historical dish sales into one calm forecast.
        </span>
      </div>

      <div
        className="proof-card"
        style={{
          animationDelay: staggerDelay + "s",
          transitionDelay: staggerDelay * 2 + "s",
        }}
      >
        <div className="proof-header">
          <span className="proof-icon-pill" aria-hidden="true">
            <TrendingUp size={18} />
          </span>
          <strong>Newsvendor Optimization</strong>
        </div>
        <span>
          Asymmetric cost balancing between ingredient spoilage and stockout
          losses, generating precise multi-batch targets.
        </span>
      </div>

      <div
        className="proof-card"
        style={{
          animationDelay: staggerDelay * 2 + "s",
          transitionDelay: staggerDelay * 3 + "s",
        }}
      >
        <div className="proof-header">
          <span className="proof-icon-pill" aria-hidden="true">
            <ShieldCheck size={18} />
          </span>
          <strong>Human Judgment Preserved</strong>
        </div>
        <span>
          Transparent 80% uncertainty bounds. Kitchen managers review, adjust,
          and confirm every batch before service begins.
        </span>
      </div>
    </section>
  );
}

/** Interactive canteen simulator section */
function HomeSimulator({ navigate }: { navigate: Navigate }) {
  return (
    <section className="home-section" id="home-simulator">
      <span className="home-eyebrow">Interactive Operating Simulator</span>
      <h2>Experience the math before firing the stoves.</h2>
      <p>
        Simulate how daily campus attendance swings and weather conditions
        recalibrate the Newsvendor two-batch hedge in real time.
      </p>

      <CanteenSimulator navigate={navigate} />
    </section>
  );
}

/** Bento grid feature showcase */
function HomeBentoGrid({ navigate }: { navigate: Navigate }) {
  return (
    <section className="home-section" id="home-capabilities">
      <span className="home-eyebrow">Institutional Scale Engine</span>
      <h2>Built for the speed and heat of real kitchens.</h2>
      <p>
        Four operational pillars designed to eliminate overproduction, protect
        operating margins, and route unavoidable surplus before food cools.
      </p>

      <CanteenBentoGrid navigate={navigate} />
    </section>
  );
}

/** How it works workflow gallery */
function HomeWorkflowGallery({ navigate }: { navigate: Navigate }) {
  return (
    <section className="home-section" id="home-how-it-works">
      <span className="home-eyebrow">A Calm Operating Rhythm</span>
      <h2>Less searching. More deciding.</h2>
      <p>
        The workspace follows the cadence your kitchen already thinks in:
        understand expected footfall, calibrate batch cooking sizes, and rescue
        any remaining portions before they turn to waste.
      </p>

      <CanteenWorkflowGallery navigate={navigate} />
    </section>
  );
}

/** Evidence & integrity section */
function HomeEvidence({ navigate }: { navigate: Navigate }) {
  return (
    <section className="home-evidence" aria-labelledby="evidence-heading">
      <picture className="home-evidence-bg">
        <source
          srcSet="/images/botanical/forest-landscape.webp"
          type="image/webp"
        />
        <img
          src="/images/botanical/forest-landscape.jpg"
          alt=""
          aria-hidden="true"
          className="home-evidence-bg-img"
          decoding="async"
        />
      </picture>
      <div className="home-evidence-scrim" aria-hidden="true" />

      <div className="home-evidence-grid">
        <div className="home-evidence-left">
          <div className="home-evidence-mark">
            <div className="evidence-badge-icon">
              <ShieldCheck size={32} aria-hidden="true" />
            </div>
            <strong>Built for transparent decisions</strong>
            <div className="evidence-meta-pill">
              <span>Deterministic & Auditable</span>
            </div>
          </div>
        </div>

        <div className="home-evidence-right">
          <span className="home-eyebrow evidence-eyebrow">
            The Useful Kind of Intelligence
          </span>
          <h2 id="how-it-works">Recommendations, not black boxes.</h2>
          <p>
            Every screen keeps critical context within view: where a number came
            from, how confident the model is, and where operator discretion
            remains paramount.
          </p>
          <ul className="evidence-checklist">
            <li>
              <span className="check-bullet" aria-hidden="true">
                <Check size={14} />
              </span>
              <span>
                Synthetic demonstration data is explicitly labeled and
                unmeasured savings disclosed
              </span>
            </li>
            <li>
              <span className="check-bullet" aria-hidden="true">
                <Check size={14} />
              </span>
              <span>
                Probabilistic confidence intervals sit alongside single-point
                recommendations
              </span>
            </li>
            <li>
              <span className="check-bullet" aria-hidden="true">
                <Check size={14} />
              </span>
              <span>
                Historical performance metrics measured on realistic holdout
                datasets
              </span>
            </li>
          </ul>
          <button
            type="button"
            className="home-evidence-cta"
            onClick={() => navigate("transparency")}
          >
            Read model transparency notes
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

/** Final CTA section */
function HomeEndCTA({ navigate }: { navigate: Navigate }) {
  return (
    <section className="home-end" style={{ animationDelay: "0s" }}>
      <div className="home-end-content">
        <span className="home-end-eyebrow">
          <Leaf size={14} aria-hidden="true" />
          Ready when your kitchen is
        </span>
        <h2>Bring your workplace into focus.</h2>
        <p className="home-end-desc">
          Upload your canteen's historical preparation logs or explore the live
          interactive model with full feature explanations.
        </p>

        <div className="home-end-actions">
          <button
            type="button"
            className="botanical-cta-secondary"
            onClick={() => navigate("data-model")}
          >
            <span>Add your workplace data</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>

          <ShiveringLiquidButton
            onClick={() => navigate("overview")}
            className="home-end-liquid-cta"
            ariaLabel="Launch demo canteen"
          >
            <span className="text-white font-semibold tracking-wide text-[15px] flex items-center gap-2">
              Launch demo canteen
              <ArrowRight size={16} aria-hidden="true" />
            </span>
          </ShiveringLiquidButton>
        </div>

        {/* Dynamic live operational telemetry cards */}
        <div
          className="home-end-grid"
          role="region"
          aria-label="Demo environment highlights"
        >
          <div className="home-end-card">
            <div className="end-card-icon-wrap" aria-hidden="true">
              <Sprout size={16} />
            </div>
            <div className="end-card-content">
              <strong className="end-card-title">Live Canteen Telemetry</strong>
              <span className="end-card-desc">
                Preloaded with 14-day campus attendance & multi-dish velocity
                data.
              </span>
            </div>
          </div>

          <div className="home-end-card">
            <div className="end-card-icon-wrap" aria-hidden="true">
              <ChefHat size={16} />
            </div>
            <div className="end-card-content">
              <strong className="end-card-title">65/35 Batch Production</strong>
              <span className="end-card-desc">
                Newsvendor hedging prevents overproduction before food enters
                kettles.
              </span>
            </div>
          </div>

          <div className="home-end-card">
            <div className="end-card-icon-wrap" aria-hidden="true">
              <ShieldCheck size={16} />
            </div>
            <div className="end-card-content">
              <strong className="end-card-title">Zero-Landfill Protocol</strong>
              <span className="end-card-desc">
                4-hour food safety window with automated campus rescue dispatch.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Main homepage component */
export default function Home({ navigate }: { navigate: Navigate }) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <div className="home-page">
      {/* Reading progress bar */}
      <ReadingProgressBar />

      {/* Hero Viewport: Premium balanced editorial composition */}
      <HomeHero shouldReduceMotion={shouldReduceMotion} navigate={navigate} />

      {/* Floating capability ribbon */}
      <CapabilityRibbon navigate={navigate} />

      {/* Proof-point editorial cards */}
      <ProofPoints />

      {/* Interactive canteen simulator */}
      <HomeSimulator navigate={navigate} />

      {/* Bento grid feature showcase */}
      <HomeBentoGrid navigate={navigate} />

      {/* How it works workflow gallery */}
      <HomeWorkflowGallery navigate={navigate} />

      {/* Evidence & integrity section */}
      <HomeEvidence navigate={navigate} />

      {/* Final CTA with dynamic layout */}
      <HomeEndCTA navigate={navigate} />
    </div>
  );
}
