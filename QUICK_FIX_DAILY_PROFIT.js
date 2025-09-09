// QUICK FIX FOR DAILY PROFIT SCREEN
// This will temporarily bypass the complex logic and show basic results

console.log('🚀 === QUICK FIX FOR DAILY PROFIT SCREEN ===');

// Simple function to test basic profit calculation
async function quickFixDailyProfit() {
  try {
    console.log('🔧 Testing basic profit calculation...');
    
    // Get all data
    const [ordersResult, billsResult, expensesResult] = await Promise.all([
      supabase.from('orders').select('*'),
      supabase.from('bills').select('*'), 
      supabase.from('Daily_Expenses').select('*')
    ]);
    
    const orders = ordersResult.data || [];
    const bills = billsResult.data || [];
    const expenses = expensesResult.data || [];
    
    console.log(`📊 Data loaded: ${orders.length} orders, ${bills.length} bills, ${expenses.length} expenses`);
    
    // Simple revenue calculation - just sum all bills for now
    let totalRevenue = 0;
    bills.forEach(bill => {
      const amount = Number(bill.total_amt) || 0;
      totalRevenue += amount;
      console.log(`💰 Bill ${bill.id}: ₹${amount}`);
    });
    
    // Simple expense calculation
    let totalExpenses = 0;
    expenses.forEach(expense => {
      const amount = (Number(expense.material_cost) || 0) + 
                    (Number(expense.miscellaneous_Cost) || 0) + 
                    (Number(expense.chai_pani_cost) || 0);
      totalExpenses += amount;
    });
    
    const netProfit = totalRevenue - totalExpenses;
    const orderCount = orders.length;
    
    console.log('\n💰 SIMPLE CALCULATION RESULTS:');
    console.log(`  Total Revenue: ₹${totalRevenue}`);
    console.log(`  Total Expenses: ₹${totalExpenses}`);
    console.log(`  Net Profit: ₹${netProfit}`);
    console.log(`  Order Count: ${orderCount}`);
    
    if (totalRevenue === 0) {
      console.log('\n🚨 REVENUE IS ZERO - CHECKING BILLS...');
      if (bills.length === 0) {
        console.log('❌ No bills found in database');
        console.log('💡 Create some bills first');
      } else {
        console.log('⚠️ Bills exist but have zero amounts');
        bills.forEach(bill => {
          console.log(`  Bill ${bill.id}: total_amt = ${bill.total_amt} (${typeof bill.total_amt})`);
        });
      }
    }
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      orderCount,
      billCount: bills.length
    };
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    return null;
  }
}

// Function to manually update the Daily Profit UI (if we can access it)
async function forceUpdateDailyProfitUI() {
  console.log('🔧 Attempting to force update Daily Profit UI...');
  
  try {
    const result = await quickFixDailyProfit();
    
    if (result) {
      console.log('\n💡 MANUAL UI UPDATE SUGGESTION:');
      console.log('If the UI is still showing ₹0.00, try:');
      console.log('1. Switch to "All Time" filter');
      console.log('2. Pull down to refresh');
      console.log('3. Press the refresh button');
      console.log('4. Restart the app');
      
      // Try to trigger a refresh if possible
      console.log('\n🔄 Trying to trigger refresh...');
      
      // Check if there's a way to trigger the loadData function
      if (typeof window !== 'undefined' && window.location) {
        console.log('💡 Try refreshing the page or switching filters');
      }
    }
    
  } catch (error) {
    console.error('❌ Force update failed:', error);
  }
}

// Simple data creation for testing
async function createTestData() {
  console.log('🧪 === CREATING TEST DATA ===');
  
  try {
    // Create a test bill for today
    const todayIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const todayStr = todayIST.toISOString().split('T')[0];
    
    console.log(`📅 Creating test bill for today: ${todayStr}`);
    
    const { data: newBill, error: billError } = await supabase
      .from('bills')
      .insert({
        customer_name: 'Test Customer',
        mobile_number: '9876543210',
        total_amt: 1500,
        payment_amount: 500,
        today_date: todayStr,
        bill_status: 'active'
      })
      .select()
      .single();
    
    if (billError) {
      console.error('❌ Failed to create test bill:', billError);
      return;
    }
    
    console.log('✅ Created test bill:', newBill);
    
    // Create a test order linked to this bill
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: 'Test Customer',
        bill_id: newBill.id,
        payment_status: 'paid',
        Work_pay: 100,
        order_date: todayStr
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('❌ Failed to create test order:', orderError);
      return;
    }
    
    console.log('✅ Created test order:', newOrder);
    
    console.log('\n🎉 TEST DATA CREATED SUCCESSFULLY!');
    console.log('💡 Now try refreshing the Daily Profit screen');
    
    return { bill: newBill, order: newOrder };
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
}

// Check what payment statuses exist
async function checkPaymentStatuses() {
  console.log('\n🔍 === CHECKING PAYMENT STATUSES ===');
  
  const { data: orders } = await supabase.from('orders').select('payment_status');
  const statuses = [...new Set(orders?.map(o => o.payment_status) || [])];
  
  console.log('📊 Existing payment statuses:', statuses);
  
  const paidCount = orders?.filter(o => o.payment_status?.toLowerCase() === 'paid').length || 0;
  console.log(`💰 Orders marked as "paid": ${paidCount}`);
  
  if (paidCount === 0) {
    console.log('\n💡 TO GET REVENUE SHOWING:');
    console.log('1. Go to Orders screen in the app');
    console.log('2. Edit some orders');
    console.log('3. Change payment_status to "paid"');
    console.log('4. Return to Daily Profit screen');
    console.log('5. The revenue should now show');
  }
}

// Run all diagnostics and fixes
async function runQuickFix() {
  console.log('🚀 Running comprehensive quick fix...\n');
  
  await quickFixDailyProfit();
  await checkPaymentStatuses();
  
  console.log('\n💡 === QUICK FIX SUMMARY ===');
  console.log('If Daily Profit still shows ₹0.00:');
  console.log('1. Run: createTestData() to create sample data');
  console.log('2. Or mark existing orders as "paid"');
  console.log('3. Or switch to "All Time" filter');
  console.log('4. Or refresh the screen');
  
  console.log('\n🔧 Available functions:');
  console.log('  - quickFixDailyProfit() - Test basic calculation');
  console.log('  - createTestData() - Create sample data');
  console.log('  - checkPaymentStatuses() - Check order statuses');
}

// Auto-run
setTimeout(runQuickFix, 1000);

// Make functions available globally
window.quickFix = {
  quickFixDailyProfit,
  createTestData,
  checkPaymentStatuses,
  forceUpdateDailyProfitUI,
  runQuickFix
};

console.log('💡 Quick fix functions available: quickFix.createTestData()');
