import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { RefreshCw, SlidersHorizontal, Info, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import { fetchConfig, fetchForecast } from '../api';
import { ConfigResponse, ForecastResponse } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { PageHeader } from '../components/common/PageHeader';
import { SkeletonKpiGrid } from '../components/common/SkeletonLoader';
import { formatINR, formatNumber } from '../utils/formatters';
import { tokens } from '../tokens';

interface DemandForecastViewProps {
  onOpenLimitations?: () => void;
  scenarioPreset?: 'normal' | 'event' | 'rainy';
  onSelectScenario?: (scenario: 'normal' | 'event' | 'rainy') => void;
}

export const DemandForecastView: React.FC<DemandForecastViewProps> = ({
  onOpenLimitations,
  scenarioPreset = 'normal',
  onSelectScenario,
}) => {
  const [config, setConfig] = useState<ConfigResponse | null>(null);
  const [selectedItem, setSelectedItem] = useState('Pav Bhaji');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [attendance, setAttendance] = useState(100);
  const [weather, setWeather] = useState('Sunny / Normal');
  const [isEvent, setIsEvent] = useState(false);

  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
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

  // Adapt to scenario presets
  useEffect(() => {
    if (scenarioPreset === 'event') {
      setIsEvent(true);
      setAttendance(135);
      setWeather('Sunny / Normal');
    } else if (scenarioPreset === 'rainy') {
      setIsEvent(false);
      setAttendance(80);
      setWeather('Rainy / Low Footfall');
    } else {
      setIsEvent(false);
      setAttendance(100);
      setWeather('Sunny / Normal');
    }
  }, [scenarioPreset]);

  useEffect(() => {
    runForecast();
  }, [selectedItem, selectedDay, attendance, weather, isEvent]);

  const runForecast = async () => {
    try {
      setLoading(true);
      const res = await fetchForecast({
        menu_item: selectedItem,
        day_of_week: selectedDay,
        attendance_index: attendance / 100,
        campus_event: isEvent ? 1 : 0,
        weather,
      });
      setForecast(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Demand Forecast & Uncertainty Analysis"
        subtitle="Item-level demand inference powered by Random Forest ensemble with empirical 80% confidence intervals."
        stageTag="Stage 1: Predict"
        onOpenLimitations={onOpenLimitations}
        scenarioPreset={scenarioPreset}
        onSelectScenario={onSelectScenario}
      />

      {/* Scenario Parameters Control Card */}
      <div className="bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8] mb-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#16865D]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#17232E]">
              Forecast Scenario Drivers & Campus Parameters
            </h2>
          </div>
          <span className="text-xs text-[#647386] hidden sm:inline">
            Interactive ML inference pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end text-xs">
          {/* Menu Item */}
          <div>
            <label htmlFor="dish-select" className="block text-xs font-bold text-[#17232E] mb-1.5">
              Menu Item
            </label>
            <select
              id="dish-select"
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-medium focus:outline-none focus:ring-2 focus:ring-[#16865D]"
            >
              {config?.menu_item_names?.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              )) || <option value="Pav Bhaji">Pav Bhaji</option>}
            </select>
          </div>

          {/* Service Day */}
          <div>
            <label htmlFor="day-select" className="block text-xs font-bold text-[#17232E] mb-1.5">
              Day of Week
            </label>
            <select
              id="day-select"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-medium focus:outline-none focus:ring-2 focus:ring-[#16865D]"
            >
              {config?.days_of_week?.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              )) || <option value="Monday">Monday</option>}
            </select>
          </div>

          {/* Attendance Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-[#17232E] mb-1.5">
              <span>Campus Footfall</span>
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
              aria-label="Campus Footfall percentage"
            />
          </div>

          {/* Weather Condition */}
          <div>
            <label htmlFor="weather-select" className="block text-xs font-bold text-[#17232E] mb-1.5">
              Weather Condition
            </label>
            <select
              id="weather-select"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#DFE5EC] rounded-lg px-3 py-2 text-[#17232E] font-medium focus:outline-none focus:ring-2 focus:ring-[#16865D]"
            >
              {config?.weather_types?.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              )) || (
                <>
                  <option value="Sunny / Normal">Sunny / Normal</option>
                  <option value="Rainy / Low Footfall">Rainy / Low Footfall</option>
                  <option value="Cold / Overcast">Cold / Overcast</option>
                </>
              )}
            </select>
          </div>

          {/* Campus Event Checkbox in Blue Accent */}
          <div className="flex items-center gap-2.5 h-10 px-3 bg-[#F0F3F8] border border-[#DFE5EC] rounded-lg">
            <input
              type="checkbox"
              id="eventToggle"
              checked={isEvent}
              onChange={(e) => setIsEvent(e.target.checked)}
              className="w-4 h-4 rounded-sm text-[#4263D8] accent-[#4263D8] cursor-pointer"
            />
            <label
              htmlFor="eventToggle"
              className="text-xs font-bold text-[#17232E] cursor-pointer select-none"
            >
              Campus Fest Active (+35%)
            </label>
          </div>
        </div>
      </div>

      {/* 4 Distinct Coordinated KPI Cards */}
      {loading && !forecast ? (
        <SkeletonKpiGrid />
      ) : forecast ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Point Forecast"
            value={formatNumber(forecast.predicted_demand)}
            unit="portions"
            meta="Expected customer demand"
            pillText="RANDOM FOREST"
            pillVariant="mint"
            accentColor="emerald"
            sparklineColor="#16865D"
            tooltip="Ensemble average point forecast across 100 decision trees for this item under the selected parameters."
            sparklineData={[
              forecast.weekday_baseline - 5,
              forecast.weekday_baseline,
              forecast.predicted_demand - 2,
              forecast.predicted_demand,
            ]}
          />
          <KpiCard
            label="80% Uncertainty Range"
            value={`${forecast.lower_bound} – ${forecast.upper_bound}`}
            unit="portions"
            meta="Empirical 10th – 90th percentile"
            pillText="INTERVAL"
            pillVariant="teal"
            accentColor="teal"
            sparklineColor="#087E8B"
            tooltip="Range capturing 80% of simulated tree estimates, used to calculate dynamic refill buffers."
            sparklineData={[forecast.lower_bound, forecast.predicted_demand, forecast.upper_bound]}
          />
          <KpiCard
            label="Weekday Baseline"
            value={formatNumber(forecast.weekday_baseline)}
            unit="portions"
            meta={`ML diff: ${forecast.baseline_diff >= 0 ? '+' : ''}${forecast.baseline_diff} portions`}
            pillText="REFERENCE"
            pillVariant="blue"
            accentColor="blue"
            sparklineColor="#4263D8"
            tooltip="Unoptimized 7-day rolling historical baseline for this weekday."
            sparklineData={[forecast.weekday_baseline, forecast.weekday_baseline]}
          />
          <KpiCard
            label="Estimated Gross Value"
            value={formatINR(forecast.gross_value)}
            unit=""
            meta={`${formatINR(forecast.selling_price)} retail / portion`}
            pillText="REVENUE"
            pillVariant="amber"
            accentColor="amber"
            sparklineColor="#E7A32D"
            tooltip="Potential retail value generated if all predicted portions are served."
            sparklineData={[forecast.gross_value * 0.9, forecast.gross_value]}
          />
        </div>
      ) : null}

      {/* Two Column Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8] mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#17232E]">
                Demand Trajectory: {selectedItem}
              </h2>
              <p className="text-xs text-[#647386]">
                Last 30 observed days vs current scenario prediction
              </p>
            </div>
            <span className="text-xs font-semibold text-[#12523C] bg-[#E4F7ED] border border-[#47D7A0]/40 px-2.5 py-1 rounded-md">
              Units: Portions Sold
            </span>
          </div>

          <div className="h-[280px] w-full">
            {forecast?.trajectory ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={forecast.trajectory}
                  margin={{ top: 10, right: 15, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DFE5EC" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#17232E' }}
                    interval={4}
                    tickFormatter={(v) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#647386' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#172B3D] text-[#FFFFFF] p-3 rounded-lg shadow-xl text-xs border border-[#087E8B]/40">
                            <div className="text-xs text-[#8A99A8] mb-0.5">{d.date}</div>
                            <div className="font-bold text-sm text-[#47D7A0]">
                              {d.actual_sold} portions sold
                            </div>
                            <div className="text-[12px] text-[#EAF0FF] mt-1">
                              {d.is_holdout ? 'Holdout Evaluation Sample' : 'Historical Training Observation'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual_sold"
                    stroke="#16865D"
                    strokeWidth={2.4}
                    dot={{ r: 3, fill: '#47D7A0', stroke: '#12523C', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#47D7A0', stroke: '#12523C' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#647386]">
                Loading trajectory...
              </div>
            )}
          </div>
        </div>

        {/* Feature Attribution (5 cols) in Deep Teal */}
        <div className="lg:col-span-5 bg-[#FFFFFF] border border-[#DFE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F0F3F8] mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#17232E]">
                Model Feature Attribution
              </h2>
              <p className="text-xs text-[#647386]">
                Feature importance weights for {selectedItem}
              </p>
            </div>
            <span className="text-xs font-bold text-[#087E8B] bg-[#DDF5F7] border border-[#13B8A6]/40 px-2 py-0.5 rounded-sm">
              Tree Gini Importance
            </span>
          </div>

          <div className="h-[280px] w-full">
            {forecast?.features ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={forecast.features}
                  layout="vertical"
                  margin={{ top: 10, right: 25, left: 25, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#DFE5EC" />
                  <XAxis type="number" unit="%" tick={{ fontSize: 12, fill: '#647386' }} />
                  <YAxis
                    dataKey="feature"
                    type="category"
                    tick={{ fontSize: 12, fill: '#17232E' }}
                    width={100}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const f = payload[0].payload;
                        return (
                          <div className="bg-[#172B3D] text-[#FFFFFF] p-2.5 rounded-lg shadow-xl text-xs border border-[#087E8B]/40">
                            <div className="font-bold text-[#47D7A0]">{f.feature}</div>
                            <div className="text-white mt-0.5">
                              Contribution: <strong>{f.importance_pct.toFixed(1)}%</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="importance_pct" fill="#087E8B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#647386]">
                Loading feature weights...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Protocol Callout in Pale Green with Emerald Border */}
      <div className="p-4 bg-[#E4F7ED] border border-[#47D7A0]/40 border-l-4 border-l-[#16865D] rounded-xl text-xs text-[#12523C] flex items-start justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#16865D] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-[#12523C]">
              Forecasting Methodology & Empirical Uncertainty Protocol
            </h3>
            <p className="text-xs text-[#12523C]/90 leading-relaxed">
              Predictions are generated by a scikit-learn <code className="font-mono bg-[#FFFFFF] px-1 py-0.5 rounded text-[#12523C] border border-[#47D7A0]/40">RandomForestRegressor</code> (100 estimators) trained on chronological canteen history. Uncertainty intervals reflect empirical 10th and 90th percentile tree estimates across the ensemble. Predictions serve as operational decision inputs, not guarantees of customer turnout.
            </p>
          </div>
        </div>
        {onOpenLimitations && (
          <button
            type="button"
            onClick={onOpenLimitations}
            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#E4F7ED] border border-[#47D7A0] text-[#12523C] font-bold text-xs rounded-lg shrink-0 transition-colors shadow-xs"
          >
            Review Audit Dossier
          </button>
        )}
      </div>
    </div>
  );
};
