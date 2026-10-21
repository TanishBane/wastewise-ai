# WasteWise frontend

A React + TypeScript kitchen operations workspace connected to the FastAPI forecasting and preparation engine.

## Run as one website

From the project root:

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

Open the URL printed by Vite (normally http://localhost:3000). The preferred one-command flow is:

```powershell
.\run_website.ps1
```

That script builds this frontend and starts FastAPI, which serves both the
compiled website and `/api/*` from **http://127.0.0.1:8000**. Use that one link
for the complete application. This avoids the separate Vite development URL;
deployment can add a public host later without changing frontend API paths.

For frontend-only development with hot reload:

```powershell
cd frontend
npm install
npm run dev
```

The development server proxies `/api` to port 8000. To point directly to
another backend, set `VITE_API_BASE_URL` before starting Vite. In the website
flow, leave `VITE_API_BASE_URL` unset so API requests use the current page's
origin.

## What is included

- Kitchen overview with real menu data, filters, local review marks, and CSV export.
- Forecast workbench with attendance, weekday, weather, and event controls.
- Preparation planner with stock, cost, availability preference, and exportable batch plans.
- Three-scenario comparison using actual backend forecasts and preparation calculations.
- Surplus rescue queue, chronological holdout evaluation, and explicitly labeled simulated impact.
- CSV onboarding, drag-and-drop upload, schema reference, preview, and confirmed demo reset.
- Searchable page command menu (Ctrl/Cmd K), keyboard-accessible native dialogs, mobile navigation, reduced motion, and print styling.
- Lazy-loaded routes and charts, self-hosted Newsreader and Source Sans 3, an error boundary, and recoverable API failures.

Demo mode is determined by the backend's active dataset. Uploading records switches the source label; restoring demo data switches it back. Uploaded data is shared by sessions using that backend and is kept in server memory. Review marks are local to the mounted view. Exporting a plan does not dispatch kitchen instructions.

## Quality checks

```powershell
npm run build
npm run lint
npm run format:check
```

The browser regression script uses installed Google Chrome, Python, and `websockets`:

```powershell
python -m pip install websockets
python scripts/verify_frontend.py --url http://127.0.0.1:3000
```

Run it from the project root. Screenshots and results go to `screenshots/frontend-review/`. The script checks all routes, scenario changes, comparisons, exports, mobile layouts, dialogs, reduced motion, and error recovery. Chrome is expected under Program Files on Windows.

Only use `--test-upload` with an isolated test backend: it replaces the active dataset and restores the demo afterward. The default script URL is port 3002 for this reason.

## Source layout

- `src/App.tsx`: workspace shell, navigation, search, tour, and route loading.
- `src/workspace/`: the six operational screens, help/resources, shared UI, data hooks, and charts.
- `src/index.css`: responsive design system, interaction states, and print styles.
- `src/tokens.ts`: palette used by chart rendering and checked against CSS.
- `src/api.ts`: typed API calls, timeouts, and readable failure messages.
- `public/fonts/`: self-hosted font files and their OFL license.

Product constraints and design decisions are documented in the root `PRODUCT.md` and `DESIGN.md`.
