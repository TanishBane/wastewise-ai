# WasteWise AI Deployment Guide & Production Checklist

This document outlines the current state of deployment readiness for the **WasteWise AI Public Demonstration Application** and notes for optional private multi-tenant enterprise deployments.

---

## Architecture Overview (Public Demo Edition)

The public demonstration application is built to run zero-friction out of the box:
- **Frontend**: React 19 single-page application built with Vite and Tailwind CSS v4. Deploys to Vercel. Operates in public demo mode with synthetic canteen data, zero sign-in modals, and zero account creation barriers.
- **Backend**: FastAPI asynchronous Python service. Deploys to Render or any standard container/server environment. Pinned in demo mode (`WASTEWISE_DEMO_MODE=true`) to `DEFAULT_ORG_ID`, preventing anonymous access to private tenants while offering interactive forecasting and Newsvendor batch planning.
- **Storage**: Local SQLite database (`data/wastewise.db`) containing calibrated baseline demo datasets. Zero external cloud database is required for the public demo.
- **Enterprise Option**: Historical schema migrations (`supabase/migrations/`) and PostgreSQL RLS support are retained for organizations deploying a private, multi-tenant instance with Supabase Auth.

---

## Phase 1: Frontend Deployment (Vercel)

The React frontend is ready for immediate deployment to Vercel as a single-page application.

### Recommended Configuration
1. Log into your Vercel Dashboard.
2. Click **Add New... > Project**.
3. Import the `TanishBane/wastewise-ai` GitHub repository.
4. Ensure the Framework Preset is set to **Vite** (auto-detected).
5. Ensure the Root Directory is set to `frontend`.
6. Configure Build & Development Settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
7. Environment Variables:
   - `VITE_API_BASE_URL`: `https://wastewise-api.onrender.com` (Only needed if backend is hosted on a separate domain; leave empty if proxying or running unified).
   *(Notice: No Supabase keys or auth tokens are required for the public demo).*
8. Click **Deploy**.

---

## Phase 2: Backend Deployment (Render)

Render is pre-configured via `render.yaml` defining the `wastewise-api` web service.

### Environment Configuration in Render
1. Ensure the `wastewise-api` Web Service is created in the Render Dashboard connected to `TanishBane/wastewise-ai`.
2. Configure the following Environment Variables in the Render Dashboard:
   - `WASTEWISE_DEMO_MODE`: `true`
   - `ENABLE_API_DOCS`: `false` (safeguards OpenAPI / Swagger endpoints in public demo)
   - `WASTEWISE_CORS_ORIGINS`: `https://wastewise-ai.vercel.app` (or your actual Vercel project domain, plus local development URLs).
   - `PORT`: `10000` (or leave default assigned by Render)
3. Build & Start Commands:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

---

## Phase 3: Optional Enterprise Multi-Tenant Deployment (PostgreSQL / Supabase)

If deploying a private enterprise instance with authenticated multi-tenancy:
1. Create a Supabase project or PostgreSQL database.
2. Execute the migration in `supabase/migrations/20261023190000_supabase_auth_multitenant.sql` to establish multi-tenant tables and Row-Level Security (RLS) policies.
3. Configure `DATABASE_URL` (PostgreSQL pooling connection string) and `SUPABASE_JWT_SECRET` in the backend environment.
4. Set `WASTEWISE_DEMO_MODE=false`.

---

## Verification & Health Check

1. **Backend Health Probe**:
   ```bash
   curl -s https://<your-backend-domain>/api/health
   # Expected response: {"status":"healthy","database":"connected","demo_mode":true}
   ```
2. **Frontend UI Verification**:
   - Access the deployed Vercel domain.
   - Confirm the global "DEMO MODE · Sample Canteen Data" indicator pill is visible in the header.
   - Confirm that no login, register, sign-in, or sign-out buttons appear.
   - Confirm that all operational pages (Demand Forecast, Preparation Planner, Surplus Rescue, Kitchen Overview) load sample datasets and compute predictions.
   - Confirm that `#backend-api` routes cleanly to the home view without error.
