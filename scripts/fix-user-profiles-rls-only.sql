-- TARGETED FIX: Only fix user_profiles RLS if that's the main issue
-- This will fix the FirstLoginModal getting stuck

-- Fix user_profiles table specifically
CREATE POLICY "user_profiles_owner_access" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Test the fix
SELECT 'user_profiles RLS policy created' as status;

-- Verify the policy was created
SELECT tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';
