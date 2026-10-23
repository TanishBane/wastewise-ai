-- WasteWise AI — PostgreSQL & RLS Multi-Tenant Security Verification Tests
-- Executed via pgTAP or psql in CI / local Supabase testing environment.

BEGIN;

-- Setup test extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create mock test users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'chef_anita@canteen-a.edu', '{"full_name": "Anita Rao", "canteen_name": "Canteen Alpha"}'),
    ('22222222-2222-2222-2222-222222222222', 'chef_rahul@canteen-b.edu', '{"full_name": "Rahul Verma", "canteen_name": "Canteen Beta"}')
ON CONFLICT (id) DO NOTHING;

-- Verification 1: Confirm trigger created user profiles and default organizations
DO $$
DECLARE
    org_a_count INTEGER;
    org_b_count INTEGER;
BEGIN
    SELECT count(*) INTO org_a_count FROM public.organizations WHERE name LIKE '%Alpha%';
    SELECT count(*) INTO org_b_count FROM public.organizations WHERE name LIKE '%Beta%';
    IF org_a_count = 0 OR org_b_count = 0 THEN
        RAISE EXCEPTION 'TEST FAILED: Trigger handle_new_user failed to create organizations';
    END IF;
    RAISE NOTICE 'TEST PASSED: Organizations auto-provisioned successfully';
END $$;

-- Verification 2: Verify RLS restricts Chef Anita from viewing Canteen Beta's outcomes
DO $$
DECLARE
    org_b_id UUID;
    visible_outcomes_count INTEGER;
BEGIN
    -- Retrieve Canteen Beta's ID
    SELECT organization_id INTO org_b_id FROM public.organization_members
    WHERE user_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;

    -- Directly insert an outcome for Canteen Beta
    INSERT INTO public.actual_outcomes (
        organization_id, user_id, service_date, target_meal, menu_item,
        portions_prepared, portions_sold, portions_leftover, waste_cause
    ) VALUES (
        org_b_id, '22222222-2222-2222-2222-222222222222', '2026-10-23', 'Lunch', 'Pav Bhaji',
        30, 25, 5, 'Over-preparation'
    );

    -- Simulate request as Chef Anita (User 11111111...)
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

    -- Query actual_outcomes
    SELECT count(*) INTO visible_outcomes_count FROM public.actual_outcomes WHERE organization_id = org_b_id;

    IF visible_outcomes_count > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Chef Anita can read Canteen Beta outcomes! RLS failed.';
    END IF;

    RAISE NOTICE 'TEST PASSED: Cross-organization read denied by RLS policy';
END $$;

-- Verification 3: Verify Cross-organization insert is rejected
DO $$
DECLARE
    org_b_id UUID;
    insert_succeeded BOOLEAN := false;
BEGIN
    SELECT organization_id INTO org_b_id FROM public.organization_members
    WHERE user_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;

    -- Act as Chef Anita
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

    BEGIN
        INSERT INTO public.actual_outcomes (
            organization_id, user_id, service_date, target_meal, menu_item,
            portions_prepared, portions_sold, portions_leftover, waste_cause
        ) VALUES (
            org_b_id, '11111111-1111-1111-1111-111111111111', '2026-10-23', 'Lunch', 'Idli Sambar',
            20, 18, 2, 'Over-preparation'
        );
        insert_succeeded := true;
    EXCEPTION WHEN insufficient_privilege THEN
        insert_succeeded := false;
    END;

    IF insert_succeeded THEN
        RAISE EXCEPTION 'SECURITY BREACH: Chef Anita was able to write data into Canteen Beta!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Cross-organization insert denied by RLS policy';
END $$;

-- Verification 4: Operational Invariant Check (prepared = sold + leftover)
DO $$
DECLARE
    org_a_id UUID;
    invalid_insert_succeeded BOOLEAN := false;
BEGIN
    SELECT organization_id INTO org_a_id FROM public.organization_members
    WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;

    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

    BEGIN
        -- Invalid: 50 prepared != 30 sold + 10 leftover (sum is 40)
        INSERT INTO public.actual_outcomes (
            organization_id, user_id, service_date, target_meal, menu_item,
            portions_prepared, portions_sold, portions_leftover, waste_cause
        ) VALUES (
            org_a_id, '11111111-1111-1111-1111-111111111111', '2026-10-23', 'Lunch', 'Veg Thali',
            50, 30, 10, 'Over-preparation'
        );
        invalid_insert_succeeded := true;
    EXCEPTION WHEN check_violation THEN
        invalid_insert_succeeded := false;
    END;

    IF invalid_insert_succeeded THEN
        RAISE EXCEPTION 'CONSTRAINT VIOLATION: Invalid portion math (50 != 30 + 10) was accepted!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Operational invariant portions_prepared = portions_sold + portions_leftover enforced';
END $$;

ROLLBACK;
