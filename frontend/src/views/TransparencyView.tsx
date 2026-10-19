import React from 'react';
import { Database, TrendingUp, Sliders, Award, AlertTriangle, ArrowLeft, CheckCircle2, Info } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { PageId } from '../components/Sidebar';

interface TransparencyViewProps {
  onNavigate: (page: PageId) => void;
  onOpenLimitations?: () => void;
}

export const TransparencyView: React.FC<TransparencyViewProps> = ({ onNavigate, onOpenLimitations }) => {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16865D] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Overview</span>
        </button>
      </div>

      <PageHeader
        title="AI & Data Transparency Dossier"
        subtitle="Mathematical models, out-of-time holdout validation methodology, and synthetic simulation boundaries for ADAPPT 5.0."
        stageTag="Governance & Audit"
        actions={
          onOpenLimitations && (
            <button
              type="button"
              onClick={onOpenLimitations}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#E4F7ED] text-[#12523C] border border-[#16865D]/40 hover:bg-[#16865D] hover:text-white transition-colors"
            >
              <Info className="w-4 h-4" />
              <span>Open Evaluation Modal</span>
            </button>
          )
        }
      />

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs">
          <span className="text-xs font-bold text-[#16865D] uppercase tracking-wider block">Model Architecture</span>
          <span className="text-lg font-bold text-[#17232E] mt-1 block">Random Forest</span>
          <span className="text-xs text-[#647386]">100 estimators · Depth 8 · Seed 42</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs">
          <span className="text-xs font-bold text-[#4263D8] uppercase tracking-wider block">Holdout WAPE</span>
          <span className="text-lg font-bold text-[#17232E] mt-1 block">8.4%</span>
          <span className="text-xs text-[#647386]">vs 10.8% rolling weekday baseline</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs">
          <span className="text-xs font-bold text-[#7656D6] uppercase tracking-wider block">Holdout MAE</span>
          <span className="text-lg font-bold text-[#17232E] mt-1 block">4.76 portions</span>
          <span className="text-xs text-[#647386]">Unobserved 60-day test set</span>
        </div>

        <div className="p-4 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs">
          <span className="text-xs font-bold text-[#E7A32D] uppercase tracking-wider block">Optimization</span>
          <span className="text-lg font-bold text-[#17232E] mt-1 block">Newsvendor</span>
          <span className="text-xs text-[#647386]">Cost-asymmetric loss balance</span>
        </div>
      </div>

      {/* Detailed Technical Sections */}
      <div className="space-y-5 text-xs text-[#17232E] leading-relaxed">
        {/* Section 1: Synthetic Telemetry */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Database className="w-4 h-4 text-[#16865D]" />
            <h2>1. Synthetic Data Generation Architecture</h2>
          </div>
          <p className="text-[#647386]">
            The 365-day dataset (2025-09-28 to 2026-09-27) covers 1,440 operational cafeteria records across 8 core canteen dishes:
            Chicken Biryani, Paneer Butter Masala, Veg Fried Rice, Dal Tadka, Samosa, Masala Dosa, Chole Bhature, and Gulab Jamun.
          </p>
          <p className="text-[#647386]">
            Data synthesis models realistic campus phenomena:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#647386]">
            <li><strong>Temporal Factors:</strong> Day of week effects (Monday recovery, Friday spikes, Sunday dips with footfall factor 0.40–0.70).</li>
            <li><strong>Academic Shock Events:</strong> University technical symposiums (+35% footfall), semester exams (-30% lunch attendance).</li>
            <li><strong>Meteorological telemetry:</strong> Monsoonal rain (-20% footfall on hot foods, +15% on deep-fried snacks like samosas).</li>
          </ul>
        </div>

        {/* Section 2: Model & Loss Formulation */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <TrendingUp className="w-4 h-4 text-[#087E8B]" />
            <h2>2. Demand Inference & Cost-Asymmetric Newsvendor Formulation</h2>
          </div>
          <p className="text-[#647386]">
            Standard machine learning models optimize Mean Squared Error (MSE), which treats overproduction and stockouts as equally costly. 
            In cafeteria operations, overproduction causes physical food spoilage (raw ingredient cost loss), whereas stockouts cause diner dissatisfaction and uncaptured margin.
          </p>
          <div className="p-3.5 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg font-mono text-xs text-[#17232E] space-y-1">
            <div>Critical Ratio Formula:</div>
            <div className="text-[#16865D] font-bold">CR = C_u / (C_u + C_o)</div>
            <div className="text-[12px] text-[#647386]">Where C_u = Underage Cost (Selling Price - Raw Cost)</div>
            <div className="text-[12px] text-[#647386]">Where C_o = Overage Cost (Raw Ingredient Cost Per Portion)</div>
          </div>
          <p className="text-[#647386]">
            Using empirical quantiles from the Random Forest ensemble, the Preparation Planner sizes the batch such that the cumulative probability equals the Critical Ratio, minimizing expected financial and waste regret.
          </p>
        </div>

        {/* Section 3: Validation Methodology */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Award className="w-4 h-4 text-[#4263D8]" />
            <h2>3. Out-of-Time Chronological Validation Split</h2>
          </div>
          <p className="text-[#647386]">
            To prevent data leakage, training is strictly split chronologically:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[#647386]">
            <li><strong>Training Split (305 days):</strong> 2025-09-28 through 2026-07-28 (1,160 records).</li>
            <li><strong>Holdout Evaluation Split (60 days):</strong> 2026-07-29 through 2026-09-27 (280 records, completely unseen during training).</li>
            <li><strong>Rolling Weekday Baseline:</strong> A 7-day rolling average for the corresponding day of week, representing standard intuitive kitchen prep habit.</li>
          </ul>
        </div>

        {/* Section 4: Metrics Definitions */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <CheckCircle2 className="w-4 h-4 text-[#7656D6]" />
            <h2>4. Mathematical Definitions of Reported Metrics</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
              <span className="font-bold text-[#17232E] block">WAPE (Weighted Absolute Percentage Error)</span>
              <p className="text-[#647386] mt-1">Sum of absolute errors divided by total actual demand. Robust against low-volume distortion.</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
              <span className="font-bold text-[#17232E] block">MAE (Mean Absolute Error)</span>
              <p className="text-[#647386] mt-1">Average absolute difference between predicted and actual customer portions.</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
              <span className="font-bold text-[#17232E] block">Initial Batch vs. Refill Buffer</span>
              <p className="text-[#647386] mt-1">Staggered batching: cook 80–85% before shift start; hold balance until mid-service headcount check.</p>
            </div>
            <div className="p-3 bg-[#F5F7FA] border border-[#DFE5EC] rounded-lg">
              <span className="font-bold text-[#17232E] block">Simulated Savings (₹48,324)</span>
              <p className="text-[#647386] mt-1">Projected counterfactual avoided ingredient loss across the holdout period vs unbuffered baseline.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
