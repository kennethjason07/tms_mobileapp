-- Migration: Add order_status column to orders table
-- Date: 2025-12-06
-- Purpose: Track order completion status separately from delivery status
-- WhatsApp integration will trigger when order_status = 'completed'

-- Step 1: Add the new column with default value
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS order_status text NOT NULL DEFAULT 'pending';

-- Step 2: Add check constraint for valid values
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS order_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT order_status_check 
CHECK (order_status IN ('pending', 'completed'));

-- Step 3: Update existing orders to have order_status = 'pending'
-- (This ensures all existing orders start with pending status)
UPDATE public.orders 
SET order_status = 'pending' 
WHERE order_status IS NULL OR order_status = '';

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_order_status 
ON public.orders(order_status);

-- Verification query (run this to check the migration worked)
-- SELECT id, garment_type, status, order_status, billnumberinput2 
-- FROM public.orders 
-- LIMIT 10;
