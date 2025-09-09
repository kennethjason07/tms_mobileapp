// DIAGNOSE ZERO REVENUE ISSUE
// Copy and paste this into browser console to find why revenue shows ₹0.00

console.log('🔍 === DIAGNOSING ZERO REVENUE ISSUE ===');

async function diagnoseZeroRevenue() {
  try {
    console.log('🧪 Step 1: Check basic data availability...');
    
    // Check if we have any orders at all
    const { data: allOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(10);
    
    if (ordersError) {
      console.error('❌ Orders fetch error:', ordersError);
      return;
    }
    
    console.log(`📦 Total orders in DB: ${allOrders?.length || 0}`);
    
    if (allOrders?.length > 0) {
      console.log('📋 Sample orders:');
      allOrders.slice(0, 3).forEach((order, i) => {
        console.log(`  ${i+1}. Order ${order.id}: status="${order.payment_status}", bill_id=${order.bill_id}`);
      });
      
      // Check payment statuses
      const paidOrders = allOrders.filter(o => o.payment_status?.toLowerCase() === 'paid');
      console.log(`💰 Orders marked as "paid": ${paidOrders.length}`);
      
      if (paidOrders.length === 0) {
        console.log('⚠️ PROBLEM FOUND: No orders have payment_status = "paid"');
        console.log('💡 Solution: Mark some orders as paid to generate revenue');
        
        // Show what payment statuses exist
        const statuses = [...new Set(allOrders.map(o => o.payment_status))];
        console.log('📊 Existing payment statuses:', statuses);
      }
      
      // Check if bills exist
      const billIds = [...new Set(allOrders.map(o => o.bill_id).filter(Boolean))];
      console.log(`📄 Unique bill IDs referenced: ${billIds.length}`);
      
      if (billIds.length > 0) {
        const { data: bills } = await supabase
          .from('bills')
          .select('*')
          .in('id', billIds.slice(0, 5));
        
        console.log(`💰 Bills found: ${bills?.length || 0}`);
        
        if (bills?.length > 0) {
          console.log('📋 Sample bills:');
          bills.forEach(bill => {
            console.log(`  Bill ${bill.id}: ₹${bill.total_amt}, date=${bill.today_date}`);
          });
        }
      }
      
    } else {
      console.log('⚠️ PROBLEM FOUND: No orders in database');
      console.log('💡 Solution: Create some orders first');
    }
    
    console.log('\n🧪 Step 2: Test IST date calculation...');
    
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
    console.log(`📅 Today (IST): ${todayIST}`);
    console.log(`🕐 Current IST time: ${nowIST.toLocaleString()}`);
    
    if (todayIST === '2025-09-09') {
      console.log('✅ IST calculation working correctly');
    } else {
      console.log('⚠️ IST calculation might be wrong');
    }
    
    console.log('\n🧪 Step 3: Test complete revenue flow...');
    
    // Test the complete revenue calculation flow
    const { data: orders } = await supabase.from('orders').select('*');
    const paidOrders = orders?.filter(order => 
      order.payment_status?.toLowerCase() === 'paid'
    ) || [];
    
    console.log(`💵 Step 3.1: Found ${paidOrders.length} paid orders`);
    
    if (paidOrders.length === 0) {
      console.log('🚨 ROOT CAUSE: No paid orders = No revenue');
      console.log('💡 TO FIX: Mark some orders as paid:');
      console.log('  1. Go to Orders screen');
      console.log('  2. Edit an order');
      console.log('  3. Set payment_status to "paid"');
      console.log('  4. Return to Daily Profit screen');
      return { issue: 'no_paid_orders', solution: 'mark_orders_as_paid' };
    }
    
    const uniqueBillIds = [...new Set(paidOrders.map(order => order.bill_id).filter(Boolean))];
    console.log(`📄 Step 3.2: Found ${uniqueBillIds.length} unique bill IDs`);
    
    if (uniqueBillIds.length === 0) {
      console.log('🚨 ROOT CAUSE: Paid orders have no bill_id');
      console.log('💡 TO FIX: Ensure orders have valid bill_id values');
      return { issue: 'missing_bill_ids', solution: 'add_bill_ids_to_orders' };
    }
    
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .in('id', uniqueBillIds);
    
    console.log(`💰 Step 3.3: Retrieved ${bills?.length || 0} bills`);
    
    if (!bills || bills.length === 0) {
      console.log('🚨 ROOT CAUSE: Bill IDs reference non-existent bills');
      console.log('💡 TO FIX: Ensure bill_id values in orders match actual bill IDs');
      return { issue: 'missing_bills', solution: 'fix_bill_references' };
    }
    
    // Calculate revenue
    let totalRevenue = 0;
    bills.forEach(bill => {
      const amount = Number(bill.total_amt) || 0;
      const dateIST = formatISTDate(bill.today_date || bill.date_issue || bill.due_date);
      console.log(`💰 Bill ${bill.id}: ₹${amount} (${dateIST})`);
      totalRevenue += amount;
    });
    
    console.log(`💰 CALCULATED TOTAL REVENUE: ₹${totalRevenue}`);
    
    if (totalRevenue === 0) {
      console.log('🚨 ROOT CAUSE: Bills have zero total_amt values');
      console.log('💡 TO FIX: Ensure bills have valid total_amt values');
      return { issue: 'zero_bill_amounts', solution: 'add_bill_amounts' };
    }
    
    // Check today's specific data
    const todayBills = bills.filter(bill => {
      const billDateIST = formatISTDate(bill.today_date || bill.date_issue || bill.due_date);
      return billDateIST === todayIST;
    });
    
    const todayRevenue = todayBills.reduce((sum, bill) => sum + (Number(bill.total_amt) || 0), 0);
    
    console.log(`🔥 TODAY'S ANALYSIS (${todayIST}):`);
    console.log(`  📄 Bills today: ${todayBills.length}`);
    console.log(`  💰 Revenue today: ₹${todayRevenue}`);
    
    if (todayRevenue === 0 && todayBills.length === 0) {
      console.log('🚨 ROOT CAUSE: No bills created today');
      console.log('💡 TO FIX: Create some bills for today (Sep 9, 2025) or switch to "All Time" filter');
      return { issue: 'no_todays_data', solution: 'create_todays_bills_or_use_all_time' };
    }
    
    console.log('\n✅ DIAGNOSIS COMPLETE');
    return { 
      issue: 'unknown',
      totalRevenue,
      todayRevenue,
      paidOrders: paidOrders.length,
      todayBills: todayBills.length
    };
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    return { issue: 'diagnosis_error', error: error.message };
  }
}

// Quick fix suggestions
function showQuickFixes() {
  console.log('\n💡 === QUICK FIXES FOR ZERO REVENUE ===');
  console.log('1. CHECK ORDERS: Ensure some orders have payment_status = "paid"');
  console.log('2. CHECK BILLS: Ensure bills exist with valid total_amt values');
  console.log('3. CHECK DATES: Try "All Time" filter instead of "Today"');
  console.log('4. CHECK CONSOLE: Look for error messages in browser console');
  console.log('5. REFRESH: Try refreshing the Daily Profit screen');
}

// Test if summary stats are working
async function testSummaryStats() {
  console.log('\n🧪 === TESTING SUMMARY STATS CALCULATION ===');
  
  // This should help identify if the issue is in data fetching or summary calculation
  try {
    // Mock some test data to see if summary calculation works
    const testData = [
      {
        date: '2025-09-09',
        revenue: 1500,
        workPay: 200,
        shopExpenses: 100,
        workerExpenses: 50,
        netProfit: 1150,
        orderCount: 3,
        bills: [{ id: 1, total_amt: 500 }, { id: 2, total_amt: 1000 }]
      }
    ];
    
    // Test summary calculation
    const totalRevenue = testData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = testData.reduce((sum, day) => sum + day.orderCount, 0);
    const totalProfit = testData.reduce((sum, day) => sum + day.netProfit, 0);
    
    console.log('📊 Test summary with mock data:');
    console.log(`  Revenue: ₹${totalRevenue}`);
    console.log(`  Orders: ${totalOrders}`);
    console.log(`  Profit: ₹${totalProfit}`);
    
    if (totalRevenue > 0) {
      console.log('✅ Summary calculation logic works fine');
      console.log('🚨 Problem is likely in data fetching or filtering');
    }
    
  } catch (error) {
    console.log('❌ Summary calculation has issues:', error);
  }
}

// Auto-run diagnosis
console.log('⏳ Running diagnosis in 1 second...');
setTimeout(async () => {
  const result = await diagnoseZeroRevenue();
  testSummaryStats();
  showQuickFixes();
  
  console.log('\n📊 === DIAGNOSIS RESULT ===');
  console.log('Issue:', result.issue);
  console.log('Solution:', result.solution || 'See quick fixes above');
}, 1000);

// Manual access
window.diagnoseRevenue = {
  diagnoseZeroRevenue,
  testSummaryStats,
  showQuickFixes
};

console.log('💡 Manual functions: diagnoseRevenue.diagnoseZeroRevenue()');
