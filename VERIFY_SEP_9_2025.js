// VERIFY IST DATE FOR SEPTEMBER 9, 2025
// Copy and paste this into your browser console

console.log('🇮🇳 === VERIFYING IST DATE: SEPTEMBER 9, 2025 ===');

function verifyISTDate() {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
  
  // Current time
  const nowUTC = new Date();
  const nowIST = new Date(nowUTC.getTime() + IST_OFFSET_MS);
  
  console.log('⏰ System UTC time:', nowUTC.toISOString());
  console.log('🇮🇳 IST time:', nowIST.toISOString());
  console.log('📅 IST local string:', nowIST.toLocaleString('en-IN', {timeZone: 'UTC'}));
  
  // Format today's date in IST
  const getTodayIST = () => {
    const istNow = new Date(new Date().getTime() + IST_OFFSET_MS);
    const yyyy = istNow.getUTCFullYear();
    const mm = String(istNow.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(istNow.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const todayIST = getTodayIST();
  console.log('📅 Today in IST format:', todayIST);
  
  // Verify it matches September 9, 2025
  if (todayIST === '2025-09-09') {
    console.log('✅ CORRECT: Today is September 9, 2025 in IST!');
  } else {
    console.log('⚠️ Date mismatch - Expected: 2025-09-09, Got:', todayIST);
  }
  
  // Show readable format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = todayIST.split('-');
  const readableDate = `${parts[2]} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
  console.log('📆 Today (readable):', readableDate);
  
  return todayIST;
}

// Test with sample bill dates
function testBillDates() {
  console.log('\n🧪 Testing bill date conversion...');
  
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  
  const formatISTDate = (date) => {
    if (!date) return '';
    const utcDate = new Date(date);
    const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
    
    const yyyy = istDate.getUTCFullYear();
    const mm = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  // Test various UTC times that should become Sep 9, 2025 in IST
  const testDates = [
    '2025-09-08T18:30:00Z', // Should become Sep 9
    '2025-09-08T23:59:59Z', // Should become Sep 9
    '2025-09-09T10:00:00Z', // Should become Sep 9
    '2025-09-09T18:29:59Z', // Should become Sep 9
    '2025-09-09T18:30:00Z', // Should become Sep 10
  ];
  
  console.log('UTC Date -> IST Date conversion:');
  testDates.forEach(utcDate => {
    const istFormatted = formatISTDate(utcDate);
    console.log(`  ${utcDate} -> ${istFormatted}`);
  });
}

// Check if API functions are working
async function testAPIWithSep9() {
  console.log('\n💰 Testing API with Sep 9, 2025...');
  
  if (typeof SupabaseAPI !== 'undefined' && typeof SupabaseAPI.getTodayIST === 'function') {
    const apiTodayIST = SupabaseAPI.getTodayIST();
    console.log('📅 API Today IST:', apiTodayIST);
    
    if (apiTodayIST === '2025-09-09') {
      console.log('✅ API correctly returns Sep 9, 2025');
      
      try {
        const todayData = await SupabaseAPI.calculatePaymentBasedProfit(apiTodayIST);
        console.log('📊 Sep 9 payment data:', todayData);
        
        if (todayData.payment_events && todayData.payment_events.length > 0) {
          console.log(`✅ Found ${todayData.payment_events.length} payment events for Sep 9!`);
          console.log(`💰 Today's revenue: ₹${todayData.total_revenue}`);
        } else {
          console.log('⚠️ No payment events found for Sep 9, 2025');
        }
        
        return todayData;
      } catch (error) {
        console.error('❌ API call failed:', error);
      }
    } else {
      console.log('❌ API date mismatch - Expected: 2025-09-09, Got:', apiTodayIST);
    }
  } else {
    console.log('❌ SupabaseAPI.getTodayIST not available');
  }
}

// Run verification
async function runVerification() {
  console.log('🚀 Running Sep 9, 2025 verification...\n');
  
  const todayIST = verifyISTDate();
  testBillDates();
  const apiData = await testAPIWithSep9();
  
  console.log('\n📊 === VERIFICATION SUMMARY ===');
  console.log(`Today (IST): ${todayIST}`);
  console.log(`Expected: 2025-09-09`);
  console.log(`Match: ${todayIST === '2025-09-09' ? '✅ YES' : '❌ NO'}`);
  
  if (apiData) {
    console.log(`Revenue today: ₹${apiData.total_revenue || 0}`);
    console.log(`Payment events: ${apiData.payment_events?.length || 0}`);
  }
  
  console.log('\n🇮🇳 Daily Profit should now show data for September 9, 2025 in IST timezone!');
}

// Auto-run
setTimeout(runVerification, 1000);

// Manual access
window.sep9Verify = { verifyISTDate, testBillDates, testAPIWithSep9, runVerification };

console.log('📝 Manual functions available: sep9Verify.runVerification()');
