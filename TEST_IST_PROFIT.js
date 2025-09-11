// IST TIMEZONE VERIFICATION TEST FOR DAILY PROFIT
// Copy and paste this into your browser console when the app is running

console.log('🇮🇳 === IST TIMEZONE TEST FOR DAILY PROFIT ===');

// Test IST calculations
function testISTCalculations() {
  console.log('🕰️ Testing IST timezone calculations...');
  
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
  
  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + IST_OFFSET_MS);
  
  console.log('⏰ Current UTC time:', nowUTC.toISOString());
  console.log('🇮🇳 Current IST time:', nowIST.toISOString());
  
  // Test date formatting
  const formatISTDate = (date) => {
    if (!date) return '';
    const utcDate = new Date(date);
    const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
    
    const yyyy = istDate.getUTCFullYear();
    const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const getTodayIST = () => {
    const istNow = new Date(new Date().getTime() + IST_OFFSET_MS);
    const yyyy = istNow.getUTCFullYear();
    const mm = String(istNow.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(istNow.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const todayIST = getTodayIST();
  console.log('📅 Today in IST format:', todayIST);
  
  // Test if your current time matches
  const currentHour = nowIST.getUTCHours();
  const currentMinute = nowIST.getUTCMinutes();
  console.log(`🕐 Current IST time: ${currentHour}:${String(currentMinute).padStart(2, '0')}`);
  
  if (currentHour >= 22) {
    console.log('🌙 Late night time - you might see tomorrow\'s date in some UTC systems');
  }
  
  return { todayIST, nowIST, formatISTDate };
}

// Test API date formatting
async function testAPIDateHandling() {
  console.log('🧪 Testing API date handling...');
  
  if (typeof SupabaseAPI !== 'undefined') {
    console.log('✅ SupabaseAPI available');
    
    // Test the new IST methods
    if (typeof SupabaseAPI.getTodayIST === 'function') {
      const apiTodayIST = SupabaseAPI.getTodayIST();
      console.log('📅 API Today IST:', apiTodayIST);
      
      // Test the payment API with today's filter
      try {
        console.log('💰 Testing payment API with today filter...');
        const todayData = await SupabaseAPI.calculatePaymentBasedProfit(apiTodayIST);
        console.log('📊 Today\'s payment data:', todayData);
        
        if (todayData.payment_events && todayData.payment_events.length > 0) {
          console.log('✅ Found payment events for today!');
          todayData.payment_events.forEach(event => {
            console.log(`  💵 ${event.date}: ${event.type} ₹${event.amount} (Bill ${event.billId})`);
          });
        } else {
          console.log('⚠️ No payment events found for today');
        }
        
        return todayData;
      } catch (error) {
        console.error('❌ API test failed:', error);
      }
    } else {
      console.error('❌ getTodayIST method not available in SupabaseAPI');
    }
  } else {
    console.error('❌ SupabaseAPI not available');
  }
}

// Test bills data with IST dates
async function testBillsWithIST() {
  console.log('🧪 Testing bills data with IST formatting...');
  
  try {
    const { data: bills, error } = await supabase
      .from('bills')
      .select('*')
      .order('today_date', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('❌ Bills fetch error:', error);
      return;
    }
    
    console.log(`📄 Latest ${bills?.length || 0} bills:`);
    
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const formatISTDate = (date) => {
      if (!date) return 'No date';
      const utcDate = new Date(date);
      const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
      const yyyy = istDate.getUTCFullYear();
      const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    
    const todayIST = formatISTDate(new Date());
    
    bills?.forEach((bill, i) => {
      const billDateIST = formatISTDate(bill.today_date || bill.date_issue);
      const isToday = billDateIST === todayIST;
      console.log(`  ${i+1}. Bill ${bill.id}: ₹${bill.total_amt} (₹${bill.payment_amount} advance)`);
      console.log(`     Date: ${billDateIST} ${isToday ? '🔥 TODAY!' : ''}`);
    });
    
    const todayBills = bills?.filter(bill => {
      const billDateIST = formatISTDate(bill.today_date || bill.date_issue);
      return billDateIST === todayIST;
    }) || [];
    
    console.log(`📊 Bills created today (${todayIST}):`, todayBills.length);
    
    return { bills, todayBills, todayIST };
    
  } catch (error) {
    console.error('❌ Bills test failed:', error);
  }
}

// Run comprehensive IST test
async function runISTTest() {
  console.log('🚀 Running comprehensive IST test...\n');
  
  // Test 1: IST calculations
  const istCalc = testISTCalculations();
  console.log('');
  
  // Test 2: Bills with IST
  const billsTest = await testBillsWithIST();
  console.log('');
  
  // Test 3: API date handling
  const apiTest = await testAPIDateHandling();
  console.log('');
  
  // Summary
  console.log('📊 === IST TEST SUMMARY ===');
  console.log(`Today (IST): ${istCalc.todayIST}`);
  console.log(`Current IST time: ${istCalc.nowIST.toLocaleString()}`);
  console.log(`Bills today: ${billsTest?.todayBills?.length || 0}`);
  console.log(`Today's revenue: ₹${apiTest?.total_revenue || 0}`);
  console.log(`Payment events today: ${apiTest?.payment_events?.length || 0}`);
  
  if (apiTest?.payment_events?.length > 0) {
    console.log('✅ IST calculations working - found today\'s data!');
  } else {
    console.log('⚠️ No data found for today - check if bills exist for today\'s IST date');
  }
  
  console.log('\n🇮🇳 === IST TIMEZONE TEST COMPLETE ===');
  
  return {
    todayIST: istCalc.todayIST,
    todayBills: billsTest?.todayBills?.length || 0,
    todayRevenue: apiTest?.total_revenue || 0,
    success: (apiTest?.payment_events?.length || 0) > 0
  };
}

// Auto-run the test
console.log('⏳ Running IST test in 2 seconds...');
setTimeout(runISTTest, 2000);

// Expose for manual testing
window.istDebug = {
  testISTCalculations,
  testAPIDateHandling,
  testBillsWithIST,
  runISTTest
};

console.log('💡 Available manual IST test functions:');
console.log('  - istDebug.testISTCalculations()');
console.log('  - istDebug.testBillsWithIST()');
console.log('  - istDebug.runISTTest()');

// Also show what time it is right now in IST
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const nowIST = new Date(new Date().getTime() + IST_OFFSET_MS);
console.log(`\n🇮🇳 Current time in IST: ${nowIST.toLocaleString()} (${nowIST.toISOString()})`);
console.log('📅 This should match your local time!');
