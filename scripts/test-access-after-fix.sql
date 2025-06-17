-- Test if the fixes worked
-- This simulates what your app is trying to do

-- Test 1: Postal code lookup (unauthenticated)
SET ROLE anon;
SELECT 'Testing postal_sectors as anon user...' as test;
SELECT COUNT(*) as postal_sectors_accessible FROM postal_sectors LIMIT 1;

-- Test 2: Community discovery (unauthenticated)
SELECT 'Testing communities as anon user...' as test;
SELECT COUNT(*) as communities_accessible FROM communities LIMIT 1;

-- Test 3: Posts reading (unauthenticated)
SELECT 'Testing posts as anon user...' as test;
SELECT COUNT(*) as posts_accessible FROM posts LIMIT 1;

-- Reset role
RESET ROLE;

-- Test 4: User profiles (authenticated only)
SELECT 'Testing user_profiles policies...' as test;
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

SELECT 'Access tests complete! 🧪' as status;
