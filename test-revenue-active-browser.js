// Test script to run in browser console to verify revenue tracking system
// Instructions: Open your app in browser, open console, paste this script

async function testRevenueSystemInBrowser() {
  console.log('🧪 === TESTING REVENUE TRACKING SYSTEM (Browser Console) ===\n');

  // Check if SupabaseAPI is available
  if (typeof SupabaseAPI === 'undefined') {
    console.log('❌ SupabaseAPI not found in browser');
    console.log('💡 Please run this in your app\'s browser console where SupabaseAPI is loaded');
    return;
  }

  try {
    // Test profit calculation method
    console.log('💰 Testing profit calculation method...');
    const todayProfit = await SupabaseAPI.calculateProfit();
    
    console.log('📈 Profit calculation result:');
    console.log('   Method used:', todayProfit.method || 'unknown');
    console.log('   Total revenue: ₹' + (todayProfit.total_revenue || 0));
    console.log('   Net profit: ₹' + (todayProfit.net_profit || 0));
    
    if (todayProfit.revenue_breakdown) {
      console.log('   Revenue breakdown:');
      console.log('     Advance payments: ₹' + (todayProfit.revenue_breakdown.advance_payments || 0));
      console.log('     Final payments: ₹' + (todayProfit.revenue_breakdown.final_payments || 0));
    }

    // Check the method being used
    if (todayProfit.method === 'two_stage') {
      console.log('\n🎉 SUCCESS: Two-stage revenue system is ACTIVE!');
      console.log('✅ Final payments will now be recorded as today\'s revenue when orders are marked "paid"');
      
      // Find a test order
      const allOrders = await SupabaseAPI.getOrders();
      let testOrder = null;
      
      for (const order of allOrders) {
        const paymentStatus = order.payment_status?.toLowerCase();
        if (paymentStatus !== 'paid' && paymentStatus !== 'full') {
          const totalAmount = parseFloat(order.total_amt) || 0;
          const advanceAmount = parseFloat(order.payment_amount) || 0;
          const remainingBalance = totalAmount - advanceAmount;
          
          if (remainingBalance > 0) {
            testOrder = order;
            break;
          }
        }
      }

      if (testOrder) {
        console.log('\n🔍 Found test order for demonstration:');
        console.log('   Bill Number:', testOrder.billnumberinput2);
        console.log('   Current Payment Status:', testOrder.payment_status);
        console.log('   Total Amount: ₹' + testOrder.total_amt);
        console.log('   Advance Amount: ₹' + testOrder.payment_amount);
        console.log('   Remaining Balance: ₹' + (testOrder.total_amt - testOrder.payment_amount).toFixed(2));
        
        console.log('\n💡 TO TEST THE FUNCTIONALITY:');
        console.log('1. Go to Orders Overview screen');
        console.log('2. Find bill ' + testOrder.billnumberinput2);
        console.log('3. Change payment status to "Paid"');
        console.log('4. Check Daily Profit screen');
        console.log('5. You should see ₹' + (testOrder.total_amt - testOrder.payment_amount).toFixed(2) + ' added to today\'s revenue!');
      } else {
        console.log('\n⚠️ No unpaid orders with remaining balance found');
        console.log('💡 Create a new order with partial payment to test the functionality');
      }
      
      return true;
    } else if (todayProfit.method === 'legacy') {
      console.log('\n❌ ISSUE: System is still using legacy method');
      console.log('💡 This suggests the revenue_tracking table might have permissions issues');
      console.log('🔧 Check table RLS policies in Supabase dashboard');
      return false;
    } else {
      console.log('\n⚠️ UNKNOWN: Could not determine calculation method');
      console.log('Method value:', todayProfit.method);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing revenue system:', error);
    return false;
  }
}

// Make the function available globally for browser console
if (typeof window !== 'undefined') {
  window.testRevenueSystemInBrowser = testRevenueSystemInBrowser;
  console.log('🧪 Revenue system test loaded!');
  console.log('Run: testRevenueSystemInBrowser()');
} else {
  // If running in Node.js environment, execute directly
  testRevenueSystemInBrowser();
}
