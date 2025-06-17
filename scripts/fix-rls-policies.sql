-- Fix RLS policies to allow public community discovery
-- while keeping user actions protected

-- Enable RLS on all tables first
ALTER TABLE postal_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "postal_sectors_public_read" ON postal_sectors;
DROP POLICY IF EXISTS "communities_public_read" ON communities;
DROP POLICY IF EXISTS "communities_public_insert" ON communities;
DROP POLICY IF EXISTS "posts_public_read" ON posts;
DROP POLICY IF EXISTS "comments_public_read" ON comments;
DROP POLICY IF EXISTS "community_members_public_read" ON community_members;
DROP POLICY IF EXISTS "community_members_authenticated_write" ON community_members;
DROP POLICY IF EXISTS "posts_authenticated_write" ON posts;
DROP POLICY IF EXISTS "comments_authenticated_write" ON comments;
DROP POLICY IF EXISTS "user_profiles_owner_access" ON user_profiles;
DROP POLICY IF EXISTS "post_votes_authenticated_access" ON post_votes;
DROP POLICY IF EXISTS "comment_votes_authenticated_access" ON comment_votes;

-- 1. POSTAL SECTORS - Public read access (for postal code lookup)
CREATE POLICY "postal_sectors_public_read" ON postal_sectors
    FOR SELECT USING (true);

-- 2. COMMUNITIES - Public read and insert (for discovery and auto-creation)
CREATE POLICY "communities_public_read" ON communities
    FOR SELECT USING (true);

CREATE POLICY "communities_public_insert" ON communities
    FOR INSERT WITH CHECK (true);

-- 3. POSTS - Public read access (for viewing community content)
CREATE POLICY "posts_public_read" ON posts
    FOR SELECT USING (true);

-- Posts - Authenticated users can insert/update/delete their own posts
CREATE POLICY "posts_authenticated_write" ON posts
    FOR ALL USING (auth.uid() = user_id);

-- 4. COMMENTS - Public read access (for viewing discussions)
CREATE POLICY "comments_public_read" ON comments
    FOR SELECT USING (true);

-- Comments - Authenticated users can insert/update/delete their own comments
CREATE POLICY "comments_authenticated_write" ON comments
    FOR ALL USING (auth.uid() = user_id);

-- 5. COMMUNITY MEMBERS - Public read for counts, authenticated write for joining
CREATE POLICY "community_members_public_read" ON community_members
    FOR SELECT USING (true);

CREATE POLICY "community_members_authenticated_write" ON community_members
    FOR ALL USING (auth.uid() = user_id);

-- 6. USER PROFILES - Users can only access their own profiles
CREATE POLICY "user_profiles_owner_access" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- 7. VOTING - Authenticated users only
CREATE POLICY "post_votes_authenticated_access" ON post_votes
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "comment_votes_authenticated_access" ON comment_votes
    FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions to anonymous users for public tables
GRANT SELECT ON postal_sectors TO anon;
GRANT SELECT, INSERT ON communities TO anon;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON comments TO anon;
GRANT SELECT ON community_members TO anon;

-- Grant full access to authenticated users
GRANT ALL ON postal_sectors TO authenticated;
GRANT ALL ON communities TO authenticated;
GRANT ALL ON posts TO authenticated;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON community_members TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON post_votes TO authenticated;
GRANT ALL ON comment_votes TO authenticated;

-- Ensure sequences are accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
