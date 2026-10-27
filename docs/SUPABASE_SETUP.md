# WasteWise AI — Supabase Integration & Multi-Tenant Deployment Setup

> [!NOTE]
> **Public Demo Notice**: The standard WasteWise AI public demonstration application operates entirely out-of-the-box in **Demo Mode** using local SQLite storage (data/wastewise.db) and requires zero Supabase credentials, auth tokens, or cloud databases.
>
> This document is retained for repository reference and for enterprise organizations deploying an isolated private multi-tenant instance of WasteWise AI with Supabase Auth and PostgreSQL Row-Level Security (RLS).

This document outlines the complete setup procedure for connecting **WasteWise AI** to Supabase Auth, PostgreSQL, multi-tenant Row Level Security (RLS), and deploying to staging/production environments (Vercel frontend and Render/Railway backend).

---

## 1. Supabase Project Creation

1. Navigate to the [Supabase Dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New Project** and select your organization.
3. Configure the project:
   - **Name**: `wastewise-ai` (or your preferred canteen cluster name)
   - **Database Password**: Choose a strong password and store it securely (e.g. in your password manager).
   - **Region**: Select the AWS region closest to your operational canteens (e.g., `ap-south-1` for Mumbai).
   - **Pricing Plan**: Free or Pro tier.
4. Wait for the database provisioning to complete (typically 1–2 minutes).

---

## 2. Retrieving Required Credentials

From the Supabase Dashboard, gather the following configuration keys:

| Parameter | Location in Dashboard | Usage | Exposure |
|---|---|---|---|
| **Project URL** (`VITE_SUPABASE_URL` / `SUPABASE_URL`) | *Project Settings* -> *API* -> *Project URL* | Client SDK & Backend JWT Issuer | Public / Safe |
| **Publishable / Anon Key** (`VITE_SUPABASE_PUBLISHABLE_KEY`) | *Project Settings* -> *API* -> *Project API Keys* -> `anon` / `public` | React Frontend Auth Client | Public / Safe |
| **JWT Secret** (`SUPABASE_JWT_SECRET`) | *Project Settings* -> *API* -> *JWT Settings* -> *JWT Secret* | FastAPI Token Verification (HS256) | **Secret (Backend Only)** |
| **PostgreSQL URI** (`DATABASE_URL`) | *Project Settings* -> *Database* -> *Connection String* -> *URI* (Use Transaction Pooler on port `6543`) | SQLAlchemy Backend Database Engine | **Secret (Backend Only)** |

> [!CAUTION]
> Never expose `SUPABASE_JWT_SECRET`, `service_role` keys, or database passwords in frontend `.env` files or variables prefixed with `VITE_`.

---

## 3. Database Schema Setup & Migrations

The database migration is version-controlled in the standard Supabase directory:
`supabase/migrations/20261023190000_supabase_auth_multitenant.sql`

### Option A: Via Supabase CLI (Recommended)

1. Authenticate the CLI with a scoped personal access token:
   ```bash
   npx supabase login
   ```
2. Link your local repository to your remote Supabase project:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
3. Push the migrations to remote PostgreSQL:
   ```bash
   npx supabase db push
   ```

### Option B: Via Supabase SQL Editor

1. Open the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).
2. Copy the contents of `supabase/migrations/20261023190000_supabase_auth_multitenant.sql`.
3. Paste into the editor and click **Run**.
4. Confirm all 8 tables, indexes, triggers, and RLS policies are created successfully.

---

## 4. Auth Provider, Email Verification & Recovery Settings

Configure Auth behavior in the Supabase Dashboard under *Authentication* -> *Providers* & *URL Configuration*:

1. **Email Auth Provider**:
   - Navigate to *Authentication* -> *Providers* -> *Email*.
   - Ensure **Enable Email provider** is toggled ON.
   - For production, ensure **Confirm email** is enabled to require verification before full operator access.
2. **Redirect URLs**:
   - Navigate to *Authentication* -> *URL Configuration*.
   - **Site URL**:
     - Local development: `http://localhost:3000` or `http://127.0.0.1:8000`
     - Production: `https://wastewise.vercel.app` (or your custom domain)
   - **Redirect URLs**: Add the following permitted redirect paths:
     - `http://localhost:3000/**`
     - `http://127.0.0.1:8000/**`
     - `https://wastewise.vercel.app/**`
3. **Email Templates**:
   - Under *Authentication* -> *Email Templates*, customize the **Confirmation** and **Reset Password** templates with WasteWise AI branding if desired.

---

## 5. Multi-Tenant Architecture & Database Row Level Security (RLS)

WasteWise AI enforces strict tenant isolation at the database layer. No operator can read, insert, update, or delete records belonging to another canteen organization.

### Schema Hierarchy
- `organizations`: Root tenant entity representing an individual canteen, dining hall, or campus food-service operation.
- `organization_members`: Junction table establishing user roles (`owner`, `admin`, `member`).
- `user_profiles`: User profile data synced 1:1 with `auth.users`.
- `actual_outcomes`: Post-service shift logs with conservation constraint (`portions_prepared = portions_sold + portions_leftover`).
- `menu_items`: Dish catalog scoped to the organization.
- `preparation_plans`: Batch preparation plans and replenishment trigger limits.
- `forecast_runs`: Historical scenario predictions and uncertainty bounds.
- `upload_history`: Ingestion audit logs.

### Security Definer Functions & Least-Privilege Grants
- `public.is_org_member(org_id UUID)`: `SECURITY DEFINER SET search_path = '' STABLE`
- `public.is_org_admin(org_id UUID)`: `SECURITY DEFINER SET search_path = '' STABLE`
- `public.is_org_owner(org_id UUID)`: `SECURITY DEFINER SET search_path = '' STABLE`
- `public.create_organization(org_name TEXT, org_slug TEXT)`: Securely provisions organizations with the calling user as owner. Direct `INSERT` on `organizations` is revoked from `authenticated`.
- `public.get_organization_members(org_id UUID)`: Narrowly exposes only display name, avatar, and role for teammates without leaking personal profile information or emails.

### Preventing Cross-Tenant Record Transfers
Anti-transfer database triggers (`prevent_organization_transfer`) are attached to all tenant-scoped tables:
```sql
CREATE TRIGGER trg_prevent_transfer_actual_outcomes
  BEFORE UPDATE ON public.actual_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();
```
Any attempt to update a row's `organization_id` to another tenant raises an immediate exception and aborts the transaction.

---

## 6. Avoiding the PostgreSQL Superuser `BYPASSRLS` Trap

> [!IMPORTANT]
> In PostgreSQL, any user with the `SUPERUSER` or `BYPASSRLS` attribute (such as the default `postgres` database user) completely bypasses Row Level Security policies, even if `FORCE ROW LEVEL SECURITY` is enabled on the table.

### Production Connection Role Strategy
To ensure RLS policies are strictly enforced when using SQLAlchemy direct connections:

1. **Use an Authenticated or Restricted Application Role**:
   Create a dedicated application role in PostgreSQL that does NOT possess `BYPASSRLS`:
   ```sql
   CREATE ROLE wastewise_app WITH LOGIN PASSWORD 'strong_password';
   GRANT USAGE ON SCHEMA public TO wastewise_app;
   GRANT authenticated TO wastewise_app;
   ```
2. **Transaction-Scoped Identity Claims**:
   The backend database access layer uses `set_session_user(db, user_id, role)`:
   ```python
   db.execute(
       text(
           "SELECT set_config('request.jwt.claim.sub', :sub, true), "
           "set_config('request.jwt.claim.role', :role, true)"
       ),
       {"sub": str(user_id), "role": role},
   )
   ```
   The third argument `true` (`is_local`) scopes the setting strictly to the current database transaction, preventing connection pool identity leakage.

---

## 7. Model & Dataset Isolation (`OrgStateRegistry`)

The forecasting engine and operational datasets are fully isolated per organization via `OrgStateRegistry` (`backend/services/org_state_service.py`):
- **Private Tenant Storage**: Datasets are stored in private tenant directories: `data/tenants/{organization_id}/active_operator_dataset.csv`.
- **Per-Tenant Machine Learning Models**: Each organization maintains an independent `DemandForecastingEngine` and `PreparationPlanner`.
- **Zero Pollution**: An upload or dataset reset by Tenant A will never mutate, replace, or affect Tenant B's model or recommendations.

---

## 8. Fail-Closed Backend Authentication Strategy

`backend/auth.py` enforces cryptographic verification and fails closed:
- **Pinned Algorithms**: Rejects `alg: none` and algorithm-switching attacks. Only the explicitly configured algorithm (`HS256` or `RS256`) is accepted.
- **Asymmetric JWKS Support**: When `SUPABASE_AUTH_ALGORITHM == "RS256"`, keys are fetched from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` and matched against the token's `kid`.
- **Fail Closed**: If verification credentials are not configured, requests fail closed (HTTP 500/401) rather than accepting unverified tokens.
- **No Permissive Defaults**: Unauthenticated calls to private endpoints are immediately rejected with HTTP 401.

---

## 9. Local Development Environment

### Step 1: Frontend Configuration
In `frontend/.env.local` (or root `.env`):
```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Step 2: Backend Configuration
In `.env` (or server environment variables):
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
DATABASE_URL=postgresql://postgres.your-project-ref:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
AUTH_REQUIRED=true
WASTEWISE_CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

### Step 3: Run the Development Servers
1. **Start Backend**:
   ```powershell
   py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```
2. **Start Frontend**:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Open `http://localhost:3000`.

---

## 10. Running Automated Tests

### Full Python & Security Test Suite
```powershell
py -m pytest tests/ -v
```
All 46 tests must pass cleanly.

### Frontend Production Build & Code Quality
```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run format:check
npm.cmd --prefix frontend run build
```

### Supabase RLS Security Verification
Execute the automated database security checks against your Supabase PostgreSQL instance:
```bash
psql "$DATABASE_URL" -f supabase/tests/rls_security_test.sql
```

---

## 11. Deployment Requirements Before Vercel Launch

Before deploying the frontend Single Page Application to Vercel:

1. **Backend URL**: Ensure your FastAPI backend is deployed on a persistent hosting platform (e.g. Render, Railway, AWS ECS) with a valid SSL/TLS HTTPS endpoint.
2. **Vercel Environment Variables**:
   - `VITE_API_BASE_URL`: `https://your-backend-api.onrender.com`
   - `VITE_SUPABASE_URL`: `https://your-project-ref.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: `your-supabase-anon-key`
3. **Backend CORS Environment Variable**:
   - `WASTEWISE_CORS_ORIGINS`: Set to your production Vercel domain (e.g. `https://wastewise.vercel.app`).
4. **Supabase Redirect URL**: Add `https://your-app.vercel.app/**` to the authorized redirect URLs in Supabase Auth configuration.
