import React, { useEffect, useState } from 'react';
import { AlertTriangle, Filter, ShieldAlert, CheckCircle2, Clock, Sparkles, AlertCircle } from 'lucide-react';
import { fetchWasteRisks } from '../api';
import { WasteRiskResponse, WasteRiskItem } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataTable, Column } from '../components/common/DataTable';
import { SkeletonKpiGrid, SkeletonTable } from '../components/common/SkeletonLoader';
import { formatINR, formatNumber } from '../utils/formatters';
import { tokens } from '../tokens';

interface WasteRiskMonitoringViewProps {
  onOpenLimitations?: () => void;
  scenarioPreset?: 'normal' | 'event' | 'rainy';
  onSelectScenario?: (scenario: 'normal' | 'event' | 'rainy') => void;
}

export const WasteRiskMonitoringView: React.FC<WasteRiskMonitoringViewProps> = ({
  onOpenLimitations,
  scenarioPreset = 'normal',
  onSelectScenario,
}) => {
  const [data, setData] = useState<WasteRiskResponse | null>(null);
  const [filterTier, setFilterTier] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterTier, scenarioPreset]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWasteRisks(filterTier);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<WasteRiskItem>[] = [
    {
      header: 'Menu Item',
      accessorKey: 'menu_item',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-bold text-[#17232E] text-xs">{item.menu_item}</div>
          <div className="text-[12px] text-[#647386]">{item.category}</div>
        </div>
      ),
    },
    {
      header: 'Forecast',
      accessorKey: 'predicted_demand',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-medium text-[#17232E] tabular-nums">
          {formatNumber(item.predicted_demand)}
          <span className="text-xs text-[#647386] font-normal ml-0.5">p</span>
        </span>
      ),
    },
    {
      header: 'Planned Prep',
      accessorKey: 'planned_preparation',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-bold text-[#4263D8] tabular-nums">
          {formatNumber(item.planned_preparation)}
          <span className="text-xs text-[#647386] font-normal ml-0.5">p</span>
        </span>
      ),
    },
    {
      header: 'Potential Surplus',
      accessorKey: 'potential_surplus',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span
          className={`font-bold tabular-nums ${
            item.potential_surplus > 10 ? 'text-[#E7A32D]' : 'text-[#12523C]'
          }`}
        >
          +{formatNumber(item.potential_surplus)} p
        </span>
      ),
    },
    {
      header: 'Cost at Risk',
      accessorKey: 'ingredient_cost_at_risk',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-bold text-[#BF3F45] tabular-nums">
          {formatINR(item.ingredient_cost_at_risk)}
        </span>
      ),
    },
    {
      header: 'Risk Tier',
      accessorKey: 'risk_level',
      sortable: true,
      cell: (item) => {
        const badgeType =
          item.risk_level === 'High'
            ? 'high'
            : item.risk_level === 'Moderate'
            ? 'moderate'
            : 'low';
        return <StatusBadge status={badgeType} label={`${item.risk_level} Risk`} size="sm" />;
      },
    },
    {
      header: 'Kitchen Mitigation Action',
      accessorKey: 'primary_action',
      cell: (item) => (
        <div className="text-xs text-[#17232E] max-w-sm leading-relaxed">
          {item.primary_action}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Waste-Risk Monitoring & Operational Triage"
        subtitle="Real-time triage matrix distinguishing intentional safety buffer portions from actionable food waste exposure."
        stageTag="Stage 3: Rescue & Intercept"
        onOpenLimitations={onOpenLimitations}
        scenarioPreset={scenarioPreset}
        onSelectScenario={onSelectScenario}
      />

      {/* 4 Distinct Coordinated KPI Cards */}
      {loading && !data ? (
        <SkeletonKpiGrid />
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="High Surplus Risk"
            value={formatNumber(data.summary.high_risk_count)}
            unit="items"
            meta="Immediate initial batch pull-back"
            pillText="CRITICAL"
            pillVariant="red"
            accentColor="coral"
            sparklineColor="#E96B63"
            tooltip="Number of dishes with surplus exposure exceeding acceptable safety threshold."
            sparklineData={[3, 2, 4, 2, 1, data.summary.high_risk_count]}
          />
          <KpiCard
            label="Moderate Risk"
            value={formatNumber(data.summary.mod_risk_count)}
            unit="items"
            meta="Hold replenishment at review point"
            pillText="WATCH"
            pillVariant="amber"
            accentColor="amber"
            sparklineColor="#E7A32D"
            tooltip="Dishes requiring mid-service kitchen monitoring before authorizing second batch."
            sparklineData={[1, 3, 2, 4, 3, data.summary.mod_risk_count]}
          />
          <KpiCard
            label="Total Surplus Exposure"
            value={formatNumber(data.summary.total_surplus_exposure)}
            unit="portions"
            meta="Avoidable over-preparation buffer"
            pillText="VOLUME"
            pillVariant="violet"
            accentColor="violet"
            sparklineColor="#7656D6"
            tooltip="Aggregated surplus portions across all items if full planned preparation is executed."
            sparklineData={[45, 38, 42, 35, 30, data.summary.total_surplus_exposure]}
          />
          <KpiCard
            label="Ingredient Cost at Risk"
            value={formatINR(data.summary.total_ingredient_cost_at_risk)}
            unit=""
            meta="Raw ingredient capital exposure"
            pillText="CAPITAL"
            pillVariant="amber"
            accentColor="amber"
            sparklineColor="#E7A32D"
            tooltip="Total financial exposure of surplus ingredients under unbuffered batch cooking."
            sparklineData={[2400, 2100, 1950, 1600, data.summary.total_ingredient_cost_at_risk]}
          />
        </div>
      ) : null}

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-[#647386]">
          <Filter className="w-4 h-4 text-[#087E8B]" />
          <span className="font-bold text-[#17232E]">Filter by Risk Severity:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'High', 'Moderate', 'Low'].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setFilterTier(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterTier === tier
                  ? 'bg-[#16865D] text-[#FFFFFF] shadow-xs'
                  : 'bg-[#F0F3F8] text-[#647386] border border-[#DFE5EC] hover:bg-[#DFE5EC] hover:text-[#17232E]'
              }`}
            >
              {tier === 'all' ? 'All Tiers' : `${tier} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Operational Triage DataTable */}
      <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F3F8] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#17232E]">
              Operational Risk Triage Table
            </h2>
            <p className="text-xs text-[#647386]">
              Distinguishing deliberate safety buffers from preventable ingredient loss
            </p>
          </div>
          <span className="text-xs font-bold text-[#087E8B] bg-[#DDF5F7] border border-[#13B8A6]/40 px-2.5 py-1 rounded-md">
            Showing {data?.items.length || 0} Menu Items
          </span>
        </div>

        {loading && !data ? (
          <SkeletonTable rows={4} />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items || []}
            keyExtractor={(item) => item.menu_item}
            exportFileName="wastewise_risk_triage.csv"
            searchPlaceholder="Search dish, category or action..."
            emptyMessage="No items match your risk filter."
          />
        )}
      </div>

      {/* Detailed Kitchen Directives */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#087E8B]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#17232E]">
            Kitchen SOP & Shelf-Life Management Guidance
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.items.slice(0, 4).map((item) => (
            <div
              key={item.menu_item}
              className="p-4 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl text-xs flex flex-col justify-between shadow-xs hover:border-[#16865D]/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#17232E] text-sm">
                    {item.menu_item}
                  </span>
                  <span className="text-xs font-semibold text-[#17232E] bg-[#F0F3F8] border border-[#DFE5EC] px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#087E8B]" />
                    <span>Hold Limit: {item.shelf_life_hours}h</span>
                  </span>
                </div>
                <p className="text-xs text-[#647386] leading-relaxed">
                  {item.kitchen_guidance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
