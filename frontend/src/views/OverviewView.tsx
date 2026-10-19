import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  Legend,
} from 'recharts';
import {
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Sliders,
  Sparkles,
  Info,
  Calendar,
} from 'lucide-react';
import { fetchOverview } from '../api';
import { OverviewResponse, OverviewItemDetail, PrioritizedAlert } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { PageHeader } from '../components/common/PageHeader';
import { PageId } from '../components/Sidebar';
import { AlertDecisionCard, AlertDriver } from '../components/common/AlertDecisionCard';
import { OverrideModal } from '../components/common/OverrideModal';
import { DataTable, Column } from '../components/common/DataTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonKpiGrid, SkeletonChart, SkeletonTable } from '../components/common/SkeletonLoader';
import { formatINR, formatNumber } from '../utils/formatters';
import { tokens } from '../tokens';

interface OverviewViewProps {
  onNavigate: (page: PageId) => void;
  onOpenLimitations?: () => void;
  scenarioPreset?: 'normal' | 'event' | 'rainy';
  onSelectScenario?: (scenario: 'normal' | 'event' | 'rainy') => void;
}

interface ItemOverride {
  quantity: number;
  reason: string;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onOpenLimitations,
  scenarioPreset = 'normal',
  onSelectScenario,
}) => {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Operator session-only overrides and approvals
  const [overrides, setOverrides] = useState<Record<string, ItemOverride>>({});
  const [approvedItems, setApprovedItems] = useState<Record<string, boolean>>({});

  // Override modal state
  const [activeModalItem, setActiveModalItem] = useState<{
    menuItem: string;
    recommendedPrep: number;
  } | null>(null);

  useEffect(() => {
    loadOverview();
  }, [scenarioPreset]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to WasteWise backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (dishName: string) => {
    setApprovedItems((prev) => ({
      ...prev,
      [dishName]: !prev[dishName],
    }));
  };

  const handleOpenOverride = (menuItem: string, recommendedPrep: number) => {
    setActiveModalItem({ menuItem, recommendedPrep });
  };

  const handleSaveOverride = (menuItem: string, quantity: number, reason: string) => {
    setOverrides((prev) => ({
      ...prev,
      [menuItem]: { quantity, reason },
    }));
  };

  const handleResetOverride = (menuItem: string) => {
    setOverrides((prev) => {
      const copy = { ...prev };
      delete copy[menuItem];
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Executive Overview"
          subtitle="Loading real-time demand forecast and preparation intelligence..."
          period="Lunch Shift"
        />
        <SkeletonKpiGrid />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <SkeletonChart height="h-80" />
          </div>
          <div className="lg:col-span-5">
            <SkeletonChart height="h-80" />
          </div>
        </div>
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-[#FDE9E7] border border-[#E96B63] rounded-xl text-[#BF3F45] max-w-xl mx-auto my-8">
        <div className="flex items-center gap-2 font-bold text-base mb-1">
          <AlertCircle className="w-5 h-5 text-[#BF3F45]" />
          <span>Backend Connection Error</span>
        </div>
        <p className="text-xs mb-4 text-[#BF3F45]/90">{error}</p>
        <button
          onClick={loadOverview}
          className="px-4 py-2 bg-[#16865D] text-white text-xs font-semibold rounded-lg hover:bg-[#12523C] transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate adjusted KPI totals if overrides are active
  const totalForecast = data.kpis.forecast_demand;
  const totalPrep = data.item_details.reduce((sum, item) => {
    const override = overrides[item.menu_item];
    return sum + (override ? override.quantity : item.recommended_prep);
  }, 0);
  const totalSurplus = Math.max(0, totalPrep - totalForecast);
  const surplusPct = totalForecast > 0 ? ((totalSurplus / totalForecast) * 100).toFixed(1) : '0';

  // Chart data with error bounds and baseline comparison
  const chartData = data.item_details.map((item) => {
    const override = overrides[item.menu_item];
    return {
      name: item.menu_item,
      forecast: item.predicted_demand,
      plan: override ? override.quantity : item.recommended_prep,
      error: [item.error_minus, item.error_plus],
      lower: item.lower_bound,
      upper: item.upper_bound,
      category: item.category,
    };
  });

  // Table columns definition for DataTable
  const tableColumns: Column<OverviewItemDetail>[] = [
    {
      header: 'Menu Item',
      accessorKey: 'menu_item',
      sortable: true,
      cell: (item) => (
        <div>
          <div className="font-bold text-[#17232E] text-xs">{item.menu_item}</div>
          {overrides[item.menu_item] && (
            <div className="text-[12px] text-[#92400E] font-medium flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E7A32D]" />
              <span>Override: {overrides[item.menu_item].quantity} portions</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      accessorKey: 'category',
      sortable: true,
      cell: (item) => (
        <span className="text-xs font-medium text-[#17232E] bg-[#F0F3F8] border border-[#DFE5EC] px-2 py-0.5 rounded-sm">
          {item.category}
        </span>
      ),
    },
    {
      header: 'Forecast',
      accessorKey: 'predicted_demand',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-semibold text-[#17232E] tabular-nums">
          {formatNumber(item.predicted_demand)}
          <span className="text-xs text-[#647386] font-normal ml-0.5">portions</span>
        </span>
      ),
    },
    {
      header: 'Initial Batch',
      accessorKey: 'initial_batch',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-bold text-[#16865D] tabular-nums">
          {formatNumber(item.initial_batch)}
          <span className="text-xs text-[#647386] font-normal ml-0.5">portions</span>
        </span>
      ),
    },
    {
      header: 'Refill Trigger',
      accessorKey: 'refill_trigger_label',
      cell: (item) => (
        <span className="text-xs font-medium text-[#17232E]">
          {item.refill_trigger_label}
        </span>
      ),
    },
    {
      header: 'Cost / Portion',
      accessorKey: 'cost_per_portion',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-medium text-[#647386] tabular-nums">
          {formatINR(item.cost_per_portion)}
        </span>
      ),
    },
    {
      header: 'Naive Exposure',
      accessorKey: 'naive_exposure',
      sortable: true,
      className: 'text-right',
      cell: (item) => (
        <span className="font-bold text-[#92400E] tabular-nums">
          {formatINR(item.naive_exposure)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={() => handleOpenOverride(item.menu_item, item.recommended_prep)}
            className="px-2 py-1 text-xs font-semibold text-[#16865D] bg-[#E4F7ED] hover:bg-[#47D7A0]/30 rounded-md transition-colors"
          >
            Adjust
          </button>
        </div>
      ),
    },
  ];

  const handleExportOverview = () => {
    if (!data) return;
    const csvContent =
      'data:text/csv;charset=utf-8,Menu Item,Category,Forecast Demand,Recommended Prep,Cost At Risk\n' +
      data.item_details
        .map(
          (i) =>
            `"${i.menu_item}","${i.category}",${i.predicted_demand},${i.recommended_prep},${i.naive_exposure}`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wastewise_overview_${data.service_date.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header with Contextual Scenario Controls & Local Export */}
      <PageHeader
        title="Executive Canteen Overview"
        subtitle="Understand today's expected demand, preparation plan, and operational risks."
        serviceDate={data.service_date}
        period="Lunch Shift (12:00 – 14:30)"
        isSynthetic={data.is_synthetic}
        stageTag="6:30 AM Shift Dispatch"
        onOpenLimitations={onOpenLimitations}
        scenarioPreset={scenarioPreset}
        onSelectScenario={onSelectScenario}
        onExport={handleExportOverview}
      />

      {/* 4 Distinct Coordinated KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Forecast Demand: Emerald / Mint */}
        <KpiCard
          label="Forecast Demand"
          value={formatNumber(totalForecast)}
          unit="portions"
          meta="Predicted across 8 menu items"
          pillText="RF MODEL"
          pillVariant="mint"
          accentColor="emerald"
          sparklineColor="#16865D"
          tooltip="Random Forest point estimate aggregated across 8 menu items for today's lunch service, trained on 305 historical days."
          sparklineData={[145, 152, 148, 160, 155, 164, totalForecast]}
        />

        {/* 2. Recommended Preparation: Professional Royal Blue */}
        <KpiCard
          label="Recommended Preparation"
          value={formatNumber(totalPrep)}
          unit="portions"
          meta={
            Object.keys(overrides).length > 0
              ? `${Object.keys(overrides).length} session override(s) active`
              : 'Staggered Newsvendor batch target'
          }
          pillText={Object.keys(overrides).length > 0 ? 'OVERRIDDEN' : 'OPTIMAL'}
          pillVariant={Object.keys(overrides).length > 0 ? 'amber' : 'blue'}
          accentColor="blue"
          sparklineColor="#4263D8"
          tooltip="Asymmetric cost-optimized production target incorporating ingredient loss costs vs stockout penalties."
          sparklineData={[150, 158, 155, 168, 162, 170, totalPrep]}
        />

        {/* 3. Potential Surplus: Premium Violet */}
        <KpiCard
          label="Potential Surplus"
          value={formatNumber(totalSurplus)}
          unit="portions"
          meta={`${surplusPct}% planned buffer`}
          pillText="SAFETY BUFFER"
          pillVariant="violet"
          accentColor="violet"
          sparklineColor="#7656D6"
          tooltip="Controlled safety buffer portions planned above expected demand to eliminate lunch-hour stockouts."
          sparklineData={[10, 8, 12, 6, 9, 8, totalSurplus]}
        />

        {/* 4. Estimated Cost at Risk: Warm Amber */}
        <KpiCard
          label="Estimated Cost at Risk"
          value={formatINR(data.kpis.cost_at_risk)}
          unit=""
          meta="Exposure under unoptimized prep"
          pillText="RISK AVOIDED"
          pillVariant="amber"
          accentColor="amber"
          sparklineColor="#E7A32D"
          tooltip="Total ingredient exposure cost of unbuffered naive preparation if surplus food remains unrescued."
          sparklineData={[1400, 1250, 1100, 950, 920, 900, data.kpis.cost_at_risk]}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Demand Forecast & Uncertainty Chart */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8] mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#17232E]">
                Forecast Demand by Menu Item
              </h2>
              <p className="text-xs text-[#647386]">
                Random Forest point prediction with 80% empirical uncertainty intervals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#087E8B] bg-[#DDF5F7] border border-[#13B8A6]/40 px-2.5 py-1 rounded-md">
                80% Uncertainty Band
              </span>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 15, left: -10, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DFE5EC" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#17232E' }}
                  interval={0}
                  angle={-22}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#647386' }}
                  domain={[0, 'auto']}
                  unit="p"
                />
                <Tooltip
                  cursor={{ fill: '#F0F3F8' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-[#172B3D] text-[#FFFFFF] p-3 rounded-lg shadow-xl text-xs border border-[#087E8B]/40">
                          <div className="font-bold text-sm text-[#47D7A0] mb-1">
                            {item.name}
                          </div>
                          <div className="text-xs text-[#EAF0FF]">
                            Forecast: <strong className="text-white">{item.forecast} portions</strong>
                          </div>
                          <div className="text-xs text-[#EAF0FF]">
                            Recommended Batch: <strong className="text-white">{item.plan} portions</strong>
                          </div>
                          <div className="text-xs text-[#8A99A8] mt-1 pt-1 border-t border-[#DFE5EC]/20">
                            80% Interval: {item.lower} – {item.upper} portions
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="forecast"
                  name="Forecast Demand"
                  fill="#16865D"
                  radius={[4, 4, 0, 0]}
                >
                  <ErrorBar
                    dataKey="error"
                    width={5}
                    strokeWidth={2}
                    stroke="#12523C"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend & Context */}
          <div className="mt-3 pt-3 border-t border-[#F0F3F8] flex flex-wrap items-center justify-between text-xs text-[#647386] gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#16865D]" />
                <span className="font-medium text-[#17232E]">Forecast Demand (Portions)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-[#12523C]" />
                <span className="font-medium text-[#17232E]">80% Empirical Whiskers</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('demand-forecast')}
              className="text-xs font-semibold text-[#16865D] hover:underline flex items-center gap-1"
            >
              <span>Explore deep forecast</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Kitchen Decision Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F3F8] mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#17232E]">
                  Prioritized Kitchen Decisions
                </h2>
                <p className="text-xs text-[#647386]">
                  Actionable batch sizes and cost exposure mitigation
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('waste-risk')}
                className="text-xs font-semibold text-[#16865D] hover:underline flex items-center gap-1"
              >
                <span>View triage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of Alert Decision Cards */}
            <div className="space-y-3.5">
              {data.prioritized_alerts.map((alert) => (
                <AlertDecisionCard
                  key={alert.menu_item}
                  dishName={alert.menu_item}
                  category={
                    data.item_details.find((d) => d.menu_item === alert.menu_item)?.category ||
                    'Main Course'
                  }
                  riskLevel={alert.risk_level}
                  forecastDemand={alert.predicted_demand}
                  plannedPrep={alert.planned_preparation}
                  costAtRisk={alert.cost_at_risk}
                  potentialSurplus={alert.potential_surplus}
                  actionText={alert.action}
                  isApproved={approvedItems[alert.menu_item] || false}
                  override={overrides[alert.menu_item] || null}
                  onApprove={handleApprove}
                  onOpenOverride={() =>
                    handleOpenOverride(alert.menu_item, alert.planned_preparation)
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Preparation Summary Table with DataTable Component */}
      <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F3F8] mb-4">
          <div>
            <h2 className="text-base font-bold text-[#17232E]">
              Daily Preparation Schedule & Refill Triggers
            </h2>
            <p className="text-xs text-[#647386]">
              Staggered initial cooking batches and replenishment trigger thresholds across all 8 items
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('prep-planner')}
            className="text-xs font-semibold text-[#16865D] hover:underline flex items-center gap-1"
          >
            <span>Open Planner View</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <DataTable
          columns={tableColumns}
          data={data.item_details}
          keyExtractor={(item) => item.menu_item}
          exportFileName="wastewise_prep_schedule.csv"
          searchPlaceholder="Search menu item or category..."
          emptyMessage="No menu items matched your search query."
        />
      </div>

      {/* Model Benchmark Footer Bar */}
      <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#647386] gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#16865D] shrink-0" />
          <div className="leading-snug">
            <strong className="text-[#17232E]">Holdout Validation Benchmark: </strong>
            Random Forest holdout WAPE <strong className="text-[#12523C] bg-[#E4F7ED] px-1.5 py-0.5 rounded-sm">{data.benchmark.ml_wape}</strong> (MAE{' '}
            {data.benchmark.ml_mae} portions) outperforms 7-day rolling baseline{' '}
            <strong className="text-[#92400E] bg-[#FFF3D9] px-1.5 py-0.5 rounded-sm">{data.benchmark.base_wape}</strong>.
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('performance')}
          className="text-[#16865D] font-bold hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
        >
          <span>Explore Holdout Verification</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Override Modal */}
      {activeModalItem && (
        <OverrideModal
          isOpen={true}
          onClose={() => setActiveModalItem(null)}
          menuItem={activeModalItem.menuItem}
          recommendedPrep={activeModalItem.recommendedPrep}
          currentOverride={overrides[activeModalItem.menuItem] || null}
          onSaveOverride={handleSaveOverride}
          onResetOverride={handleResetOverride}
        />
      )}
    </div>
  );
};
