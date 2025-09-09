-- ═══════════════════════════════════════════════════════════════════════════════
-- TWO-STAGE REVENUE TRACKING TABLE SETUP
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- This script creates the revenue_tracking table for implementing two-stage 
-- revenue recognition:
-- 
-- Stage 1 (Advance): When customer pays advance during bill creation
-- Stage 2 (Final): When admin marks order as "paid" 
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create revenue_tracking table
CREATE TABLE IF NOT EXISTS public.revenue_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES public.orders(id) ON DELETE CASCADE,
    bill_id BIGINT REFERENCES public.bills(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'final')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    total_bill_amount DECIMAL(10,2) NOT NULL CHECK (total_bill_amount >= 0),
    remaining_balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
    payment_date DATE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'cancelled')),
    advance_payment_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_order_id ON public.revenue_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_bill_id ON public.revenue_tracking(bill_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_payment_date ON public.revenue_tracking(payment_date);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_payment_type ON public.revenue_tracking(payment_type);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_status ON public.revenue_tracking(status);

-- Create compound index for common queries
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_date_type ON public.revenue_tracking(payment_date, payment_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_revenue_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_revenue_tracking_updated_at ON public.revenue_tracking;
CREATE TRIGGER trigger_revenue_tracking_updated_at
    BEFORE UPDATE ON public.revenue_tracking
    FOR EACH ROW
    EXECUTE FUNCTION public.update_revenue_tracking_updated_at();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE public.revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust as needed for your security requirements)
DROP POLICY IF EXISTS "Allow all operations on revenue_tracking" ON public.revenue_tracking;
CREATE POLICY "Allow all operations on revenue_tracking"
ON public.revenue_tracking
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.revenue_tracking IS 'Tracks two-stage revenue recognition: advance payments (Stage 1) and final payments (Stage 2)';
COMMENT ON COLUMN public.revenue_tracking.payment_type IS 'Type of payment: "advance" for initial payment during bill creation, "final" for remaining balance when order marked as paid';
COMMENT ON COLUMN public.revenue_tracking.amount IS 'Amount received for this payment stage';
COMMENT ON COLUMN public.revenue_tracking.payment_date IS 'Date when the payment was received (IST timezone)';
COMMENT ON COLUMN public.revenue_tracking.remaining_balance IS 'Remaining balance after this payment';

-- Insert sample data for testing (optional)
-- INSERT INTO public.revenue_tracking 
-- (order_id, bill_id, customer_name, payment_type, amount, total_bill_amount, remaining_balance, payment_date)
-- VALUES 
-- (1, 1, 'Test Customer', 'advance', 500.00, 1000.00, 500.00, CURRENT_DATE);

-- Display table structure
\d public.revenue_tracking;
