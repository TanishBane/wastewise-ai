import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Sparkles, Calendar, Info } from 'lucide-react';

export type BadgeStatus =
  | 'high'
  | 'moderate'
  | 'low'
  | 'model'
  | 'baseline'
  | 'info'
  | 'danger'
  | 'warning'
  | 'success'
  | 'optimal'
  | 'buffer'
  | 'avoided';

interface StatusBadgeProps {
  status?: BadgeStatus;
  type?: BadgeStatus;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type,
  label,
  size = 'md',
  className = '',
}) => {
  const effectiveStatus = (status || type || 'info').toLowerCase() as BadgeStatus;

  const configs: Record<
    string,
    { defaultLabel: string; icon: any; styles: string; iconColor: string }
  > = {
    // High / Urgent (Coral & Deep Red)
    high: {
      defaultLabel: 'High Risk',
      icon: ShieldAlert,
      styles: 'bg-[#FDE9E7] text-[#BF3F45] border-[#E96B63]/40',
      iconColor: 'text-[#BF3F45]',
    },
    danger: {
      defaultLabel: 'High Risk',
      icon: ShieldAlert,
      styles: 'bg-[#FDE9E7] text-[#BF3F45] border-[#E96B63]/40',
      iconColor: 'text-[#BF3F45]',
    },

    // Moderate Exposure (Amber)
    moderate: {
      defaultLabel: 'Moderate Exposure',
      icon: AlertTriangle,
      styles: 'bg-[#FFF3D9] text-[#92400E] border-[#E7A32D]/40',
      iconColor: 'text-[#E7A32D]',
    },
    warning: {
      defaultLabel: 'Moderate Exposure',
      icon: AlertTriangle,
      styles: 'bg-[#FFF3D9] text-[#92400E] border-[#E7A32D]/40',
      iconColor: 'text-[#E7A32D]',
    },

    // Low / Optimal (Emerald)
    low: {
      defaultLabel: 'Low Risk',
      icon: CheckCircle2,
      styles: 'bg-[#E4F7ED] text-[#12523C] border-[#47D7A0]/40',
      iconColor: 'text-[#16865D]',
    },
    success: {
      defaultLabel: 'Optimal Plan',
      icon: CheckCircle2,
      styles: 'bg-[#E4F7ED] text-[#12523C] border-[#47D7A0]/40',
      iconColor: 'text-[#16865D]',
    },

    // Optimal Plan (Royal Blue)
    optimal: {
      defaultLabel: 'Optimal Target',
      icon: CheckCircle2,
      styles: 'bg-[#EAF0FF] text-[#4263D8] border-[#5585F7]/40',
      iconColor: 'text-[#4263D8]',
    },

    // Safety Buffer (Premium Violet)
    buffer: {
      defaultLabel: 'Safety Buffer',
      icon: Sparkles,
      styles: 'bg-[#F0EBFF] text-[#7656D6] border-[#A78BFA]/40',
      iconColor: 'text-[#7656D6]',
    },

    // Model Attribution (Emerald & Mint)
    model: {
      defaultLabel: 'Random Forest',
      icon: Sparkles,
      styles: 'bg-[#E4F7ED] text-[#12523C] border-[#47D7A0]/40',
      iconColor: 'text-[#16865D]',
    },

    // Weekday Baseline (Neutral Slate)
    baseline: {
      defaultLabel: 'Weekday Baseline',
      icon: Calendar,
      styles: 'bg-[#F0F3F8] text-[#17232E] border-[#DFE5EC]',
      iconColor: 'text-[#647386]',
    },

    // Informational / Monitored (Deep Teal)
    info: {
      defaultLabel: 'Monitored',
      icon: Info,
      styles: 'bg-[#DDF5F7] text-[#087E8B] border-[#13B8A6]/40',
      iconColor: 'text-[#087E8B]',
    },
  };

  const config = configs[effectiveStatus] || configs.info;
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[12px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md border ${config.styles} ${sizeClasses} ${className}`}
      role="status"
    >
      <Icon
        className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${config.iconColor} shrink-0`}
        strokeWidth={2.4}
        aria-hidden="true"
      />
      <span>{displayLabel}</span>
    </span>
  );
};
