import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Sparkles,
  TrendingUp,
  Sliders,
  Users,
  CheckCircle2,
  Award,
  ArrowRight,
} from 'lucide-react';
import { ScenarioPreset } from './TopBar';

interface GuidedDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: ScenarioPreset) => void;
  onNavigatePage: (pageId: any) => void;
}

interface StepInfo {
  number: number;
  title: string;
  tagline: string;
  description: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  pageTarget: string;
  scenarioTarget?: ScenarioPreset;
  metrics: Array<{ label: string; value: string }>;
}

const DEMO_STEPS: StepInfo[] = [
  {
    number: 1,
    title: 'Load Service Day',
    tagline: 'Morning shift setup at 6:30 AM',
    description:
      'The morning chef opens WasteWise AI at 6:30 AM before cooking starts. The system loads today’s service date (Sunday, 27 Sep 2026), factoring in scheduled meal shifts, campus calendar state, and morning weather telemetry.',
    actionLabel: 'Proceed: Read Forecast',
    icon: Calendar,
    pageTarget: 'overview',
    scenarioTarget: 'normal',
    metrics: [
      { label: 'Service Date', value: '27 Sep 2026' },
      { label: 'Shift', value: 'Lunch (12:00-14:30)' },
      { label: 'Campus Index', value: '0.40 (Weekend)' },
    ],
  },
  {
    number: 2,
    title: 'Read Forecast',
    tagline: 'Machine learning demand projection with explainability',
    description:
      'Rather than relying on rough static estimates, the Random Forest model analyzes past sales, menu affinities, day-of-week trends, and campus footfall to forecast 161 total lunch portions across 8 core items with an 80% confidence interval.',
    actionLabel: 'Proceed: Choose Plan',
    icon: TrendingUp,
    pageTarget: 'demand_forecast',
    scenarioTarget: 'normal',
    metrics: [
      { label: 'Forecast Demand', value: '161 portions' },
      { label: 'Model WAPE', value: '8.4% Holdout' },
      { label: 'Baseline Comparison', value: '-14 portions vs Baseline' },
    ],
  },
  {
    number: 3,
    title: 'Choose Plan',
    tagline: 'Cost-asymmetric Newsvendor preparation & batch splitting',
    description:
      'The Smart Preparation Planner balances ingredient waste costs against stockout penalties. It recommends 168 portions total, split into a 142-portion initial batch (85%) and a 26-portion dynamic refill buffer to mitigate early overproduction.',
    actionLabel: 'Proceed: Toggle Campus Event',
    icon: Sliders,
    pageTarget: 'smart_preparation',
    scenarioTarget: 'normal',
    metrics: [
      { label: 'Recommended Prep', value: '168 portions' },
      { label: 'Initial Batch', value: '142 portions' },
      { label: 'Cost at Risk', value: '₹887' },
    ],
  },
  {
    number: 4,
    title: 'Toggle Campus Event',
    tagline: 'Real-time scenario shock: +35% footfall spike',
    description:
      'An unexpected university technical fest or conference is announced. The operator toggles the "Campus Event" preset. The AI immediately recalibrates all 8 dish batches upward, preventing severe lunch stockouts and lost revenue.',
    actionLabel: 'Proceed: Log Actuals',
    icon: Users,
    pageTarget: 'overview',
    scenarioTarget: 'event',
    metrics: [
      { label: 'Simulated Surge', value: '+35% Footfall' },
      { label: 'Dynamic Recalibration', value: 'Instant Multi-Item' },
      { label: 'Stockout Prevention', value: 'Protected' },
    ],
  },
  {
    number: 5,
    title: 'Log Actuals & Reconcile',
    tagline: 'Closing the loop: audit accuracy and simulated savings',
    description:
      'Post-service audit: actual sales matched the model prediction within 4.76 portions MAE. Unsold safety buffer portions were logged and dispatched to campus partners, realizing ₹48,324 in simulated annualized ingredient savings.',
    actionLabel: 'Complete Walkthrough',
    icon: Award,
    pageTarget: 'impact_analytics',
    scenarioTarget: 'normal',
    metrics: [
      { label: 'Holdout WAPE', value: '8.4% vs 10.8%' },
      { label: 'Simulated Savings', value: '₹48,324' },
      { label: 'Verification', value: 'Zero Data Drift' },
    ],
  },
];

export const GuidedDemoModal: React.FC<GuidedDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  onNavigatePage,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = DEMO_STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === DEMO_STEPS.length - 1;
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (isLast) {
      onClose();
      return;
    }
    const nextIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextIndex);
    const nextStep = DEMO_STEPS[nextIndex];
    if (nextStep.scenarioTarget) {
      onSelectScenario(nextStep.scenarioTarget);
    }
    if (nextStep.pageTarget) {
      onNavigatePage(nextStep.pageTarget);
    }
  };

  const handlePrev = () => {
    if (isFirst) return;
    const prevIndex = currentStepIndex - 1;
    setCurrentStepIndex(prevIndex);
    const prevStep = DEMO_STEPS[prevIndex];
    if (prevStep.scenarioTarget) {
      onSelectScenario(prevStep.scenarioTarget);
    }
    if (prevStep.pageTarget) {
      onNavigatePage(prevStep.pageTarget);
    }
  };

  const jumpToStep = (index: number) => {
    setCurrentStepIndex(index);
    const step = DEMO_STEPS[index];
    if (step.scenarioTarget) {
      onSelectScenario(step.scenarioTarget);
    }
    if (step.pageTarget) {
      onNavigatePage(step.pageTarget);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#DFE5EC] shadow-2xl p-6 sm:p-8 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DFE5EC]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E4F7ED] text-[#16865D] border border-[#16865D]/30">
              Interactive Hackathon Demo
            </span>
            <span className="text-xs text-[#647386]">ADAPPT 5.0 FoodTech</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            aria-label="Close walkthrough"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-5 gap-2 my-5">
          {DEMO_STEPS.map((s, idx) => {
            const isActive = idx === currentStepIndex;
            const isCompleted = idx < currentStepIndex;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => jumpToStep(idx)}
                className={`py-2 px-1 text-center rounded-lg text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-[#16865D] text-[#FFFFFF] border-[#12523C] shadow-xs'
                    : isCompleted
                    ? 'bg-[#E4F7ED] text-[#12523C] border-[#16865D]'
                    : 'bg-[#F0F3F8] text-[#647386] border-[#DFE5EC] hover:bg-[#F5F7FA]'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Step {s.number}</span>
                  {isCompleted && <CheckCircle2 className="w-3 h-3 text-[#12523C]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Content Card */}
        <div className="bg-[#F5F7FA] border border-[#DFE5EC] rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#16865D] text-[#FFFFFF] flex items-center justify-center shadow-xs">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#16865D] uppercase tracking-wider">
                Step {currentStep.number} of 5
              </span>
              <h2 id="demo-title" className="text-lg font-bold text-[#17232E]">
                {currentStep.title}
              </h2>
            </div>
          </div>

          <p className="text-xs font-semibold text-[#087E8B] mb-2">{currentStep.tagline}</p>
          <p className="text-xs text-[#17232E] leading-relaxed mb-4">{currentStep.description}</p>

          {/* Key Metrics for this step */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#DFE5EC]">
            {currentStep.metrics.map((m) => (
              <div key={m.label} className="bg-[#FFFFFF] p-2.5 rounded-lg border border-[#DFE5EC]">
                <span className="block text-xs font-medium text-[#647386]">{m.label}</span>
                <span className="text-xs sm:text-sm font-bold text-[#17232E] tabular-nums">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={handlePrev}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
              isFirst
                ? 'text-[#DFE5EC] cursor-not-allowed'
                : 'text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8]'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] rounded-lg transition-colors"
            >
              Exit Tour
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#16865D] hover:bg-[#12523C] active:bg-[#12523C] rounded-lg shadow-sm transition-colors"
            >
              <span>{currentStep.actionLabel}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
