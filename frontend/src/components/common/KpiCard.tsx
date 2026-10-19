import React, { useState, useEffect } from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

export type KpiAccentColor = 'emerald' | 'blue' | 'violet' | 'amber' | 'coral' | 'teal';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  meta?: string;
  pillText?: string;
  pillVariant?: 'mint' | 'neutral' | 'amber' | 'red' | 'info' | 'blue' | 'violet' | 'teal';
  accentColor?: KpiAccentColor;
  delta?: {
    value: string | number;
    label?: string;
    type?: 'positive' | 'negative' | 'neutral';
  };
  sparklineData?: number[];
  sparklineColor?: string;
  definitionTooltip?: string;
  tooltip?: string;
  isSynthetic?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  meta,
  pillText,
  pillVariant = 'neutral',
  accentColor,
  delta,
  sparklineData,
  sparklineColor,
  definitionTooltip,
  tooltip,
  isSynthetic = true,
}) => {
  const effectiveTooltip = tooltip || definitionTooltip;
  const shouldReduceMotion = useReducedMotion();
  const [showTooltip, setShowTooltip] = useState(false);

  // Animated numeral count-up effect
  const isNumeric = typeof value === 'number';
  const [displayNum, setDisplayNum] = useState<number>(() => (isNumeric && !shouldReduceMotion ? 0 : Number(value) || 0));

  useEffect(() => {
    if (!isNumeric || shouldReduceMotion) {
      return;
    }
    const target = Number(value);
    let start = 0;
    const duration = 500; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(start + (target - start) * (1 - Math.pow(2, -10 * progress)));
      setDisplayNum(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayNum(target);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [value, isNumeric, shouldReduceMotion]);

  // Coordinated pill styles
  const pillStyles = {
    mint: 'bg-[#E4F7ED] text-[#12523C] border-[#47D7A0]/40',
    blue: 'bg-[#EAF0FF] text-[#4263D8] border-[#5585F7]/40',
    violet: 'bg-[#F0EBFF] text-[#7656D6] border-[#A78BFA]/40',
    amber: 'bg-[#FFF3D9] text-[#92400E] border-[#E7A32D]/40',
    red: 'bg-[#FDE9E7] text-[#BF3F45] border-[#E96B63]/40',
    teal: 'bg-[#DDF5F7] text-[#087E8B] border-[#13B8A6]/40',
    neutral: 'bg-[#F0F3F8] text-[#17232E] border-[#DFE5EC]',
    info: 'bg-[#EAF0FF] text-[#4263D8] border-[#5585F7]/40',
  };

  // Coordinated top border accents
  const topBorderClasses: Record<KpiAccentColor, string> = {
    emerald: 'border-t-2 border-t-[#16865D]',
    blue: 'border-t-2 border-t-[#4263D8]',
    violet: 'border-t-2 border-t-[#7656D6]',
    amber: 'border-t-2 border-t-[#E7A32D]',
    coral: 'border-t-2 border-t-[#E96B63]',
    teal: 'border-t-2 border-t-[#087E8B]',
  };

  // Determine effective sparkline color
  const resolveSparklineColor = (): string => {
    if (sparklineColor) return sparklineColor;
    if (accentColor === 'blue' || pillVariant === 'blue' || pillVariant === 'info') return '#4263D8';
    if (accentColor === 'violet' || pillVariant === 'violet') return '#7656D6';
    if (accentColor === 'amber' || pillVariant === 'amber') return '#E7A32D';
    if (accentColor === 'coral' || pillVariant === 'red') return '#E96B63';
    if (accentColor === 'teal' || pillVariant === 'teal') return '#087E8B';
    return '#16865D'; // Emerald
  };

  const effectiveSparklineColor = resolveSparklineColor();
  const effectiveTopBorder = accentColor ? topBorderClasses[accentColor] : '';

  // Mini sparkline SVG renderer
  const renderSparkline = (data: number[]) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 64;
    const height = 22;

    const points = data
      .map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d - min) / range) * (height - 6) - 3;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
        <polyline
          fill="none"
          stroke={effectiveSparklineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div
      className={`bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-4 flex flex-col justify-between shadow-xs transition-all hover:border-[#CAD6CE] hover:shadow-sm relative ${effectiveTopBorder}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-bold tracking-wider text-[#647386] uppercase truncate">
            {label}
          </span>

          {/* Metric Definition Tooltip */}
          {effectiveTooltip && (
            <div className="relative inline-flex items-center">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="p-0.5 text-[#647386] hover:text-[#17232E] rounded focus-visible:ring-1 focus-visible:ring-[#16865D]"
                aria-label={`Definition of ${label}`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div
                  role="tooltip"
                  className="absolute left-0 bottom-full mb-1.5 z-40 w-56 p-2.5 bg-[#172B3D] text-[#FFFFFF] text-[12px] leading-relaxed rounded-lg shadow-lg pointer-events-none animate-in fade-in duration-150 border border-[#087E8B]/40"
                >
                  <p>{effectiveTooltip}</p>
                  <div className="absolute top-full left-2 -mt-1 border-4 border-transparent border-t-[#172B3D]" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Provenance Chip */}
          {isSynthetic && (
            <span
              className="text-[12px] font-medium px-1.5 py-0.5 rounded-md bg-[#F0F3F8] text-[#647386] border border-[#DFE5EC]"
              title="Metric computed from synthetic demonstration telemetry"
            >
              Synthetic
            </span>
          )}

          {/* Context Badge */}
          {pillText && (
            <span
              className={`text-[12px] font-bold px-2 py-0.5 rounded-md border uppercase shrink-0 ${pillStyles[pillVariant]}`}
            >
              {pillText}
            </span>
          )}
        </div>
      </div>

      {/* Main Value Display */}
      <div className="flex items-baseline justify-between gap-2 my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-extrabold tracking-tight text-[#17232E] tabular-nums">
            {isNumeric ? displayNum.toLocaleString('en-IN') : value}
          </span>
          {unit && (
            <span className="text-xs font-semibold text-[#647386]">{unit}</span>
          )}
        </div>

        {/* Optional Mini Sparkline with Coordinated Color */}
        {sparklineData && sparklineData.length > 1 && (
          <div className="shrink-0">{renderSparkline(sparklineData)}</div>
        )}
      </div>

      {/* Delta & Meta Footer Row */}
      <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#F0F3F8] text-[12px]">
        {meta ? (
          <span className="text-[#647386] truncate font-medium">{meta}</span>
        ) : (
          <span />
        )}

        {delta && (
          <div
            className={`inline-flex items-center gap-0.5 font-bold shrink-0 ${
              delta.type === 'positive'
                ? 'text-[#12523C]'
                : delta.type === 'negative'
                ? 'text-[#BF3F45]'
                : 'text-[#647386]'
            }`}
          >
            {delta.type === 'positive' ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : delta.type === 'negative' ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
            <span className="tabular-nums">{delta.value}</span>
            {delta.label && <span className="font-normal text-[#647386] ml-0.5">{delta.label}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
