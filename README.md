# 🌿 WasteWise AI — ADAPPT 5.0 AI in FoodTech
> **Predict smarter. Prepare better. Waste less.**  
> *Adaptive Canteen Demand Forecasting & Preparation Decision Support Platform*

[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-10B981?style=flat&logo=python)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19%20%7C%20TypeScript-61DAFB?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat&logo=vite)](https://vite.dev)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org)
[![Tests](https://img.shields.io/badge/Pytest-17%20Passed-10B981?style=flat&logo=pytest)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📌 Executive Summary

Food waste in catering and college canteens is fundamentally an **operations decision problem driven by demand uncertainty**. Canteens must commit kitchen preparation hours before customer arrival. Traditional operations rely on rigid habitual buffers (e.g., cooking 100 portions every day), resulting in severe end-of-day discards or costly early stockouts.

**WasteWise AI** connects demand estimation directly to kitchen batch execution through a closed 4-stage decision loop:
1. **PREDICT:** Estimate menu item demand with defensible 80% uncertainty bounds using an empirical Random Forest ensemble.
2. **PREPARE:** Balance the cost of excess food ($C_{\text{surplus}}$) against the cost of lost sales ($C_{\text{shortage}}$) using Newsvendor economics, recommending staggered batch cooking and refill triggers.
3. **RESCUE:** Triage items by financial risk exposure and provide safe operational interventions (batch pull-backs, flash specials, and donation protocols).
4. **LEARN:** Continuously benchmark predictions against a weekday-average baseline using chronological holdout validation, recording physical discards and availability.

---

## 🚀 Quickstart: Run the Platform

WasteWise AI features a modern **React + TypeScript + Tailwind CSS** operational frontend powered by a high-performance **Python FastAPI** microservice.

### Prerequisites
- Python 3.11 or newer (Python 3.14 compatible).
- Node.js 18+ and npm.

### 1. Start the FastAPI Intelligence Backend
```bash
# From repository root
pip install -r requirements.txt
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Backend health check: `http://127.0.0.1:8000/api/health`

### 2. Start the React Operations Dashboard
```bash
# In a separate terminal
cd frontend
npm install
npm run dev
```
The operations dashboard will open at **`http://localhost:3000`**.

*(Note: The legacy Streamlit prototype is preserved and can be run at `http://localhost:8501` via `streamlit run app.py`)*

---

## ⏱️ 90-Second Judge Demonstration Guide

During hackathon presentations, use the sidebar button **“Launch demo scenario”** or walk through these 5 rapid steps:

1. **Step 1: The Canteen Reality (Overview)**
   - Open `Overview`. Show the daily demand estimate (~510 portions across 8 dishes), potential surplus exposure, and the active alert panel highlighting excess risk on *Veg Thali*.
2. **Step 2: Generate Point & Range Forecast (Demand forecast)**
   - Select **Pav Bhaji** on **Monday**. 
   - Point out the point forecast (~72 portions) and the **80% uncertainty range** (64–80 portions) derived from the 100-tree Random Forest ensemble.
3. **Step 3: The "Aha!" Moment — Event Surge (Preparation planner)**
   - Switch to **Preparation planner**. Under *Operational Conditions*, check **Major campus event / festival active** and slide attendance to **130%**.
   - Watch the prediction instantly update from **72 → 94 portions**.
4. **Step 4: Staggered Batch Recommendation**
   - Note the Newsvendor recommendation: Total plan = **88 portions**, with an **Initial Batch of 57 portions** and a **Refill Trigger at 18 portions**. 
   - Explain why: Staggered cooking prevents perishable food from degrading at room temperature if student footfall deviates.
5. **Step 5: Rigorous Benchmark & Pilot Plan (Performance & impact)**
   - Show the **Model vs Baseline Holdout Benchmark**: Candidate Random Forest achieves **8.4% WAPE**, significantly outperforming the naive weekday baseline (**14.2% WAPE**).
   - Point out the honest disclaimer: *Savings are mathematically simulated on holdout records, not claimed as real until measured via the 4-week pilot.*

---

## 📐 Decision Architecture & Mathematics

### Newsvendor Critical Fractile
Preparing too much and preparing too little have different financial and operational costs:
- **$C_{\text{surplus}}$ (Cost of Excess):** Direct raw ingredient cost per portion + holding/spoilage loss.
- **$C_{\text{shortage}}$ (Cost of Stockout):** Selling price $-$ ingredient cost (lost margin) $+$ student dissatisfaction penalty.

The target planning quantile ($CR$) is computed as:
$$CR = \frac{C_{\text{shortage}}}{C_{\text{shortage}} + C_{\text{surplus}}}$$

The cost-optimal daily preparation plan $Q^*$ is:
$$Q^* = \mu_{\text{demand}} + z_{CR} \cdot \sigma_{\text{demand}} - \text{Current Stock}$$

Where:
- $\mu_{\text{demand}}$ = Model point forecast.
- $\sigma_{\text{demand}}$ = Implied standard deviation derived from the ensemble 80% interval ($\sigma \approx \frac{q_{90} - q_{10}}{2.56}$).
- $z_{CR}$ = Inverse cumulative standard normal distribution at quantile $CR$.

---

## 📊 Evaluation Methodology: Strict Time-Based Holdout

To avoid **data leakage**, WasteWise never performs random cross-validation on time-series records. 
- **Training Window:** Historical records from day 1 to day 145.
- **Evaluation Window:** Unseen future records from day 146 to day 180.

### Metrics Defined
- **Mean Absolute Error (MAE):** $\frac{1}{N} \sum |y_i - \hat{y}_i|$ (Portions).
- **Weighted Absolute Percentage Error (WAPE):** $\frac{\sum |y_i - \hat{y}_i|}{\sum y_i} \times 100\%$ (Percentage).
- **Stockout Rate:** Percentage of days where latent customer demand exceeded prepared supply.

---

## 🛡️ Safety & Responsible AI Boundaries

1. **No Biological Safety Inferences:** The product never determines food safety from demand forecasts alone. Cooked food exposed to the danger zone (5°C – 60°C) for $>2$ hours cannot be donated.
2. **Strict Provenance Labeling:** Synthetic demonstration data is prominently marked with a `🧪 SYNTHETIC DATA` pill on every page.
3. **Local & Privacy-Preserving:** No external LLM keys or proprietary APIs required. Customer data remains on-premise.

---

## 🧪 Automated Test Suite

Run all automated unit and integration tests with:
```bash
pytest tests
```
Current test suite status: **17 tests passed in ~3.5 seconds** covering:
- Synthetic dataset generation & boundary constraints.
- CSV schema parser and user input validation.
- Baseline fit/predict and Random Forest time-series evaluation.
- Newsvendor critical ratio optimization & inventory deduction.
- Waste risk tiering and operational action generation.
- Full end-to-end integration across all views.

---

## 📂 Repository Structure

```
wastewise-ai/
├── app.py                      # Application entry point & router
├── requirements.txt            # Constrained Python dependencies
├── README.md                   # Complete beginner and judge guide
├── backend/                    # High-performance FastAPI Microservice
│   └── main.py                 # REST API endpoints (overview, forecast, plan, waste-risk, performance, data)
├── frontend/                   # Modern React + TypeScript + Vite + Tailwind CSS App
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── types.ts            # Enterprise TypeScript API interfaces
│       ├── api.ts              # Resilient fetch client
│       ├── index.css           # Custom design tokens & font system
│       ├── App.tsx             # Root router & demo coordinator
│       ├── components/
│       │   ├── BrandIntro.tsx  # Fullscreen brand reveal with skip button & sessionStorage
│       │   ├── Sidebar.tsx     # 240px fixed navigation & provenance footer
│       │   ├── AppShell.tsx    # Responsive shell container
│       │   └── common/         # KpiCard, PageHeader
│       └── views/
│           ├── OverviewView.tsx            # View 1: Executive KPI overview & kitchen alerts
│           ├── DemandForecastView.tsx      # View 2: Quantile demand inference & feature attributions
│           ├── PreparationPlannerView.tsx  # View 3: Newsvendor critical ratio & 2-tier batching
│           ├── WasteRiskMonitoringView.tsx # View 4: Real-time risk triage & operational interventions
│           ├── PerformanceImpactView.tsx   # View 5: 3-tier holdout benchmarks & ESG impact
│           └── DataModelView.tsx           # View 6: CSV ingestion, schema validation & explorer
├── src/                        # Core Python Machine Learning & Planning Engine
│   ├── config.py               # Menu configurations, cost constants, palette
│   ├── data.py                 # Synthetic data engine, CSV validator, sample exporter
│   ├── model.py                # Random Forest regressor, Weekday baseline, holdout split
│   ├── planner.py              # Newsvendor optimizer, staggered batches, policy simulator
│   └── metrics.py              # Risk triage, rescue actions, carbon estimation
├── data/
│   └── wastewise_sample_canteen_data.csv # Cached 180-day demonstration dataset
└── tests/
    ├── test_data.py            # Data generation & schema tests
    ├── test_model.py           # ML training, baseline, & forecast tests
    ├── test_planner.py         # Critical ratio & preparation logic tests
    ├── test_metrics.py         # Risk classification & impact tests
    └── test_views.py           # End-to-end integration pipeline tests
```

---

## 👥 Hackathon Team & Acknowledgements
- **Team:** 2-Member Student Innovation Team
- **Competition:** ADAPPT 5.0 — AI in FoodTech
- **Problem Statement:** Food Waste from Demand Uncertainty
- **Concept Reference:** `WasteWise_AI_ADAPPT5_Concept_Dossier.pdf` (Version 1.0, 19 October 2026)
