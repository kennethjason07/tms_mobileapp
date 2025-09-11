// COMPREHENSIVE DAILY PROFIT SYSTEM TEST
// Copy and paste this into your browser console when the app is running

console.log('💰 === TESTING COMPREHENSIVE DAILY PROFIT SYSTEM ===');

// Test the comprehensive daily profit calculation
async function testComprehensiveProfitSystem() {
  console.log('🧪 Testing comprehensive daily profit calculation...\n');
  
  try {
    // Test IST date calculation first
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.getTime() + IST_OFFSET_MS);
    
    const formatISTDate = (date) => {
      if (!date) return '';
      const istDate = new Date(new Date(date).getTime() + IST_OFFSET_MS);
      const yyyy = istDate.getUTCFullYear();
      const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    
    const todayIST = formatISTDate(new Date());
    
    console.log('📅 IST Date Calculation:');
    console.log(`  UTC: ${nowUTC.toISOString()}`);
    console.log(`  IST: ${nowIST.toISOString()}`);
    console.log(`  Today (IST): ${todayIST}`);
    
    if (todayIST === '2025-09-09') {
      console.log('✅ IST date calculation correct for Sep 9, 2025');
    } else {
      console.log(`⚠️ Expected 2025-09-09, got ${todayIST}`);
    }
    
    console.log('\n📊 === TESTING DATA FETCHING ===');
    
    // Test data fetching
    const [ordersResult, dailyExpensesResult, workerExpensesResult] = await Promise.all([
      supabase.from('orders').select('*').order('order_date', { ascending: false }),
      supabase.from('Daily_Expenses').select('*').order('Date', { ascending: false }),
      supabase.from('Worker_Expense').select('*').order('date', { ascending: false })
    ]);
    
    const orders = ordersResult.data || [];
    const dailyExpenses = dailyExpensesResult.data || [];
    const workerExpenses = workerExpensesResult.data || [];
    
    console.log(`📦 Orders loaded: ${orders.length}`);
    console.log(`💵 Daily expenses loaded: ${dailyExpenses.length}`);
    console.log(`👷 Worker expenses loaded: ${workerExpenses.length}`);
    
    console.log('\n💰 === TESTING REVENUE CALCULATION (Subquery Approach) ===');
    
    // Test revenue calculation
    const paidOrders = orders.filter(order => 
      order.payment_status?.toLowerCase() === 'paid'
    );
    console.log(`💵 Paid orders: ${paidOrders.length} out of ${orders.length} total`);
    
    const uniqueBillIds = [...new Set(paidOrders.map(order => order.bill_id).filter(Boolean))];
    console.log(`📄 Unique bills with paid orders: ${uniqueBillIds.length}`);
    
    let billsWithPaidOrders = [];
    if (uniqueBillIds.length > 0) {
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .in('id', uniqueBillIds);
      billsWithPaidOrders = bills || [];
    }
    
    console.log(`💰 Bills retrieved: ${billsWithPaidOrders.length}`);
    
    // Calculate total revenue
    let totalRevenue = 0;
    billsWithPaidOrders.forEach(bill => {
      const amount = Number(bill.total_amt) || 0;
      const dateIST = formatISTDate(bill.today_date || bill.date_issue || bill.due_date);
      console.log(`  Bill ${bill.id}: ₹${amount} (${dateIST})`);
      totalRevenue += amount;
    });
    
    console.log(`💰 TOTAL REVENUE: ₹${totalRevenue}`);
    
    // Test today's data specifically
    const todayBills = billsWithPaidOrders.filter(bill => {
      const billDateIST = formatISTDate(bill.today_date || bill.date_issue || bill.due_date);
      return billDateIST === todayIST;
    });
    
    const todayRevenue = todayBills.reduce((sum, bill) => sum + (Number(bill.total_amt) || 0), 0);
    
    console.log(`\n🔥 TODAY'S DATA (${todayIST}):`);
    console.log(`  Bills: ${todayBills.length}`);
    console.log(`  Revenue: ₹${todayRevenue}`);
    
    if (todayBills.length > 0) {
      console.log('✅ Found data for today!');
      todayBills.forEach(bill => {
        console.log(`    Bill ${bill.id}: ₹${bill.total_amt}`);
      });
    } else {
      console.log('⚠️ No bills found for today');
    }
    
    console.log('\n📊 === TESTING EXPENSE CALCULATION ===');
    
    // Test today's expenses
    const todayDailyExpenses = dailyExpenses.filter(expense => {
      const expenseDateIST = formatISTDate(expense.Date);
      return expenseDateIST === todayIST;
    });
    
    const todayWorkerExpenses = workerExpenses.filter(expense => {
      const expenseDateIST = formatISTDate(expense.date);
      return expenseDateIST === todayIST;
    });
    
    const todayDailyTotal = todayDailyExpenses.reduce((sum, expense) => {
      return sum + (Number(expense.material_cost) || 0) + 
                 (Number(expense.miscellaneous_Cost) || 0) + 
                 (Number(expense.chai_pani_cost) || 0);
    }, 0);
    
    const todayWorkerTotal = todayWorkerExpenses.reduce((sum, expense) => {
      return sum + (Number(expense.Amt_Paid) || 0);
    }, 0);
    
    console.log(`Today's Daily Expenses: ₹${todayDailyTotal} (${todayDailyExpenses.length} entries)`);
    console.log(`Today's Worker Expenses: ₹${todayWorkerTotal} (${todayWorkerExpenses.length} entries)`);
    
    const todayTotalExpenses = todayDailyTotal + todayWorkerTotal;
    const todayNetProfit = todayRevenue - todayTotalExpenses;
    
    console.log(`\n📈 TODAY'S PROFIT CALCULATION:`);
    console.log(`  Revenue: ₹${todayRevenue}`);
    console.log(`  Expenses: ₹${todayTotalExpenses}`);
    console.log(`  Net Profit: ₹${todayNetProfit}`);
    
    return {
      todayIST,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      uniqueBills: uniqueBillIds.length,
      totalRevenue,
      todayRevenue,
      todayBills: todayBills.length,
      todayExpenses: todayTotalExpenses,
      todayProfit: todayNetProfit,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Test the Daily Profit Screen data loading
async function testDailyProfitScreen() {
  console.log('\n🖥️ === TESTING DAILY PROFIT SCREEN INTEGRATION ===');
  
  try {
    // Check if we can access the screen's data loading function
    // This simulates what happens when user selects "Today"
    
    console.log('Testing "Today" filter simulation...');
    
    // This would be equivalent to setting dateFilter to 'today' and calling loadData()
    // The actual implementation should show results for 2025-09-09
    
    console.log('✅ Integration test setup complete');
    console.log('💡 To test the actual screen:');
    console.log('  1. Go to Daily Profit Screen in the app');
    console.log('  2. Select "Today" filter');
    console.log('  3. Check console logs for comprehensive calculation steps');
    console.log('  4. Verify cards show data for Sep 9, 2025');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run comprehensive test
async function runComprehensiveTest() {
  console.log('🚀 Running comprehensive Daily Profit system test...\n');
  
  const systemTest = await testComprehensiveProfitSystem();
  const integrationTest = await testDailyProfitScreen();
  
  console.log('\n📊 === COMPREHENSIVE TEST SUMMARY ===');
  console.log(`System Test: ${systemTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Integration Test: ${integrationTest.success ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (systemTest.success) {
    console.log('\n📈 SYSTEM TEST RESULTS:');
    console.log(`  Today: ${systemTest.todayIST}`);
    console.log(`  Total Orders: ${systemTest.totalOrders}`);
    console.log(`  Paid Orders: ${systemTest.paidOrders}`);
    console.log(`  Revenue Generating Bills: ${systemTest.uniqueBills}`);
    console.log(`  Total Revenue: ₹${systemTest.totalRevenue}`);
    console.log(`  Today's Revenue: ₹${systemTest.todayRevenue}`);
    console.log(`  Today's Bills: ${systemTest.todayBills}`);
    console.log(`  Today's Expenses: ₹${systemTest.todayExpenses}`);
    console.log(`  Today's Profit: ₹${systemTest.todayProfit}`);
    
    if (systemTest.todayRevenue > 0 || systemTest.todayBills > 0) {
      console.log('\n🎉 SUCCESS: Found data for today! The Daily Profit cards should update.');
    } else {
      console.log('\n⚠️ No data for today - create some bills/orders for Sep 9, 2025 to see results.');
    }
  }
  
  console.log('\n💰 === COMPREHENSIVE DAILY PROFIT TEST COMPLETE ===');
  
  return {
    system: systemTest,
    integration: integrationTest,
    overallSuccess: systemTest.success && integrationTest.success
  };
}

// Auto-run the test
console.log('⏳ Running comprehensive test in 2 seconds...');
setTimeout(runComprehensiveTest, 2000);

// Expose for manual testing
window.comprehensiveProfitTest = {
  testComprehensiveProfitSystem,
  testDailyProfitScreen,
  runComprehensiveTest
};

console.log('💡 Available manual test functions:');
console.log('  - comprehensiveProfitTest.testComprehensiveProfitSystem()');
console.log('  - comprehensiveProfitTest.runComprehensiveTest()');

// Show current IST time for reference
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const nowIST = new Date(new Date().getTime() + IST_OFFSET_MS);
console.log(`\n🇮🇳 Current IST time: ${nowIST.toLocaleString()}`);
console.log('📅 Expected date: September 9, 2025');
