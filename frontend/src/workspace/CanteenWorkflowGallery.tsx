import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import type { Navigate } from "./model";

interface CanteenWorkflowGalleryProps {
  navigate: Navigate;
}

const workflowSteps = [
  {
    id: "step-1",
    time: "06:30 AM",
    title: "Signal Synchronization & Weather Feed",
    role: "Morning Kitchen Briefing",
    desc: "The system ingests updated campus footfall estimates (1.0x baseline), monsoon rain forecasts, and morning class schedules to calculate dish-level demand uncertainty bands.",
    webp: "/images/canteen/fresh-prep.webp",
    jpg: "/images/canteen/fresh-prep.jpg",
    alt: "Fresh vegetables and culinary mise-en-place preparation in commercial kitchen",
    kpis: [
      { label: "Attendance Feed", val: "1,250 synced" },
      { label: "Weather Shift", val: "Mild / Clear" },
      { label: "Confidence Band", val: "80% bounds" },
    ],
  },
  {
    id: "step-2",
    time: "10:00 AM",
    title: "Batch 1 Kettle Production (65% Target)",
    role: "Cooking Station Firing",
    desc: "Chefs fire the primary 65% kettle buffer for high-volume gravies, rice, and main courses, avoiding premature overproduction while guaranteeing zero first-hour stockouts.",
    webp: "/images/canteen/kitchen-prep.webp",
    jpg: "/images/canteen/kitchen-prep.jpg",
    alt: "Professional culinary chefs batch cooking in commercial kitchen",
    kpis: [
      { label: "Batch 1 Allocation", val: "65% committed" },
      { label: "Reserve Buffer", val: "35% held back" },
      { label: "Overprep Risk", val: "Minimal" },
    ],
  },
  {
    id: "step-3",
    time: "12:30 PM",
    title: "Counter Demand Monitoring & Refill Trigger",
    role: "Mid-Service Orchestration",
    desc: "As the lunch rush peaks, counter monitors track consumption velocity. If the steam table drops below the 5-portion safety threshold, the secondary quick-prep batch fires on demand.",
    webp: "/images/canteen/canteen-service.webp",
    jpg: "/images/canteen/canteen-service.jpg",
    alt: "Vibrant cafeteria service counter with hot steam food wells and portion trays",
    kpis: [
      { label: "Refill Threshold", val: "< 5 portions" },
      { label: "Stockout Prevention", val: "99.2% uptime" },
      { label: "Queue Velocity", val: "Optimal" },
    ],
  },
  {
    id: "step-4",
    time: "14:30 PM",
    title: "Surplus Audit & Cold-Chain Rescue Dispatch",
    role: "Shift Closure & Sustainability",
    desc: "At service close, kitchen supervisors log actual leftover portions directly to the database. Any safe surplus is instantly dispatched to hostel cafeterias or partner NGOs within the 4-hour window.",
    webp: "/images/canteen/plated-meal.webp",
    jpg: "/images/canteen/plated-meal.jpg",
    alt: "Nutritious balanced plated meal served in sustainable dining hall tray",
    kpis: [
      { label: "Cold-Chain Window", val: "4-hour timer" },
      { label: "Direct Landfill Waste", val: "0.0 kg" },
      { label: "Recorded to DB", val: "SQLite Demonstration DB" },
    ],
  },
];

export default function CanteenWorkflowGallery({
  navigate,
}: CanteenWorkflowGalleryProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const currentStep = workflowSteps[activeStepIndex];

  return (
    <div
      className="workflow-gallery-container"
      role="region"
      aria-label="Kitchen Operational Workflow"
    >
      {/* Step Selector Tabs */}
      <div
        className="workflow-tabs"
        role="tablist"
        aria-label="Workflow shift phases"
      >
        {workflowSteps.map((step, idx) => (
          <button
            key={step.id}
            type="button"
            role="tab"
            aria-selected={activeStepIndex === idx}
            className={`workflow-tab-btn ${activeStepIndex === idx ? "active" : ""}`}
            onClick={() => setActiveStepIndex(idx)}
          >
            <span className="workflow-tab-time">{step.time}</span>
            <span className="workflow-tab-title">{step.title}</span>
            {activeStepIndex === idx && (
              <motion.div
                layoutId="activeWorkflowIndicator"
                className="workflow-tab-indicator"
                transition={
                  shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }
                }
              />
            )}
          </button>
        ))}
      </div>

      {/* Active Phase Card Presentation */}
      <div className="workflow-stage-card">
        {/* Left Column: Authentic Photography with Picture Fallback & Key Re-render */}
        <div className="workflow-stage-media" key={currentStep.id}>
          <picture className="workflow-stage-picture">
            <source srcSet={currentStep.webp} type="image/webp" />
            <img
              src={currentStep.jpg}
              alt={currentStep.alt}
              className="workflow-stage-img"
              width={1200}
              height={800}
              loading="eager"
              decoding="async"
            />
          </picture>
          <div className="workflow-stage-badge">
            <Clock size={13} aria-hidden="true" />
            <span>
              {currentStep.time} · {currentStep.role}
            </span>
          </div>
        </div>

        {/* Right Column: Operational Detail & Telemetry */}
        <div className="workflow-stage-details">
          <div className="stage-eyebrow">
            <span className="stage-step-num">
              Phase 0{activeStepIndex + 1} of 04
            </span>
            <span className="stage-divider">·</span>
            <span className="stage-role-tag">{currentStep.role}</span>
          </div>

          <h3 className="stage-heading">{currentStep.title}</h3>
          <p className="stage-description">{currentStep.desc}</p>

          <div className="stage-kpi-row">
            {currentStep.kpis.map((kpi) => (
              <div key={kpi.label} className="stage-kpi-chip">
                <span className="stage-kpi-label">{kpi.label}</span>
                <strong className="stage-kpi-val">{kpi.val}</strong>
              </div>
            ))}
          </div>

          <div className="stage-nav-row">
            <button
              type="button"
              className="stage-next-btn"
              onClick={() =>
                setActiveStepIndex((prev) => (prev + 1) % workflowSteps.length)
              }
            >
              <span>Next Operating Phase</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="stage-action-link"
              onClick={() => {
                if (activeStepIndex === 0) navigate("demand-forecast");
                else if (activeStepIndex === 1) navigate("prep-planner");
                else if (activeStepIndex === 2) navigate("overview");
                else navigate("waste-risk");
              }}
            >
              <span>Open in Workspace</span>
              <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
