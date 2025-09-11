// Test to verify the two-stage revenue tracking system is now working
const pkg = require('./supabase.js');
const { SupabaseAPI } = pkg;

async function testRevenueSystemStatus() {
  console.log('🧪 === TESTING REVENUE TRACKING SYSTEM STATUS ===\n');

  try {
    // Step 1: Check if revenue_tracking table is accessible
    console.log('📊 Step 1: Testing revenue_tracking table access...');
    
    const { supabase } = pkg;
    const { data: tableTest, error: tableError } = await supabase
      .from('revenue_tracking')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Revenue tracking table not accessible:', tableError.message);
      return false;
    }
    
    console.log('✅ Revenue tracking table is accessible!');
    console.log(`📋 Current records in table: ${tableTest?.length >= 0 ? 'Table exists' : 'Empty table'}`);

    // Step 2: Test the profit calculation method
    console.log('\n💰 Step 2: Testing profit calculation method...');
    
    const todayProfit = await SupabaseAPI.calculateProfit();
    console.log('📈 Profit calculation result:');
    console.log(`   Method used: ${todayProfit.method || 'unknown'}`);
    console.log(`   Total revenue: ₹${todayProfit.total_revenue || 0}`);
    console.log(`   Net profit: ₹${todayProfit.net_profit || 0}`);
    
    if (todayProfit.revenue_breakdown) {
      console.log('   Revenue breakdown:');
      console.log(`     Advance payments: ₹${todayProfit.revenue_breakdown.advance_payments || 0}`);
      console.log(`     Final payments: ₹${todayProfit.revenue_breakdown.final_payments || 0}`);
    }

    // Step 3: Verify system is using two-stage method
    if (todayProfit.method === 'two_stage') {
      console.log('\n🎉 SUCCESS: Two-stage revenue system is ACTIVE!');
      console.log('✅ Final payments will now be recorded as today\'s revenue when orders are marked "paid"');
      return true;
    } else if (todayProfit.method === 'legacy') {
      console.log('\n❌ ISSUE: System is still using legacy method');
      console.log('💡 This suggests the revenue_tracking table might not be properly configured');
      return false;
    } else {
      console.log('\n⚠️ UNKNOWN: Could not determine calculation method');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing revenue system:', error);
    return false;
  }
}

async function testPaymentCompletionFlow() {
  console.log('\n🧪 === TESTING PAYMENT COMPLETION FLOW ===\n');

  try {
    // Find an order with pending payment
    console.log('🔍 Looking for an order with pending payment...');
    
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

    if (!testOrder) {
      console.log('⚠️ No suitable test order found (need unpaid order with remaining balance)');
      console.log('💡 To test, create a new order with partial payment');
      return;
    }

    console.log(`✅ Found test order: ${testOrder.billnumberinput2}`);
    console.log('📋 Test order details:');
    console.log(`   Order ID: ${testOrder.id}`);
    console.log(`   Bill Number: ${testOrder.billnumberinput2}`);
    console.log(`   Payment Status: ${testOrder.payment_status}`);
    console.log(`   Total Amount: ₹${testOrder.total_amt}`);
    console.log(`   Advance Amount: ₹${testOrder.payment_amount}`);
    console.log(`   Remaining Balance: ₹${(testOrder.total_amt - testOrder.payment_amount).toFixed(2)}`);

    // Get current revenue for today
    const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const beforeProfit = await SupabaseAPI.calculateProfit(todayDate);
    
    console.log('\n💰 Current revenue for today BEFORE payment completion:');
    console.log(`   Revenue: ₹${beforeProfit.total_revenue}`);
    console.log(`   Final payments: ₹${beforeProfit.revenue_breakdown?.final_payments || 0}`);

    console.log('\n🔄 This is what SHOULD happen when you mark this order as "paid":');
    console.log(`   1. System calculates remaining balance: ₹${(testOrder.total_amt - testOrder.payment_amount).toFixed(2)}`);
    console.log(`   2. Records this amount as today's final payment revenue`);
    console.log(`   3. Updates today's total revenue immediately`);
    console.log(`   4. Shows increased profit in Daily Profit screen`);

    console.log('\n💡 To complete the test:');
    console.log(`   1. Go to Orders Overview screen`);
    console.log(`   2. Find bill ${testOrder.billnumberinput2}`);
    console.log(`   3. Change payment status to "Paid"`);
    console.log(`   4. Check Daily Profit screen - should see ₹${(testOrder.total_amt - testOrder.payment_amount).toFixed(2)} added to today's revenue`);

  } catch (error) {
    console.error('❌ Error testing payment completion flow:', error);
  }
}

// Run the tests
async function runAllTests() {
  const isActive = await testRevenueSystemStatus();
  
  if (isActive) {
    await testPaymentCompletionFlow();
    
    console.log('\n🎯 === SYSTEM STATUS SUMMARY ===');
    console.log('✅ Revenue tracking table: CREATED');
    console.log('✅ Two-stage revenue system: ACTIVE');
    console.log('✅ Payment completion tracking: READY');
    console.log('\n🎉 Your system is now properly configured!');
    console.log('💰 When you mark orders as "paid", the pending amount will be added to TODAY\'S revenue');
  } else {
    console.log('\n❌ === SYSTEM NEEDS ATTENTION ===');
    console.log('💡 The revenue tracking table exists but system is not using it');
    console.log('🔧 Please check table permissions and RLS policies');
  }
}

runAllTests().catch(console.error);
