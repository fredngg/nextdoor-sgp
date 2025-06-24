-- Check the category constraint in group_buys table
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'group_buys'::regclass 
AND contype = 'c';

-- Also check the table structure
\d group_buys;
