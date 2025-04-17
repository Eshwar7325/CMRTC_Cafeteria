-- Create the sequence reset function for Items table
-- Run this in Supabase SQL Editor

-- First check current sequence name
SELECT pg_get_serial_sequence('Items', 'id') as sequence_name;

-- Create a function to reset the sequence
CREATE OR REPLACE FUNCTION reset_items_sequence(next_val bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the privileges of the function creator
AS $$
DECLARE
  seq_name text;
BEGIN
  -- Get the sequence name for Items table's id column
  SELECT pg_get_serial_sequence('Items', 'id') INTO seq_name;
  
  -- If sequence exists, reset it
  IF seq_name IS NOT NULL THEN
    EXECUTE format('ALTER SEQUENCE %s RESTART WITH %s', seq_name, next_val);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Allow the function to be called via RPC
GRANT EXECUTE ON FUNCTION reset_items_sequence(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_items_sequence(bigint) TO anon;
GRANT EXECUTE ON FUNCTION reset_items_sequence(bigint) TO service_role; 