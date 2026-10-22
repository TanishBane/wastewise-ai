# WasteWise AI — Baseline Verification & Pre-Upgrade Audit Report

**Date:** October 22, 2026  
**Branch:** `feature/complete-upgrade`  
**Backup Reference:** `backup/pre-complete-upgrade` (pinned at commit `22866e2`)  
**Workspace:** `C:\Users\gmatr\.gemini\antigravity\scratch\wastewise-ai`  

---

## 1. Git State & Branch Strategy

### Repository Verification
- **Repository Type**: Genuine Git repository (`git status` and `.git` verified).
- **Remote**: `origin` -> `https://github.com/TanishBane/wastewise-ai.git` (Fetch & Push).
- **Initial Working Commit**: `22866e2 Initial WasteWise AI application`.

### Branch Protection Scheme
To strictly protect the working baseline before implementing new features:
1. `backup/pre-complete-upgrade`: Created and pointing immutably to commit `22866e2`.
2. `audit-and-cleanup`: Retains the initial cleanup pass.
3. `feature/complete-upgrade`: Active feature branch where all Phase 0-5 engineering is performed.
4. `main`: Preserved intact; no direct commits or force-pushes.

---

## 2. Investigation of Previous Browser Verification Failures

During the prior audit, `scripts/verify_frontend.py` failed during execution against `http://127.0.0.1:8000`. A thorough forensic examination was performed by inspecting script source code, CDP network events, DOM expectations, font declarations, and application routing.

### Root Causes Identified & Classified

#### Finding 1: Default Route Navigation Expectation vs `#home`
- **Error**: `AssertionError: Timed out: document.querySelector('.menu-table tbody tr')` at line 59.
- **Root Cause**: `scripts/verify_frontend.py` navigates to the base URL (`Page.navigate(url)` without a hash fragment) and immediately waits for the kitchen menu table (`.menu-table tbody tr`). However, in `frontend/src/App.tsx`, an unhashed URL defaults to `home` (`<Home />`), which renders a summary overview card rather than the detailed tabular menu grid (`<Overview />`).
- **Classification**: **Route / Selector Misalignment**. When navigating directly to `/#overview`, `.menu-table tbody tr` renders immediately and passes.
- **Remedy**: Update default fallback handling in `App.tsx` and brand click destinations so that root navigation lands on the primary operational overview, or support `#home` navigation cleanly.

#### Finding 2: Unregistered Interwoven Font
- **Error**: `AssertionError: supplied Interwoven font loaded` at line 62.
- **Root Cause**: `frontend/public/fonts/Interwoven.ttf` and `Interwoven-NOTICE.txt` are present in the repository (licensed font supplied by project owner). `scripts/verify_frontend.py` asserts that `document.fonts` contains `Interwoven` and that `getComputedStyle(document.body).fontFamily` includes `Interwoven`. However, `frontend/src/fonts.css` only registered `Just Sans`, `Newsreader`, and `Source Sans 3`, omitting the `@font-face` declaration for `Interwoven`.
- **Classification**: **Application Regression / Incomplete Asset Registration**.
- **Remedy**: Register the `@font-face` declaration for `Interwoven` in `frontend/src/fonts.css` and incorporate `Interwoven` into `--font-body` and `--font-display` in `frontend/src/index.css`.

#### Finding 3: Missing Command Palette / Search Trigger
- **Error**: `verify_frontend.py` line 93 expects `await click('Find a page', '.search-trigger')` and opens a command dialog with `[aria-label="Search pages"]`.
- **Root Cause**: Both `README.md` and `frontend/README.md` specify: *"Searchable page command menu (Ctrl/Cmd K), keyboard-accessible native dialogs..."*. However, the `.search-trigger` button and command menu dialog were missing from `frontend/src/App.tsx`.
- **Classification**: **Missing Documented Feature**.
- **Remedy**: Implement the keyboard-accessible Command Palette (`Ctrl/Cmd K`, search trigger in workspace header) in `frontend/src/App.tsx`.

---

## 3. Real Route Enumeration from Application Source

Previous reports inconsistently reported 6 or 10 routes. Inspection of `frontend/src/App.tsx` (`links` array and `allPages` array) confirms exactly **11 active, distinct routes**:

| # | Route Hash | Navigation Label / Purpose | Component Rendered | Source Location |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `#home` | Home / Welcome Dashboard | `Home.tsx` | `frontend/src/workspace/Home.tsx` |
| 2 | `#overview` | Kitchen Overview & Menu Priorities | `Overview.tsx` | `frontend/src/workspace/Overview.tsx` |
| 3 | `#demand-forecast` | Demand Forecast & Scenario Workbench | `Scenario.tsx` (kind="demand-forecast") | `frontend/src/workspace/Scenario.tsx` |
| 4 | `#prep-planner` | Preparation Planner & Batch Allocations | `Scenario.tsx` (kind="prep-planner") | `frontend/src/workspace/Scenario.tsx` |
| 5 | `#waste-risk` | Surplus Rescue & Waste-Risk Triage | `Rescue.tsx` | `frontend/src/workspace/Rescue.tsx` |
| 6 | `#performance` | Performance & Chronological Holdout Impact | `Performance.tsx` | `frontend/src/workspace/Performance.tsx` |
| 7 | `#data-model` | Data Management, Upload & Model Audit | `Data.tsx` | `frontend/src/workspace/Data.tsx` |
| 8 | `#help` | Kitchen Field Guide & Operator Playbook | `Guide.tsx` (page="help") | `frontend/src/workspace/Guide.tsx` |
| 9 | `#privacy` | Data Handling & Local Execution Boundaries | `Guide.tsx` (page="privacy") | `frontend/src/workspace/Guide.tsx` |
| 10 | `#terms` | Operational Advisory & Food Safety Scope | `Guide.tsx` (page="terms") | `frontend/src/workspace/Guide.tsx` |
| 11 | `#transparency` | Model Specifications & Newsvendor Math | `Guide.tsx` (page="transparency") | `frontend/src/workspace/Guide.tsx` |

---

## 4. Baseline Test & Build Verification Results

| Verification Test | Command | Result | Duration | Details |
| :--- | :--- | :---: | :---: | :--- |
| **Backend Unit & Integration Tests** | `py -m pytest tests -v` | **PASSED** | 3.99s | 23/23 tests passed. |
| **Frontend TypeScript Build** | `tsc -b` | **PASSED** | 785ms | 0 errors. |
| **Frontend Production Build** | `vite build` | **PASSED** | 785ms | 13 chunks generated in `dist/`. |
| **Frontend Combined Build** | `npm run build` | **PASSED** | 785ms | Clean exit 0. |
| **Frontend Linter** | `npm run lint` (`oxlint`) | **PASSED** | 49ms | 0 errors, 0 warnings across 21 files. |
| **Frontend Formatter** | `npm run format:check` | **PASSED** | 2.1s | All matched files use Prettier style. |
| **FastAPI Backend Health** | `GET /api/health` | **PASSED** | 12ms | `status: healthy`, `model_trained: true`. |
| **Overview Metrics Endpoint** | `GET /api/overview` | **PASSED** | 28ms | 161 demand, 168 prep, 7 surplus, ₹887 cost. |
| **Responsive UI Checks** | `py verify_simplified_ux.py` | **PASSED** | 18.2s | 12 screenshots verified (desktop, tablet, mobile). |

---

## 5. Unchanged Baseline Metrics Lock

The following figures serve as the strict reference baseline. Any modification in subsequent phases must not introduce unexplainable mathematical drift:
- **Forecast Demand (Total)**: `161` portions
- **Recommended Preparation (Total)**: `168` portions
- **Potential Surplus**: `7` portions
- **Cost at Risk (Naive Baseline Exposure)**: `₹887`
- **Holdout Machine Learning WAPE**: `8.4%`
- **Rolling Weekday Baseline WAPE**: `10.8%`
- **Machine Learning MAE**: `4.76` (or `4.8`) portions
- **Holdout Sample Size**: `280` records (35 service days across 8 dishes)
