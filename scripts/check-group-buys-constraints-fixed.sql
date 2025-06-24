-- Check the category constraint in group_buys table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'group_buys'::regclass 
AND contype = 'c';

-- Check table columns and their constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'group_buys' 
ORDER BY ordinal_position;
