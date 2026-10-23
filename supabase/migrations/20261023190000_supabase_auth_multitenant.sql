-- WasteWise AI — Multi-Tenant PostgreSQL Migration & RLS Security
-- Migration: 20261023190000_supabase_auth_multitenant.sql
-- Enforces database-level organization isolation, least-privilege grants, and performance-optimized RLS.

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Organizations Table (Tenants)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. User Profiles (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Organization Memberships (User to Organization with Role)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- 5. Menu Items (Catalog scoped to Organization)
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cost_price DOUBLE PRECISION NOT NULL,
    selling_price DOUBLE PRECISION NOT NULL,
    prep_time_min INTEGER DEFAULT 30 NOT NULL,
    prep_batch_size INTEGER DEFAULT 20 NOT NULL,
    shelf_life_hours DOUBLE PRECISION DEFAULT 4.0 NOT NULL,
    base_demand DOUBLE PRECISION DEFAULT 50.0 NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, name)
);

-- 6. Actual Outcomes (Shift Logs with Operational Invariant Validation)
CREATE TABLE IF NOT EXISTS public.actual_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_date TEXT NOT NULL,
    target_meal TEXT DEFAULT 'Lunch' NOT NULL,
    menu_item TEXT NOT NULL,
    portions_prepared INTEGER NOT NULL,
    portions_sold INTEGER NOT NULL,
    portions_leftover INTEGER NOT NULL,
    waste_cause TEXT DEFAULT 'Over-preparation' NOT NULL,
    discarded_kg DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    donation_kg DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    waste_cost DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    notes TEXT DEFAULT '',
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_portions_positive CHECK (
        portions_prepared >= 0 AND portions_sold >= 0 AND portions_leftover >= 0
    ),
    CONSTRAINT check_portions_invariant CHECK (
        portions_prepared = portions_sold + portions_leftover
    )
);

-- 7. Preparation Plans (Optimized Batch Recommendations)
CREATE TABLE IF NOT EXISTS public.preparation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_date TEXT NOT NULL,
    target_meal TEXT DEFAULT 'Lunch' NOT NULL,
    menu_item TEXT NOT NULL,
    predicted_demand DOUBLE PRECISION NOT NULL,
    lower_bound DOUBLE PRECISION NOT NULL,
    upper_bound DOUBLE PRECISION NOT NULL,
    current_stock INTEGER DEFAULT 0 NOT NULL,
    critical_ratio DOUBLE PRECISION DEFAULT 0.55 NOT NULL,
    recommended_total_plan INTEGER NOT NULL,
    recommended_initial_batch INTEGER NOT NULL,
    refill_trigger_threshold INTEGER DEFAULT 0 NOT NULL,
    wastewise_expected_cost DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    current_policy_expected_cost DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    net_cost_avoided DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    status TEXT DEFAULT 'recommended' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. Forecast Runs (Scenario Forecasts & Uncertainty Records)
CREATE TABLE IF NOT EXISTS public.forecast_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    menu_item TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    attendance_index DOUBLE PRECISION NOT NULL,
    is_event INTEGER NOT NULL,
    weather TEXT NOT NULL,
    target_service TEXT DEFAULT 'Lunch' NOT NULL,
    predicted_demand DOUBLE PRECISION NOT NULL,
    lower_bound DOUBLE PRECISION NOT NULL,
    upper_bound DOUBLE PRECISION NOT NULL,
    weekday_baseline DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    model_version TEXT DEFAULT '1.0-rf' NOT NULL,
    feature_contributions_json TEXT DEFAULT '{}' NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. Upload History (Ingested Dataset Audit Log)
CREATE TABLE IF NOT EXISTS public.upload_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    checksum TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    service_days INTEGER DEFAULT 0 NOT NULL,
    validation_warnings_json TEXT DEFAULT '[]' NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    source TEXT DEFAULT 'operator' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- 10. Performance Indexes on Foreign Keys & RLS lookup columns
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_org ON public.menu_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_actual_outcomes_org_date ON public.actual_outcomes(organization_id, service_date);
CREATE INDEX IF NOT EXISTS idx_prep_plans_org_date ON public.preparation_plans(organization_id, service_date);
CREATE INDEX IF NOT EXISTS idx_forecast_runs_org ON public.forecast_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_org ON public.upload_history(organization_id);

-- 11. Security Definer Helper Functions (Protected and optimized)
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = (SELECT auth.uid())
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = (SELECT auth.uid())
      AND role = 'owner'
  );
$$;

-- Trusted organization provisioning function (prevents client-forged roles)
CREATE OR REPLACE FUNCTION public.create_organization(org_name TEXT, org_slug TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calling_user_id UUID;
  new_org_id UUID;
  computed_slug TEXT;
BEGIN
  calling_user_id := (SELECT auth.uid());
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create an organization';
  END IF;

  IF org_name IS NULL OR length(trim(org_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name cannot be empty';
  END IF;

  IF org_slug IS NULL OR length(trim(org_slug)) = 0 THEN
    computed_slug := 'org-' || substr(calling_user_id::text, 1, 8) || '-' || extract(epoch from clock_timestamp())::bigint;
  ELSE
    computed_slug := lower(regexp_replace(trim(org_slug), '[^a-zA-Z0-9\-]', '-', 'g'));
  END IF;

  INSERT INTO public.organizations (name, slug)
  VALUES (trim(org_name), computed_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, calling_user_id, 'owner');

  -- Seed initial standard canteen menu items
  INSERT INTO public.menu_items (organization_id, name, category, cost_price, selling_price, prep_time_min, prep_batch_size, shelf_life_hours, base_demand)
  VALUES
    (new_org_id, 'Pav Bhaji', 'Lunch / Snack', 35.0, 80.0, 30, 20, 4.0, 50.0),
    (new_org_id, 'Idli Sambar', 'Breakfast / Light', 22.0, 50.0, 20, 25, 3.0, 40.0),
    (new_org_id, 'Veg Thali', 'Lunch Meals', 65.0, 140.0, 45, 15, 3.5, 45.0),
    (new_org_id, 'Veg Grilled Sandwich', 'Snack', 28.0, 70.0, 15, 15, 2.0, 35.0),
    (new_org_id, 'Masala Dosa', 'Breakfast / Snack', 30.0, 75.0, 25, 20, 2.5, 45.0),
    (new_org_id, 'Chole Bhature', 'Lunch / Special', 45.0, 110.0, 40, 18, 3.0, 40.0),
    (new_org_id, 'Poha', 'Breakfast', 18.0, 40.0, 15, 30, 3.0, 35.0),
    (new_org_id, 'Rajma Rice Bowl', 'Lunch Meals', 40.0, 95.0, 35, 20, 4.0, 42.0)
  ON CONFLICT DO NOTHING;

  RETURN new_org_id;
END;
$$;

-- Privacy-conscious member directory function: exposes name/avatar to teammates without exposing full profiles
CREATE OR REPLACE FUNCTION public.get_organization_members(target_org_id UUID)
RETURNS TABLE (
    user_id UUID,
    role TEXT,
    full_name TEXT,
    avatar_url TEXT,
    joined_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT 
    m.user_id,
    m.role,
    p.full_name,
    p.avatar_url,
    m.created_at AS joined_at
  FROM public.organization_members m
  JOIN public.user_profiles p ON p.id = m.user_id
  WHERE m.organization_id = target_org_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members self_m
      WHERE self_m.organization_id = target_org_id
        AND self_m.user_id = (SELECT auth.uid())
    );
$$;

-- Trigger function preventing cross-organization ownership/data reassignment
CREATE OR REPLACE FUNCTION public.prevent_organization_transfer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id <> OLD.organization_id THEN
    RAISE EXCEPTION 'Transferring records across organizations is strictly prohibited';
  END IF;
  RETURN NEW;
END;
$$;

-- Attach anti-transfer triggers across all tenant-scoped tables
DROP TRIGGER IF EXISTS trg_prevent_transfer_org_members ON public.organization_members;
CREATE TRIGGER trg_prevent_transfer_org_members
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();

DROP TRIGGER IF EXISTS trg_prevent_transfer_menu_items ON public.menu_items;
CREATE TRIGGER trg_prevent_transfer_menu_items
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();

DROP TRIGGER IF EXISTS trg_prevent_transfer_actual_outcomes ON public.actual_outcomes;
CREATE TRIGGER trg_prevent_transfer_actual_outcomes
  BEFORE UPDATE ON public.actual_outcomes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();

DROP TRIGGER IF EXISTS trg_prevent_transfer_prep_plans ON public.preparation_plans;
CREATE TRIGGER trg_prevent_transfer_prep_plans
  BEFORE UPDATE ON public.preparation_plans
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();

DROP TRIGGER IF EXISTS trg_prevent_transfer_forecast_runs ON public.forecast_runs;
CREATE TRIGGER trg_prevent_transfer_forecast_runs
  BEFORE UPDATE ON public.forecast_runs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();

DROP TRIGGER IF EXISTS trg_prevent_transfer_upload_history ON public.upload_history;
CREATE TRIGGER trg_prevent_transfer_upload_history
  BEFORE UPDATE ON public.upload_history
  FOR EACH ROW EXECUTE FUNCTION public.prevent_organization_transfer();

-- 12. Enable Row Level Security on ALL tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members FORCE ROW LEVEL SECURITY;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.actual_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actual_outcomes FORCE ROW LEVEL SECURITY;

ALTER TABLE public.preparation_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preparation_plans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.forecast_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecast_runs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history FORCE ROW LEVEL SECURITY;

-- 13. RLS Policies: Organizations
CREATE POLICY "org_select_member" ON public.organizations
    FOR SELECT TO authenticated
    USING (id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = (SELECT auth.uid())
    ));

CREATE POLICY "org_update_admin" ON public.organizations
    FOR UPDATE TO authenticated
    USING (public.is_org_admin(id))
    WITH CHECK (public.is_org_admin(id));

-- 14. RLS Policies: User Profiles (Strict Self-Only Isolation)
CREATE POLICY "profile_select_self" ON public.user_profiles
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = id);

CREATE POLICY "profile_insert_self" ON public.user_profiles
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "profile_update_self" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- 15. RLS Policies: Organization Members
CREATE POLICY "org_members_select" ON public.organization_members
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

-- Prevents self-joining and privilege self-escalation:
-- Only existing admins can insert members; only owners can invite admins or owners.
CREATE POLICY "org_members_insert" ON public.organization_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_admin(organization_id)
        AND (
            role = 'member'
            OR (role IN ('admin', 'owner') AND public.is_org_owner(organization_id))
        )
    );

-- Enforces role change authorization over both existing and resulting membership:
-- Admins can update member roles; only owners can promote/demote admins or owners.
CREATE POLICY "org_members_update" ON public.organization_members
    FOR UPDATE TO authenticated
    USING (
        public.is_org_admin(organization_id)
        AND (
            public.is_org_owner(organization_id)
            OR role = 'member'
        )
    )
    WITH CHECK (
        public.is_org_admin(organization_id)
        AND (
            public.is_org_owner(organization_id)
            OR role = 'member'
        )
    );

-- Delete policy: Admins can remove members; Owners can remove anyone except self; Members can leave themselves (unless owner)
CREATE POLICY "org_members_delete" ON public.organization_members
    FOR DELETE TO authenticated
    USING (
        (user_id = (SELECT auth.uid()) AND role <> 'owner')
        OR (public.is_org_owner(organization_id) AND user_id <> (SELECT auth.uid()))
        OR (public.is_org_admin(organization_id) AND role = 'member')
    );

-- 16. RLS Policies: Menu Items
CREATE POLICY "menu_items_select" ON public.menu_items
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "menu_items_insert" ON public.menu_items
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "menu_items_update" ON public.menu_items
    FOR UPDATE TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "menu_items_delete" ON public.menu_items
    FOR DELETE TO authenticated
    USING (public.is_org_admin(organization_id));

-- 17. RLS Policies: Actual Outcomes
CREATE POLICY "actual_outcomes_select" ON public.actual_outcomes
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "actual_outcomes_insert" ON public.actual_outcomes
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_org_member(organization_id) AND
        (user_id = (SELECT auth.uid()) OR user_id IS NULL)
    );

CREATE POLICY "actual_outcomes_update" ON public.actual_outcomes
    FOR UPDATE TO authenticated
    USING (
        public.is_org_member(organization_id) AND
        (public.is_org_admin(organization_id) OR user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        public.is_org_member(organization_id) AND
        (public.is_org_admin(organization_id) OR user_id = (SELECT auth.uid()))
    );

CREATE POLICY "actual_outcomes_delete" ON public.actual_outcomes
    FOR DELETE TO authenticated
    USING (public.is_org_admin(organization_id));

-- 18. RLS Policies: Preparation Plans
CREATE POLICY "prep_plans_select" ON public.preparation_plans
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "prep_plans_insert" ON public.preparation_plans
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "prep_plans_update" ON public.preparation_plans
    FOR UPDATE TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "prep_plans_delete" ON public.preparation_plans
    FOR DELETE TO authenticated
    USING (public.is_org_admin(organization_id));

-- 19. RLS Policies: Forecast Runs
CREATE POLICY "forecast_runs_select" ON public.forecast_runs
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "forecast_runs_insert" ON public.forecast_runs
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "forecast_runs_delete" ON public.forecast_runs
    FOR DELETE TO authenticated
    USING (public.is_org_admin(organization_id));

-- 20. RLS Policies: Upload History
CREATE POLICY "upload_history_select" ON public.upload_history
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id));

CREATE POLICY "upload_history_insert" ON public.upload_history
    FOR INSERT TO authenticated
    WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "upload_history_update" ON public.upload_history
    FOR UPDATE TO authenticated
    USING (public.is_org_admin(organization_id))
    WITH CHECK (public.is_org_admin(organization_id));

-- 21. Automatic New User Setup Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name);

  -- Create a personal default canteen organization for the user
  INSERT INTO public.organizations (name, slug)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'canteen_name', split_part(NEW.email, '@', 1) || '''s Canteen'),
    'org-' || substr(NEW.id::text, 1, 8) || '-' || extract(epoch from clock_timestamp())::bigint
  )
  RETURNING id INTO default_org_id;

  -- Assign user as owner of their default organization
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (default_org_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Seed initial menu items for the newly created canteen organization
  INSERT INTO public.menu_items (organization_id, name, category, cost_price, selling_price, prep_time_min, prep_batch_size, shelf_life_hours, base_demand)
  VALUES
    (default_org_id, 'Pav Bhaji', 'Lunch / Snack', 35.0, 80.0, 30, 20, 4.0, 50.0),
    (default_org_id, 'Idli Sambar', 'Breakfast / Light', 22.0, 50.0, 20, 25, 3.0, 40.0),
    (default_org_id, 'Veg Thali', 'Lunch Meals', 65.0, 140.0, 45, 15, 3.5, 45.0),
    (default_org_id, 'Veg Grilled Sandwich', 'Snack', 28.0, 70.0, 15, 15, 2.0, 35.0),
    (default_org_id, 'Masala Dosa', 'Breakfast / Snack', 30.0, 75.0, 25, 20, 2.5, 45.0),
    (default_org_id, 'Chole Bhature', 'Lunch / Special', 45.0, 110.0, 40, 18, 3.0, 40.0),
    (default_org_id, 'Poha', 'Breakfast', 18.0, 40.0, 15, 30, 3.0, 35.0),
    (default_org_id, 'Rajma Rice Bowl', 'Lunch Meals', 40.0, 95.0, 35, 20, 4.0, 42.0)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 22. Explicit Least-Privilege Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Organizations: Authenticated users can read their orgs and update if admin.
-- Creation is restricted to trusted function `create_organization` or `handle_new_user` trigger.
GRANT SELECT, UPDATE ON public.organizations TO authenticated;

-- User Profiles: Self read and write
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;

-- Organization Members: Managed via admin/owner policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

-- Operational data tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actual_outcomes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preparation_plans TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.forecast_runs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.upload_history TO authenticated;

-- Function execution grants
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_members(UUID) TO authenticated;
