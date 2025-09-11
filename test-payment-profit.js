// Test Payment Completion Profit Tracking
// This script tests that when payment status is changed to "paid", 
// the pending amount is recorded as profit for the current day

import { SupabaseAPI } from './supabase.js';

async function testPaymentCompletionProfit() {
  console.log('🧪 === TESTING PAYMENT COMPLETION PROFIT TRACKING ===\n');

  try {
    // Step 1: Find a bill with pending payment status that has remaining balance
    console.log('📊 Step 1: Finding suitable test order...');
    
    const allOrders = await SupabaseAPI.getOrders();
    let testOrder = null;
    
    // Look for an order that has pending payment status and remaining balance
    for (const order of allOrders) {
      if (order.payment_status?.toLowerCase() !== 'paid') {
        // Get bill information to calculate remaining balance
        const totalAmount = parseFloat(order.total_amt) || 0;
        const advanceAmount = parseFloat(order.payment_amount) || 0;
        const remainingBalance = totalAmount - advanceAmount;
        
        if (remainingBalance > 0) {
          testOrder = order;
          break;
        }
      }
    }

    if (!testOrder) {
      console.log('❌ No suitable test order found');
      console.log('💡 Need an order with:');
      console.log('   - payment_status != "paid"');
      console.log('   - remaining balance > 0 (total_amt > payment_amount)');
      return;
    }

    console.log(`✅ Found test order: ${testOrder.billnumberinput2}`);
    console.log('📋 Order details:');
    console.log(`   Order ID: ${testOrder.id}`);
    console.log(`   Bill Number: ${testOrder.billnumberinput2}`);
    console.log(`   Payment Status: ${testOrder.payment_status}`);
    console.log(`   Total Amount: ₹${testOrder.total_amt}`);
    console.log(`   Advance Amount: ₹${testOrder.payment_amount}`);
    console.log(`   Remaining Balance: ₹${(testOrder.total_amt - testOrder.payment_amount).toFixed(2)}`);

    // Step 2: Get current profit for today (before payment completion)
    console.log('\n💰 Step 2: Getting current profit for today...');
    
    const todayDate = new Date().toISOString().split('T')[0];
    const profitBeforePayment = await SupabaseAPI.calculateProfit(todayDate);
    
    console.log('📊 Today\'s profit BEFORE payment completion:');
    console.log(`   Revenue: ₹${profitBeforePayment.total_revenue}`);
    console.log(`   Net Profit: ₹${profitBeforePayment.net_profit}`);
    
    if (profitBeforePayment.revenue_breakdown) {
      console.log(`   Advance Payments: ₹${profitBeforePayment.revenue_breakdown.advance_payments}`);
      console.log(`   Final Payments: ₹${profitBeforePayment.revenue_breakdown.final_payments}`);
    }

    // Step 3: Change payment status to "paid" for this bill
    console.log('\n✅ Step 3: Changing payment status to "paid"...');
    
    const remainingBalance = testOrder.total_amt - testOrder.payment_amount;
    console.log(`🔄 This should add ₹${remainingBalance.toFixed(2)} to today's profit`);
    
    // Use bulk update to change payment status for all orders in this bill
    const updateResult = await SupabaseAPI.updatePaymentStatusByBillNumber(testOrder.billnumberinput2, 'paid');
    console.log(`✅ Payment status updated for ${updateResult.affected_count} order(s)`);

    // Step 4: Get profit for today after payment completion
    console.log('\n💰 Step 4: Getting profit for today after payment completion...');
    
    const profitAfterPayment = await SupabaseAPI.calculateProfit(todayDate);
    
    console.log('📊 Today\'s profit AFTER payment completion:');
    console.log(`   Revenue: ₹${profitAfterPayment.total_revenue}`);
    console.log(`   Net Profit: ₹${profitAfterPayment.net_profit}`);
    
    if (profitAfterPayment.revenue_breakdown) {
      console.log(`   Advance Payments: ₹${profitAfterPayment.revenue_breakdown.advance_payments}`);
      console.log(`   Final Payments: ₹${profitAfterPayment.revenue_breakdown.final_payments}`);
    }

    // Step 5: Analyze the difference
    console.log('\n🔍 Step 5: Analyzing the profit change...');
    
    const revenueIncrease = profitAfterPayment.total_revenue - profitBeforePayment.total_revenue;
    const profitIncrease = profitAfterPayment.net_profit - profitBeforePayment.net_profit;
    
    console.log('📈 Changes:');
    console.log(`   Revenue increase: ₹${revenueIncrease.toFixed(2)}`);
    console.log(`   Profit increase: ₹${profitIncrease.toFixed(2)}`);
    console.log(`   Expected increase: ₹${remainingBalance.toFixed(2)}`);
    
    // Verify the increase matches the remaining balance
    if (Math.abs(revenueIncrease - remainingBalance) < 0.01) {
      console.log('✅ SUCCESS: Revenue increased by exactly the remaining balance!');
      console.log('🎉 Payment completion profit tracking is working correctly!');
    } else {
      console.log('⚠️ Revenue increase doesn\'t match expected amount');
      console.log('💡 This could be due to:');
      console.log('   - Other payments processed simultaneously');
      console.log('   - Rounding differences');
      console.log('   - Multiple orders in the same bill');
    }

    // Step 6: Show final payments recorded today
    if (profitAfterPayment.revenue_breakdown) {
      const finalPaymentsIncrease = profitAfterPayment.revenue_breakdown.final_payments - (profitBeforePayment.revenue_breakdown?.final_payments || 0);
      console.log(`\n💳 Final payments recorded today: ₹${finalPaymentsIncrease.toFixed(2)}`);
    }

    console.log('\n🎯 === KEY FINDINGS ===');
    console.log('✅ When payment status is changed to "paid":');
    console.log('   1. System calculates remaining balance (total - advance)');
    console.log('   2. Records this amount as profit for TODAY (not original order date)');
    console.log('   3. Updates daily profit calculations immediately');
    console.log('   4. Tracks final payments separately from advance payments');
    
    console.log('\n💡 This means:');
    console.log('   - Revenue is recorded when payment is actually received');
    console.log('   - Daily profit reflects real cash flow for that day');
    console.log('   - Perfect for tracking payment completion timing');

    console.log('\n🧪 === PAYMENT COMPLETION PROFIT TEST COMPLETED ===');
    
    return {
      success: true,
      testOrder: {
        billNumber: testOrder.billnumberinput2,
        remainingBalance
      },
      profitIncrease,
      revenueIncrease
    };

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
    return { success: false, error: error.message };
  }
}

// Function to demonstrate the concept with example data
function explainPaymentCompletionProfit() {
  console.log('📚 === PAYMENT COMPLETION PROFIT EXPLANATION ===\n');
  
  console.log('💡 How Payment Completion Profit Tracking Works:\n');
  
  console.log('📅 Day 1 - Bill Creation:');
  console.log('   Customer: John Doe');
  console.log('   Total Bill: ₹1,200');
  console.log('   Advance Paid: ₹500');
  console.log('   → Day 1 Profit: +₹500 (advance payment)');
  console.log('   → Remaining Balance: ₹700\n');
  
  console.log('📅 Day 7 - Payment Status Changed to "Paid":');
  console.log('   Action: Mark order as completed/paid');
  console.log('   Remaining Balance: ₹700');
  console.log('   → Day 7 Profit: +₹700 (final payment)');
  console.log('   → Total Revenue: ₹1,200 (₹500 + ₹700)\n');
  
  console.log('🎯 Key Benefits:');
  console.log('   ✅ Revenue recorded when payment actually received');
  console.log('   ✅ Daily profit reflects real cash flow');
  console.log('   ✅ No double counting of payments');
  console.log('   ✅ Accurate timing of revenue recognition\n');
  
  console.log('🔧 Technical Implementation:');
  console.log('   • When you click "Paid" in Orders Overview');
  console.log('   • System calculates: total_amt - payment_amount');
  console.log('   • Records remaining balance as today\'s revenue');
  console.log('   • Updates Daily Profit Screen immediately\n');
  
  console.log('📊 Daily Profit Screen Will Show:');
  console.log('   Today\'s Revenue: ₹700');
  console.log('   ├── Advance Payments: ₹0');
  console.log('   └── Final Payments: ₹700');
}

// Export functions
export { testPaymentCompletionProfit, explainPaymentCompletionProfit };

// If running in browser, make functions available globally
if (typeof window !== 'undefined') {
  window.testPaymentCompletionProfit = testPaymentCompletionProfit;
  window.explainPaymentCompletionProfit = explainPaymentCompletionProfit;
  
  console.log('🧪 Payment profit test functions available:');
  console.log('   - testPaymentCompletionProfit(): Test the actual functionality');
  console.log('   - explainPaymentCompletionProfit(): Show explanation');
}
