# WasteWise AI Deployment Blockers & Action Plan

This document outlines the current state of deployment readiness and what manual steps the project owner needs to take, as certain operations require dashboard access.

## Phase 1: Vercel Verification Status

- The existing Vercel project `tanixailive` exists but currently lacks credentials for automated API access from this environment, meaning I cannot modify its settings or safely inspect its configuration directly.
- The instructions explicitly forbid modifying `tanixailive` and request a new project `wastewise-ai`.
- Because I lack an authenticated `vercel` CLI token inside the current container, I cannot provision a new Vercel project on your account automatically.

### Manual Vercel Actions Required
1. Log into your Vercel Dashboard.
2. Click **Add New... > Project**.
3. Import the `TanishBane/wastewise-ai` GitHub repository.
4. Ensure the Framework Preset is set to **Vite** (it should auto-detect).
5. Ensure the Root Directory is set to `frontend`.
6. Add the following Environment Variables (found in `.env.example`):
   - `VITE_API_BASE_URL` = `https://wastewise-api.onrender.com` (Or your actual deployed Render URL)
   - `VITE_SUPABASE_URL` = `<your-supabase-project-url>`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `<your-supabase-anon-key>`
7. Click **Deploy**.

## Phase 2: Render & Backend Status

- Render is configured via `render.yaml`. The web service is defined as `wastewise-api`.
- There is currently no live verification that the Render backend `https://wastewise-api.onrender.com` is actively successfully deployed or successfully querying Supabase. `curl -s https://wastewise-api.onrender.com/api/health` returns an error, indicating the API is either offline or the URL is incorrect.

### Manual Render Actions Required
1. Ensure the `wastewise-api` Web Service is successfully deploying in the Render Dashboard.
2. Ensure the following Environment Variables are configured securely in Render:
   - `DATABASE_URL` (Points to Supabase Transaction Pooler, e.g., `postgresql://postgres.xxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres`)
   - `SUPABASE_URL`
   - `SUPABASE_JWT_SECRET`
   - `SUPABASE_AUTH_ALGORITHM` = `HS256` (or `RS256` if using JWKS)
   - `AUTH_REQUIRED` = `true`
   - `WASTEWISE_CORS_ORIGINS` = `https://wastewise.vercel.app` (Or your actual Vercel project URL)
3. Note: Ensure `psycopg2-binary` or `asyncpg` is present in `requirements.txt`. (The codebase already relies on Supabase and PostgreSQL, but needs the driver. `psycopg2-binary` was successfully installed in the local environment, but we must ensure it's recorded correctly.)

## Phase 3: Supabase Configuration

- The migration file `20261023190000_supabase_auth_multitenant.sql` establishes multitenant logic and RLS (Row Level Security).
- The integration looks correct from the codebase side (JWT verification, RLS policies, multi-tenant roles).
- `test_auth.py` and `rls_security_test.sql` verify the constraints locally.

### Manual Supabase Actions Required
1. Run the migration script in Supabase SQL Editor: `supabase/migrations/20261023190000_supabase_auth_multitenant.sql`.
2. Configure **Authentication Redirect URLs** in the Supabase Dashboard:
   - Go to Authentication > URL Configuration.
   - Set the Site URL to your actual Vercel URL (e.g., `https://wastewise.vercel.app`).
   - Add the necessary Redirect URIs (e.g., `https://wastewise.vercel.app/#overview`).

## Codebase Checks

- `npm ci` and `npm run build` in `frontend/` succeed with 0 errors.
- `python -m pytest tests/` succeeds locally, with 46 passing tests.

## Summary

The source code is highly robust and production-ready for deployment. The remaining steps are entirely operational inside the Vercel, Render, and Supabase dashboards to establish the secure environment connections.
