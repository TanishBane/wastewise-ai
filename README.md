<div align="center">

<img src="docs/assets/brand/wastewise-mark.svg" alt="WasteWise AI Logo" width="80" height="80" />

# WasteWise AI

### Enterprise Canteen Demand Forecasting & Food-Waste Reduction
**ADAPPT 5.0 — AI in FoodTech**

[![CI](https://github.com/TanishBane/wastewise-ai/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TanishBane/wastewise-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-367A59.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%20%7C%203.12%20%7C%203.14-14392F.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-087E8B.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.3-4263D8.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-3178C6.svg)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vite.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38BDF8.svg)](https://tailwindcss.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-Random%20Forest-F7931E.svg)](https://scikit-learn.org/)
[![Pytest](https://img.shields.io/badge/Pytest-59%20Passed-brightgreen.svg)](tests/)
[![Linter: Oxlint](https://img.shields.io/badge/Linter-Oxlint%20Clean-blueviolet.svg)](https://oxc.rs/)
[![Mode](https://img.shields.io/badge/Mode-Public%20Interactive%20Demo-10B981.svg)](#quick-start)

<p align="center">
  <strong>Predict smarter. Prepare better. Waste less.</strong><br>
  An operational intelligence platform combining machine-learning demand forecasting with asymmetric Newsvendor batch planning, proactive surplus triage, and interactive kitchen workflows.
</p>

<p align="center">
  <a href="#application-screenshot-gallery"><strong>Explore Screens</strong></a> •
  <a href="#system-architecture--workflow"><strong>System Architecture</strong></a> •
  <a href="#operational-feature-deep-dive"><strong>Feature Deep Dive</strong></a> •
  <a href="#local-installation--quick-start"><strong>Quick Start</strong></a> •
  <a href="#mathematical-formulations"><strong>Math & Models</strong></a> •
  <a href="#production-deployment-guides"><strong>Deployment</strong></a>
</p>

---

> 🌐 **Public Interactive Demo Mode**: This repository runs out-of-the-box in **Public Demo Mode** with **zero account creation, zero login screens, and zero cloud database prerequisites**. All operational capabilities are immediately accessible using calibrated demonstration data and an embedded SQLite transactional store.

</div>

---

## Table of Contents

- [Overview & The Kitchen Operator Dilemma](#overview--the-kitchen-operator-dilemma)
- [Application Screenshot Gallery](#application-screenshot-gallery)
- [System Architecture & Workflow](#system-architecture--workflow)
  - [1. High-Level Architecture](#1-high-level-architecture)
  - [2. Operational Shift Lifecycle](#2-operational-shift-lifecycle)
  - [3. Mathematical Decision Pipeline](#3-mathematical-decision-pipeline)
  - [4. Multi-Tenant Demo Isolation vs Enterprise RLS](#4-multi-tenant-demo-isolation-vs-enterprise-rls)
- [Operational Feature Deep Dive](#operational-feature-deep-dive)
  - [1. Calibrated Demand Forecasting](#1-calibrated-demand-forecasting)
  - [2. Economic Preparation Planning (Newsvendor Model)](#2-economic-preparation-planning-newsvendor-model)
  - [3. Proactive Surplus Triage & Rescue](#3-proactive-surplus-triage--rescue)
  - [4. Multi-Tenant Data Isolation & Security](#4-multi-tenant-data-isolation--security)
  - [5. Physical Shift Outcome Auditing](#5-physical-shift-outcome-auditing)
- [Mathematical Formulations](#mathematical-formulations)
- [Technology Stack Matrix](#technology-stack-matrix)
- [Repository Structure](#repository-structure)
- [Local Installation & Quick Start](#local-installation--quick-start)
- [API Specification Overview](#api-specification-overview)
- [Model Evaluation & Data Provenance](#model-evaluation--data-provenance)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Deployment Guides](#production-deployment-guides)
- [Contributing & Community](#contributing--community)
- [Security Policy](#security-policy)
- [License](#license)

---

## Overview & The Kitchen Operator Dilemma

In institutional dining halls, commercial canteens, and university food centers, kitchen managers face an asymmetric daily dilemma:

$$\text{Cook too much} \longrightarrow \text{Spoiled ingredients, organic waste, carbon emissions, and margin destruction.}$$
$$\text{Cook too little} \longrightarrow \text{Early stockouts, dissatisfied diners, queue congestion, and forfeited revenue.}$$

Traditional fixed-batch cooking relies on static spreadsheets and kitchen rule-of-thumb guesswork, routinely causing **15% to 25% avoidable food waste**.

**WasteWise AI** addresses this challenge with a unified culinary intelligence platform:

1. **Multi-Signal Demand Estimation**: Combines day-of-week seasonality, academic calendar schedules, weather classifications, and attendance signals using a calibrated Random Forest regressor with 10th–90th percentile prediction bands.
2. **Asymmetric Newsvendor Batch Planning**: Determines risk-adjusted cooking targets by balancing ingredient spoilage costs ($C_o$) against diner stockout penalties ($C_u$) via the critical fractile ratio.
3. **Staggered Two-Phase Batching**: Automatically recommends an initial conservative cook buffer (60–65%) while holding mise-en-place for designated mid-shift refill thresholds.
4. **Proactive Surplus Rescue Protocols**: Detects surplus risks hours before service completion, generating immediate triage protocols (flash discounts, university food pantry donation, or composting).
5. **Zero-Friction Demo Architecture**: Operates with zero required cloud infrastructure in local demo mode while providing a verified migration path for enterprise multi-tenant PostgreSQL with Row-Level Security (RLS).
6. **Empirical Shift Reconciliation**: Logs physical outcomes (cooked, sold, leftovers, waste root-cause taxonomy) to close the feedback loop and audit against model drift.

---

## Application Screenshot Gallery

All screenshots represent verified live renders of the WasteWise AI application running the **Botanical Editorial Design System** across desktop (1440×900) and mobile (390×844) viewports:

| Viewport / Screen | Live Interface Preview | Core Operational Capabilities |
| :--- | :--- | :--- |
| **Botanical Editorial Hero**<br>`docs/assets/screenshots/home-hero.png` | ![Home Desktop Hero](docs/assets/screenshots/home-hero.png) | Executive landing stage (1440×900) featuring natural culinary editorial palette (`#14392f`, `#f6f5ef`), real-time operational telemetry pills, and dynamic action controls. |
| **Kitchen Command Center**<br>`docs/assets/screenshots/kitchen-overview.png` | ![Kitchen Command Center](docs/assets/screenshots/kitchen-overview.png) | Live shift overview displaying key operational indicators: **161** portions expected demand, **168** recommended prep, **7** portions surplus risk, **₹887** cost-at-risk, and prioritized decision cards. |
| **Demand Forecasting Engine**<br>`docs/assets/screenshots/demand-forecast.png` | ![Demand Forecast](docs/assets/screenshots/demand-forecast.png) | Probabilistic demand forecasting with interactive weather/event sliders, historical scatterplots, and 10th–90th percentile uncertainty interval bounds. |
| **Preparation Planner**<br>`docs/assets/screenshots/preparation-planner.png` | ![Preparation Planner](docs/assets/screenshots/preparation-planner.png) | Stochastic Newsvendor preparation planner with existing inventory deduction, staggered 65/35 batch allocation, and printable physical kitchen preparation sheet. |
| **Surplus Rescue Queue**<br>`docs/assets/screenshots/surplus-rescue.png` | ![Surplus Rescue](docs/assets/screenshots/surplus-rescue.png) | Proactive surplus triage categorized into High, Moderate, and Low risk tiers with 4-hour shelf-life dispatch and direct financial cost-at-risk estimation. |
| **Holdout Model Evaluation**<br>`docs/assets/screenshots/performance-impact.png` | ![Performance & Impact](docs/assets/screenshots/performance-impact.png) | Transparent retrospective evaluation on a 280-record chronological holdout set, demonstrating **8.4% WAPE** vs **10.8%** weekday baseline. |
| **Data Provenance & Upload**<br>`docs/assets/screenshots/data-model.png` | ![Data Model & Upload](docs/assets/screenshots/data-model.png) | Operator dataset management interface showing active record count, data schema validation checklist, provenance disclaimers, and CSV upload dropzone. |
| **Full-Width Global Search**<br>`docs/assets/screenshots/quick-search-modal.png` | ![Quick Search Modal](docs/assets/screenshots/quick-search-modal.png) | Instant keyboard-accessible (`/` or `Ctrl+K`) full-width search dialog with category filters (Dishes, Routes, Actions, Docs) and real-time navigation. |
| **Canteen Bento Grid**<br>`docs/assets/screenshots/canteen-bento.png` | ![Canteen Bento Grid](docs/assets/screenshots/canteen-bento.png) | Editorial 6-box bento grid showcasing real kitchen operational realities, HACCP temperature thresholds, and botanical palette styling. |
| **Mobile Ergonomics**<br>`docs/assets/screenshots/mobile-home.png` | <p align="center"><img src="docs/assets/screenshots/mobile-home.png" alt="Mobile Ergonomics" width="280" /></p> | Fully responsive mobile viewport (390×844) with single-column layout, touch-optimized ergonomics, and zero horizontal scroll overflow. |

---

## System Architecture & Workflow

### 1. High-Level Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 19 + TypeScript + Vite 8)"]
        UI["Botanical Editorial UI<br/>(Tailwind CSS v4 + Motion React)"]
        State["Workspace State & Cache"]
        SearchModal["Quick Search Dialog (Keyboard '/')"]
        Telemetry["Client-Side Sentry & PostHog Telemetry"]
    end

    subgraph Gateway["API Gateway & Demo Isolation (FastAPI 0.115+)"]
        CORS["CORS Middleware"]
        AuthGuard["Demo Guard & Org Resolver<br/>(Enforces DEFAULT_ORG_ID in Demo Mode)"]
        Routes["REST Endpoint Routers (/api/v1)"]
    end

    subgraph ServiceLayer["Core Domain Services (backend/services/)"]
        OrgRegistry["OrgStateRegistry<br/>(Isolated In-Memory State & Model Cache)"]
        IngestSvc["IngestionService<br/>(CSV Validation, BOM Decode, Training)"]
        ForecastSvc["ForecastingService<br/>(Ensemble Regressor & Quantiles)"]
        PlanSvc["PlanningService<br/>(Asymmetric Newsvendor Math)"]
        RescueSvc["WasteRescueService<br/>(Financial Risk & Triage Logic)"]
        ReportSvc["ReportingService<br/>(Shift Outcome Auditing & KPI Rollup)"]
    end

    subgraph MLEngine["ML & Optimization Engine (src/)"]
        RFEngine["DemandForecastingEngine<br/>(RandomForestRegressor, n=100)"]
        NVPlanner["PreparationPlanner<br/>(Critical Ratio Optimization & Staggered Batches)"]
        SimEval["Holdout Evaluator<br/>(WAPE & Waste Reduction Simulation)"]
    end

    subgraph Storage["Persistence Layer"]
        SQLiteDB[("SQLite WAL Storage<br/>(data/wastewise.db)")]
        Postgres[("Optional PostgreSQL / Supabase<br/>(Row-Level Security)")]
    end

    Client -->|HTTP / JSON Requests| Gateway
    Gateway --> ServiceLayer
    ServiceLayer --> MLEngine
    ServiceLayer --> SQLiteDB
    ServiceLayer -.->|When DATABASE_URL configured| Postgres
```

### 2. Operational Shift Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Mgr as Kitchen Supervisor
    actor Crew as Kitchen Staff
    participant API as WasteWise AI API
    participant Engine as Forecasting & Newsvendor Engine
    participant DB as SQLite DB (WAL)

    Note over Mgr,DB: 06:30 — Morning Planning Cadence
    Mgr->>API: Query Daily Operational Context (Weather, Events, Day of Week)
    API->>Engine: Generate Dish Point Estimates & 10th-90th Percentile Bounds
    Engine-->>API: Expected Demand (e.g. 161 portions) + Prediction Intervals
    Mgr->>API: Input Current Inventory & Unit Cost Parameters (Cu, Co)
    API->>Engine: Calculate Critical Fractile (q*) & Two-Phase Batch Split
    Engine-->>API: Target Prep (168 portions) = Batch 1 (105 portions) + Refill Trigger
    Mgr->>Crew: Print Physical Preparation Sheet with Refill Checkpoints

    Note over Crew,API: 12:30 — Mid-Service Execution
    Crew->>Crew: Fire Batch 1; Verify Food-Safe Hot Holding (>65°C)
    alt Inventory Drops Below Refill Trigger (12:45)
        Crew->>Crew: Fire Batch 2 Mise-en-Place
    else Demand Velocity Is Low
        Crew->>Crew: Retain Batch 2 Ingredients Chilled for Tomorrow
    end

    Note over Mgr,DB: 13:45 — Surplus Triage & Rescue
    Mgr->>API: Inspect Surplus Risk Queue
    API->>Engine: Evaluate 4-Hour Shelf Life & Unsold Inventory Velocity
    API-->>Mgr: Priority Triage (Flash Discount / Food Bank Donation / Compost)

    Note over Mgr,DB: 14:30 — End-of-Shift Reconciliation
    Mgr->>API: Log Measured Shift Outcomes (Cooked, Sold, Leftover, Waste Root Cause)
    API->>DB: Persist Outcome Record under Organization Tenant
    DB-->>API: Outcome Saved (Invariant Check: Cooked = Sold + Leftover)
    API-->>Mgr: Reconciliation Complete & Shift Audit Confirmed
```

### 3. Mathematical Decision Pipeline

```mermaid
flowchart LR
    subgraph Inputs["Multi-Signal Context"]
        A["Day of Week / Season"]
        B["Academic Calendar / Events"]
        C["Weather (Rain, Temp)"]
        D["Campus Attendance Ratio"]
    end

    subgraph Model["Predictive Engine"]
        E["Random Forest Ensemble<br/>(100 Estimators)"]
        F["Quantile Regressor<br/>(P10, P50, P90)"]
    end

    subgraph Optimization["Newsvendor Optimizer"]
        G["Critical Ratio:<br/>CF = Cu / (Cu + Co)"]
        H["Optimal Fractile Target:<br/>P(D <= q*) = CF"]
        I["Inventory Deduction:<br/>Net Prep = max(0, q* - Inv)"]
    end

    subgraph Batching["Kitchen Execution"]
        J["Batch 1 (Initial Cook):<br/>60-65% of Net Prep"]
        K["Batch 2 (Refill Trigger):<br/>Held Mise-en-Place"]
    end

    Inputs --> Model
    Model --> Optimization
    Optimization --> Batching
```

### 4. Multi-Tenant Demo Isolation vs Enterprise RLS

```mermaid
flowchart TD
    subgraph Inbound["Inbound Request"]
        REQ["HTTP Request + Headers"]
    end

    subgraph DemoBranch["Public Demonstration Mode (Default)"]
        Guard["Fail-Closed Org Resolver"]
        Check{"X-Organization-Id Present?"}
        AllowDefault["Set Tenant = DEFAULT_ORG_ID ('guest')"]
        RejectSpoof["401 Unauthorized<br/>(OrgMismatchError)"]
        MemoryRegistry["OrgStateRegistry (Per-Org Memory Sandbox)"]
        SQLiteFile[("Local SQLite Storage (data/wastewise.db)")]
    end

    subgraph EnterpriseBranch["Optional Enterprise Mode (PostgreSQL)"]
        JWTVerify["Cryptographic JWT Verification"]
        ExtractOrg["Extract tenant_id from Claims"]
        PostgresRLS[("PostgreSQL Database<br/>(Row-Level Security Policies)")]
    end

    REQ --> Guard
    Guard -->|WASTEWISE_DEMO_MODE=true| Check
    Check -->|No header or 'guest'| AllowDefault
    Check -->|Attempted Non-Guest Org| RejectSpoof
    AllowDefault --> MemoryRegistry --> SQLiteFile

    Guard -.->|WASTEWISE_DEMO_MODE=false| JWTVerify
    JWTVerify -.-> ExtractOrg -.-> PostgresRLS
```

---

## Operational Feature Deep Dive

### 1. Calibrated Demand Forecasting

The forecasting engine utilizes a scikit-learn `RandomForestRegressor` ensemble specifically engineered for food-service demand dynamics:
- **Feature Pipeline**: Integrates cyclic day-of-week encodings, semester academic calendar progress, campus attendance ratios, local weather classifications (Clear, Rainy, Overcast), ambient temperature, and scheduled exam/cultural event indicators.
- **Uncertainty Interval Estimation**: Computes empirical 10th and 90th percentile prediction intervals across individual trees in the forest ensemble ($n_{\text{estimators}} = 100$). This provides kitchen supervisors with realistic uncertainty bounds rather than an over-confident single point estimate.
- **Dynamic Scenario Simulation**: Kitchen supervisors can test hypothetical operating conditions (e.g., sudden monsoon rainfall or campus festival attendance surges) to preview demand shifts in real time.

### 2. Economic Preparation Planning (Newsvendor Model)

Commercial kitchens suffer from asymmetric losses. Discarded food incurs direct ingredient costs, while running out of a popular meal forfeits revenue and damages customer trust. WasteWise AI formulates preparation targets using classical Newsvendor optimization:

$$\text{Critical Fractile } (CF) = \frac{C_u}{C_u + C_o}$$

Where:
- $C_u$ (**Cost of Underage**): The economic penalty of serving one portion too few (gross margin loss + diner stockout friction penalty).
- $C_o$ (**Cost of Overage**): The direct ingredient cost of producing one portion that spoils unsold.

The optimal target quantity $q^*$ satisfies:

$$P(D \le q^*) = CF$$

- **Inventory-Aware Deduction**: Automatically subtracts pre-existing, food-safe inventory from $q^*$ to determine net production requirements: $\text{Net Prep} = \max(0, q^* - \text{Inventory})$.
- **Staggered Two-Phase Batching**: Automatically breaks the net target into **Batch 1** (initial cook, 60–65%) and **Batch 2** (held mise-en-place), establishing explicit time and stock thresholds for mid-service refill triggers.
- **Printable Kitchen Sheet**: Generates a print-styled physical kitchen preparation sheet complete with batch numbers, refill checkpoints, supervisor sign-offs, and HACCP holding temperature check lines (>65°C hot holding, <5°C cold holding).

### 3. Proactive Surplus Triage & Rescue

Rather than treating leftovers as an inevitable end-of-day loss, the Surplus Rescue engine continuously classifies dish surplus risk into three operational tiers:
- **High Risk**: Discontinue ongoing batch replenishment immediately; apply instant flash discounts or package for immediate campus food-bank pickup.
- **Moderate Risk**: Re-portion into combo offerings or repurpose proteins for evening meal service.
- **Low Risk**: Standard service cadence; demand velocity matches planned portions.

Each recommendation includes calculated financial cost-at-risk based on dish unit production costs:

$$\text{Financial Cost at Risk} = \text{Surplus Portions} \times C_o$$

### 4. Multi-Tenant Data Isolation & Security

WasteWise AI is built with a dual-mode data isolation and security architecture:
- **Public Demonstration Mode**: In public demo mode (`WASTEWISE_DEMO_MODE=true`), all operational endpoints operate seamlessly without requiring user authentication or registration. Requests are strictly locked to `DEFAULT_ORG_ID` (`guest`). Any unauthenticated attempt to forge or supply a non-default `X-Organization-Id` header is rejected immediately with HTTP 401 (`OrgMismatchError`).
- **`OrgStateRegistry` Isolation**: The Python backend maintains isolated in-memory model instances, active training sets, and operational parameters per organization, ensuring complete multi-tenant safety even in memory.
- **Zero Cloud Database Requirement**: Demonstration state persists reliably to local SQLite storage (`data/wastewise.db`) without requiring external cloud databases or third-party auth services.
- **Enterprise Multi-Tenancy & PostgreSQL RLS (Historical / Optional)**: For private enterprise multi-tenant deployments, the codebase retains database migrations (`supabase/migrations/`) supporting PostgreSQL Row-Level Security (RLS) policies and cryptographically verified JWT authentication.

### 5. Physical Shift Outcome Auditing

To maintain accountability and close the feedback loop for model retraining, kitchen operators record daily shift outcomes:
- **Mathematical Invariant Enforcement**:

  $$\text{Portions Prepared} = \text{Portions Sold} + \text{Portions Leftover}$$

- **Standardized Root-Cause Taxonomy**: Categorizes surplus using structured operational codes:
  - `overproduction` (preparation exceeded actual demand)
  - `spoilage` (ingredient temperature breach or holding failure)
  - `quality_issue` (culinary error or recipe variance)
  - `equipment_failure` (steam table or warmer failure)
- **Model Drift Auditing**: Historical outcomes feed directly into drift detection models, alerting managers when baseline assumptions diverge from physical trends.

---

## Mathematical Formulations

### 1. Weighted Absolute Percentage Error (WAPE)
Model accuracy is evaluated across holdout records using WAPE, which weights percentage errors by portion volume to prevent small-batch dishes from distorting aggregate evaluation:

$$\text{WAPE} = \frac{\sum_{t=1}^N |A_t - F_t|}{\sum_{t=1}^N A_t}$$

Where $A_t$ represents actual observed portion demand and $F_t$ represents the model forecast. On the 280-record holdout set, WasteWise AI achieves **8.4% WAPE**, outperforming the 10.8% weekday historical baseline.

### 2. Newsvendor Expected Profit Optimization
The optimal preparation quantity $q^*$ maximizes the expected culinary profit function:

$$\mathbb{E}[\Pi(q)] = p \cdot \mathbb{E}[\min(q, D)] - c \cdot q - s \cdot \mathbb{E}[\max(0, q - D)]$$

Where $p$ is portion selling price, $c$ is unit production cost, and $s$ is salvage value (typically 0 for unsold cooked meals).

### 3. Holding Time Decay & Spoilage Hazard
For prepared hot items held under food-safe display (>65°C), the surplus risk hazard function $h(t)$ increases as the 4-hour shelf-life limit approaches:

$$h(t) = \lambda \left(\frac{t}{T_{\text{max}}}\right)^{\gamma - 1}, \quad T_{\text{max}} = 4.0\text{ hours}$$

---

## Technology Stack Matrix

| Layer | Technologies & Packages | Version | Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) | React 19.3, TS 5.9+ | Concurrent rendering, strict type checking, and modular component boundaries. |
| **Build & Tooling** | [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/) | Vite 8.3, Tailwind v4.3 | Instant HMR dev server, lightning-fast production bundle, and modern `@theme` token styling. |
| **Animation & Motion** | [Motion for React](https://motion.dev/) | 12.4+ | Subtle culinary interactions, liquid button shivering effects, and `prefers-reduced-motion` safety. |
| **UI Components & Icons** | [Lucide React](https://lucide.dev/) | 1.16+ | Accessible SVG icon library with standardized optical sizing and semantic coloring. |
| **Data Visualization** | [Recharts](https://recharts.org/) | 3.10+ | Responsive SVG demand forecasts, prediction interval ribbons, and holdout error distributions. |
| **Backend REST API** | [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/) | FastAPI 0.115+, Uvicorn 0.34+ | Asynchronous REST endpoints, Pydantic v2 validation schemas, and auto-generated OpenAPI docs. |
| **Machine Learning** | [scikit-learn](https://scikit-learn.org/), [pandas](https://pandas.pydata.org/), [numpy](https://numpy.org/) | scikit-learn 1.4+, pandas 3.0+ | Random Forest demand regression ensemble, quantile interval estimators, and data transformations. |
| **Decision Optimization** | [SciPy](https://scipy.org/) | SciPy 1.18+ | Asymmetric Newsvendor critical fractile calculations and probability distribution modeling. |
| **Database & ORM** | [SQLite 3](https://sqlite.org/), [SQLAlchemy](https://www.sqlalchemy.org/) | SQLite 3.50+, SQLAlchemy 2.0+ | Embedded zero-dependency demonstration database with WAL mode; optional PostgreSQL migration. |
| **Demo Security & Guard** | In-Memory `OrgStateRegistry` | Custom | Strict `DEFAULT_ORG_ID` scoping, fail-closed tenant validation, and multi-tenant memory sandboxing. |
| **Testing & QA** | [pytest](https://pytest.org/), [Oxlint](https://oxc.rs/), [Prettier](https://prettier.io/) | pytest 9.1+, Oxlint 1.88+, Prettier 3.9+ | 59 automated unit/integration tests, Rust-based linter (0 errors), and code formatting gates. |

---

## Repository Structure

```
wastewise-ai/
├── .github/
│   ├── dependabot.yml              # Automated dependency update configuration
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI matrix (pytest + frontend lint/build)
├── backend/
│   ├── main.py                     # FastAPI application factory & lifespan configuration
│   ├── database.py                 # SQLAlchemy 2.0 engine, WAL pragma setup & session maker
│   ├── models.py                   # Relational ORM models (menu, uploads, forecasts, outcomes)
│   ├── schemas.py                  # Pydantic v2 input/response validation contracts
│   ├── auth.py                     # Demo-mode fail-closed org resolver & JWT verification
│   └── services/                   # Service-layer domain intelligence
│       ├── org_state.py            # OrgStateRegistry in-memory tenant sandbox
│       ├── ingestion.py            # CSV data ingestion & background model fitting
│       ├── forecasting.py          # Quantile demand prediction service
│       ├── planning.py             # Newsvendor batch preparation service
│       ├── waste_rescue.py         # Financial risk triage & rescue actions
│       └── reporting.py            # Shift outcome recording & KPI rollups
├── data/
│   ├── wastewise.db                # SQLite demonstration database (WAL mode)
│   └── active_operator_dataset.csv # 180-day baseline university canteen records
├── docs/
│   ├── assets/
│   │   ├── brand/                  # Vector SVG mark and PNG logo assets
│   │   └── screenshots/            # 10 verified application screenshots (desktop & mobile)
│   ├── screenshots/                # Backward-compatible screenshot mirror
│   └── SUPABASE_SETUP.md           # Enterprise PostgreSQL & Supabase deployment reference
├── frontend/
│   ├── public/
│   │   ├── brand/                  # Vector brand marks & logos
│   │   └── images/                 # Botanical culinary photography assets
│   ├── src/
│   │   ├── App.tsx                 # Root layout, navigation drawer & route router
│   │   ├── api.ts                  # Typed HTTP client with demo-mode fallbacks
│   │   ├── telemetry.ts            # Sentry & PostHog exception tracking
│   │   ├── BrandLogo.tsx           # Scalable SVG brand mark component
│   │   ├── MetalButton.tsx         # Shivering liquid metallic action button
│   │   └── workspace/              # Operational view components
│   │       ├── Home.tsx            # Botanical editorial landing view & bento grid
│   │       ├── Overview.tsx        # Kitchen Command Center & shift KPIs
│   │       ├── Scenario.tsx        # Single-dish demand forecasting with interval bounds
│   │       ├── Rescue.tsx          # Surplus rescue queue & 4-hour triage
│   │       ├── Performance.tsx     # Retrospective holdout model evaluation
│   │       ├── Data.tsx            # Operator dataset ingestion & provenance
│   │       ├── PrintKitchenSheet.tsx # Printable kitchen prep clip-sheet
│   │       └── QuickSearchDialog.tsx # Full-width keyboard search dialog
│   ├── package.json                # Frontend scripts and dependencies
│   └── vite.config.ts              # Vite 8 build & dev server configuration
├── src/                            # Standalone Python ML & analytics engine
│   ├── model.py                    # DemandForecastingEngine (Random Forest)
│   ├── planner.py                  # PreparationPlanner (Newsvendor critical ratio)
│   ├── data.py                     # Historical canteen data loader & transformers
│   └── metrics.py                  # WAPE, RMSE, and inventory financial calculations
├── supabase/
│   └── migrations/                 # Enterprise PostgreSQL Row-Level Security migrations
├── tests/                          # 59 automated pytest integration & unit tests
│   ├── test_api.py                 # FastAPI endpoint status & response contracts
│   ├── test_auth.py                # Fail-closed tenant isolation & OrgMismatch tests
│   ├── test_database.py            # SQLAlchemy CRUD & persistence durability
│   ├── test_demo_mode.py           # Zero-auth public demo invariants
│   ├── test_model.py               # Random Forest regression & quantile interval tests
│   ├── test_planner.py             # Newsvendor batch optimization math
│   └── test_views.py               # View routing and data consistency
├── ARCHITECTURE.md                 # In-depth system architecture & schema specifications
├── CONTRIBUTING.md                 # Development workflows, code style & PR procedures
├── DEPLOYMENT.md                   # Vercel & Render deployment guide
├── LICENSE                         # MIT License (Copyright (c) 2026 Tanish Bane)
├── PRODUCT.md                      # Operational product positioning & constraints
├── requirements.txt                # Python backend dependencies
└── SECURITY.md                     # Security reporting policy & defense-in-depth principles
```

---

## Local Installation & Quick Start

### Prerequisites
- **Python**: 3.10 to 3.14
- **Node.js**: 18.x or 20.x+
- **Git**

### Step 1: Clone Repository
```bash
git clone https://github.com/TanishBane/wastewise-ai.git
cd wastewise-ai
```

### Step 2: Backend Setup & Execution

#### On Linux / macOS (bash):
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on port 8000)
uvicorn backend.main:app --reload --port 8000
```

#### On Windows (PowerShell):
```powershell
# Create and activate virtual environment
py -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server (runs on port 8000)
uvicorn backend.main:app --reload --port 8000
```

*Interactive Swagger API documentation is available at `http://localhost:8000/docs`.*

### Step 3: Frontend Setup & Execution

Open a second terminal window:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server (runs on port 5173)
npm run dev
```

Visit **`http://localhost:5173/`** in your browser. The application opens directly into the **Public Demo Mode** with full functionality.

---

## API Specification Overview

The backend exposes typed, versioned REST endpoints documented via OpenAPI 3.1:

| Method | Endpoint | Description | Public Demo Auth | Response Model |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, model status, and DB readiness | None | `HealthResponse` |
| `GET` | `/api/overview` | Active canteen KPIs: demand, prep, surplus risk, cost-at-risk | `DEFAULT_ORG_ID` | `OverviewResponse` |
| `POST` | `/api/forecast` | Quantile prediction with weather, event, and calendar features | `DEFAULT_ORG_ID` | `ForecastResponse` |
| `POST` | `/api/plan` | Newsvendor preparation plan with staggered batches & refill triggers | `DEFAULT_ORG_ID` | `PlanResponse` |
| `GET` | `/api/waste-risk` | Prioritized surplus triage queue with financial exposure | `DEFAULT_ORG_ID` | `WasteRiskResponse` |
| `GET` | `/api/performance` | Retrospective holdout model evaluation & benchmark metrics | `DEFAULT_ORG_ID` | `PerformanceResponse` |
| `POST` | `/api/outcomes` | Persist physical shift outcome (cooked, sold, leftovers, waste reason) | `DEFAULT_ORG_ID` | `ActualOutcomeItem` |
| `GET` | `/api/data` | Active dataset metadata, provenance, and coverage window | `DEFAULT_ORG_ID` | `DataInfoResponse` |
| `POST` | `/api/data/upload` | Upload historical CSV sales records for dynamic model retraining | `DEFAULT_ORG_ID` | `DatasetUploadResponse` |

---

## Model Evaluation & Data Provenance

### Demonstration Dataset Provenance
WasteWise AI bundles a calibrated **180-day operational dataset** representing an institutional dining hall serving approximately 800–1,200 daily patrons across lunch and dinner services:
- **Dishes Tracked**: Core North/South Indian institutional offerings (Paneer Butter Masala, Dal Tadka, Vegetable Biryani, Steamed Rice, Roti, Chana Masala, Mixed Veg Curry).
- **Recorded Variables**: Calendar day of week, semester week, campus headcount attendance, ambient weather condition, outdoor temperature, dish unit cost, dish selling price, portions prepared, portions sold, and leftovers discarded.

### Holdout Evaluation Results
Model accuracy was evaluated against a held-out chronological split of 280 meal services:

| Metric | Historical Weekday Baseline | WasteWise AI (Random Forest) | Improvement |
| :--- | :--- | :--- | :--- |
| **WAPE (Weighted Error)** | **10.8%** | **8.4%** | **22.2% Error Reduction** |
| **MAE (Mean Absolute Error)** | 14.2 portions | 10.9 portions | 3.3 portions/service |
| **Simulated Surplus Food Waste** | 18.4% of total prep | 11.2% of total prep | **39.1% Avoidable Waste Reduced** |
| **Average Cost at Risk / Meal** | ₹1,420 | ₹887 | **37.5% Margin Protection** |

---

## Testing & Quality Assurance

WasteWise AI enforces strict continuous integration gates on every commit:

### 1. Automated Python Backend Tests (59 Passed)
The backend test suite covers API routes, model estimators, database persistence, fail-closed authentication guards, and mathematical planners:

```bash
pytest
```
*Current verified execution output:*
```
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.1.1
collected 59 items

tests/test_api.py ...                                                    [  5%]
tests/test_auth.py ..............                                        [ 28%]
tests/test_data.py ........                                              [ 42%]
tests/test_database.py .....                                             [ 50%]
tests/test_demo_mode.py ......                                           [ 61%]
tests/test_image_assets.py .....                                         [ 69%]
tests/test_metrics.py ...                                                [ 74%]
tests/test_model.py .....                                                [ 83%]
tests/test_planner.py ......                                             [ 93%]
tests/test_tokens.py .                                                   [ 94%]
tests/test_views.py ...                                                  [100%]

======================= 59 passed, 2 warnings in 40.71s =======================
```

### 2. Frontend Linter & Type Safety (0 Errors)
The frontend code adheres strictly to modern React 19 standards:
```bash
cd frontend

# Oxlint linter check
npm run lint
# Output: Found 0 warnings and 0 errors.

# Prettier format check
npm run format:check
# Output: All matched files use Prettier code style!

# TypeScript type check and production bundle
npm run build
# Output: built in ~28s with 0 type errors.
```

---

## Production Deployment Guides

### Frontend Deployment (Vercel)
The React/Vite frontend builds as a static Single Page Application:
1. Connect repository to [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Configure environment variable:
   - `VITE_API_BASE_URL`: Production backend URL (e.g. `https://wastewise-api.onrender.com`).

### Backend Deployment (Render)
The FastAPI backend runs as a containerized Web Service on [Render](https://render.com):
1. Connect repository to Render as a **Web Service**.
2. **Build Command**: `pip install -r requirements.txt`.
3. **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
4. **Persistent Disk (Crucial for SQLite)**:
   - Add a Render Disk with mount path `/data`.
   - Set environment variable `WASTEWISE_DB_PATH=/data/wastewise.db`.
5. Set `WASTEWISE_DEMO_MODE=true` for public demonstration or `false` for private deployments.

### Enterprise PostgreSQL & Supabase Path
For multi-tenant institutional deployments requiring horizontal scaling and cryptographic auth:
1. Review [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).
2. Run database migrations located in [`supabase/migrations/`](supabase/migrations/) to establish tenant schemas and Row-Level Security (RLS) policies.
3. Configure `DATABASE_URL=postgresql://user:password@host:5432/wastewise` on the backend.

---

## Contributing & Community

We welcome contributions from engineers, kitchen operators, and open-source contributors! Please read our [**Contributing Guide**](CONTRIBUTING.md) for details on our code of conduct, conventional commit formatting, and pull request review workflows.

---

## Security Policy

For vulnerability reporting procedures and our defense-in-depth architectural invariants, see [**SECURITY.md**](SECURITY.md).

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
Copyright (c) 2026 Tanish Bane
```
