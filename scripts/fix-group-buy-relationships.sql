-- Add foreign key relationships for group buy tables
-- This will help Supabase understand the relationships for joins

-- Add foreign key from group_buy_participants to user_profiles
ALTER TABLE group_buy_participants 
ADD CONSTRAINT fk_group_buy_participants_user_profiles 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);

-- Add foreign key from group_buy_comments to user_profiles  
ALTER TABLE group_buy_comments 
ADD CONSTRAINT fk_group_buy_comments_user_profiles 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);

-- Add foreign key from group_buys to user_profiles (organizer)
ALTER TABLE group_buys 
ADD CONSTRAINT fk_group_buys_organizer_user_profiles 
FOREIGN KEY (organizer_id) REFERENCES user_profiles(user_id);

-- Verify the relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('group_buy_participants', 'group_buy_comments', 'group_buys');
