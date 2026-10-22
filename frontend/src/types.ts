export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  event: string;
  workspace: string;
  is_synthetic: boolean;
  model_trained: boolean;
}

export interface MenuItemConfig {
  name: string;
  category: string;
  cost_per_portion: number;
  selling_price: number;
  prep_batch_size: number;
  shelf_life_hours: number;
  base_demand: number;
}

export interface ConfigResponse {
  menu_items: MenuItemConfig[];
  menu_item_names: string[];
  weather_types: string[];
  days_of_week: string[];
  workspace: string;
  event_name: string;
  version: string;
  is_synthetic?: boolean;
  latest_date?: string;
}

export interface OverviewItemDetail {
  menu_item: string;
  category: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  error_minus: number;
  error_plus: number;
  recommended_prep: number;
  initial_batch: number;
  refill_trigger: number;
  refill_trigger_label: string;
  cost_per_portion: number;
  naive_exposure: number;
}

export interface PrioritizedAlert {
  menu_item: string;
  risk_level: "High" | "Moderate" | "Low";
  predicted_demand: number;
  planned_preparation: number;
  potential_surplus: number;
  cost_at_risk: number;
  action: string;
}

export interface OverviewResponse {
  service_date: string;
  is_synthetic: boolean;
  provenance_text: string;
  kpis: {
    forecast_demand: number;
    recommended_prep: number;
    potential_surplus: number;
    surplus_pct: number;
    cost_at_risk: number;
  };
  item_details: OverviewItemDetail[];
  prioritized_alerts: PrioritizedAlert[];
  benchmark: {
    ml_wape: string;
    ml_mae: string;
    base_wape: string;
  };
}

export interface ForecastResponse {
  menu_item: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  weekday_baseline: number;
  baseline_diff: number;
  gross_value: number;
  selling_price: number;
  features: Array<{ feature: string; importance_pct: number }>;
  trajectory: Array<{ date: string; actual_sold: number; is_holdout: boolean }>;
}

export interface PlanResponse {
  menu_item: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  critical_ratio: number;
  recommended_total_plan: number;
  recommended_initial_batch: number;
  refill_trigger_threshold: number;
  recommended_buffer: number;
  current_policy_prep: number;
  wastewise_expected_surplus: number;
  wastewise_expected_shortage: number;
  wastewise_expected_cost: number;
  current_policy_expected_surplus: number;
  current_policy_expected_shortage: number;
  current_policy_expected_cost: number;
  net_cost_avoided: number;
  surplus_portions_avoided: number;
  recommendation_reason: string;
  risk_classification: string;
  distribution: Array<{ portions: number; frequency: number }>;
}

export interface WasteRiskItem {
  menu_item: string;
  category: string;
  predicted_demand: number;
  planned_preparation: number;
  potential_surplus: number;
  ingredient_cost_at_risk: number;
  risk_level: "High" | "Moderate" | "Low";
  primary_action: string;
  kitchen_guidance: string;
  shelf_life_hours: number;
}

export interface WasteRiskResponse {
  items: WasteRiskItem[];
  summary: {
    high_risk_count: number;
    mod_risk_count: number;
    total_surplus_exposure: number;
    total_ingredient_cost_at_risk: number;
  };
}

export interface PerformanceResponse {
  ml_metrics: {
    wape: number;
    mae: number;
    r2: number;
    sample_size: number;
    split_date: string;
  };
  baseline_metrics: {
    wape: number;
    mae: number;
  };
  dish_comparison: Array<{
    menu_item: string;
    ml_wape: number;
    ml_mae: number;
    baseline_wape: number;
    wape_diff: number;
  }>;
  simulation: {
    waste_reduction_pct: number;
    financial_savings_inr: number;
    carbon_avoided_kg: number;
    surplus_portions_avoided: number;
    stockout_rate_traditional: number;
    stockout_rate_wastewise: number;
  };
}

export interface DataInfoResponse {
  is_synthetic: boolean;
  total_records: number;
  date_min: string;
  date_max: string;
  columns: string[];
  preview: Record<string, any>[];
  last_import?: string | null;
  last_filename?: string | null;
}

export interface ActualOutcomePayload {
  service_date: string;
  target_meal?: string;
  menu_item: string;
  portions_prepared: number;
  portions_sold: number;
  portions_leftover: number;
  waste_cause?: string;
  discarded_kg?: number;
  donation_kg?: number;
  waste_cost?: number;
  notes?: string;
}

export interface ActualOutcomeItem {
  id: number;
  service_date: string;
  target_meal: string;
  menu_item: string;
  portions_prepared: number;
  portions_sold: number;
  portions_leftover: number;
  waste_cause?: string;
  discarded_kg: number;
  donation_kg: number;
  waste_cost: number;
  notes: string;
  recorded_at: string;
}

export interface ForecastHistoryItem {
  id: number;
  timestamp: string;
  menu_item: string;
  day_of_week: string;
  attendance_index: number;
  is_event: number;
  weather: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  model_version: string;
}

export interface PreparationPlanHistoryItem {
  id: number;
  service_date: string;
  target_meal: string;
  menu_item: string;
  predicted_demand: number;
  recommended_total_plan: number;
  recommended_initial_batch: number;
  refill_trigger_threshold: number;
  status: string;
  created_at: string;
}
