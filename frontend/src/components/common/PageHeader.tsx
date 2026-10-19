import React from 'react';
import { Calendar, Download, Users, CloudRain, ShieldAlert } from 'lucide-react';
import { ScenarioPreset } from '../TopBar';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  serviceDate?: string;
  period?: string;
  isSynthetic?: boolean;
  stageTag?: string;
  actions?: React.ReactNode;
  onOpenLimitations?: () => void;
  // Contextual controls
  scenarioPreset?: ScenarioPreset;
  onSelectScenario?: (scenario: ScenarioPreset) => void;
  onExport?: () => void;
  exportLabel?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  serviceDate = '27 Sep 2026',
  period = 'Lunch Shift',
  isSynthetic = true,
  stageTag,
  actions,
  onOpenLimitations,
  scenarioPreset,
  onSelectScenario,
  onExport,
  exportLabel = 'Export CSV',
}) => {
  return (
    <div className="mb-6 space-y-3">
      {/* Top Title & Primary Context Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-4 border-b border-[#DFE5EC] gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17232E]">
              {title}
            </h1>
            {stageTag && (
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-[#F0F3F8] text-[#17232E] border border-[#DFE5EC]">
                {stageTag}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#647386] mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Right Contextual Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 lg:self-end">
          {/* Service Date & Shift Badge */}
          {serviceDate && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg text-xs text-[#17232E]">
              <Calendar className="w-3.5 h-3.5 text-[#16865D]" />
              <span className="font-semibold">{serviceDate}</span>
              <span className="text-[#8A99A8]">·</span>
              <span className="text-[#647386] font-medium">{period}</span>
            </div>
          )}

          {/* Scenario Selector (When available for the view) */}
          {scenarioPreset && onSelectScenario && (
            <div className="flex items-center gap-1 bg-[#F0F3F8] p-1 rounded-lg border border-[#DFE5EC]">
              <button
                type="button"
                onClick={() => onSelectScenario('normal')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  scenarioPreset === 'normal'
                    ? 'bg-[#FFFFFF] text-[#16865D] border border-[#DFE5EC] shadow-xs'
                    : 'text-[#647386] hover:text-[#17232E]'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => onSelectScenario('event')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  scenarioPreset === 'event'
                    ? 'bg-[#4263D8] text-[#FFFFFF] shadow-xs'
                    : 'text-[#647386] hover:text-[#4263D8]'
                }`}
                title="Simulate technical fest or symposium footfall surge (+35%)"
              >
                <Users className="w-3 h-3" />
                <span>Event (+35%)</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectScenario('rainy')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  scenarioPreset === 'rainy'
                    ? 'bg-[#087E8B] text-[#FFFFFF] shadow-xs'
                    : 'text-[#647386] hover:text-[#087E8B]'
                }`}
                title="Simulate monsoon rainfall footfall dip (-20%)"
              >
                <CloudRain className="w-3 h-3" />
                <span>Rainy (-20%)</span>
              </button>
            </div>
          )}

          {/* Optional Local Export */}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#DFE5EC] bg-[#FFFFFF] text-[#16865D] hover:bg-[#E4F7ED] hover:border-[#16865D]/40 transition-colors shadow-xs"
              title="Export operational summary to CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#16865D]" />
              <span>{exportLabel}</span>
            </button>
          )}

          {/* Custom Action Elements */}
          {actions}
        </div>
      </div>

      {/* Discreet Provenance Banner */}
      <div className="px-3.5 py-2 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg text-xs font-medium text-[#17232E] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#47D7A0]" />
          <span>
            {isSynthetic
              ? 'Demonstration environment · 365-day synthetic cafeteria dataset'
              : 'Production environment · Operator telemetry'}
          </span>
        </div>
        {onOpenLimitations && (
          <button
            type="button"
            onClick={onOpenLimitations}
            className="text-xs font-semibold text-[#16865D] hover:underline"
          >
            Review data bounds & methodology
          </button>
        )}
      </div>
    </div>
  );
};
