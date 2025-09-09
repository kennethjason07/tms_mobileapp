# Two-Stage Revenue Recognition System - Setup Guide

## Quick Setup (5 minutes)

### Step 1: Create Database Table
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `setup_revenue_tracking.sql`
4. Run the script

### Step 2: Test the System
1. Open your React Native app
2. Go to browser developer console
3. Run: `testTwoStageRevenueSystem()`
4. Verify all tests pass

### Step 3: Create a Test Bill
1. Go to New Bill screen
2. Create a bill with advance payment (e.g., ₹300 advance on ₹1000 total)
3. Check Daily Profit screen - should show ₹300 revenue for today

### Step 4: Mark Order as Paid
1. Go to Orders Overview screen
2. Find your test order
3. Mark it as "paid"
4. Check Daily Profit screen - should show additional ₹700 revenue for today

## Expected Results

### After Step 3 (Bill Creation)
```
Daily Profit Screen:
- Total Revenue: ₹300 (from advance payment)
- Revenue Breakdown: Advance ₹300, Final ₹0
```

### After Step 4 (Mark as Paid)
```
Daily Profit Screen:
- Total Revenue: ₹1000 (₹300 advance + ₹700 final)
- Revenue Breakdown: Advance ₹300, Final ₹700
```

## Troubleshooting

### Issue: "revenue_tracking table doesn't exist"
**Solution**: Run the setup_revenue_tracking.sql script in Supabase

### Issue: "No revenue showing in Daily Profit"
**Checks**:
1. Verify revenue_tracking table has records: `SELECT * FROM revenue_tracking;`
2. Check IST dates are correct
3. Verify Daily Profit is using new calculateProfit method

### Issue: "Revenue showing twice"
**Solution**: Make sure you're using the new calculateProfit method, not mixing with legacy

## Console Commands for Debugging

```javascript
// Check revenue records
await supabase.from('revenue_tracking').select('*').order('recorded_at', { ascending: false });

// Check current IST date
console.log(new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000)).toISOString().split('T')[0]);

// Test revenue calculation
await SupabaseAPI.calculateProfit();

// Run full test
testTwoStageRevenueSystem();
```

## Success Criteria

✅ **Database Setup**: revenue_tracking table created successfully  
✅ **Advance Payment**: Revenue recorded when bill created with payment amount  
✅ **Final Payment**: Remaining balance recorded when order marked "paid"  
✅ **Daily Profit**: Shows accurate total from both payment stages  
✅ **IST Timezone**: All dates recorded in Indian Standard Time  
✅ **Error Handling**: System works even if revenue tracking fails  

## Next Steps

After successful setup:
1. Train users on new revenue reporting features
2. Monitor system for a few days to ensure accuracy
3. Compare with previous revenue tracking to validate
4. Consider adding revenue analytics dashboard

---

**Need Help?** Check the troubleshooting section in TWO_STAGE_REVENUE_SYSTEM.md
