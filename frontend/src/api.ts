import {
  ActualOutcomeItem,
  ActualOutcomePayload,
  ConfigResponse,
  DataInfoResponse,
  ForecastHistoryItem,
  ForecastResponse,
  HealthResponse,
  OverviewResponse,
  PerformanceResponse,
  PlanResponse,
  PreparationPlanHistoryItem,
  WasteRiskResponse,
} from "./types";
import { captureException } from "./telemetry";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  const headers = new Headers(options?.headers);

  try {
    res = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers,
      signal: options?.signal || AbortSignal.timeout(60000),
    });
  } catch (error) {
    captureException(error);
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      throw new Error(
        "The calculation took too long. Try again or use a smaller dataset.",
      );
    }
    throw new Error(
      "Cannot reach the WasteWise backend. Check that it is running, then try again.",
    );
  }
  if (!res.ok) {
    const body = await res.text();
    let detail = `Request failed (${res.status}). Please try again.`;
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed.detail === "string") detail = parsed.detail;
      else if (Array.isArray(parsed.detail))
        detail = parsed.detail
          .map((item: string | { msg?: string }) =>
            typeof item === "string" ? item : item.msg || "Invalid input",
          )
          .join(" ");
    } catch {
      /* Do not expose an HTML proxy error as product copy. */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/api/health");
}

export async function fetchConfig(): Promise<ConfigResponse> {
  return fetchJson<ConfigResponse>("/api/config");
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return fetchJson<OverviewResponse>("/api/overview");
}

export async function fetchForecast(params: {
  menu_item: string;
  day_of_week: string;
  attendance_index: number;
  campus_event: number;
  weather: string;
}): Promise<ForecastResponse> {
  return fetchJson<ForecastResponse>("/api/forecast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  return fetchJson<PlanResponse>("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function fetchWasteRisks(
  riskTier?: string,
): Promise<WasteRiskResponse> {
  const query =
    riskTier && riskTier !== "all"
      ? `?risk_tier=${encodeURIComponent(riskTier)}`
      : "";
  return fetchJson<WasteRiskResponse>(`/api/waste-risk${query}`);
}

export async function fetchPerformance(): Promise<PerformanceResponse> {
  return fetchJson<PerformanceResponse>("/api/performance");
}

export async function fetchDataInfo(): Promise<DataInfoResponse> {
  return fetchJson<DataInfoResponse>("/api/data");
}

export async function uploadDatasetCSV(
  file: File,
): Promise<{ status: string; message: string; records: number }> {
  const formData = new FormData();
  formData.append("file", file);
  return fetchJson<{ status: string; message: string; records: number }>(
    "/api/data/upload",
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function resetDataset(): Promise<{
  status: string;
  message: string;
}> {
  return fetchJson<{ status: string; message: string }>("/api/data/reset", {
    method: "POST",
  });
}

export async function recordOutcome(
  payload: ActualOutcomePayload,
): Promise<{ status: string; id: string; message: string }> {
  return fetchJson<{ status: string; id: string; message: string }>(
    "/api/outcomes",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchOutcomes(
  serviceDate?: string,
  menuItem?: string,
): Promise<ActualOutcomeItem[]> {
  const params = new URLSearchParams();
  if (serviceDate) params.append("service_date", serviceDate);
  if (menuItem) params.append("menu_item", menuItem);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJson<ActualOutcomeItem[]>(`/api/outcomes${qs}`);
}

export async function fetchForecastHistory(
  limit: number = 30,
): Promise<ForecastHistoryItem[]> {
  return fetchJson<ForecastHistoryItem[]>(
    `/api/forecast/history?limit=${limit}`,
  );
}

export async function fetchPlanHistory(
  limit: number = 30,
): Promise<PreparationPlanHistoryItem[]> {
  return fetchJson<PreparationPlanHistoryItem[]>(
    `/api/plan/history?limit=${limit}`,
  );
}
