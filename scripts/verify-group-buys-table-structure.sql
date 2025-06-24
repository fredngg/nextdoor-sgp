-- Check if group_buys table exists and view its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'group_buys' 
ORDER BY ordinal_position;

-- Check if the table exists at all
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'group_buys'
) as table_exists;

-- Check current records in group_buys (if any)
SELECT COUNT(*) as total_group_buys FROM group_buys;

-- Check recent group_buys
SELECT 
    id,
    title,
    community_slug,
    status,
    created_at
FROM group_buys 
ORDER BY created_at DESC 
LIMIT 5;
