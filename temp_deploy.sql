-- Create a function to execute our view creation
CREATE OR REPLACE FUNCTION execute_sql_command(sql_text text)
RETURNS TEXT AS $$
BEGIN
    EXECUTE sql_text;
    RETURN 'SQL executed successfully';
EXCEPTION WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;