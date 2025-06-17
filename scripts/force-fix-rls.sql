-- NUCLEAR OPTION: Completely reset and fix RLS policies

-- 1. Disable RLS temporarily to clean up
ALTER TABLE postal_sectors DISABLE ROW LEVEL SECURITY;
ALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE community_members DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Revoke all permissions and start fresh
REVOKE ALL ON postal_sectors FROM anon, authenticated;
REVOKE ALL ON communities FROM anon, authenticated;
REVOKE ALL ON posts FROM anon, authenticated;
REVOKE ALL ON comments FROM anon, authenticated;
REVOKE ALL ON community_members FROM anon, authenticated;

-- 4. Grant basic permissions first
GRANT SELECT ON postal_sectors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON communities TO anon, authenticated;
GRANT SELECT ON posts TO anon, authenticated;
GRANT SELECT ON comments TO anon, authenticated;
GRANT SELECT ON community_members TO anon, authenticated;

-- Grant write permissions to authenticated users
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON community_members TO authenticated;

-- 5. Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Re-enable RLS with simple policies
ALTER TABLE postal_sectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_read" ON postal_sectors FOR SELECT USING (true);

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_read" ON communities FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON communities FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON communities FOR UPDATE USING (true);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_read" ON posts FOR SELECT USING (true);
CREATE POLICY "allow_auth_write" ON posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_owner_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "allow_owner_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_read" ON comments FOR SELECT USING (true);
CREATE POLICY "allow_auth_write" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_owner_update" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "allow_owner_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_read" ON community_members FOR SELECT USING (true);
CREATE POLICY "allow_auth_write" ON community_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "allow_owner_delete" ON community_members FOR DELETE USING (auth.uid() = user_id);

-- 7. Test the setup
SET ROLE anon;
SELECT 'TESTING AS ANON USER' as status;
SELECT COUNT(*) as postal_sectors_count FROM postal_sectors;
SELECT COUNT(*) as communities_count FROM communities;
RESET ROLE;

SELECT 'RLS POLICIES RESET AND FIXED' as status;
