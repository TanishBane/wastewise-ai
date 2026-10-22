# WasteWise AI — Final Verification

Verified on branch `feature/complete-upgrade` on 2026-10-22.

## Delivered corrections

- Dashboard KPI values are produced from `/api/overview` and rendered by the React overview. Live verification returned: expected demand **161**, suggested preparation **168**, potential surplus **7**, and baseline-policy ingredient cost at risk **₹887**.
- The KPI-number font now uses a dependable numeric fallback. This fixes the browser-visible regression where the API values existed but the custom display font did not draw digits.
- CSV ingestion now rejects empty, non-CSV, over-10-MB, non-numeric, out-of-range, duplicate, invalid-calendar, and unsupported-weather input before state is changed. Failed imports do not replace the active dataset.
- A successful upload writes an audit record and `data/active_operator_dataset.csv`; the application restores this validated active source on startup. Resetting the demo changes the active source only and no longer deletes menu catalog or audit history.
- Database sessions roll back on write failures. Forecast and preparation endpoints return a clear 503 if their mandatory audit write cannot be completed instead of silently claiming persistence.
- Outcome logging validates non-negative values and requires `prepared = sold + leftover`. Exact retries are idempotent; conflicting records for the same dish/date/meal are rejected.
- CORS defaults to the two local Vite origins with credentials disabled. Override only through `WASTEWISE_CORS_ORIGINS`.

## Checks actually run

| Command | Result |
| --- | --- |
| `py -m pytest -q` | 30 passed |
| `npm run build` (in `frontend`) | passed |
| `npm run lint` (in `frontend`) | passed |
| `npm run format:check` (in `frontend`) | passed |
| `py -m uvicorn backend.main:app --host 127.0.0.1 --port 8011` | started successfully |
| Live requests to `/api/health`, `/api/overview`, `/api/performance` | healthy; trained synthetic model; KPI and holdout data returned |
| Browser check at `http://127.0.0.1:8011/` | dashboard visible; all four KPI values present; bottom scroll edge visible and non-interactive |

## Remaining limitations

- The active uploaded CSV is a local, single-workspace source; this prototype has no authentication, per-user tenancy, migrations, or edit/correction UI for outcomes.
- Forecast ranges are ensemble spreads, not calibrated coverage intervals. Impact figures remain explicitly retrospective simulations unless operators record real outcomes.
- The legacy Streamlit application remains as a reference prototype; the React/FastAPI application is the verified primary experience.

## Worktree note

This repository already contained substantial uncommitted upgrade work when verification began. It was preserved on the existing feature branch; no reset, clean, deletion, merge, push, or deployment was performed.
