# Two-Stage Revenue Recognition System

## Overview

This document describes the implementation of a comprehensive two-stage revenue recognition system for the Tailoring Management System (TMS). The system accurately tracks revenue at two key moments in the business process:

**Stage 1 (Advance Payment)**: When customers pay advance during bill creation  
**Stage 2 (Final Payment)**: When admin marks orders as "paid" 

## Business Logic

### Stage 1: Bill Creation + Advance Payment
```
Customer places order → Pays advance → Advance recorded as today's revenue
Example: Order total ₹1000, advance ₹300 → ₹300 added to today's revenue
```

### Stage 2: Order Completion + Final Payment  
```
Order completed → Admin marks as "paid" → Remaining balance recorded as today's revenue
Example: Remaining ₹700 → ₹700 added to today's revenue
```

## Technical Implementation

### Database Schema

#### revenue_tracking Table
```sql
CREATE TABLE public.revenue_tracking (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id),
    bill_id BIGINT REFERENCES bills(id), 
    customer_name TEXT NOT NULL,
    payment_type TEXT CHECK (payment_type IN ('advance', 'final')),
    amount DECIMAL(10,2) NOT NULL,
    total_bill_amount DECIMAL(10,2) NOT NULL,
    remaining_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_date DATE NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'recorded'
);
```

### API Methods

#### 1. recordAdvancePayment(orderId, billId, advanceAmount, totalAmount, customerName)
- **Triggered**: During bill creation in NewBillScreen
- **Purpose**: Records advance payment as today's revenue
- **IST Timezone**: Uses IST dates for accurate daily tracking

#### 2. recordFinalPayment(orderId)  
- **Triggered**: When admin updates payment status to "paid"
- **Purpose**: Records remaining balance as today's revenue
- **Logic**: Calculates `finalAmount = totalAmount - advanceAmount`

#### 3. calculateProfit(date)
- **Enhanced**: Now uses revenue_tracking table instead of just orders
- **Fallback**: Falls back to legacy method if revenue_tracking doesn't exist
- **IST Timezone**: All date filtering uses IST timezone

### Integration Points

#### NewBillScreen.js
```javascript
// OLD METHOD
const billResult = await SupabaseAPI.createNewBill(billData);
const orderResult = await SupabaseAPI.createOrder(orderData);

// NEW METHOD  
const result = await SupabaseAPI.createBillWithAdvanceTracking(billData, orderData);
// Automatically records advance payment as revenue
```

#### OrdersOverviewScreen.js (Payment Status Updates)
```javascript
// When admin marks order as "paid"
await SupabaseAPI.updatePaymentStatus(orderId, 'paid');
// Automatically records final payment as today's revenue
```

## Revenue Calculation Logic

### Before (Legacy System)
```javascript
// Only counted revenue when entire order was marked "paid"
const totalRevenue = orders
  .filter(o => o.payment_status === 'paid')
  .reduce((sum, o) => sum + o.total_amt, 0);
```

### After (Two-Stage System)  
```javascript
// Counts both advance and final payments separately
const totalRevenue = revenueRecords
  .reduce((sum, record) => sum + record.amount, 0);

// Breakdown available:
// - Advance payments: ₹X
// - Final payments: ₹Y  
// - Total revenue: ₹X + ₹Y
```

## Benefits

### 1. **Accurate Cash Flow Tracking**
- Revenue recorded when money is actually received
- No delay between cash received and revenue recognition

### 2. **Real-Time Revenue Updates**  
- Daily Profit screen shows up-to-date revenue
- No waiting until entire order is marked "paid"

### 3. **Prevents Double-Counting**
- Each payment stage recorded separately
- No risk of counting same revenue twice

### 4. **Detailed Revenue Breakdown**
- Separate tracking of advance vs final payments
- Better understanding of payment patterns

### 5. **IST Timezone Accuracy**
- All dates stored in IST timezone
- Accurate daily revenue reporting for Indian business

## Usage Examples

### Example 1: Full Advance Payment
```
Order Total: ₹500
Advance: ₹500  
Stage 1: ₹500 recorded as today's revenue
Stage 2: ₹0 (no final payment needed)
```

### Example 2: Partial Advance Payment  
```
Order Total: ₹1000
Advance: ₹400
Stage 1: ₹400 recorded as today's revenue  
Stage 2: ₹600 recorded when marked as "paid"
```

### Example 3: No Advance Payment
```
Order Total: ₹800
Advance: ₹0
Stage 1: No revenue recorded
Stage 2: ₹800 recorded when marked as "paid"  
```

## Testing & Validation

### Setup Database Table
```sql
-- Run setup_revenue_tracking.sql in your Supabase database
\i setup_revenue_tracking.sql
```

### Test Scenarios

1. **Create Bill with Advance**
   - Go to New Bill screen  
   - Enter order details with payment amount > 0
   - Check revenue_tracking table for advance record
   - Verify Daily Profit screen shows updated revenue

2. **Mark Order as Paid**
   - Go to Orders Overview  
   - Mark an order as "paid"
   - Check revenue_tracking table for final payment record
   - Verify Daily Profit screen shows additional revenue

3. **Date Filtering**
   - Test "Today", "This Week", "This Month" filters
   - Verify IST timezone accuracy
   - Check revenue breakdown by payment type

## Error Handling

### Graceful Fallbacks
- If revenue_tracking table doesn't exist → Falls back to legacy calculation
- If advance payment recording fails → Bill creation still succeeds
- If final payment recording fails → Status update still succeeds

### Console Logging
- Detailed logs for all revenue recording operations
- IST timezone conversion logging
- Payment breakdown logging

## Migration Strategy

### Phase 1: Parallel Operation
- New system runs alongside legacy system
- Both revenue calculations available
- No disruption to existing functionality

### Phase 2: Validation Period
- Compare results between old and new systems
- Fix any discrepancies  
- Train users on new revenue reporting

### Phase 3: Full Migration
- Switch Daily Profit screen to new system
- Deprecate legacy revenue calculation
- Archive old revenue data if needed

## Future Enhancements

### Possible Additions
1. **Payment History Tracking**: Full audit trail of all payments
2. **Revenue Analytics**: Advanced reporting and charts
3. **SMS Integration**: Auto-notify customers when payments recorded
4. **Refund Handling**: Support for payment reversals
5. **Multi-Currency**: Support for different currencies

## Support & Troubleshooting

### Common Issues

**Q: Daily Profit shows ₹0 revenue after upgrading**  
A: Run the setup_revenue_tracking.sql script to create the new table

**Q: Advance payments not appearing in revenue**  
A: Check console logs for revenue recording errors. Verify IST timezone settings.

**Q: Revenue showing twice**  
A: Likely mixing old and new calculation methods. Use only the new calculateProfit method.

### Debug Commands
```javascript
// Check revenue records
const records = await supabase
  .from('revenue_tracking')
  .select('*')
  .order('recorded_at', { ascending: false });

// Test IST date conversion
const istDate = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
console.log('IST Date:', istDate.toISOString().split('T')[0]);
```

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Author**: TMS Development Team
