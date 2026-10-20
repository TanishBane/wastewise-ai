# WasteWise AI

**Predict smarter. Prepare better. Waste less.**

A canteen operations workspace that connects demand forecasting to practical batch preparation, surplus triage, and transparent evaluation. Built for daily kitchen decisions, with clearly labeled synthetic data for demonstrations.

## Start the application

Python and Node.js/npm are required. The frontend uses Vite 8; use Node.js 22.12 or newer.

```powershell
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the address Vite prints, normally http://localhost:3000. Backend health: http://127.0.0.1:8000/api/health.

For frontend configuration, checks, and production proxy requirements, see [frontend/README.md](frontend/README.md).

## The operational workflow

1. **Review the kitchen:** menu demand, baseline cost exposure, and prioritized preparation decisions.
2. **Explore demand:** weekday, attendance, campus event, and weather scenarios, with model estimates and recorded sales.
3. **Plan batches:** account for safe ready-to-serve stock, cost asymmetry, and service preference. Export what to cook now and what to hold for replenishment.
4. **Review surplus:** filter the rescue queue by risk, inspect the suggested operational action, and adjust the plan.
5. **Inspect the evidence:** chronological holdout error, a weekday-average baseline, and explicitly simulated impact.
6. **Connect records:** download the schema template, upload a CSV with at least 14 service days, and inspect the active dataset.

A guided tour, searchable page menu (Ctrl/Cmd K), mobile navigation, keyboard support, reduced motion, and print styling are included. Local review marks and plan exports do not dispatch instructions to kitchen staff.

## What the calculations mean

The Random Forest learns **portions sold**, with menu, weekday, weather, attendance, event, and temperature features. Stockouts can censor sales below true demand. The displayed range is the 10th–90th percentile spread of tree predictions, not a calibrated guarantee of future demand coverage.

The preparation planner uses surplus and shortage costs, blended with the operator's service preference, to select a demand quantile. It approximates demand dispersion from the ensemble range, subtracts existing stock from new preparation, and proposes an initial batch and refill allocation. Operators must review the result against actual kitchen constraints.

Evaluation uses a chronological holdout. WAPE is total absolute prediction error divided by total observed sales; MAE is average absolute error in portions. Impact estimates replay the preparation policy on held-out records and compare surplus and stockouts against a baseline. Ingredient savings exclude missed-sale penalties. Carbon estimates use illustrative mass and emission assumptions. These are **retrospective simulations, not measured business outcomes**.

## Data and deployment boundaries

- The sample dataset is synthetic and labeled throughout the UI.
- CSV uploads replace the active dataset in backend memory after validation and successful training.
- The active dataset is shared across clients of the same backend and is not retained after a process restart.
- This prototype has no account authentication or per-user data isolation. Use a controlled environment.
- Forecasts do not certify food safety. Follow qualified kitchen procedures for holding, reheating, discounting, and donation.
- The model runs locally without external LLM keys. Frontend fonts are self-hosted.

## Verification

```powershell
python -m pytest tests -q
npm run build --prefix frontend
npm run lint --prefix frontend
npm run format:check --prefix frontend
```

Browser regression checks and their isolated-upload option are documented in the frontend README. Screenshots and browser reports are generated under `screenshots/frontend-review/`.

## Project layout

```text
backend/main.py             FastAPI routes and active dataset/model state
src/data.py                 Synthetic data and CSV validation
src/model.py                Forecast engine and chronological evaluation
src/planner.py              Preparation economics and batch planning
src/metrics.py              Risk triage and impact simulation
frontend/src/App.tsx        Workspace shell, navigation, search and tour
frontend/src/workspace/     Operational screens, shared controls and charts
frontend/src/index.css      Responsive design system and print styling
frontend/public/fonts/      Self-hosted IBM Plex Sans and license
tests/                      Python and API regression checks
scripts/verify_frontend.py  Chrome browser regression checks
PRODUCT.md                  Product constraints and confirmed audience
DESIGN.md                   Documented frontend design system
```

The earlier Streamlit prototype is retained in `app.py` and `src/views/`; run it with `streamlit run app.py` if needed. The React frontend is the primary interface.

Developed for ADAPPT 5.0 — AI in FoodTech.
