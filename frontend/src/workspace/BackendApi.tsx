import { useEffect, useState } from "react";
import {
  Check,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  Play,
  RefreshCw,
  Terminal,
} from "lucide-react";
import MetalButton from "../MetalButton";
import { PageHeading, Panel } from "./shared";
import type { ScreenProps } from "./model";

interface HealthData {
  status: string;
  app_name: string;
  version: string;
  event: string;
  workspace: string;
  is_synthetic: boolean;
  model_trained: boolean;
}

interface EndpointOption {
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  payload?: any;
}

const ENDPOINTS: EndpointOption[] = [
  {
    name: "System Health & ML Status",
    method: "GET",
    path: "/api/health",
    description: "Evaluates service uptime, Random Forest readiness, and active workspace.",
  },
  {
    name: "Catalog Configuration",
    method: "GET",
    path: "/api/config",
    description: "Returns active canteen dishes, weather factors, and calendar parameters.",
  },
  {
    name: "Kitchen Command Center Overview",
    method: "GET",
    path: "/api/overview",
    description: "Aggregates daily revenue targets, waste triage counts, and dish-level demand.",
  },
  {
    name: "Surplus Waste Risk Triage",
    method: "GET",
    path: "/api/waste-risk",
    description: "Categorizes planned dishes into High, Moderate, and Low risk surplus tiers.",
  },
  {
    name: "Performance & Impact Simulation",
    method: "GET",
    path: "/api/performance",
    description: "Outputs RMSE/MAE regression metrics and holdout ingredient waste reduction.",
  },
  {
    name: "Random Forest Demand Scenario",
    method: "POST",
    path: "/api/forecast",
    description: "Calculates machine learning demand prediction with lower/upper bounds.",
    payload: {
      menu_item: "Pav Bhaji",
      day_of_week: "Monday",
      attendance_index: 1.0,
      campus_event: 0,
      weather: "Sunny / Mild",
      target_service: "Lunch",
    },
  },
  {
    name: "Newsvendor Preparation Plan",
    method: "POST",
    path: "/api/plan",
    description: "Solves cost-optimal batch preparation balancing shortage vs surplus risk.",
    payload: {
      menu_item: "Pav Bhaji",
      predicted_demand: 120,
      lower_bound: 100,
      upper_bound: 140,
      current_stock: 10,
      service_level_preference: 0.55,
      target_meal: "Lunch",
    },
  },
];

export default function BackendApi(_props: ScreenProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLatency, setHealthLatency] = useState<number | null>(null);

  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointOption>(ENDPOINTS[0]);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: number;
    latency: number;
    data: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const fetchHealthCheck = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    const start = performance.now();
    try {
      const res = await fetch("/api/health");
      const latency = Math.round(performance.now() - start);
      setHealthLatency(latency);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: any) {
      setHealthError(err.message || "Failed to reach backend.");
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealthCheck();
  }, []);

  const runEndpointTest = async (endpoint: EndpointOption) => {
    setTestLoading(true);
    setSelectedEndpoint(endpoint);
    const start = performance.now();
    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: { "Content-Type": "application/json" },
      };
      if (endpoint.payload) {
        options.body = JSON.stringify(endpoint.payload);
      }
      const res = await fetch(endpoint.path, options);
      const latency = Math.round(performance.now() - start);
      const data = await res.json();
      setTestResult({
        status: res.status,
        latency,
        data,
      });
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setTestResult({
        status: 0,
        latency,
        data: { error: err.message || "Network request failed" },
      });
    } finally {
      setTestLoading(false);
    }
  };

  const copyResultJson = () => {
    if (!testResult) return;
    navigator.clipboard.writeText(JSON.stringify(testResult.data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="backend-api-page p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header & Live Indicator */}
      <PageHeading
        title="Live Backend & Interactive API"
        description="Unified Vercel deployment running the Vite + React frontend alongside the FastAPI Python machine learning backend on the same origin."
      >
        <div className="flex flex-wrap items-center gap-3">
          <MetalButton
            className="button primary"
            onClick={() => window.open("/docs", "_blank")}
            title="Open Swagger UI documentation in a full browser tab"
          >
            <ExternalLink size={15} />
            <span>Open Swagger UI</span>
          </MetalButton>
          <MetalButton
            className="button"
            onClick={() => window.open("/redoc", "_blank")}
            title="Open ReDoc API reference"
          >
            <Code2 size={15} />
            <span>Open ReDoc</span>
          </MetalButton>
          <MetalButton
            className="button"
            onClick={fetchHealthCheck}
            disabled={loadingHealth}
            title="Ping backend service for real-time health telemetry"
          >
            <RefreshCw size={14} className={loadingHealth ? "spin" : ""} />
            <span>Ping Backend</span>
          </MetalButton>
        </div>
      </PageHeading>

      {/* 2. Real-Time Service Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface,#fcfaf5)] border border-[var(--border,#d4cdbf)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--ink-light,#666)] mb-1">
            <span className="font-semibold uppercase tracking-wider">FastAPI Service</span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {healthLatency !== null ? `${healthLatency}ms` : "Live"}
            </span>
          </div>
          <div className="text-xl font-bold font-serif text-[var(--ink,#1f2923)]">
            {health?.status === "healthy" ? "Online & Healthy" : healthError ? "Check Connection" : "Connecting..."}
          </div>
          <p className="text-xs text-[var(--ink-light,#666)] mt-1">
            Uvicorn · Python 3.14 · Version {health?.version || "1.0"}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface,#fcfaf5)] border border-[var(--border,#d4cdbf)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--ink-light,#666)] mb-1">
            <span className="font-semibold uppercase tracking-wider">ML Forecasting Engine</span>
            <Cpu size={14} className="text-[var(--primary,#1e4638)]" />
          </div>
          <div className="text-xl font-bold font-serif text-[var(--ink,#1f2923)]">
            {health?.model_trained ? "Model Trained" : "Ready"}
          </div>
          <p className="text-xs text-[var(--ink-light,#666)] mt-1">
            Random Forest (100 estimators)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface,#fcfaf5)] border border-[var(--border,#d4cdbf)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--ink-light,#666)] mb-1">
            <span className="font-semibold uppercase tracking-wider">Tenant Isolation</span>
            <Database size={14} className="text-[var(--primary,#1e4638)]" />
          </div>
          <div className="text-xl font-bold font-serif text-[var(--ink,#1f2923)] truncate">
            {health?.workspace || "Campus Green"}
          </div>
          <p className="text-xs text-[var(--ink-light,#666)] mt-1">
            Multi-Tenant SQLite / Supabase RLS
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface,#fcfaf5)] border border-[var(--border,#d4cdbf)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[var(--ink-light,#666)] mb-1">
            <span className="font-semibold uppercase tracking-wider">Vercel Deployment</span>
            <Layers size={14} className="text-[var(--primary,#1e4638)]" />
          </div>
          <div className="text-xl font-bold font-serif text-[var(--ink,#1f2923)]">
            Multi-Service Project
          </div>
          <p className="text-xs text-[var(--ink-light,#666)] mt-1">
            Shared Origin Routing: / & /api/*
          </p>
        </div>
      </div>

      {/* 3. Interactive Endpoint Explorer & Live Tester */}
      <Panel
        title="Interactive Live API Explorer"
        description="Select an endpoint to execute a real live request directly against the Vercel-hosted FastAPI instance:"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Endpoint Selector List */}
          <div className="lg:col-span-5 space-y-2">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
              return (
                <button
                  key={ep.method + ep.path}
                  onClick={() => runEndpointTest(ep)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                    isSelected
                      ? "bg-[var(--primary,#1e4638)] text-white border-[var(--primary,#1e4638)] shadow-sm"
                      : "bg-[var(--surface,#fcfaf5)] text-[var(--ink,#1f2923)] border-[var(--border,#d4cdbf)] hover:bg-[var(--surface-muted,#eee9de)]"
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider shrink-0 mt-0.5 ${
                      ep.method === "POST"
                        ? isSelected
                          ? "bg-amber-400 text-amber-950"
                          : "bg-amber-100 text-amber-800"
                        : isSelected
                          ? "bg-emerald-300 text-emerald-950"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{ep.name}</p>
                    <p className={`text-xs font-mono truncate ${isSelected ? "text-emerald-100" : "text-[var(--ink-light,#666)]"}`}>
                      {ep.path}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Response Viewer Panel */}
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-slate-950 text-slate-100 border border-slate-800 overflow-hidden shadow-inner">
            {/* Terminal Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-slate-400 ml-2">
                  {selectedEndpoint.method} {selectedEndpoint.path}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {testResult && (
                  <>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        testResult.status >= 200 && testResult.status < 300
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-red-950 text-red-400 border border-red-800"
                      }`}
                    >
                      {testResult.status} {testResult.status === 200 ? "OK" : ""}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {testResult.latency}ms
                    </span>
                  </>
                )}
                <button
                  onClick={copyResultJson}
                  disabled={!testResult}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Copy JSON Response"
                  aria-label="Copy JSON Response"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => runEndpointTest(selectedEndpoint)}
                  disabled={testLoading}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1.5 transition text-xs"
                >
                  <Play size={11} className={testLoading ? "spin" : ""} />
                  <span>Send</span>
                </button>
              </div>
            </div>

            {/* Code / JSON Area */}
            <div className="p-4 font-mono text-xs overflow-auto max-h-[380px] flex-1 leading-relaxed text-emerald-400 selection:bg-emerald-900">
              {testLoading ? (
                <div className="flex items-center justify-center h-48 text-slate-400">
                  <RefreshCw size={18} className="spin mr-2" />
                  <span>Executing request against Vercel backend...</span>
                </div>
              ) : testResult ? (
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center">
                  <Terminal size={28} className="mb-2 opacity-50" />
                  <p>Click "Send" above or select any endpoint on the left to inspect live payload.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Panel>

      {/* 4. Embedded Swagger UI Section */}
      <Panel
        title="Embedded Interactive Swagger UI"
        description="Explore, try out requests, and review complete Pydantic request and response schemas directly inside this view:"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="px-2.5 py-1.5 rounded-lg border border-[var(--border,#d4cdbf)] text-xs font-medium hover:bg-[var(--surface-muted,#eee9de)] transition flex items-center gap-1.5 text-[var(--ink,#1f2923)]"
            >
              <RefreshCw size={13} />
              <span>Reload Docs</span>
            </button>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-[var(--primary,#1e4638)] text-white text-xs font-medium hover:opacity-95 transition flex items-center gap-1.5"
            >
              <ExternalLink size={13} />
              <span>Full Screen</span>
            </a>
          </div>
        }
      >
        <div className="w-full rounded-2xl border border-[var(--border,#d4cdbf)] overflow-hidden shadow-md bg-white">
          <iframe
            key={iframeKey}
            src="/docs"
            title="FastAPI Swagger Documentation"
            className="w-full h-[650px] border-none"
            loading="lazy"
          />
        </div>
      </Panel>

      {/* 5. Vercel Unified Project Topology */}
      <div className="p-6 rounded-2xl bg-[var(--surface-muted,#eee9de)] border border-[var(--border,#d4cdbf)]">
        <h3 className="text-base font-bold font-serif mb-2 text-[var(--ink,#1f2923)] flex items-center gap-2">
          <Layers size={18} className="text-[var(--primary,#1e4638)]" />
          <span>Vercel Multi-Service Project Architecture</span>
        </h3>
        <p className="text-xs text-[var(--ink-light,#666)] leading-relaxed mb-4">
          Both the frontend and backend are deployed and managed together as a unified Vercel project under a single root domain:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-[var(--border,#d4cdbf)]">
            <strong className="block text-[var(--ink,#1f2923)] mb-1">1. Frontend Service (Vite)</strong>
            <p className="text-[var(--ink-light,#666)]">
              Serves the high-performance React 19 SPA, Lucide icons, Tailwind CSS, and chart components at root <code className="bg-slate-100 px-1 py-0.5 rounded">/</code>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[var(--border,#d4cdbf)]">
            <strong className="block text-[var(--ink,#1f2923)] mb-1">2. Backend Service (FastAPI)</strong>
            <p className="text-[var(--ink-light,#666)]">
              Executes Python Random Forest demand predictions and Newsvendor preparation planning at <code className="bg-slate-100 px-1 py-0.5 rounded">/api/*</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">/docs</code>.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[var(--border,#d4cdbf)]">
            <strong className="block text-[var(--ink,#1f2923)] mb-1">3. Shared Domain Rewrites</strong>
            <p className="text-[var(--ink-light,#666)]">
              Managed in root <code className="bg-slate-100 px-1 py-0.5 rounded">vercel.json</code>. Zero CORS issues, shared environment bindings, and atomic deployments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
