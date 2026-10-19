import {
  ConfigResponse,
  DataInfoResponse,
  ForecastResponse,
  HealthResponse,
  OverviewResponse,
  PerformanceResponse,
  PlanResponse,
  WasteRiskResponse,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, options);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error (${res.status}): ${errorText}`);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/api/health');
}

export async function fetchConfig(): Promise<ConfigResponse> {
  return fetchJson<ConfigResponse>('/api/config');
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return fetchJson<OverviewResponse>('/api/overview');
}

export async function fetchForecast(params: {
  menu_item: string;
  day_of_week: string;
  attendance_index: number;
  campus_event: number;
  weather: string;
}): Promise<ForecastResponse> {
  return fetchJson<ForecastResponse>('/api/forecast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function fetchPlan(params: {
  menu_item: string;
  predicted_demand: number;
  lower_bound: number;
  upper_bound: number;
  current_stock?: number;
  custom_cost_surplus?: number;
  custom_cost_shortage?: number;
  service_level_preference?: number;
  traditional_baseline_prep?: number;
}): Promise<PlanResponse> {
  return fetchJson<PlanResponse>('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export async function fetchWasteRisks(riskTier?: string): Promise<WasteRiskResponse> {
  const query = riskTier && riskTier !== 'all' ? `?risk_tier=${encodeURIComponent(riskTier)}` : '';
  return fetchJson<WasteRiskResponse>(`/api/waste-risk${query}`);
}

export async function fetchPerformance(): Promise<PerformanceResponse> {
  return fetchJson<PerformanceResponse>('/api/performance');
}

export async function fetchDataInfo(): Promise<DataInfoResponse> {
  return fetchJson<DataInfoResponse>('/api/data');
}

export async function uploadDatasetCSV(file: File): Promise<{ status: string; message: string; records: number }> {
  const formData = new FormData();
  formData.append('file', file);
  return fetchJson<{ status: string; message: string; records: number }>('/api/data/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function resetDataset(): Promise<{ status: string; message: string }> {
  return fetchJson<{ status: string; message: string }>('/api/data/reset', {
    method: 'POST',
  });
}
