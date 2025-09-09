// DAILY PROFIT DEBUGGING TEST SCRIPT
// Copy and paste this into your browser console when the app is running

console.log('🔧 === DAILY PROFIT DEBUG TEST STARTING ===');

// Test 1: Check if SupabaseAPI is available
if (typeof SupabaseAPI !== 'undefined') {
  console.log('✅ SupabaseAPI is available');
} else {
  console.error('❌ SupabaseAPI is not available - check if app loaded properly');
}

// Test 2: Check if calculatePaymentBasedProfit function exists
if (typeof SupabaseAPI?.calculatePaymentBasedProfit === 'function') {
  console.log('✅ calculatePaymentBasedProfit function exists');
} else {
  console.error('❌ calculatePaymentBasedProfit function missing');
}

// Test 3: Direct API call
async function testPaymentBasedProfit() {
  try {
    console.log('🧪 Testing calculatePaymentBasedProfit()...');
    const result = await SupabaseAPI.calculatePaymentBasedProfit();
    
    console.log('📊 API Result:', result);
    console.log('💰 Total Revenue:', result.total_revenue);
    console.log('💵 Payment Events:', result.payment_events?.length || 0);
    console.log('📅 Payment Events:', result.payment_events);
    
    if (result.payment_events?.length > 0) {
      console.log('✅ Payment events found!');
      result.payment_events.forEach((event, i) => {
        console.log(`  ${i+1}. ${event.date}: ${event.type} ₹${event.amount} (Bill ${event.billId})`);
      });
    } else {
      console.log('⚠️ No payment events found');
    }
    
    return result;
  } catch (error) {
    console.error('❌ API call failed:', error);
    return null;
  }
}

// Test 4: Check bills data
async function testBillsData() {
  try {
    console.log('🧪 Testing bills data...');
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .order('today_date', { ascending: false });
      
    if (error) {
      console.error('❌ Bills fetch error:', error);
      return;
    }
    
    console.log('📄 Total bills:', bills?.length || 0);
    
    const billsWithAdvance = bills?.filter(b => (Number(b.payment_amount) || 0) > 0) || [];
    console.log('💵 Bills with advance payment:', billsWithAdvance.length);
    
    if (billsWithAdvance.length > 0) {
      console.log('📋 Bills with advances:');
      billsWithAdvance.forEach(bill => {
        console.log(`  Bill ${bill.id}: ₹${bill.payment_amount} advance, ₹${bill.total_amt} total (${bill.today_date})`);
      });
    }
    
    return bills;
  } catch (error) {
    console.error('❌ Bills test failed:', error);
    return null;
  }
}

// Test 5: Check orders data
async function testOrdersData() {
  try {
    console.log('🧪 Testing orders data...');
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('❌ Orders fetch error:', error);
      return;
    }
    
    console.log('📦 Total orders:', orders?.length || 0);
    
    const paidOrders = orders?.filter(o => o.payment_status?.toLowerCase() === 'paid') || [];
    console.log('✅ Paid orders:', paidOrders.length);
    
    if (paidOrders.length > 0) {
      console.log('📋 Paid orders:');
      paidOrders.slice(0, 5).forEach(order => {
        console.log(`  Order ${order.id}: Bill ${order.bill_id}, Status: ${order.payment_status} (${order.updated_at})`);
      });
    }
    
    return orders;
  } catch (error) {
    console.error('❌ Orders test failed:', error);
    return null;
  }
}

// Test 6: Test date formatting
function testDateFormatting() {
  console.log('🧪 Testing date formatting...');
  
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  
  const formatISTDate = (date) => {
    if (!date) return '';
    const utcDate = new Date(date);
    const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
    
    const yyyy = istDate.getFullYear();
    const mm = String(istDate.getMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const todayKey = formatISTDate(now);
  
  console.log('🕐 Current time (local):', now.toLocaleString());
  console.log('🇮🇳 Current time (IST):', istNow.toLocaleString());
  console.log('📅 Today key (IST):', todayKey);
  
  return todayKey;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running all Daily Profit debug tests...\n');
  
  // Basic checks
  testDateFormatting();
  console.log('');
  
  // Data tests
  const bills = await testBillsData();
  console.log('');
  
  const orders = await testOrdersData();
  console.log('');
  
  // API test
  const profitData = await testPaymentBasedProfit();
  console.log('');
  
  // Summary
  console.log('📊 === TEST SUMMARY ===');
  console.log('Bills loaded:', bills ? '✅' : '❌');
  console.log('Orders loaded:', orders ? '✅' : '❌');
  console.log('Payment API working:', profitData ? '✅' : '❌');
  
  if (profitData) {
    console.log(`Revenue: ₹${profitData.total_revenue || 0}`);
    console.log(`Payment events: ${profitData.payment_events?.length || 0}`);
    console.log(`Net profit: ₹${profitData.net_profit || 0}`);
  }
  
  console.log('🔧 === DAILY PROFIT DEBUG TEST COMPLETE ===');
  
  return {
    bills,
    orders,
    profitData,
    success: !!(bills && orders && profitData)
  };
}

// Auto-run the test
console.log('⏳ Auto-running tests in 2 seconds...');
setTimeout(runAllTests, 2000);

// Also expose functions for manual testing
window.dailyProfitDebug = {
  testPaymentBasedProfit,
  testBillsData,
  testOrdersData,
  testDateFormatting,
  runAllTests
};

console.log('💡 Available manual test functions:');
console.log('  - dailyProfitDebug.testPaymentBasedProfit()');
console.log('  - dailyProfitDebug.testBillsData()');
console.log('  - dailyProfitDebug.testOrdersData()');
console.log('  - dailyProfitDebug.runAllTests()');
