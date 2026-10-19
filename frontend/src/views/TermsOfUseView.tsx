import React from 'react';
import { Scale, FileText, AlertTriangle, ChefHat, CheckSquare, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { PageId } from '../components/Sidebar';

interface TermsOfUseViewProps {
  onNavigate: (page: PageId) => void;
}

export const TermsOfUseView: React.FC<TermsOfUseViewProps> = ({ onNavigate }) => {
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
        title="Terms of Use & Operational Advisory"
        subtitle="Operational scope, decision-support boundaries, and human-in-the-loop responsibilities for canteen managers using WasteWise AI."
        stageTag="Legal & Trust"
      />

      {/* Advisory Banner */}
      <div className="p-4 bg-[#FFF3D9] border border-[#E7A32D] rounded-xl text-xs text-[#92400E] flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 text-[#E7A32D] mt-0.5" />
        <div>
          <span className="font-bold block">Prototype Evaluation Advisory</span>
          <p className="mt-0.5 leading-relaxed">
            WasteWise AI is provided as a hackathon decision-support prototype developed for <strong>ADAPPT 5.0 — AI in FoodTech</strong>. 
            These terms define the scope of software assistance. Kitchen supervisors and culinary teams maintain primary authority and liability over food preparation, purchasing, and sanitation.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-5 text-xs text-[#17232E] leading-relaxed">
        {/* Section 1 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <ChefHat className="w-4 h-4 text-[#16865D]" />
            <h2>1. Decision-Support Role & Human Oversight</h2>
          </div>
          <p className="text-[#647386]">
            WasteWise AI operates strictly as an assistive operational tool. It does not replace executive head chefs, kitchen managers, or inventory supervisors. 
            All batch recommendations (including initial cooking volumes, replenishment triggers, and buffer allocations) are mathematical suggestions derived from statistical modeling. Operators must review and approve all cooking schedules before physical kitchen dispatch.
          </p>
        </div>

        {/* Section 2 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <Scale className="w-4 h-4 text-[#087E8B]" />
            <h2>2. Statistical Forecasts are Estimates</h2>
          </div>
          <p className="text-[#647386]">
            Demand projections (e.g., 161 lunch portions with an 80% empirical interval of 146–175) are probabilistic estimates based on historical patterns, academic calendar indices, and morning weather telemetry. Unexpected real-world factors—such as unscheduled campus closures, flash rainfall, or sudden timetable shifts—can cause realized demand to diverge from statistical expectations. The system provides an instant session override control specifically for operator adjustments.
          </p>
        </div>

        {/* Section 3 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <AlertTriangle className="w-4 h-4 text-[#BF3F45]" />
            <h2>3. Non-Biological Food Safety Boundary (HACCP)</h2>
          </div>
          <p className="text-[#647386]">
            WasteWise AI does <strong>not</strong> monitor or certify biological food safety, cold-chain temperature thresholds, bacterial pathogen presence, or allergen cross-contamination. 
            Canteen teams must comply with institutional Hazard Analysis Critical Control Point (HACCP) protocols, municipal public health guidelines, and culinary shelf-life limits regardless of algorithmic suggestions.
          </p>
        </div>

        {/* Section 4 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <CheckSquare className="w-4 h-4 text-[#4263D8]" />
            <h2>4. Counterfactual Savings & Metric Transparency</h2>
          </div>
          <p className="text-[#647386]">
            Reported performance metrics (such as ₹48,324 in projected financial savings and surplus portion reductions) are counterfactual simulated estimates benchmarked against a 7-day rolling weekday baseline. They represent prospective computational savings on synthetic cafeteria records, not auditable financial returns or bank-verified revenues.
          </p>
        </div>

        {/* Section 5 */}
        <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-[#17232E]">
            <FileText className="w-4 h-4 text-[#7656D6]" />
            <h2>5. Disclaimer of Warranties</h2>
          </div>
          <p className="text-[#647386]">
            This software is provided &quot;as is&quot; for hackathon demonstration and academic evaluation. The development team disclaims all implied warranties of merchantability, fitness for a particular commercial purpose, or continuous operational availability.
          </p>
        </div>
      </div>
    </div>
  );
};
