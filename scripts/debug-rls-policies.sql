-- 1. Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('postal_sectors', 'communities', 'posts', 'comments', 'community_members');

-- 2. Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('postal_sectors', 'communities', 'posts', 'comments', 'community_members')
ORDER BY tablename, policyname;

-- 3. Check table permissions for anon role
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee = 'anon'
AND table_name IN ('postal_sectors', 'communities', 'posts', 'comments', 'community_members');

-- 4. Check if anon role exists and has proper inheritance
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles 
WHERE rolname IN ('anon', 'authenticated', 'service_role');

-- 5. Test actual access as anon user (this simulates unauthenticated access)
SET ROLE anon;
SELECT 'Testing postal_sectors access' as test;
SELECT COUNT(*) FROM postal_sectors LIMIT 1;

SELECT 'Testing communities access' as test;
SELECT COUNT(*) FROM communities LIMIT 1;

-- Reset role
RESET ROLE;

-- 6. Check if there are any conflicting policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%auth.uid()%' OR qual LIKE '%authenticated%')
AND tablename IN ('postal_sectors', 'communities');
