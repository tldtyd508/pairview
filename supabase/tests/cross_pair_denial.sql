-- Manual RLS verification template.
-- Replace the UUID placeholders with real values from your Supabase project.

-- Simulate Pair A member
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Expected: rows for Pair A are visible
select count(*) as visible_subjects_for_pair_a
from public.subjects
where pair_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Simulate Pair B member
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Expected: zero rows when Pair B tries to read Pair A data
select count(*) as denied_subjects_for_pair_a
from public.subjects
where pair_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Repeat the same pattern for:
-- public.experiences
-- public.reviews
-- public.markers
-- public.experience_markers
-- public.photo_attachments
