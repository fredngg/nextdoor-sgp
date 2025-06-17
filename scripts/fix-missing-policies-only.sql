-- Only create policies that don't exist yet
-- This avoids the "already exists" error

-- Check and create postal_sectors policy if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'postal_sectors' AND policyname = 'postal_sectors_public_read') THEN
        CREATE POLICY "postal_sectors_public_read" ON postal_sectors FOR SELECT USING (true);
        RAISE NOTICE 'Created postal_sectors_public_read policy';
    ELSE
        RAISE NOTICE 'postal_sectors_public_read policy already exists';
    END IF;
END $$;

-- Check and create communities read policy if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'communities_public_read') THEN
        CREATE POLICY "communities_public_read" ON communities FOR SELECT USING (true);
        RAISE NOTICE 'Created communities_public_read policy';
    ELSE
        RAISE NOTICE 'communities_public_read policy already exists';
    END IF;
END $$;

-- Check and create communities insert policy if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'communities_public_insert') THEN
        CREATE POLICY "communities_public_insert" ON communities FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'Created communities_public_insert policy';
    ELSE
        RAISE NOTICE 'communities_public_insert policy already exists';
    END IF;
END $$;

-- Check and create posts read policy if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'posts_public_read') THEN
        CREATE POLICY "posts_public_read" ON posts FOR SELECT USING (true);
        RAISE NOTICE 'Created posts_public_read policy';
    ELSE
        RAISE NOTICE 'posts_public_read policy already exists';
    END IF;
END $$;

-- Check and create comments read policy if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'comments_public_read') THEN
        CREATE POLICY "comments_public_read" ON comments FOR SELECT USING (true);
        RAISE NOTICE 'Created comments_public_read policy';
    ELSE
        RAISE NOTICE 'comments_public_read policy already exists';
    END IF;
END $$;

-- Check and create community_members read policy if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'community_members_public_read') THEN
        CREATE POLICY "community_members_public_read" ON community_members FOR SELECT USING (true);
        RAISE NOTICE 'Created community_members_public_read policy';
    ELSE
        RAISE NOTICE 'community_members_public_read policy already exists';
    END IF;
END $$;

SELECT 'Policy creation complete! ✅' as status;
