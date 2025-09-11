// Test to check if revenue_tracking table exists
import { SupabaseAPI } from './supabase.js';

async function testRevenueTracking() {
  console.log('🔍 Testing if revenue_tracking table exists...');
  
  try {
    const result = await SupabaseAPI.calculateProfit();
    console.log('📊 Calculation result:', JSON.stringify(result, null, 2));
    console.log('💡 Method used:', result.method);
    
    if (result.method === 'legacy') {
      console.log('❌ ISSUE IDENTIFIED: revenue_tracking table does not exist!');
      console.log('💡 This means final payments are not being recorded to today\'s revenue');
      console.log('🔧 Solution: Create the revenue_tracking table');
      return false;
    } else {
      console.log('✅ Two-stage revenue system is active');
      return true;
    }
  } catch (err) {
    console.error('❌ Error testing profit calculation:', err);
    return false;
  }
}

testRevenueTracking().then(hasTable => {
  if (hasTable) {
    console.log('✅ Revenue tracking system is properly configured');
  } else {
    console.log('❌ Revenue tracking table missing - need to create it');
  }
});
