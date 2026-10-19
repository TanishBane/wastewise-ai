import React, { useState } from 'react';
import { Check, Sliders, ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Sparkles, TrendingUp, Info } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatINR, formatNumber } from '../../utils/formatters';
import { tokens } from '../../tokens';

export interface AlertDriver {
  name: string;
  pct: number;
}

interface AlertDecisionCardProps {
  dishName: string;
  category: string;
  riskLevel: 'High' | 'Moderate' | 'Low';
  forecastDemand: number;
  plannedPrep: number;
  costAtRisk: number;
  potentialSurplus: number;
  actionText: string;
  isApproved?: boolean;
  override?: { quantity: number; reason: string } | null;
  onApprove: (dishName: string) => void;
  onOpenOverride: (dishName: string) => void;
  drivers?: AlertDriver[];
}

const DEFAULT_REAL_DRIVERS: AlertDriver[] = [
  { name: 'Campus Footfall', pct: 67.0 },
  { name: 'Historical Baseline', pct: 27.4 },
  { name: 'Weather & Temp', pct: 3.3 },
  { name: 'Day of Week', pct: 2.3 },
];

export const AlertDecisionCard: React.FC<AlertDecisionCardProps> = ({
  dishName,
  category,
  riskLevel,
  forecastDemand,
  plannedPrep,
  costAtRisk,
  potentialSurplus,
  actionText,
  isApproved = false,
  override = null,
  onApprove,
  onOpenOverride,
  drivers = DEFAULT_REAL_DRIVERS,
}) => {
  const [showDrivers, setShowDrivers] = useState(false);

  // Border & Accent styling based on refined risk levels
  const borderClass =
    riskLevel === 'High'
      ? 'border-[#E96B63] hover:border-[#BF3F45]'
      : riskLevel === 'Moderate'
      ? 'border-[#E7A32D] hover:border-[#F28C45]'
      : 'border-[#DFE5EC] hover:border-[#16865D]';

  const riskLabel =
    riskLevel === 'High'
      ? 'High Surplus Risk'
      : riskLevel === 'Moderate'
      ? 'Moderate Exposure'
      : 'Optimal Plan';

  const riskType =
    riskLevel === 'High' ? 'high' : riskLevel === 'Moderate' ? 'moderate' : 'low';

  const effectivePrep = override ? override.quantity : plannedPrep;

  return (
    <div
      className={`bg-[#FFFFFF] rounded-xl border ${borderClass} p-5 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between`}
    >
      {/* Top Meta: Category + Dish Name + Risk Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#17232E] bg-[#F0F3F8] border border-[#DFE5EC] px-2 py-0.5 rounded-sm">
                {category}
              </span>
              {override && (
                <span className="text-[12px] font-semibold text-[#92400E] bg-[#FFF3D9] border border-[#E7A32D] px-2 py-0.5 rounded-sm flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#E7A32D]" />
                  <span>Session Override</span>
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-[#17232E] leading-snug">{dishName}</h3>
          </div>
          <StatusBadge status={riskType} label={riskLabel} size="sm" />
        </div>

        {/* Quantities & Financial Impact Matrix */}
        <div className="grid grid-cols-3 gap-2 my-3 p-3 bg-[#F0F3F8] rounded-lg border border-[#DFE5EC]">
          <div>
            <span className="block text-[12px] font-semibold text-[#647386]">Forecast Demand</span>
            <span className="text-base font-bold text-[#17232E] tabular-nums">
              {formatNumber(forecastDemand)}
              <span className="text-xs font-normal text-[#647386] ml-0.5">portions</span>
            </span>
          </div>
          <div>
            <span className="block text-[12px] font-semibold text-[#647386]">Planned Prep</span>
            <span
              className={`text-base font-bold tabular-nums ${
                override ? 'text-[#92400E]' : 'text-[#16865D]'
              }`}
            >
              {formatNumber(effectivePrep)}
              <span className="text-xs font-normal text-[#647386] ml-0.5">portions</span>
            </span>
          </div>
          <div>
            <span className="block text-[12px] font-semibold text-[#647386]">Cost at Risk</span>
            <span className="text-base font-bold text-[#BF3F45] tabular-nums">
              {formatINR(costAtRisk)}
            </span>
          </div>
        </div>

        {/* Action Guidance in Refined Blue Tint */}
        <div className="text-[12px] text-[#17232E] bg-[#EAF0FF] p-2.5 rounded-lg border border-[#5585F7]/30 flex items-start gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#4263D8] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#17232E]">Action: </strong>
            <span>{actionText}</span>
          </div>
        </div>

        {/* Overridden state banner if present (Amber) */}
        {override && (
          <div className="mb-3 p-2 bg-[#FFF3D9] border border-[#E7A32D]/40 rounded-md text-[12px] text-[#92400E]">
            <p className="font-semibold">Session-only kitchen override: {override.quantity} portions</p>
            <p className="text-[12px] text-[#92400E]/90 mt-0.5">Reason: {override.reason}</p>
          </div>
        )}

        {/* Model Explainability Accordion in Vibrant Teal */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowDrivers(!showDrivers)}
            className="flex items-center justify-between w-full text-[12px] font-semibold text-[#647386] hover:text-[#17232E] py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#087E8B]" />
              <span>Model Drivers (Random Forest Feature Weight)</span>
            </span>
            {showDrivers ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDrivers && (
            <div className="mt-2 pt-2 border-t border-[#DFE5EC] space-y-1.5 animate-fade-in">
              {drivers.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-[#647386]">{d.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-[#DFE5EC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#16865D] to-[#13B8A6] rounded-full"
                        style={{ width: `${Math.min(100, d.pct)}%` }}
                      />
                    </div>
                    <span className="font-semibold text-[#17232E] tabular-nums w-10 text-right">
                      {d.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-[#DFE5EC]">
        <button
          type="button"
          onClick={() => onApprove(dishName)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-bold transition-all ${
            isApproved
              ? 'bg-[#E4F7ED] text-[#12523C] border border-[#47D7A0]'
              : 'bg-[#16865D] hover:bg-[#12523C] active:bg-[#12523C] text-[#FFFFFF] shadow-xs'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{isApproved ? 'Approved by Chef' : 'Approve Plan'}</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenOverride(dishName)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-[12px] font-semibold text-[#17232E] bg-[#F0F3F8] hover:bg-[#DFE5EC] border border-[#DFE5EC] transition-colors"
          title="Adjust portion count for current session"
        >
          <Sliders className="w-3.5 h-3.5 text-[#647386]" />
          <span>Adjust</span>
        </button>
      </div>
    </div>
  );
};
