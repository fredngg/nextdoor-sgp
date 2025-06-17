-- EMERGENCY FIX: Your tables have RLS enabled but no policies!
-- This is blocking ALL access, even for authenticated users

-- Check which tables have RLS enabled but no policies
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.tablename IN ('postal_sectors', 'communities', 'posts', 'comments', 'community_members', 'user_profiles', 'post_votes', 'comment_votes')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- IMMEDIATE FIX: Add basic policies to all tables
-- This will make your app work instantly

-- 1. postal_sectors - Public read
DROP POLICY IF EXISTS "allow_read_postal_sectors" ON postal_sectors;
CREATE POLICY "allow_read_postal_sectors" ON postal_sectors FOR SELECT USING (true);

-- 2. communities - Public read/write
DROP POLICY IF EXISTS "allow_read_communities" ON communities;
DROP POLICY IF EXISTS "allow_insert_communities" ON communities;
CREATE POLICY "allow_read_communities" ON communities FOR SELECT USING (true);
CREATE POLICY "allow_insert_communities" ON communities FOR INSERT WITH CHECK (true);

-- 3. posts - Public read, auth write
DROP POLICY IF EXISTS "allow_read_posts" ON posts;
DROP POLICY IF EXISTS "allow_write_posts" ON posts;
CREATE POLICY "allow_read_posts" ON posts FOR SELECT USING (true);
CREATE POLICY "allow_write_posts" ON posts FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. comments - Public read, auth write  
DROP POLICY IF EXISTS "allow_read_comments" ON comments;
DROP POLICY IF EXISTS "allow_write_comments" ON comments;
CREATE POLICY "allow_read_comments" ON comments FOR SELECT USING (true);
CREATE POLICY "allow_write_comments" ON comments FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. community_members - Public read, auth write
DROP POLICY IF EXISTS "allow_read_members" ON community_members;
DROP POLICY IF EXISTS "allow_write_members" ON community_members;
CREATE POLICY "allow_read_members" ON community_members FOR SELECT USING (true);
CREATE POLICY "allow_write_members" ON community_members FOR ALL USING (auth.uid() IS NOT NULL);

-- 6. user_profiles - Owner only
DROP POLICY IF EXISTS "allow_own_profile" ON user_profiles;
CREATE POLICY "allow_own_profile" ON user_profiles FOR ALL USING (auth.uid() = user_id);

-- 7. votes - Auth only
DROP POLICY IF EXISTS "allow_post_votes" ON post_votes;
DROP POLICY IF EXISTS "allow_comment_votes" ON comment_votes;
CREATE POLICY "allow_post_votes" ON post_votes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "allow_comment_votes" ON comment_votes FOR ALL USING (auth.uid() IS NOT NULL);

-- Verify policies were created
SELECT tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '🎉 POLICIES CREATED! Your app should work now!' as status;
