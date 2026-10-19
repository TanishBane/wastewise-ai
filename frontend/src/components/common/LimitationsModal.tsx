import React from 'react';
import { X, ShieldAlert, Database, Scale, ThermometerSnowflake, FileText, CheckCircle2 } from 'lucide-react';

interface LimitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LimitationsModal: React.FC<LimitationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="limitations-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FFFFFF] rounded-xl border border-[#DFE5EC] shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#DFE5EC]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E4F7ED] text-[#16865D] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="limitations-title" className="text-base font-bold text-[#17232E]">
                Model Limitations & Scientific Transparency
              </h2>
              <p className="text-xs text-[#647386]">ADAPPT 5.0 — AI in FoodTech Evaluation Dossier</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#647386] hover:text-[#17232E] hover:bg-[#F0F3F8] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs text-[#17232E] leading-relaxed">
          {/* Card 1: Synthetic Data Disclosure */}
          <div className="p-4 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
            <div className="flex items-center gap-2 font-bold text-[#17232E] text-sm mb-1.5">
              <Database className="w-4 h-4 text-[#16865D]" />
              <span>1. Synthetic Data & Simulation Boundaries</span>
            </div>
            <p className="text-[#647386]">
              All operational records across the 365-day dataset (2025-09-28 through 2026-09-27) are synthetically generated
              using realistic culinary physics, seasonal weather patterns, academic event schedules, and cost matrices.
              Reported financial savings (e.g., ₹48,324) and surplus portion reductions are simulated counterfactual projections,
              not measured live commercial kitchen telemetry.
            </p>
          </div>

          {/* Card 2: Campus Footfall / Attendance Index */}
          <div className="p-4 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
            <div className="flex items-center gap-2 font-bold text-[#17232E] text-sm mb-1.5">
              <Scale className="w-4 h-4 text-[#087E8B]" />
              <span>2. Demand Forecasting vs. Realized Headcount</span>
            </div>
            <p className="text-[#647386]">
              The Random Forest model predicts dish portions using an estimated morning Campus Footfall Index (baseline 1.0 on weekdays,
              0.40–0.70 on weekends, +35% during campus fests, +15% during exam blocks). At 6:30 AM production release, footfall is an
              informed estimate. Intra-day attendance shocks (such as unexpected flash rainfall or flash strikes) require kitchen operator
              oversight via the session override control.
            </p>
          </div>

          {/* Card 3: Food Safety & HACCP Disclaimer */}
          <div className="p-4 bg-[#FDE9E7] border border-[#E96B63] rounded-lg text-[#BF3F45]">
            <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
              <ThermometerSnowflake className="w-4 h-4 text-[#BF3F45]" />
              <span>3. Non-Biological Food Safety Boundary</span>
            </div>
            <p className="text-[#BF3F45]/90">
              WasteWise AI provides mathematical optimization for batch production sizing and inventory exposure. It does
              <strong> not </strong> certify biological HACCP microbial safety, cold-chain temperature compliance, or organoleptic quality.
              Standard culinary hygiene protocols and local food health regulations must always take precedence over software recommendations.
            </p>
          </div>

          {/* Card 4: Algorithmic Verification & Holdout Methodology */}
          <div className="p-4 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
            <div className="flex items-center gap-2 font-bold text-[#17232E] text-sm mb-1.5">
              <FileText className="w-4 h-4 text-[#4263D8]" />
              <span>4. Validation & Holdout Split Integrity</span>
            </div>
            <p className="text-[#647386]">
              Performance metrics (8.4% WAPE, 4.76 portion MAE) are calculated strictly on an unobserved 60-day out-of-time holdout
              split (2026-07-29 to 2026-09-27) against an unoptimized 7-day rolling weekday baseline (10.8% WAPE). No holdout samples
              are leaked into training sets.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-[#DFE5EC]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#16865D] hover:bg-[#12523C] rounded-lg transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
