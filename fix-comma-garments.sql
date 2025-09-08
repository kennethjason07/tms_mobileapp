-- SQL Script to Fix Comma-Separated Garment Types in Orders Table
-- This script will split orders with comma-separated garment_type values into individual records

-- First, let's see what we're working with
SELECT 
  id,
  billnumberinput2,
  garment_type,
  total_amt,
  bill_id
FROM orders 
WHERE garment_type LIKE '%,%'
ORDER BY billnumberinput2 DESC
LIMIT 10;

-- Note: The actual splitting and insertion would need to be done carefully
-- This is a template - you should run this in a transaction and test first

-- Example approach (PostgreSQL syntax):
/*
-- Create a temporary table for the split records
CREATE TEMP TABLE split_orders AS
SELECT 
  id as original_id,
  billnumberinput2,
  bill_id,
  order_date,
  due_date,
  status,
  payment_mode,
  payment_status,
  payment_amount,
  Work_pay,
  created_at,
  updated_at,
  unnest(string_to_array(garment_type, ',')) as garment_type,
  total_amt / array_length(string_to_array(garment_type, ','), 1) as total_amt
FROM orders 
WHERE garment_type LIKE '%,%';

-- Insert the split records back into orders table
-- (You would need to handle ID generation properly)
INSERT INTO orders (
  billnumberinput2, bill_id, garment_type, total_amt, 
  order_date, due_date, status, payment_mode, 
  payment_status, payment_amount, Work_pay, 
  created_at, updated_at
)
SELECT 
  billnumberinput2, bill_id, trim(garment_type), total_amt,
  order_date, due_date, status, payment_mode, 
  payment_status, payment_amount, Work_pay, 
  created_at, updated_at
FROM split_orders;

-- Delete the original comma-separated records
DELETE FROM orders 
WHERE garment_type LIKE '%,%';
*/

-- IMPORTANT: Always backup your data before running cleanup scripts!
-- Test this process with a small subset first!
