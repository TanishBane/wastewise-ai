# WasteWise AI — Comprehensive Codebase Audit & Architecture Review

**Audit Date:** October 22, 2026  
**Auditor:** Senior Software Architect, Full-Stack Engineer & Code-Quality Auditor  
**Repository Branch:** `audit-and-cleanup` (tracking `origin/main` at commit `22866e2`)  
**Project Path:** `C:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai`  
**Execution Context:** ADAPPT 5.0 — AI in FoodTech  

---

## 1. Executive Summary

This codebase audit was conducted to thoroughly understand the WasteWise AI architecture, inspect active and inactive implementations, evaluate test coverage and build stability, classify redundant and dead code, and establish a safe baseline before the subsequent backend-hardening phase.

### Key Discoveries:
1. **Primary Production Architecture**: The active, production-grade application is a **React 19 + TypeScript + Vite 8** frontend served by a **FastAPI (Python)** backend on `http://127.0.0.1:8000`. The frontend is located in `frontend/src/workspace/` and `frontend/src/App.tsx`, with styling in `frontend/src/index.css` (warm ivory `--ground: #eeeae1` and forest green `--green: #24533d` theme), `framer-motion` scroll animations (`motion.tsx`), and self-hosted fonts (`fonts.css`).
2. **Dual-Framework History**: The repository retains an earlier Python/Streamlit prototype in `app.py` and `src/views/`. As explicitly stated in `README.md`, this is intentionally preserved for reference.
3. **Orphaned Parallel Frontend Artifacts**: Commit `22866e2` introduced a parallel set of React views (`frontend/src/views/`, 10 files) and components (`frontend/src/components/`, 15 files). Neither `frontend/src/App.tsx` nor `frontend/src/workspace/` imports or references these files. Because `tsconfig.app.json` includes `src`, `tsc -b` fails with 74 TypeScript errors on these abandoned files, preventing `npm run build` from succeeding cleanly.
4. **Zero-Drift Computational Integrity**: All machine learning, Newsvendor asymmetric optimization, holdout evaluation, and data validation logic reside in `src/` (`model.py`, `planner.py`, `metrics.py`, `data.py`, `config.py`). All 23 backend tests pass in 5.97s, and key baseline figures remain intact:
   - Forecast Demand: **161** portions
   - Recommended Preparation: **168** portions
   - Potential Surplus: **7** portions
   - Cost at Risk: **₹887**
   - Holdout WAPE: **8.4%** (vs Baseline **10.8%**)

---

## 2. Project Architecture & Entry Points

```
+-----------------------------------------------------------------------------------------+
|                                    WASTEWISE AI ARCHITECTURE                             |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|   1. PRODUCTION WEBSITE FLOW (Primary)                                                  |
|   ====================================                                                  |
|   Launch: .\run_website.ps1 (or run_website.bat)                                        |
|                                                                                         |
|   +---------------------------+        builds to       +----------------------------+   |
|   |   React 19 + Vite 8       |  ------------------->  |   frontend/dist/           |   |
|   |   frontend/src/App.tsx    |   (npm run build)      |   Static HTML, JS, CSS     |   |
|   |   frontend/src/workspace/ |                        +----------------------------+   |
|   +---------------------------+                                       |                 |
|                 |                                                     | mounted at /    |
|                 | dev proxy /api                                      v                 |
|                 v                                      +----------------------------+   |
|   +--------------------------------------------------> |   FastAPI Backend Server   |   |
|   |                                                    |   backend/main.py (:8000)  |   |
|   |                                                    +----------------------------+   |
|   |                                                                   |                 |
|   |                                    +------------------------------+                 |
|   |                                    v                                                |
|   |                      +---------------------------+                                  |
|   |                      |  Core Computational Engine |                                  |
|   |                      |  src/model.py (RF ML)     |                                  |
|   |                      |  src/planner.py (Newsvendor)                                 |
|   |                      |  src/metrics.py (Triage)  |                                  |
|   |                      |  src/data.py (Data & CSV) |                                  |
|   |                      +---------------------------+                                  |
|   |                                    |                                                |
|   |                                    v                                                |
|   |                      +---------------------------+                                  |
|   |                      |  In-Memory State          |                                  |
|   |                      |  AppState (backend/main)  |                                  |
|   |                      |  data/wastewise_sample... |                                  |
|   |                      +---------------------------+                                  |
|                                                                                         |
|   2. REFERENCE PROTOTYPE FLOW (Historical Reference)                                   |
|   ==================================================                                   |
|   Launch: py -m streamlit run app.py --server.port 8501                                 |
|   +---------------------------+                                                         |
|   |   Streamlit App           |  Uses: src/ui_theme.py, src/views/*.py                  |
|   |   app.py (:8501)          |  Calls: src/model.py, src/planner.py, src/data.py       |
|   +---------------------------+                                                         |
+-----------------------------------------------------------------------------------------+
```

### Entry Points Summary

| Component | Entry File | Runtime / Tool | Port / Serving Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Production Frontend** | `frontend/src/main.tsx` -> `App.tsx` | React 19 / Vite 8 | `http://127.0.0.1:3000` (dev) or `:8000` (prod) | **Active (Primary)** |
| **Production Backend** | `backend/main.py` | FastAPI / Uvicorn | `http://127.0.0.1:8000` | **Active (Primary)** |
| **Combined Launcher** | `run_website.ps1` / `.bat` | PowerShell / Batch | Serves unified app at `http://127.0.0.1:8000` | **Active (Primary)** |
| **Reference Prototype** | `app.py` | Streamlit 1.36+ | `http://127.0.0.1:8501` | **Reference Only** |
| **Frontend Tests** | `scripts/verify_frontend.py` | Python CDP / Chrome | Headless Chrome against `:8000` or `:3002` | **Active Test Suite** |
| **Backend Tests** | `pytest.ini` -> `tests/` | Pytest 9+ | 23 unit and integration tests | **Active Test Suite** |

---

## 3. Dependency and Data-Flow Map

### Data-Flow Lifecycle:
1. **Bootstrap**:
   - `backend/main.py` initializes `AppState`.
   - `src/data.py:get_demonstration_data()` loads `data/wastewise_sample_canteen_data.csv` (or generates 180 synthetic days if absent).
   - `src/model.py:DemandForecastingEngine` is fitted with 100 trees and evaluated on a 35-day chronological holdout split.
   - `src/planner.py:PreparationPlanner` is instantiated.
2. **Client Interaction**:
   - The user opens `http://127.0.0.1:8000` (or `http://localhost:3000` in dev).
   - `frontend/src/App.tsx` mounts and calls `fetchConfig` and `fetchOverview` via `frontend/src/api.ts`.
   - The user navigates routes via URL hashes: `#home`, `#overview`, `#demand-forecast`, `#prep-planner`, `#waste-risk`, `#performance`, `#data-model`, `#help`, `#privacy`, `#terms`, `#transparency`.
3. **Scenario Simulation & Batch Planning**:
   - Adjusting attendance, weather, or campus events triggers `POST /api/forecast`.
   - Setting prep parameters triggers `POST /api/plan`. The backend uses the Newsvendor Critical Ratio $CR = \frac{C_{\text{shortage}}}{C_{\text{shortage}} + C_{\text{surplus}}}$ blended with operator service preference ($0.55$) to size batches, calculate buffers, and establish mid-service refill triggers.
4. **Data Onboarding**:
   - Operators upload historical CSVs via `POST /api/data/upload`.
   - `src/data.py:validate_dataset()` sanitizes and checks for at least 14 service days, finite numbers, and required columns.
   - `engine.train_and_evaluate()` retrains the Random Forest on the new dataset. `is_synthetic` is updated to `False`.
5. **State Reset**:
   - `POST /api/data/reset` calls `state.reset_dataset()`, restoring the 180-day baseline.

---

## 4. Classification of Repository Files

### Category A: Definitely Required (Preserve Strictly)
*Active application code, runtime configuration, tests, build tools, assets, and documentation.*

| File / Directory | Role & Description | Active References |
| :--- | :--- | :--- |
| `backend/main.py` | FastAPI application exposing all `/api/*` endpoints and serving `frontend/dist/`. | Invoked by `run_website.ps1`, `run_website.bat`, `test_api.py`. |
| `src/config.py` | Central dish menu, costs, selling prices, shelf life, weather types, constants. | Imported by `backend/main.py`, `src/data.py`, `src/model.py`, `src/planner.py`, `src/metrics.py`. |
| `src/data.py` | Synthetic data generation, 180-day caching, and CSV validation. | Imported by `backend/main.py`, `tests/test_data.py`, `tests/test_api.py`. |
| `src/model.py` | Random Forest demand forecasting engine and chronological holdout evaluation. | Imported by `backend/main.py`, `tests/test_model.py`. |
| `src/planner.py` | Newsvendor Critical Ratio optimization and batch schedule planner. | Imported by `backend/main.py`, `src/metrics.py`, `tests/test_planner.py`. |
| `src/metrics.py` | Waste risk tiering and retrospective holdout policy simulation. | Imported by `backend/main.py`, `tests/test_metrics.py`. |
| `frontend/src/App.tsx` | Main application shell, routing, navigation, modal states, and footer. | Entry point referenced by `frontend/src/main.tsx`. |
| `frontend/src/workspace/*` (11 files) | Active views: `Home.tsx`, `Overview.tsx`, `Scenario.tsx`, `Rescue.tsx`, `Performance.tsx`, `Data.tsx`, `Guide.tsx`, `Charts.tsx`, `model.ts`, `ScenarioCompare.tsx`, `shared.tsx`. | Lazy-loaded and imported by `frontend/src/App.tsx`. |
| `frontend/src/index.css` | Comprehensive design system tokens (forest green & warm ivory) and print styles. | Imported by `frontend/src/main.tsx`. Tested by `test_tokens.py`. |
| `frontend/src/tokens.ts` | Theme palette and chart tokens matching `index.css`. | Imported by `workspace/Charts.tsx`. Tested by `test_tokens.py`. |
| `frontend/src/motion.tsx`, `motionTokens.ts` | Spring motion components and interaction physics. | Imported by `frontend/src/App.tsx` and `workspace/Guide.tsx`. |
| `frontend/src/MetalButton.tsx` | Specialized button component for calls to action. | Imported by `frontend/src/App.tsx`. |
| `frontend/src/api.ts`, `types.ts` | Frontend API client and TypeScript contract interfaces. | Imported across `App.tsx` and `workspace/*`. |
| `frontend/public/brand/*` | Official WasteWise mark assets (`wastewise-mark.png`, `wastewise-mark-64.png`, `wastewise-mark-96.png`). | Displayed in navigation header. |
| `frontend/public/fonts/*`, `src/fonts.css` | Self-hosted web fonts (Newsreader, Source Sans 3, Just Sans, Interwoven) and OFL licenses. | Loaded via `fonts.css` and `index.css`. |
| `frontend/public/favicon.svg`, `icons.svg` | Favicon and SVG iconography. | Referenced by `frontend/index.html`. |
| `data/wastewise_sample_canteen_data.csv` | 180-day baseline synthetic cafeteria dataset. | Loaded by `src/data.py:get_demonstration_data()`. |
| `run_website.ps1`, `run_website.bat` | Production website build and startup scripts. | Primary operator launch commands. |
| `requirements.txt`, `pytest.ini` | Python package manifests and test runner configuration. | Active environment setup. |
| `tests/*` (7 test files) | Pytest test suite covering API, data, metrics, model, planner, tokens, and pipelines. | Executed via `py -m pytest`. |
| `scripts/verify_frontend.py` | Official Chrome DevTools Protocol automated browser verification. | Documented in `README.md`. |
| `README.md`, `PRODUCT.md`, `DESIGN.md`, `DESIGN_REFINEMENT.md`, `.impeccable/design.json` | Project specifications, requirements, constraints, and design tokens. | Project documentation and drift tests. |

---

### Category B: Potentially Removable / Verified Disconnected Artifacts
*Files that are completely unreferenced by active application code and cause build failures.*

| File / Component | Role / Purpose | Referenced Anywhere? | Impact of Leaving | Impact of Removal |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/views/` (10 files) | Disconnected React view components from commit `22866e2` (`DataModelView.tsx`, `DemandForecastView.tsx`, `HelpCenterView.tsx`, `OverviewView.tsx`, `PerformanceImpactView.tsx`, `PreparationPlannerView.tsx`, `PrivacyPolicyView.tsx`, `TermsOfUseView.tsx`, `TransparencyView.tsx`, `WasteRiskMonitoringView.tsx`). | **No.** Unused in `App.tsx`, `workspace/`, or `main.tsx`. | Causes 44 TypeScript compilation errors due to missing `tokens` and unused variables under `noUnusedLocals`. | Fixes `tsc -b` and enables `npm run build` to succeed cleanly. |
| `frontend/src/components/` (15 files) | Disconnected components built for `frontend/src/views/` (`AppShell.tsx`, `BrandIntro.tsx`, `GuidedDemoModal.tsx`, `KeyboardShortcutsModal.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `UtilityMenu.tsx`, `common/AlertDecisionCard.tsx`, `common/DataTable.tsx`, `common/KpiCard.tsx`, `common/LimitationsModal.tsx`, `common/OverrideModal.tsx`, `common/PageHeader.tsx`, `common/SkeletonLoader.tsx`, `common/StatusBadge.tsx`). | **No.** Unused in `App.tsx`, `workspace/`, or `main.tsx`. | Causes 30 TypeScript compilation errors under `noUnusedLocals`. | Eliminates redundant component tree and fixes frontend build. |
| `frontend/src/App.css` | 1-line empty placeholder (`/* Cleared default Vite CSS */`). | **No.** `main.tsx` imports `./index.css`. | None (cosmetic). | Safe cleanup. |
| `frontend/src/assets/hero.png`, `react.svg`, `vite.svg` | Default Vite template starter assets. | **No.** Active logos are in `frontend/public/brand/` and `frontend/public/favicon.svg`. | None (cosmetic). | Safe cleanup. |

---

### Category C: Confirmed Dead Code or Redundant Artifacts
*Generated test artifacts and local files already ignored by Git.*

| Path | Description | Ignored by Git? | Recommendation |
| :--- | :--- | :--- | :--- |
| `page_*.png` (5 files in root) | Generated screenshots from Streamlit capture. | Yes (`.gitignore` line 39). | Retain in ignored local workspace or remove. |
| `rendered_overview*.png` (2 files in root) | Generated screenshots from Streamlit capture. | Yes (`.gitignore` line 40). | Retain in ignored local workspace or remove. |
| `screenshots_step2/`, `screenshots_step3/`, `screenshots_ux_refactor/` | Temporary milestone screenshots. | Yes (`.gitignore` lines 35-37). | Retained locally; already ignored by Git. |

---

### Category D: Uncertain or Potentially Important (Preserve Strictly)
*Files with historical, demonstration, or milestone significance.*

| Path | Description | Reason for Preservation |
| :--- | :--- | :--- |
| `app.py`, `src/ui_theme.py`, `src/views/*` (6 files) | Streamlit reference prototype. | Explicitly preserved for reference per `README.md` lines 90-91. |
| `capture_all_pages.py`, `capture_screenshot.py`, `capture_scrolled.py`, `check_radio.py`, `test_ui_screens.py` | Streamlit capture utilities. | Supports headless capture of the reference Streamlit prototype. |
| `verify_motion.py`, `verify_simplified_ux.py`, `verify_step2_screens.py`, `verify_step3_screens.py` | Milestone verification scripts. | Validates motion, responsive breakpoints, and specific historical milestones. |
| `snapshots/api_baseline_snapshot.json` | JSON snapshot of API responses. | Preserved for regression and drift diffing. |

---

## 5. Dependency Audit

### Python (`requirements.txt`)

```text
streamlit>=1.36.0,<2.0.0      # Required by app.py and src/views/*.py (Reference Prototype)
pandas>=2.0.0,<3.1.0          # Required by backend, data, model, planner, metrics, tests
numpy>=1.26.0,<2.6.0          # Required by data, model, planner, metrics, tests
scikit-learn>=1.4.0,<2.0.0    # Required by src/model.py (RandomForestRegressor, metrics)
scipy>=1.12.0,<1.19.0         # Required by src/planner.py (scipy.stats.norm)
plotly>=5.20.0,<8.0.0         # Required by src/ui_theme.py and Streamlit views
pytest>=8.0.0,<10.0.0         # Required for automated test suite execution
fastapi>=0.110.0,<1.0.0       # Required by backend/main.py
uvicorn>=0.29.0,<1.0.0        # Required to serve FastAPI backend
python-multipart>=0.0.9,<1.0.0# Required for CSV file upload in FastAPI
```

*Audit Assessment*: Every dependency in `requirements.txt` is directly imported and required by either the active FastAPI backend, the computational engine, the test suite, or the reference Streamlit prototype. None should be removed.

### Frontend (`frontend/package.json`)

```json
"dependencies": {
  "@tailwindcss/vite": "^4.3.3",   // Active Vite CSS plugin
  "framer-motion": "^14.3.1",       // Active spring physics in App.tsx & motion.tsx
  "lucide-react": "^1.59.0",        // Active iconography in App.tsx & workspace/*
  "react": "^19.3.1",               // Active React framework
  "react-dom": "^19.3.1",           // Active DOM renderer
  "recharts": "^3.10.1",            // Active charting in workspace/Charts.tsx
  "tailwindcss": "^4.3.3"           // Active utility framework
},
"devDependencies": {
  "@types/node": "^24.19.2",
  "@types/react": "^19.3.0",
  "@types/react-dom": "^19.3.0",
  "@vitejs/plugin-react": "^6.1.2",
  "oxlint": "^1.88.0",
  "prettier": "^3.9.10",
  "typescript": "~7.0.2",
  "vite": "^8.3.4"
}
```

*Audit Assessment*: All 7 runtime dependencies and 8 devDependencies are actively utilized. None are unused.

---

## 6. Baseline Verification Results (Pre-Cleanup)

| Check | Command | Pre-Cleanup Result | Details |
| :--- | :--- | :--- | :--- |
| **Backend Pytest** | `py -m pytest -v` | **PASSED (23/23)** | All tests passed in 5.97s. |
| **Frontend Vite Build** | `npx vite build` | **PASSED** | Built in 1.29s with 0 errors. |
| **Frontend Lint** | `npm run lint` | **PASSED (with warnings)** | 0 errors, 76 warnings (all 76 warnings are unused vars in abandoned `views/` and `components/`). |
| **Frontend Type Check** | `tsc -b` | **FAILED (74 errors)** | Fails strictly due to orphaned `frontend/src/views/` and `frontend/src/components/`. |
| **Git Working Tree** | `git status` | Clean branch `audit-and-cleanup` created. Uncommitted changes tracked safely. |

---

## 7. Backend Quality Review & Future Improvements

### Findings Categorization:

1. **Category 1 — Immediate Safe Cleanup**:
   - Resolve the TypeScript build blocker so `npm run build` (`tsc -b && vite build`) executes cleanly without error.
2. **Category 2 — Correctness & Reliability**:
   - In `backend/main.py:get_overview()`, the endpoint loops over `MENU_ITEMS.keys()` rather than `state.dataset_df["menu_item"].unique()`. If an uploaded CSV has custom dish names, they will not appear in the Overview KPI calculation.
   - In `backend/main.py:upload_csv()`, model retraining uses `holdout_days=min(35, max(5, df["date"].nunique() // 5))`. For a minimum 14-day dataset, `14 // 5 = 2`, which hits the `max(5, 2) = 5` day holdout, leaving only 9 training days. A clearer check should enforce a minimum 21 days for production reliability.
3. **Category 3 — Security**:
   - `backend/main.py` uses `allow_origins=["*"]` with `allow_credentials=True`. This is acceptable for local prototype evaluation on `127.0.0.1`, but must be restricted to explicit origins in production.
   - No rate limiting or upload payload size caps on `/api/data/upload` beyond server memory.
4. **Category 4 — Architectural Improvements for Backend-Hardening Phase**:
   - **Persistence**: `AppState` stores the active dataset in process memory. A process restart discards uploaded operator data. Implement SQLite or PostgreSQL persistence with Alembic migrations.
   - **Async Training Worker**: Ingestion and Random Forest retraining on `/api/data/upload` run synchronously on the main asyncio event loop, blocking concurrent API requests. Offload to `asyncio.to_thread` or a Celery/Redis task queue.
   - **Service Layer Separation**: Extract data aggregation, KPI computations, and scenario assembly from `backend/main.py` into dedicated service modules (`services/forecast_service.py`, `services/overview_service.py`).
   - **Authentication & Multi-Tenancy**: Introduce operator authentication and canteen-isolated workspaces.
5. **Category 5 — Unverified Concerns**:
   - Memory behavior under large multi-megabyte CSV uploads on low-resource container deployments.

---

## 8. Prioritized Cleanup Plan

To maintain complete project stability and respect the user's instructions:
1. **Step 1 (High Confidence)**: Safely archive or remove the disconnected, orphaned `frontend/src/views/` and `frontend/src/components/` directories. These are verified 100% unreferenced by `App.tsx` and `workspace/`, and their removal directly fixes the 74 TypeScript errors in `tsc -b`.
2. **Step 2 (High Confidence)**: Clean unreferenced placeholder files: `frontend/src/App.css` and default starter assets (`frontend/src/assets/hero.png`, `react.svg`, `vite.svg`).
3. **Step 3 (Verification)**: Re-run `tsc -b && vite build` (`npm run build`), `py -m pytest`, and `scripts/verify_frontend.py` to confirm zero regressions and verify the active application is 100% operational.
4. **Step 4 (Reporting)**: Produce `CODEBASE_CLEANUP_REPORT.md` documenting every modification with before-and-after results.
