-- TARGETED FIX: Only fix community discovery tables if they're blocked
-- This will fix the postal code lookup issue

-- Fix postal_sectors (needed for postal code lookup)
CREATE POLICY "postal_sectors_public_read" ON postal_sectors
    FOR SELECT USING (true);

-- Fix communities (needed for community discovery and auto-creation)
CREATE POLICY "communities_public_read" ON communities
    FOR SELECT USING (true);

CREATE POLICY "communities_public_insert" ON communities
    FOR INSERT WITH CHECK (true);

-- Test the fixes
SELECT 'Community discovery RLS policies created' as status;

-- Verify the policies were created
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('postal_sectors', 'communities')
AND schemaname = 'public'
ORDER BY tablename, policyname;
