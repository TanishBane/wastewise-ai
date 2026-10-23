-- WasteWise AI — Comprehensive PostgreSQL & RLS Multi-Tenant Security Verification Tests
-- Verifies membership authorization, privilege escalation rejection, profile privacy,
-- cross-tenant transfer prevention, and operational invariants.

BEGIN;

-- Setup test extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create mock test users in auth.users
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'chef_anita@canteen-a.edu', '{"full_name": "Anita Rao", "canteen_name": "Canteen Alpha"}'),
    ('22222222-2222-2222-2222-222222222222', 'chef_rahul@canteen-b.edu', '{"full_name": "Rahul Verma", "canteen_name": "Canteen Beta"}'),
    ('33333333-3333-3333-3333-333333333333', 'attacker@untrusted.edu', '{"full_name": "Malicious User", "canteen_name": "Attacker Canteen"}')
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

-- Verification 2: Verify User Profiles Privacy (User 3 cannot read User 1 or User 2 profiles)
DO $$
DECLARE
    visible_profiles INTEGER;
BEGIN
    -- Act as Attacker (User 33333333...)
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

    SELECT count(*) INTO visible_profiles FROM public.user_profiles;

    -- Attacker should ONLY see their own 1 profile
    IF visible_profiles <> 1 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Attacker can see % profiles! Expected exactly 1 (own profile).', visible_profiles;
    END IF;

    RAISE NOTICE 'TEST PASSED: User profile read privacy enforced (only own profile visible)';
END $$;

-- Verification 3: Verify Attempted Unauthorized Self-Joining is Denied
DO $$
DECLARE
    org_a_id UUID;
    joined_succeeded BOOLEAN := false;
BEGIN
    -- Get Org Alpha ID
    SELECT organization_id INTO org_a_id FROM public.organization_members
    WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;

    -- Act as Attacker
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

    BEGIN
        -- Attacker attempts to insert themselves into Org Alpha
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (org_a_id, '33333333-3333-3333-3333-333333333333', 'member');
        joined_succeeded := true;
    EXCEPTION WHEN insufficient_privilege THEN
        joined_succeeded := false;
    END;

    IF joined_succeeded THEN
        RAISE EXCEPTION 'SECURITY BREACH: Attacker was able to self-join Org Alpha without admin invite!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Unauthorized self-joining denied by RLS policy';
END $$;

-- Verification 4: Verify Attempted Self-Promotion to Owner / Admin is Denied
DO $$
DECLARE
    org_a_id UUID;
    promotion_succeeded BOOLEAN := false;
BEGIN
    SELECT organization_id INTO org_a_id FROM public.organization_members
    WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;

    -- Act as Attacker
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '33333333-3333-3333-3333-333333333333', true);

    BEGIN
        -- Attacker attempts to forge an owner role for themselves in Org Alpha
        INSERT INTO public.organization_members (organization_id, user_id, role)
        VALUES (org_a_id, '33333333-3333-3333-3333-333333333333', 'owner');
        promotion_succeeded := true;
    EXCEPTION WHEN insufficient_privilege THEN
        promotion_succeeded := false;
    END;

    IF promotion_succeeded THEN
        RAISE EXCEPTION 'SECURITY BREACH: Attacker was able to forge owner role in an external organization!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Privilege self-escalation and role forgery denied';
END $$;

-- Verification 5: Verify Cross-Organization Data Read is Denied
DO $$
DECLARE
    org_b_id UUID;
    visible_outcomes_count INTEGER;
BEGIN
    SELECT organization_id INTO org_b_id FROM public.organization_members
    WHERE user_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;

    -- Act as Chef Anita (User 11111111...)
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

    -- Query Canteen Beta's actual_outcomes
    SELECT count(*) INTO visible_outcomes_count FROM public.actual_outcomes WHERE organization_id = org_b_id;

    IF visible_outcomes_count > 0 THEN
        RAISE EXCEPTION 'SECURITY BREACH: Chef Anita can read Canteen Beta outcomes! RLS failed.';
    END IF;

    RAISE NOTICE 'TEST PASSED: Cross-organization read denied by RLS policy';
END $$;

-- Verification 6: Verify Cross-Organization Record Transfer is Blocked by Trigger
DO $$
DECLARE
    org_a_id UUID;
    org_b_id UUID;
    outcome_id UUID;
    transfer_succeeded BOOLEAN := false;
BEGIN
    SELECT organization_id INTO org_a_id FROM public.organization_members
    WHERE user_id = '11111111-1111-1111-1111-111111111111' LIMIT 1;
    SELECT organization_id INTO org_b_id FROM public.organization_members
    WHERE user_id = '22222222-2222-2222-2222-222222222222' LIMIT 1;

    -- Insert record in Org Alpha as Anita
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

    INSERT INTO public.actual_outcomes (
        organization_id, user_id, service_date, target_meal, menu_item,
        portions_prepared, portions_sold, portions_leftover, waste_cause
    ) VALUES (
        org_a_id, '11111111-1111-1111-1111-111111111111', '2026-10-23', 'Lunch', 'Pav Bhaji',
        30, 25, 5, 'Over-preparation'
    ) RETURNING id INTO outcome_id;

    -- Attempt to transfer ownership of this record to Org Beta
    BEGIN
        UPDATE public.actual_outcomes
        SET organization_id = org_b_id
        WHERE id = outcome_id;
        transfer_succeeded := true;
    EXCEPTION WHEN OTHERS THEN
        transfer_succeeded := false;
    END;

    IF transfer_succeeded THEN
        RAISE EXCEPTION 'SECURITY BREACH: Record was transferred across organizations!';
    END IF;

    RAISE NOTICE 'TEST PASSED: Cross-organization record transfer blocked by trigger';
END $$;

-- Verification 7: Operational Invariant Check (prepared = sold + leftover)
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
