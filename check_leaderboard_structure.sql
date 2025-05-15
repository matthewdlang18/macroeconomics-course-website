-- Check the structure of the existing leaderboard table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'leaderboard'
ORDER BY 
    ordinal_position;
