# WasteWise AI - Deployment Guide

This document outlines the deployment strategy for the WasteWise AI application, targeting Vercel for the React frontend and Render for the Python/FastAPI backend.

## 1. Vercel Frontend Deployment

The React/Vite frontend should be deployed on Vercel as a standalone Static Site Generation / Single Page Application.

*   **Root Directory:** `frontend`
*   **Build Command:** `npm run build`
*   **Output Directory:** `dist`
*   **Environment Variables:**
    *   `VITE_API_BASE_URL`: Set this to the production URL of your Render backend (e.g., `https://wastewise-api.onrender.com`).

### Environment Variables Security
It is **safe** to expose `VITE_API_BASE_URL` in the frontend build variables. This allows the client browser to know where to send API requests. **Do not** put any database credentials, API keys, or backend secrets in Vercel's environment variables, as they would be bundled into the public JavaScript code.

---

## 2. Render Backend Deployment

The Python/FastAPI backend is designed to be hosted on Render as a Web Service.

*   **Root Directory:** `/` (Project Root)
*   **Build Command:** `pip install -r requirements.txt`
*   **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
*   **Environment Variables:**
    *   `PYTHON_VERSION`: `3.12`
    *   `WASTEWISE_CORS_ORIGINS`: Set this to your Vercel frontend URL (e.g., `https://wastewise.vercel.app`).
    *   `WASTEWISE_DB_PATH`: `/data/wastewise.db` (Crucial for SQLite persistence, see below).

### Persistent Disk Configuration (Crucial for SQLite)
The current backend relies on **SQLite (`data/wastewise.db`)** and stores active uploaded datasets locally (e.g., `data/active_operator_dataset.csv`).

Because Render web services have ephemeral filesystems, **you must configure a Render Disk** to prevent data loss whenever the service restarts or deploys.

1.  In your Render Web Service settings, go to the **Disks** section.
2.  Add a disk with the **Mount Path** set to `/data`.
3.  Set the `WASTEWISE_DB_PATH` environment variable to `/data/wastewise.db`.

### Backend Secrets
Currently, the SQLite setup does not require a database password. Once migrated to Postgres (Supabase), the `DATABASE_URL` (which contains the username and password) **must** be stored securely in Render's environment variables and never exposed to the frontend.

---

## 3. Database Constraints & Supabase Migration Path

### Current SQLite Limitations
*   **No Horizontal Scaling:** The current SQLite WAL mode only supports a single backend instance safely. Do not increase Render instances beyond `1`.
*   **No Serverless Functions:** Serverless environments cannot share a persistent disk state reliably.
*   **Single-Tenant:** The current schema lacks user authentication and tenant isolation.

### Path to Supabase Production Readiness
Before deploying to a multi-canteen production environment with Supabase, the following changes must be implemented:

1.  **Database Connection URL:** Switch SQLAlchemy `create_engine` to use a `postgresql://` connection string (specifically `postgresql+psycopg2://` or `postgresql+asyncpg://`) provided by Supabase.
2.  **Add Dependencies:** Add `psycopg2-binary` (or `asyncpg`) to `requirements.txt`.
3.  **Schema Migrations:** Introduce Alembic for version-controlled database migrations instead of relying on `Base.metadata.create_all` and non-destructive `PRAGMA` checks.
4.  **Multi-Tenancy & Row-Level Security (RLS):**
    *   Add a `tenant_id` or `canteen_id` to every database model (`ActualOutcomeModel`, `MenuItemModel`, `UploadHistoryModel`).
    *   Integrate Supabase Auth tokens in the FastAPI backend (e.g., via middleware or dependency injection) to extract the user's `tenant_id` on every request.
    *   Ensure all database queries (e.g., `db.query(MenuItemModel).filter_by(tenant_id=current_tenant)`) filter data so users only see their own workspace.
    *   Alternatively, configure RLS directly in Postgres via Supabase.
5.  **Remove Persistent Disks:** Once the application relies solely on Supabase Postgres and cloud storage for CSVs, the Render persistent disk can be safely removed, enabling horizontal scaling.

---

## 4. Post-Deployment Verification

1.  Deploy the Render backend first. Note the provided `.onrender.com` URL.
2.  Set `VITE_API_BASE_URL` in Vercel to this URL and deploy the frontend.
3.  Set `WASTEWISE_CORS_ORIGINS` in Render to the Vercel URL.
4.  Open the Vercel site. The top-left corner should say "Demo workspace" or "Operator dataset" (not "Connecting to workspace" or a connection error).
5.  Check the Network tab in browser Developer Tools to confirm API calls to `https://<your-render-url>/api/...` succeed with HTTP 200 and no CORS errors.
