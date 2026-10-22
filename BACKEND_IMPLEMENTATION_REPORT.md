# WasteWise AI — Backend Implementation Report

## 1. Executive Summary

This report documents the architectural hardening and service-layer separation implemented in the WasteWise AI backend. The upgrade transitions the platform from a prototyping script into an enterprise-grade FoodTech analytics service with ACID-compliant SQLite durable storage, thread-safe asynchronous model training, and strict schema ingestion safeguards.

All 28 backend unit and integration tests are passing with zero calculation drift on the core demonstration baseline:
- **Expected Demand**: $161$ portions
- **Recommended Preparation**: $168$ portions
- **Potential Surplus**: $7$ portions ($4.2\%$)
- **Cost at Risk (Naive Buffer)**: $₹887$
- **Holdout Accuracy**: $8.4\%$ WAPE (vs. $10.8\%$ Baseline WAPE)

---

## 2. Durable Storage Architecture & SQLite Models

A durable SQLite database (`data/wastewise.db`) managed via SQLAlchemy 2.0 with Write-Ahead Logging (WAL) and foreign keys enabled provides ACID transactional guarantees.

### Implemented Models (`backend/models.py`)

1. **`MenuItemModel` (`menu_items`)**:
   - Stores catalog metadata for canteen dishes: `id`, `name`, `category`, `cost_price`, `selling_price`, `prep_time_min`, `prep_batch_size`, `shelf_life_hours`, `base_demand`, `active`, `created_at`, `updated_at`.
   - Seeded with the 8 canonical demonstration items (`Pav Bhaji`, `Idli Sambar`, `Veg Thali`, `Veg Grilled Sandwich`, `Rajma Rice Bowl`, `Poha`, `Masala Dosa`, `Fresh Fruit Juice`).
   - Automatically synchronizes newly discovered dishes when operator CSVs are ingested.

2. **`UploadHistoryModel` (`upload_history`)**:
   - Audit trail capturing `filename`, `checksum` (SHA256), `row_count`, `service_days`, `validation_warnings_json`, `timestamp`, `source` (`'synthetic'` | `'operator'`), and `is_active`.
   - Maintains dataset provenance and prevents unverified data overrides.

3. **`ForecastRunModel` (`forecast_runs`)**:
   - Logs scenario predictions: `timestamp`, `menu_item`, `day_of_week`, `attendance_index`, `is_event`, `weather`, `target_service`, `predicted_demand`, `lower_bound`, `upper_bound`, `weekday_baseline`, `model_version`, and `feature_contributions_json`.

4. **`PreparationPlanModel` (`preparation_plans`)**:
   - Records operational cooking plans: `service_date`, `target_meal`, `menu_item`, `predicted_demand`, `lower_bound`, `upper_bound`, `current_stock`, `critical_ratio`, `recommended_total_plan`, `recommended_initial_batch`, `refill_trigger_threshold`, `wastewise_expected_cost`, `current_policy_expected_cost`, `net_cost_avoided`, and `status`.

5. **`ActualOutcomeModel` (`actual_outcomes`)**:
   - Captures true operational feedback recorded by kitchen staff: `service_date`, `target_meal`, `menu_item`, `portions_prepared`, `portions_sold`, `portions_leftover`, `discarded_kg`, `donation_kg`, `waste_cost`, `notes`, and `recorded_at`.

---

## 3. Service Layer Architecture

Business logic was extracted from `backend/main.py` into dedicated, cohesive service classes in `backend/services/`:

```
backend/
├── database.py                 # SQLite engine, connection pool, WAL pragma, session management
├── models.py                   # SQLAlchemy schema models
├── services/
│   ├── __init__.py
│   ├── forecasting_service.py  # RF prediction, ensemble quantiles, feature importance extraction
│   ├── planning_service.py     # Newsvendor stochastic batching, refill triggers, Monte Carlo
│   ├── ingestion_service.py    # BOM handling, validation, concurrency lock, async training
│   ├── rescue_service.py       # Waste triage, risk categorization, operational guidance
│   └── reporting_service.py    # Overview KPIs, holdout simulation, actual outcomes capture
└── main.py                     # Thin FastAPI HTTP routes and dependency injection
```

### Key Service Capabilities

- **`IngestionService`**:
  - Handles byte streams with automatic BOM (`UTF-8-SIG`) and header whitespace stripping.
  - Guards uploads with an async mutex lock (`asyncio.Lock()`) to prevent race conditions during model retraining.
  - Moves heavy model training off the main event loop into a worker thread using `await asyncio.to_thread(engine.train_and_evaluate, ...)`.
  - Enforces schema validation: rejects negative portions, missing columns, or short datasets with detailed HTTP 422 error arrays.

- **`ForecastingService`**:
  - Extracts real tree-based feature importances directly from `self.model.feature_importances_` rather than static mock percentages.
  - Generates 80% confidence bounds via empirical ensemble tree percentiles (10th and 90th).

- **`PlanningService`**:
  - Computes optimal Newsvendor critical ratio:
    $$CR = \frac{C_{\text{shortage}}}{C_{\text{shortage}} + C_{\text{surplus}}}$$
  - Deducts safe on-hand stock and divides preparation into a 65% initial batch and replenishment triggers.
  - Generates 600-point Monte Carlo Gaussian distributions for frontend risk charts.

- **`ReportingService`**:
  - Derives dishes dynamically from the active dataset, preserving exact catalog sorting.
  - Provides full CRUD endpoints for operational kitchen outcome capture (`POST /api/outcomes` and `GET /api/outcomes`).

---

## 4. API Endpoints Reference

| Method | Endpoint | Description | Service Provider |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, event name, and model state | AppState |
| `GET` | `/api/config` | Menu item metadata, weather types, service days | `database` / `models` |
| `GET` | `/api/overview` | Active service day KPIs and prioritized alerts | `ReportingService` |
| `POST` | `/api/forecast` | Scenario prediction and feature drivers | `ForecastingService` |
| `GET` | `/api/forecast/history` | Historical audit log of scenario forecasts | `ForecastingService` |
| `POST` | `/api/plan` | Newsvendor batch preparation optimization | `PlanningService` |
| `GET` | `/api/plan/history` | Historical audit log of batch preparation plans | `PlanningService` |
| `GET` | `/api/waste-risk` | Surplus risk tiers and operational guidance | `WasteRescueService` |
| `GET` | `/api/performance` | Holdout accuracy and retrospective impact | `ReportingService` |
| `POST` | `/api/outcomes` | Logs post-service kitchen actuals to SQLite | `ReportingService` |
| `GET` | `/api/outcomes` | Retrieves logged operational outcomes | `ReportingService` |
| `GET` | `/api/data` | Dataset summary and tail preview | AppState |
| `GET` | `/api/data/template` | Downloads canteen CSV ingestion template | `src.data` |
| `POST` | `/api/data/upload` | Ingests operator CSV with async model training | `IngestionService` |
| `POST` | `/api/data/reset` | Resets to 180-day demo dataset and clean catalog | AppState / `database` |

---

## 5. Test Suite Verification

Backend test coverage spans 28 automated tests across unit and integration suites:

```
tests/test_api.py::test_template_upload_round_trip PASSED
tests/test_api.py::test_invalid_upload_preserves_model PASSED
tests/test_data.py::test_synthetic_data_generation PASSED
tests/test_data.py::test_validate_dataset_valid PASSED
tests/test_data.py::test_validate_dataset_empty PASSED
tests/test_data.py::test_validate_dataset_missing_column PASSED
tests/test_data.py::test_validate_dataset_negative_values PASSED
tests/test_data.py::test_validate_dataset_too_short PASSED
tests/test_database.py::test_menu_catalog_persisted PASSED
tests/test_database.py::test_forecast_persists_to_database PASSED
tests/test_database.py::test_preparation_plan_persists_to_database PASSED
tests/test_database.py::test_actual_outcome_recording_and_retrieval PASSED
tests/test_database.py::test_upload_persists_audit_and_syncs_catalog PASSED
tests/test_metrics.py::test_classify_waste_risks PASSED
tests/test_metrics.py::test_simulate_holdout_impact PASSED
tests/test_metrics.py::test_simulation_replays_planner_and_uses_baseline_waste PASSED
tests/test_model.py::test_baseline_fit_and_predict PASSED
tests/test_model.py::test_model_training_and_holdout_metrics PASSED
tests/test_model.py::test_predict_scenario_uncertainty_interval PASSED
tests/test_planner.py::test_critical_ratio_calculation PASSED
tests/test_planner.py::test_generate_plan_outputs PASSED
tests/test_planner.py::test_existing_stock_reduces_recommendation PASSED
tests/test_planner.py::test_existing_stock_is_available_in_cost_simulation PASSED
tests/test_planner.py::test_partial_stock_preserves_available_supply PASSED
tests/test_tokens.py::test_token_drift_check PASSED
tests/test_views.py::test_scenario_prediction_and_planning_pipeline PASSED
tests/test_views.py::test_waste_rescue_pipeline PASSED
tests/test_views.py::test_simulation_pipeline PASSED

============================= 28 passed in 5.33s =============================
```
