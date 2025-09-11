# Immediate Test Guide - Advance Payment Calculation

## Quick Test (2 minutes) 

### Step 1: Run Diagnostic Script
1. Open your React Native app in browser
2. Open Developer Console (F12)
3. Type: `testAdvancePaymentCalculation()`
4. Press Enter

**What to look for:**
- ✅ "Enhanced legacy method should show these in revenue" 
- ✅ Orders with advance payments found
- ✅ Revenue calculation is working

### Step 2: Create Test Bill with Advance
1. Go to **New Bill Screen**
2. Create a bill with:
   - **Total Amount**: ₹1000
   - **Payment Amount**: ₹300 (advance)
3. Save the bill
4. **Check the success message** - should mention advance payment recorded

### Step 3: Verify Revenue in Daily Profit
1. Go to **Daily Profit Screen**
2. Check **"Today"** filter
3. **Expected**: Should show ₹300 in total revenue

### Step 4: Mark Order as Paid (Final Payment)
1. Go to **Orders Overview Screen**  
2. Find your test order
3. **Mark as "paid"**
4. Go back to **Daily Profit Screen**
5. **Expected**: Should now show ₹1000 total revenue (₹300 + ₹700)

## If Step 3 Shows ₹0 Revenue

### Quick Fix 1: Manual Test
In browser console, run:
```javascript
quickTestAdvancePayment(999, 500)
```
This adds ₹500 test advance payment for today.

### Quick Fix 2: Check Orders Table
In console:
```javascript
// Check today's orders with advance payments
const today = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0];
const {data} = await supabase.from('orders').select('*').eq('order_date', today).gt('payment_amount', 0);
console.log('Orders with advance:', data);
```

### Quick Fix 3: Force Recalculation
In console:
```javascript
// Test different calculation methods
const result1 = await SupabaseAPI.calculateProfit();
const result2 = await SupabaseAPI.calculateProfitLegacy();
console.log('Main method:', result1.total_revenue);
console.log('Legacy method:', result2.total_revenue);
```

## Expected Console Logs

When system is working correctly:
```
🔍 TESTING ADVANCE PAYMENT CALCULATION...
📅 Today (IST): 2025-01-09

🔍 CHECK 1: Orders with advance payments created today...
📋 Found 1 orders with advance payments today:
  1. Order #123: ₹300 (Bill #1001)
💰 Total advance payments from orders table: ₹300

📊 Main calculateProfit result:
  totalRevenue: 300
  method: "legacy"
  revenueBreakdown: {paid_orders: 0, advance_payments: 300}

✅ SUCCESS: Revenue calculation is working
```

## Troubleshooting

### Issue: "No orders with payment_amount > 0 found"
**Cause**: No bills created with advance payments today
**Fix**: Create a test bill with payment amount > 0

### Issue: "Revenue calculation returning ₹0"
**Cause**: Order dates might not match IST today
**Fix**: Check order_date in orders table matches today's IST date

### Issue: "revenue_tracking table not found"
**Status**: This is OK! Enhanced legacy method will handle advance payments
**Action**: Run setup_revenue_tracking.sql later for full two-stage system

## Success Indicators

✅ **Console shows advance payments found**  
✅ **Daily Profit shows revenue > ₹0 for today**  
✅ **Revenue increases when order marked as paid**  
✅ **Success message mentions advance payment recorded**  

---

**Still having issues?** Run the diagnostic script and share the console output.
