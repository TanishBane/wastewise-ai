import React from 'react';
import {
  HelpCircle,
  Sparkles,
  Clock,
  ChefHat,
  TrendingUp,
  AlertTriangle,
  Keyboard,
  ArrowLeft,
  ChevronRight,
  Database,
} from 'lucide-react';
import { PageHeader } from '../components/common/PageHeader';
import { PageId } from '../components/Sidebar';

interface HelpCenterViewProps {
  onNavigate: (page: PageId) => void;
  onLaunchDemoTour: () => void;
  onOpenShortcuts: () => void;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  onNavigate,
  onLaunchDemoTour,
  onOpenShortcuts,
}) => {
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
        title="Help Center & Operator Playbook"
        subtitle="Quick-start instructions, operational workflow rhythms, and answers to common canteen management questions."
        stageTag="Assistance & Guides"
        actions={
          <button
            type="button"
            onClick={onLaunchDemoTour}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-gradient-to-r from-[#16865D] to-[#087E8B] hover:from-[#12523C] hover:to-[#087E8B] shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-[#47D7A0]" />
            <span>Start Interactive Tour</span>
          </button>
        }
      />

      {/* The 3 Core Questions Card */}
      <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#17232E]">
          The Operator Playbook: 3 Questions Answered in 30 Seconds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-[#F0F3F8] rounded-xl border border-[#DFE5EC] space-y-1.5">
            <div className="flex items-center gap-2 text-[#16865D] font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>1. Expected Demand</span>
            </div>
            <p className="text-xs text-[#647386]">
              Check <strong>Forecast Demand</strong> on Executive Overview. Random Forest predicts point estimates and 80% confidence bands across all dishes.
            </p>
          </div>

          <div className="p-3.5 bg-[#F0F3F8] rounded-xl border border-[#DFE5EC] space-y-1.5">
            <div className="flex items-center gap-2 text-[#4263D8] font-bold text-xs">
              <ChefHat className="w-4 h-4" />
              <span>2. Preparation Target</span>
            </div>
            <p className="text-xs text-[#647386]">
              Check <strong>Recommended Preparation</strong>. Start with the Initial Batch (80–85%); hold the Refill Buffer until mid-shift pace check.
            </p>
          </div>

          <div className="p-3.5 bg-[#F0F3F8] rounded-xl border border-[#DFE5EC] space-y-1.5">
            <div className="flex items-center gap-2 text-[#BF3F45] font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>3. Immediate Attention</span>
            </div>
            <p className="text-xs text-[#647386]">
              Check <strong>Prioritized Kitchen Decisions</strong> and <strong>Waste-Risk Triage</strong>. Pull back dishes with high potential surplus.
            </p>
          </div>
        </div>
      </div>

      {/* Shift Workflow Rhythm */}
      <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#087E8B]" />
          <h2 className="text-sm font-bold text-[#17232E]">Daily Kitchen Operational Rhythm</h2>
        </div>
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 p-3 bg-[#F5F7FA] rounded-lg border border-[#DFE5EC]">
            <span className="font-mono font-bold text-xs text-[#16865D] bg-[#E4F7ED] px-2 py-0.5 rounded shrink-0">
              06:30 AM
            </span>
            <div>
              <span className="font-bold text-xs text-[#17232E] block">Shift Dispatch & Initial Cook</span>
              <p className="text-xs text-[#647386] mt-0.5">
                Head chef opens Executive Overview. Review attendance index (e.g. 0.40 on weekends or +35% during campus fests). Approve batch cooking plans and dispatch initial batch quantities to prep stations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#F5F7FA] rounded-lg border border-[#DFE5EC]">
            <span className="font-mono font-bold text-xs text-[#4263D8] bg-[#EAF0FF] px-2 py-0.5 rounded shrink-0">
              01:15 PM
            </span>
            <div>
              <span className="font-bold text-xs text-[#17232E] block">Mid-Service Refill Check</span>
              <p className="text-xs text-[#647386] mt-0.5">
                Kitchen supervisor checks remaining food on display. If stock falls below the dynamic refill threshold (e.g. 15 portions), cook the secondary batch. Otherwise, avoid unnecessary last-hour cooking.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#F5F7FA] rounded-lg border border-[#DFE5EC]">
            <span className="font-mono font-bold text-xs text-[#7656D6] bg-[#F0EBFF] px-2 py-0.5 rounded shrink-0">
              03:00 PM
            </span>
            <div>
              <span className="font-bold text-xs text-[#17232E] block">Post-Shift Audit & Triage</span>
              <p className="text-xs text-[#647386] mt-0.5">
                Service concludes. Log unsold safety buffer portions in Waste-Risk Monitoring. Dispatch safe surplus to campus partner distribution. Telemetry syncs into holdout verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="p-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#17232E]">Frequently Asked Questions</h2>
        <div className="space-y-2 pt-1 text-xs">
          <details className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DFE5EC] group">
            <summary className="font-bold text-[#17232E] cursor-pointer list-none flex items-center justify-between">
              <span>What happens when I toggle the &quot;Campus Event (+35%)&quot; scenario?</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386] group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-[#647386] mt-2 pt-2 border-t border-[#DFE5EC] leading-relaxed">
              Toggling Campus Event simulates an unexpected footfall surge (technical symposium, cultural festival, or sports meet). The model immediately recalibrates demand projections and increases initial cooking targets across all dishes to prevent stockouts.
            </p>
          </details>

          <details className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DFE5EC] group">
            <summary className="font-bold text-[#17232E] cursor-pointer list-none flex items-center justify-between">
              <span>Can I upload our own canteen POS and kitchen logs?</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386] group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-[#647386] mt-2 pt-2 border-t border-[#DFE5EC] leading-relaxed">
              Yes. Navigate to <strong>Data & Model Governance</strong>. Download the sample CSV schema, format your historical logs, and drop your file into the upload zone. The backend validates columns and retrains the model on your records.
            </p>
          </details>

          <details className="p-3 bg-[#F5F7FA] rounded-lg border border-[#DFE5EC] group">
            <summary className="font-bold text-[#17232E] cursor-pointer list-none flex items-center justify-between">
              <span>How are &quot;Cost at Risk&quot; numbers calculated?</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#647386] group-open:rotate-90 transition-transform" />
            </summary>
            <p className="text-[#647386] mt-2 pt-2 border-t border-[#DFE5EC] leading-relaxed">
              Cost at Risk multiplies the potential surplus portions by the raw ingredient cost per portion for that dish. For example, 3 surplus Veg Thali portions at ₹65 raw cost equals ₹195 at risk under unoptimized prep.
            </p>
          </details>
        </div>
      </div>

      {/* Keyboard Shortcuts Trigger Bar */}
      <div className="p-4 bg-[#F0F3F8] border border-[#DFE5EC] rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#17232E] font-medium">
          <Keyboard className="w-4 h-4 text-[#7656D6]" />
          <span>Prefer using your keyboard? Press <kbd className="font-mono bg-white border border-[#DFE5EC] px-1 py-0.5 rounded text-[12px] font-bold">?</kbd> anywhere to view hotkeys.</span>
        </div>
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="text-xs font-semibold text-[#16865D] hover:underline"
        >
          View Hotkeys
        </button>
      </div>
    </div>
  );
};
