-- Check RLS status for each table individually
-- This will tell us exactly which tables have the "RLS enabled but no policies" issue

SELECT 
    'postal_sectors' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'postal_sectors' AND schemaname = 'public') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'postal_sectors' AND schemaname = 'public') as policy_count,
    CASE 
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'postal_sectors' AND schemaname = 'public') = true 
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'postal_sectors' AND schemaname = 'public') = 0 
        THEN '❌ BLOCKED - RLS enabled, no policies'
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'postal_sectors' AND schemaname = 'public') = false 
        THEN '✅ ACCESSIBLE - RLS disabled'
        ELSE '✅ ACCESSIBLE - Has policies'
    END as status

UNION ALL

SELECT 
    'communities' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'communities' AND schemaname = 'public') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'communities' AND schemaname = 'public') as policy_count,
    CASE 
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'communities' AND schemaname = 'public') = true 
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'communities' AND schemaname = 'public') = 0 
        THEN '❌ BLOCKED - RLS enabled, no policies'
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'communities' AND schemaname = 'public') = false 
        THEN '✅ ACCESSIBLE - RLS disabled'
        ELSE '✅ ACCESSIBLE - Has policies'
    END as status

UNION ALL

SELECT 
    'user_profiles' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') as policy_count,
    CASE 
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public') = true 
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles' AND schemaname = 'public') = 0 
        THEN '❌ BLOCKED - RLS enabled, no policies'
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles' AND schemaname = 'public') = false 
        THEN '✅ ACCESSIBLE - RLS disabled'
        ELSE '✅ ACCESSIBLE - Has policies'
    END as status

UNION ALL

SELECT 
    'posts' as table_name,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'posts' AND schemaname = 'public') as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts' AND schemaname = 'public') as policy_count,
    CASE 
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'posts' AND schemaname = 'public') = true 
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'posts' AND schemaname = 'public') = 0 
        THEN '❌ BLOCKED - RLS enabled, no policies'
        WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'posts' AND schemaname = 'public') = false 
        THEN '✅ ACCESSIBLE - RLS disabled'
        ELSE '✅ ACCESSIBLE - Has policies'
    END as status

ORDER BY table_name;

-- Also check what specific policies exist (if any)
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual = 'true' THEN 'Public access'
        WHEN qual LIKE '%auth.uid()%' THEN 'Authenticated only'
        ELSE qual
    END as access_rule
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('postal_sectors', 'communities', 'user_profiles', 'posts', 'comments')
ORDER BY tablename, policyname;
