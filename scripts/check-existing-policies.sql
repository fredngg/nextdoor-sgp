-- Check what policies already exist
SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual = 'true' THEN '🌍 Public access'
        WHEN qual LIKE '%auth.uid()%' THEN '🔒 Authenticated only'
        WHEN qual LIKE '%user_id%' THEN '👤 Owner only'
        ELSE qual
    END as access_rule,
    qual as raw_rule
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check which tables have RLS enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE pg_policies.tablename = pg_tables.tablename AND pg_policies.schemaname = 'public') as policy_count
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('postal_sectors', 'communities', 'user_profiles', 'posts', 'comments', 'community_members', 'post_votes', 'comment_votes')
ORDER BY tablename;
