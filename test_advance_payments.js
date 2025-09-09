// Diagnostic Script for Testing Advance Payment Calculation
// Run this in your browser console to debug advance payment issues

import { SupabaseAPI, supabase } from './supabase';

const testAdvancePaymentCalculation = async () => {
  console.log('🔍 TESTING ADVANCE PAYMENT CALCULATION...');
  console.log('=' .repeat(60));

  try {
    // Get current IST date
    const getISTDateString = () => {
      const utcDate = new Date();
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      return istDate.toISOString().split('T')[0];
    };

    const todayIST = getISTDateString();
    console.log('📅 Today (IST):', todayIST);

    // ═══════════════════════════════════════════════════════════════════════════════
    // CHECK 1: Look for orders with payment_amount > 0 created today
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🔍 CHECK 1: Orders with advance payments created today...');
    
    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_date', todayIST)
      .gt('payment_amount', 0);
    
    if (ordersError) {
      console.error('❌ Error fetching today\'s orders:', ordersError);
    } else {
      console.log(`📋 Found ${todayOrders?.length || 0} orders with advance payments today:`);
      
      let totalAdvanceFromOrders = 0;
      todayOrders?.forEach((order, index) => {
        const amount = parseFloat(order.payment_amount) || 0;
        totalAdvanceFromOrders += amount;
        console.log(`  ${index + 1}. Order #${order.id}: ₹${amount} (Bill #${order.billnumberinput2 || 'N/A'})`);
      });
      
      console.log(`💰 Total advance payments from orders table: ₹${totalAdvanceFromOrders}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CHECK 2: Check revenue_tracking table
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🔍 CHECK 2: Revenue tracking table...');
    
    const { data: revenueRecords, error: revenueError } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('payment_date', todayIST)
      .eq('payment_type', 'advance');
    
    if (revenueError) {
      console.log('⚠️ revenue_tracking table not found or accessible:', revenueError.message);
      console.log('ℹ️ This means the system will use the enhanced legacy method');
    } else {
      console.log(`📊 Found ${revenueRecords?.length || 0} advance payment records in revenue_tracking:`);
      
      let totalAdvanceFromTracking = 0;
      revenueRecords?.forEach((record, index) => {
        const amount = parseFloat(record.amount) || 0;
        totalAdvanceFromTracking += amount;
        console.log(`  ${index + 1}. Order #${record.order_id}: ₹${amount} (${record.customer_name})`);
      });
      
      console.log(`💰 Total advance payments from revenue_tracking: ₹${totalAdvanceFromTracking}`);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CHECK 3: Test profit calculation
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🔍 CHECK 3: Testing profit calculation methods...');
    
    // Test main calculation method
    const mainResult = await SupabaseAPI.calculateProfit(todayIST);
    console.log('📊 Main calculateProfit result:', {
      date: mainResult.date,
      totalRevenue: mainResult.total_revenue,
      method: mainResult.method || 'legacy',
      revenueBreakdown: mainResult.revenue_breakdown
    });
    
    // Test legacy method directly
    const legacyResult = await SupabaseAPI.calculateProfitLegacy(todayIST);
    console.log('📊 Legacy calculateProfitLegacy result:', {
      date: legacyResult.date,
      totalRevenue: legacyResult.total_revenue,
      revenueBreakdown: legacyResult.revenue_breakdown
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // CHECK 4: Test "All Time" calculation
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🔍 CHECK 4: Testing "All Time" calculation...');
    
    const allTimeResult = await SupabaseAPI.calculateProfit();
    console.log('📊 All Time result:', {
      totalRevenue: allTimeResult.total_revenue,
      method: allTimeResult.method || 'legacy',
      revenueBreakdown: allTimeResult.revenue_breakdown
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // SUMMARY & RECOMMENDATIONS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n📋 SUMMARY & RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    if (revenueError) {
      console.log('🎯 ISSUE: revenue_tracking table not found');
      console.log('💡 SOLUTION: Run setup_revenue_tracking.sql in Supabase');
      console.log('⚡ CURRENT: Using enhanced legacy method (should still work)');
      
      if (todayOrders && todayOrders.length > 0) {
        console.log('✅ GOOD NEWS: Orders with advance payments found');
        console.log('✅ Enhanced legacy method should show these in revenue');
      } else {
        console.log('⚠️ NO ADVANCE PAYMENTS: No orders with payment_amount > 0 found for today');
        console.log('💡 Create a test bill with advance payment to see revenue');
      }
    } else {
      if (revenueRecords && revenueRecords.length > 0) {
        console.log('✅ WORKING: revenue_tracking table has advance payment records');
      } else {
        console.log('⚠️ MISSING: No advance payment records in revenue_tracking');
        console.log('💡 Create a new bill with advance payment to test');
      }
    }
    
    if (mainResult.total_revenue > 0) {
      console.log('✅ SUCCESS: Revenue calculation is working');
    } else {
      console.log('❌ ISSUE: Revenue calculation returning ₹0');
      console.log('🔧 TROUBLESHOOTING STEPS:');
      console.log('   1. Create a bill with advance payment');
      console.log('   2. Check that order_date matches today\'s IST date');
      console.log('   3. Verify payment_amount > 0 in orders table');
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
};

// Quick test to manually add advance payment
const quickTestAdvancePayment = async (orderId = 999, amount = 500) => {
  console.log(`🧪 QUICK TEST: Adding ₹${amount} advance payment for order ${orderId}...`);
  
  try {
    const result = await SupabaseAPI.addAdvancePaymentToTodayRevenue(orderId, amount, 'Test Customer');
    console.log('🎯 Result:', result);
    
    if (result.success) {
      console.log('✅ Success! Now check Daily Profit screen for updated revenue');
      
      // Test the calculation
      const profit = await SupabaseAPI.calculateProfit();
      console.log('💰 Updated revenue:', profit.total_revenue);
    } else {
      console.log('⚠️ Manual insert failed, but enhanced legacy method should still work');
      console.log('💡 Make sure you have an order with payment_amount set for today');
    }
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
};

// Export functions for browser console
if (typeof window !== 'undefined') {
  window.testAdvancePaymentCalculation = testAdvancePaymentCalculation;
  window.quickTestAdvancePayment = quickTestAdvancePayment;
  
  console.log('🔍 Diagnostic functions available:');
  console.log('- testAdvancePaymentCalculation(): Full diagnostic test');
  console.log('- quickTestAdvancePayment(orderId, amount): Quick test with manual data');
  console.log('');
  console.log('Usage: testAdvancePaymentCalculation()');
}

export { testAdvancePaymentCalculation, quickTestAdvancePayment };
