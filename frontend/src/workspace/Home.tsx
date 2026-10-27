import {
  Activity,
  ArrowRight,
  Check,
  Clock,
  Leaf,
  ShieldCheck,
  Sprout,
  TrendingUp,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import MetalButton from "../MetalButton";
import BrandLogo from "../BrandLogo";
import { motionTokens } from "../motionTokens";
import {
  ReadingProgressBar,
  ScrollReveal,
  StaggerGroup,
  StaggerItem,
} from "../motion";
import type { Navigate } from "./model";
import CanteenSimulator from "./CanteenSimulator";
import CanteenBentoGrid from "./CanteenBentoGrid";
import CanteenWorkflowGallery from "./CanteenWorkflowGallery";

export default function Home({ navigate }: { navigate: Navigate }) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Subtle controlled parallax drift for the interactive telemetry console
  const consoleParallaxY = useTransform(
    scrollY,
    [0, 500],
    shouldReduceMotion ? [0, 0] : [0, 16],
  );

  const instant = { duration: 0 };

  return (
    <div className="home-page">
      <ReadingProgressBar />

      {/* Hero Viewport: Balanced 2-column editorial composition */}
      <section className="home-hero">
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
                    ease: motionTokens.ease.out,
                  }
            }
          >
            <Sprout size={14} className="kicker-sprout" aria-hidden="true" />
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
                    ease: motionTokens.ease.out,
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
                    ease: motionTokens.ease.out,
                  }
            }
          >
            WasteWise turns daily canteen demand signals into high-confidence
            preparation decisions—so kitchen teams cook exactly what students
            and staff consume, eliminate food waste before it happens, and
            preserve margins.
          </motion.p>

          {/* Action Buttons */}
          <div className="home-actions">
            <motion.div
              className="home-action-buttons"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldReduceMotion
                  ? instant
                  : {
                      duration: 0.5,
                      delay: 0.32,
                      ease: motionTokens.ease.out,
                    }
              }
            >
              <MetalButton
                className="button primary"
                onClick={() => navigate("overview")}
              >
                Explore kitchen overview
                <ArrowRight size={16} aria-hidden="true" />
              </MetalButton>
              <MetalButton
                className="button"
                onClick={() => navigate("demand-forecast")}
              >
                Try demand forecast
                <ArrowRight size={16} aria-hidden="true" />
              </MetalButton>
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
                      ease: motionTokens.ease.out,
                    }
              }
            >
              <a
                className="home-text-link"
                href="#home-how-it-works"
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById("home-how-it-works")?.scrollIntoView({
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
                <span
                  className="stat-pill"
                  title="Holdout evaluation: 8.4% WAPE"
                >
                  <strong>8.4%</strong>
                  <span>holdout WAPE</span>
                </span>
                <span
                  className="stat-pill"
                  title="Baseline risk exposure: ₹887"
                >
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
        </div>

        {/* Right Side: Interactive Kitchen Intelligence & Telemetry Stage */}
        <motion.div
          className="home-signal"
          aria-label="WasteWise kitchen intelligence stage"
          style={{ y: consoleParallaxY }}
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            shouldReduceMotion
              ? instant
              : {
                  duration: 0.7,
                  delay: 0.18,
                  ease: motionTokens.ease.out,
                }
          }
        >
          <div className="telemetry-hud-card">
            {/* Top Bar: Live Service Context */}
            <div className="hud-header">
              <div className="hud-title-wrap">
                <span className="live-pulse-dot" aria-hidden="true" />
                <div className="hud-canteen-meta">
                  <strong className="hud-canteen-name">
                    Campus Green Demo Canteen
                  </strong>
                  <div className="hud-service-tags">
                    <span className="hud-service-type">Lunch Service</span>
                    <span className="hud-service-sep" aria-hidden="true">
                      ·
                    </span>
                    <span className="hud-service-status">
                      Active Operating Schedule
                    </span>
                  </div>
                </div>
              </div>
              <span className="hud-badge">
                <Clock size={12} aria-hidden="true" />
                <span>Shift Cadence</span>
              </span>
            </div>

            {/* Live Visual Floor Banner */}
            <div className="hud-hero-image-strip" aria-hidden="true">
              <picture className="hud-hero-picture">
                <source
                  srcSet="/images/canteen/canteen-service.webp"
                  type="image/webp"
                />
                <img
                  src="/images/canteen/canteen-service.jpg"
                  alt="Campus Green Canteen service counter"
                  className="hud-hero-img"
                  width={480}
                  height={120}
                  loading="eager"
                  decoding="async"
                />
              </picture>
              <div className="hud-hero-img-badge">
                <span className="live-pulse-dot" aria-hidden="true" />
                <span>Live Service Floor</span>
              </div>
            </div>

            {/* Canteen Operational Shift Cadence */}
            <div className="hud-shift-cadence">
              <div className="cadence-header">
                <span className="cadence-title">Today's Operating Cadence</span>
                <span className="cadence-date">Active Kitchen Rhythm</span>
              </div>

              <div className="cadence-timeline">
                <div className="cadence-step done">
                  <span className="step-time">06:30</span>
                  <span className="step-node" aria-hidden="true" />
                  <div className="step-content">
                    <strong className="step-title">
                      Signal Synchronization
                    </strong>
                    <span className="step-desc">
                      Ingest campus attendance (1.0x), mild weather &amp; day
                      baseline
                    </span>
                  </div>
                </div>

                <div className="cadence-step active">
                  <span className="step-time">10:00</span>
                  <span className="step-node" aria-hidden="true" />
                  <div className="step-content">
                    <strong className="step-title">Batch 1 Production</strong>
                    <span className="step-desc">
                      Commit initial buffer (110 portions, 65%) to kettles
                    </span>
                  </div>
                </div>

                <div className="cadence-step">
                  <span className="step-time">12:30</span>
                  <span className="step-node" aria-hidden="true" />
                  <div className="step-content">
                    <strong className="step-title">
                      Mid-Service Refill Check
                    </strong>
                    <span className="step-desc">
                      Evaluate refill trigger (&lt;5 portions) before cooking
                      Batch 2
                    </span>
                  </div>
                </div>

                <div className="cadence-step">
                  <span className="step-time">14:30</span>
                  <span className="step-node" aria-hidden="true" />
                  <div className="step-content">
                    <strong className="step-title">
                      Surplus Audit &amp; Log
                    </strong>
                    <span className="step-desc">
                      Record actual outcomes to SQLite &amp; route any excess
                      portions
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Four KPI Telemetry Cards */}
            <div className="hud-metric-row">
              <div className="hud-metric-box">
                <span className="hud-metric-label">Expected Demand</span>
                <strong className="hud-metric-value">161</strong>
                <span className="hud-metric-note">Across 8 dishes</span>
              </div>
              <div className="hud-metric-box highlight">
                <span className="hud-metric-label">Suggested Prep</span>
                <strong className="hud-metric-value">168</strong>
                <span className="hud-metric-note">+4.3% safety buffer</span>
              </div>
              <div className="hud-metric-box">
                <span className="hud-metric-label">Model Accuracy</span>
                <strong className="hud-metric-value">8.4%</strong>
                <span className="hud-metric-note">Holdout WAPE</span>
              </div>
              <div className="hud-metric-box">
                <span className="hud-metric-label">Financial Exposure</span>
                <strong className="hud-metric-value">₹887</strong>
                <span className="hud-metric-note">Demo cost-at-risk</span>
              </div>
            </div>

            {/* Authenticated Brand Seal & Status Bar */}
            <div className="hud-footer">
              <div className="hud-brand-seal">
                <BrandLogo
                  className="hud-seal-logo"
                  width={38}
                  height={27}
                  alt="WasteWise"
                />
                <div className="hud-seal-text">
                  <span className="brand-title">
                    WasteWise Operational Platform
                  </span>
                  <span className="brand-sub">
                    Canteen Decision Support System
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="hud-quick-link"
                onClick={() => navigate("overview")}
                aria-label="Open Kitchen Overview"
              >
                <span>Launch Overview</span>
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Proof Points: Elevated Editorial Cards */}
      <StaggerGroup
        className="home-proof"
        aria-label="WasteWise core capabilities"
        staggerDelay={0.08}
      >
        <StaggerItem>
          <div className="proof-card">
            <div className="proof-header">
              <span className="proof-icon-pill" aria-hidden="true">
                <Activity size={18} />
              </span>
              <strong>Unified Kitchen Telemetry</strong>
            </div>
            <span>
              Real-time synthesis of student attendance, exam schedules,
              weather, and historical dish sales into one calm forecast.
            </span>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="proof-card">
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
        </StaggerItem>
        <StaggerItem>
          <div className="proof-card">
            <div className="proof-header">
              <span className="proof-icon-pill" aria-hidden="true">
                <ShieldCheck size={18} />
              </span>
              <strong>Human Judgment Preserved</strong>
            </div>
            <span>
              Transparent 80% uncertainty bounds. Kitchen managers review,
              adjust, and confirm every batch before service begins.
            </span>
          </div>
        </StaggerItem>
      </StaggerGroup>

      {/* Interactive 21st.dev Canteen Simulator Section */}
      <section className="home-section" id="home-simulator">
        <ScrollReveal
          className="home-section-heading"
          direction="up"
          distance={16}
        >
          <span className="home-eyebrow">Interactive Operating Simulator</span>
          <h2>Experience the math before firing the stoves.</h2>
          <p>
            Simulate how daily campus attendance swings and weather conditions
            recalibrate the Newsvendor two-batch hedge in real time.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" distance={16} threshold={0.08}>
          <CanteenSimulator navigate={navigate} />
        </ScrollReveal>
      </section>

      {/* 21st.dev Bento Grid Feature Showcase with Authentic Photography */}
      <section className="home-section" id="home-capabilities">
        <ScrollReveal
          className="home-section-heading"
          direction="up"
          distance={16}
        >
          <span className="home-eyebrow">Institutional Scale Engine</span>
          <h2>Built for the speed and heat of real kitchens.</h2>
          <p>
            Four operational pillars designed to eliminate overproduction,
            protect operating margins, and route unavoidable surplus before food
            cools.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" distance={16} threshold={0.08}>
          <CanteenBentoGrid navigate={navigate} />
        </ScrollReveal>
      </section>

      {/* How It Works: Interactive 4-Step Canteen Workflow Gallery */}
      <section className="home-section" id="home-how-it-works">
        <ScrollReveal
          className="home-section-heading"
          direction="up"
          distance={16}
        >
          <span className="home-eyebrow">A Calm Operating Rhythm</span>
          <h2>Less searching. More deciding.</h2>
          <p>
            The workspace follows the cadence your kitchen already thinks in:
            understand expected footfall, calibrate batch cooking sizes, and
            rescue any remaining portions before they turn to waste.
          </p>
        </ScrollReveal>

        <ScrollReveal direction="up" distance={16} threshold={0.08}>
          <CanteenWorkflowGallery navigate={navigate} />
        </ScrollReveal>
      </section>

      {/* Evidence & Integrity Section */}
      <section className="home-evidence">
        <ScrollReveal
          direction="left"
          distance={16}
          className="home-evidence-left"
        >
          <div className="home-evidence-mark">
            <div className="evidence-badge-icon">
              <ShieldCheck size={28} aria-hidden="true" />
            </div>
            <strong>Built for transparent decisions</strong>
            <p>
              Every operational recommendation discloses its math and
              assumptions.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal
          direction="right"
          distance={16}
          className="home-evidence-right"
        >
          <div>
            <span className="home-eyebrow">
              The Useful Kind of Intelligence
            </span>
            <h2>Recommendations, not black boxes.</h2>
            <p>
              Every screen keeps critical context within view: where a number
              came from, how confident the model is, and where operator
              discretion remains paramount.
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
              className="home-text-link"
              onClick={() => navigate("transparency")}
            >
              Read model transparency notes{" "}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </ScrollReveal>
      </section>

      {/* Final Call to Action */}
      <ScrollReveal direction="up" distance={18}>
        <section className="home-end">
          <div className="home-end-content">
            <span className="home-end-eyebrow">
              <Leaf size={14} aria-hidden="true" />
              Ready when your kitchen is
            </span>
            <h2>Bring your workplace into focus.</h2>
            <p>
              Upload your canteen’s historical preparation logs or explore the
              live interactive model with full feature explanations.
            </p>
            <div className="home-end-actions">
              <MetalButton
                className="button primary"
                onClick={() => navigate("data-model")}
              >
                Add your workplace data
                <ArrowRight size={16} aria-hidden="true" />
              </MetalButton>
              <MetalButton
                className="button"
                onClick={() => navigate("overview")}
              >
                Launch demo canteen
                <ArrowRight size={16} aria-hidden="true" />
              </MetalButton>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
