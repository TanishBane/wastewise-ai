import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChefHat, Sliders, CheckCircle2, AlertTriangle, ArrowRight, Sparkles, Scale, Info, ChevronDown } from 'lucide-react';
import { fetchConfig, fetchForecast, fetchPlan } from '../api';
import { ConfigResponse, PlanResponse } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { PageHeader } from '../components/common/PageHeader';
import { SkeletonKpiGrid } from '../components/common/SkeletonLoader';
import { formatINR, formatNumber } from '../utils/formatters';
import { tokens } from '../tokens';

interface PreparationPlannerViewProps {
  demoTriggered?: boolean;
  onOpenLimitations?: () => void;
  scenarioPreset?: 'normal' | 'event' | 'rainy';
  onSelectScenario?: (scenario: 'normal' | 'event' | 'rainy') => void;
}

export const PreparationPlannerView: React.FC<PreparationPlannerViewProps> = ({
  demoTriggered = false,
  onOpenLimitations,
  scenarioPreset = 'normal',
  onSelectScenario,
}) => {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Operational State
  const [selectedItem, setSelectedItem] = useState('Pav Bhaji');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [attendance, setAttendance] = useState(demoTriggered ? 135 : 100);
  const [weather, setWeather] = useState('Sunny / Normal');
  const [isEvent, setIsEvent] = useState(demoTriggered);

  // Economic Asymmetry State
  const [currentStock, setCurrentStock] = useState(0);
  const [costExcess, setCostExcess] = useState<number | undefined>(undefined);
  const [costShortage, setCostShortage] = useState<number | undefined>(undefined);
  const [serviceLevel, setServiceLevel] = useState(0.55);
  const [traditionalHabit, setTraditionalHabit] = useState<number | undefined>(undefined);

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig()
      .then((cfg) => {
        setConfig(cfg);
        if (cfg.menu_item_names?.length) {
          setSelectedItem(cfg.menu_item_names[0]);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (scenarioPreset === 'event' || demoTriggered) {
      setAttendance(135);
      setIsEvent(true);
      setWeather('Sunny / Normal');
    } else if (scenarioPreset === 'rainy') {
      setAttendance(80);
      setIsEvent(false);
      setWeather('Rainy / Low Footfall');
    } else {
      setAttendance(100);
      setIsEvent(false);
      setWeather('Sunny / Normal');
    }
  }, [scenarioPreset, demoTriggered]);

  useEffect(() => {
    runPlanningPipeline();
  }, [
    selectedItem,
    selectedDay,
    attendance,
    weather,
    isEvent,
    currentStock,
    costExcess,
    costShortage,
    serviceLevel,
    traditionalHabit,
  ]);

  const runPlanningPipeline = async () => {
    try {
      setLoading(true);
      const fc = await fetchForecast({
        menu_item: selectedItem,
        day_of_week: selectedDay,
        attendance_index: attendance / 100,
        campus_event: isEvent ? 1 : 0,
        weather,
      });

      const p = await fetchPlan({
        menu_item: selectedItem,
        predicted_demand: fc.predicted_demand,
        lower_bound: fc.lower_bound,
        upper_bound: fc.upper_bound,
        current_stock: currentStock,
        custom_cost_surplus: costExcess,
        custom_cost_shortage: costShortage,
        service_level_preference: serviceLevel,
        traditional_baseline_prep: traditionalHabit,
      });

      setPlan(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeItemCfg = config?.menu_items?.find((i) => i.name === selectedItem);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Smart Preparation Planner"
        subtitle="Cost-asymmetric batch sizing balancing holding waste cost against shortage penalty via Newsvendor optimization."
        stageTag="Stage 2: Prepare"
        onOpenLimitations={onOpenLimitations}
        scenarioPreset={scenarioPreset}
        onSelectScenario={onSelectScenario}
      />

      {/* Main Two-Column Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1: Operational Conditions */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3.5 border-b border-[#F0F3F8] mb-4">
            <Sliders className="w-4 h-4 text-[#16865D]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17232E]">
              1. Operational Service Conditions
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label htmlFor="target-dish" className="block text-xs font-bold text-[#17232E] mb-1.5">
                Target Menu Item
              </label>
              <select
                id="target-dish"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-medium focus:outline-none focus:ring-2 focus:ring-[#16865D]"
              >
                {config?.menu_item_names?.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="prep-day" className="block text-xs font-bold text-[#17232E] mb-1.5">
                  Service Day
                </label>
                <select
                  id="prep-day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-medium focus:outline-none focus:ring-2 focus:ring-[#16865D]"
                >
                  {config?.days_of_week?.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prep-weather" className="block text-xs font-bold text-[#17232E] mb-1.5">
                  Weather Condition
                </label>
                <select
                  id="prep-weather"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-medium focus:outline-none focus:ring-2 focus:ring-[#16865D]"
                >
                  {config?.weather_types?.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-[#17232E] mb-1.5">
                <span>Expected Footfall Attendance</span>
                <span className="font-bold text-[#12523C] bg-[#E4F7ED] border border-[#47D7A0]/40 px-1.5 py-0.5 rounded-sm tabular-nums">
                  {attendance}%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="160"
                step="5"
                value={attendance}
                onChange={(e) => setAttendance(Number(e.target.value))}
                className="w-full accent-[#16865D] cursor-pointer h-2 bg-[#F0F3F8] rounded-lg"
                aria-label="Expected footfall attendance slider"
              />
            </div>

            <div className="flex items-center gap-2.5 h-10 px-3 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg">
              <input
                type="checkbox"
                id="prepEventToggle"
                checked={isEvent}
                onChange={(e) => setIsEvent(e.target.checked)}
                className="w-4 h-4 rounded-sm text-[#4263D8] accent-[#4263D8] cursor-pointer"
              />
              <label
                htmlFor="prepEventToggle"
                className="text-xs font-bold text-[#17232E] cursor-pointer select-none"
              >
                Campus Event / Fest Active (+35% Footfall)
              </label>
            </div>
          </div>
        </div>

        {/* Col 2: Economic Asymmetry & Advanced Settings Panel */}
        <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8] mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#087E8B]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#17232E]">
                  2. Cost Asymmetry & Planning Constraints
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAdvancedOpen(!advancedOpen)}
                className="text-xs font-semibold text-[#16865D] hover:underline flex items-center gap-1"
                aria-expanded={advancedOpen}
              >
                <span>{advancedOpen ? 'Hide Advanced' : 'Configure Advanced'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {!advancedOpen ? (
              <div className="space-y-3 text-xs">
                <p className="text-[#647386] leading-relaxed">
                  Default parameters active: Stock on Hand = <strong>{currentStock}p</strong>, Buffer Appetite = <strong>{(serviceLevel * 100).toFixed(0)}%</strong>, Raw Excess Cost = <strong>₹{costExcess ?? activeItemCfg?.cost_per_portion ?? 35}</strong>.
                </p>
                <div className="p-3 bg-[#F0F3F8] rounded-lg border border-[#DFE5EC] flex items-center justify-between">
                  <span className="text-[#17232E] font-medium">Asymmetric Loss Matrix</span>
                  <span className="text-[12px] font-bold text-[#16865D] bg-[#E4F7ED] px-2 py-0.5 rounded">Optimal Quantiles</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(true)}
                  className="w-full py-2 px-3 bg-[#F5F7FA] hover:bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg text-xs font-semibold text-[#17232E] transition-colors"
                >
                  Adjust Unit Costs & Habit Baseline...
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs animate-fade-in">
                <div>
                  <label htmlFor="stock-input" className="block text-xs font-bold text-[#17232E] mb-1.5">
                    Existing Stock on Hand (Portions)
                  </label>
                  <input
                    id="stock-input"
                    type="number"
                    min="0"
                    max="200"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-semibold focus:outline-none focus:ring-2 focus:ring-[#16865D] tabular-nums"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="excess-cost" className="block text-xs font-bold text-[#17232E] mb-1.5">
                      Cost of Excess (₹/portion)
                    </label>
                    <input
                      id="excess-cost"
                      type="number"
                      min="5"
                      value={costExcess ?? activeItemCfg?.cost_per_portion ?? 35}
                      onChange={(e) => setCostExcess(Number(e.target.value))}
                      className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-semibold focus:outline-none focus:ring-2 focus:ring-[#16865D] tabular-nums"
                    />
                  </div>

                  <div>
                    <label htmlFor="shortage-cost" className="block text-xs font-bold text-[#17232E] mb-1.5">
                      Cost of Shortage (₹/portion)
                    </label>
                    <input
                      id="shortage-cost"
                      type="number"
                      min="5"
                      value={
                        costShortage ??
                        (activeItemCfg
                          ? activeItemCfg.selling_price - activeItemCfg.cost_per_portion
                          : 40)
                      }
                      onChange={(e) => setCostShortage(Number(e.target.value))}
                      className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-semibold focus:outline-none focus:ring-2 focus:ring-[#16865D] tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-[#17232E] mb-1.5">
                    <span>Service Level Preference (Buffer Appetite)</span>
                    <span className="font-bold text-[#4263D8] bg-[#EAF0FF] border border-[#5585F7]/40 px-1.5 py-0.5 rounded-sm tabular-nums">
                      {serviceLevel.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.85"
                    step="0.05"
                    value={serviceLevel}
                    onChange={(e) => setServiceLevel(Number(e.target.value))}
                    className="w-full accent-[#4263D8] cursor-pointer h-2 bg-[#F0F3F8] rounded-lg"
                    aria-label="Service level preference slider"
                  />
                </div>

                <div>
                  <label htmlFor="traditional-habit" className="block text-xs font-bold text-[#17232E] mb-1.5">
                    Traditional Baseline Prep Habit (Fixed Rule)
                  </label>
                  <input
                    id="traditional-habit"
                    type="number"
                    min="10"
                    value={traditionalHabit ?? Math.round((activeItemCfg?.base_demand || 70) * 1.15)}
                    onChange={(e) => setTraditionalHabit(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-semibold focus:outline-none focus:ring-2 focus:ring-[#16865D] tabular-nums"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preparation Output Section */}
      {loading && !plan ? (
        <SkeletonKpiGrid />
      ) : plan ? (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#17232E]">
              Recommended Batch Schedule: {selectedItem}
            </h3>
            <span className="text-xs text-[#17232E] bg-[#F0F3F8] border border-[#DFE5EC] px-3 py-1 rounded-md font-semibold">
              Critical Ratio: <strong className="text-[#16865D] tabular-nums">{plan.critical_ratio}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Forecast Demand"
              value={formatNumber(plan.predicted_demand)}
              unit="portions"
              meta={`80% range: ${plan.lower_bound} – ${plan.upper_bound}`}
              pillText="ML POINT"
              pillVariant="mint"
              accentColor="emerald"
              sparklineColor="#16865D"
              tooltip="Point demand forecast generated by the Random Forest model for today."
              sparklineData={[plan.lower_bound, plan.predicted_demand, plan.upper_bound]}
            />
            <KpiCard
              label="Total Day Target"
              value={formatNumber(plan.recommended_total_plan)}
              unit="portions"
              meta={`Buffer: ${plan.recommended_buffer >= 0 ? '+' : ''}${plan.recommended_buffer} portions`}
              pillText="OPTIMAL PLAN"
              pillVariant="blue"
              accentColor="blue"
              sparklineColor="#4263D8"
              tooltip="Optimal total portions to cook across all shifts to minimize total expected costs."
              sparklineData={[plan.predicted_demand, plan.recommended_total_plan]}
            />
            <KpiCard
              label="Initial Batch (7:00 AM)"
              value={formatNumber(plan.recommended_initial_batch)}
              unit="portions"
              meta="Start with 80-85%; hold buffer"
              pillText="STAGE 1"
              pillVariant="teal"
              accentColor="teal"
              sparklineColor="#087E8B"
              tooltip="Safe initial batch size to cook at morning shift, holding the remaining portions as an uncommitted buffer."
              sparklineData={[plan.recommended_initial_batch, plan.recommended_total_plan]}
            />
            <KpiCard
              label="Refill Trigger Threshold"
              value={formatNumber(plan.refill_trigger_threshold)}
              unit="portions"
              meta="Trigger Batch 2 if stock hits this level"
              pillText="DYNAMIC REFILL"
              pillVariant="amber"
              accentColor="amber"
              sparklineColor="#E7A32D"
              tooltip="When remaining cooked display stock drops to this number, dispatch secondary cooking batch."
              sparklineData={[plan.refill_trigger_threshold, plan.refill_trigger_threshold]}
            />
          </div>

          {/* Plain-Language Operational Rationale */}
          <div className="p-4 bg-[#E4F7ED] border border-[#47D7A0]/40 border-l-4 border-l-[#16865D] rounded-xl text-xs text-[#12523C] shadow-xs">
            <div className="font-bold text-xs uppercase tracking-wider text-[#16865D] mb-1">
              Newsvendor Optimization Rationale
            </div>
            <p className="text-xs text-[#17232E] leading-relaxed">
              {plan.recommendation_reason}
            </p>
          </div>

          {/* Policy Simulation: Traditional vs WasteWise Plan */}
          <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#17232E]">
                  Policy Simulation: Traditional Habit vs. WasteWise Adaptive Plan
                </h3>
                <p className="text-xs text-[#647386]">
                  Simulated across 1,000 Monte Carlo demand draws. Simulated on synthetic data. Not measured.
                </p>
              </div>
              <span className="text-xs font-bold text-[#4263D8] bg-[#EAF0FF] border border-[#5585F7]/40 px-2.5 py-1 rounded-md">
                Monte Carlo Validation
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Simulation Comparison Table (6 cols) */}
              <div className="lg:col-span-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#DFE5EC] text-[#647386] text-xs uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3">Policy Metric</th>
                      <th className="py-2.5 px-3 text-right">Traditional Habit</th>
                      <th className="py-2.5 px-3 text-right">WasteWise Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F3F8]">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#17232E]">Planned Preparation</td>
                      <td className="py-2.5 px-3 text-right text-[#647386] tabular-nums">{plan.current_policy_prep} portions</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#4263D8] tabular-nums">{plan.recommended_total_plan} portions</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#17232E]">Expected Surplus Waste</td>
                      <td className="py-2.5 px-3 text-right text-[#BF3F45] font-semibold tabular-nums">{plan.current_policy_expected_surplus} portions</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#12523C] tabular-nums">{plan.wastewise_expected_surplus} portions</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#17232E]">Expected Shortage Stockout</td>
                      <td className="py-2.5 px-3 text-right text-[#647386] tabular-nums">{plan.current_policy_expected_shortage} portions</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#17232E] tabular-nums">{plan.wastewise_expected_shortage} portions</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-[#17232E]">Total Expected Cost Risk</td>
                      <td className="py-2.5 px-3 text-right text-[#92400E] font-semibold tabular-nums">{formatINR(plan.current_policy_expected_cost)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#16865D] tabular-nums">{formatINR(plan.wastewise_expected_cost)}</td>
                    </tr>
                    <tr className="bg-[#E4F7ED]">
                      <td className="py-3 px-3 font-bold text-[#12523C]">Net Cost Avoided</td>
                      <td className="py-3 px-3 text-right text-[#647386] font-medium">—</td>
                      <td className="py-3 px-3 text-right font-extrabold text-[#12523C] text-sm tabular-nums">
                        {formatINR(plan.net_cost_avoided)} saved
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Demand Density Distribution Chart (6 cols) in Royal Blue */}
              <div className="lg:col-span-6 h-[220px]">
                <div className="text-xs font-bold text-[#17232E] mb-2">
                  Simulated Demand Probability Distribution
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={plan.distribution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DFE5EC" />
                    <XAxis
                      dataKey="portions"
                      tick={{ fontSize: 12, fill: '#17232E' }}
                      unit="p"
                    />
                    <YAxis tick={{ fontSize: 12, fill: '#647386' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-[#172B3D] text-white p-2.5 rounded-lg shadow-xl text-xs border border-[#4263D8]/40">
                              <div className="font-bold text-[#5585F7]">Portions: {d.portions}</div>
                              <div className="text-white mt-0.5">Monte Carlo draws: {d.frequency}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="frequency" fill="#4263D8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
