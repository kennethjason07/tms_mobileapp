// Test Script for Two-Stage Revenue Recognition System
// This script helps validate that the revenue tracking system works correctly

import { SupabaseAPI, supabase } from './supabase';

const testTwoStageRevenueSystem = async () => {
  console.log('🧪 TESTING TWO-STAGE REVENUE RECOGNITION SYSTEM...');
  console.log('=' .repeat(60));

  try {
    // Test data
    const testBillData = {
      customer_name: 'Test Customer',
      mobile_number: '9999999999',
      date_issue: '2025-01-09',
      delivery_date: '2025-01-15',
      today_date: '2025-01-09',
      due_date: '2025-01-15',
      payment_status: 'pending',
      payment_mode: 'cash',
      payment_amount: 300.00,
      total_amt: 1000.00,
      total_qty: 2,
      pant_qty: 1,
      shirt_qty: 1
    };

    const testOrderData = {
      billnumberinput2: 'TEST-' + Date.now(),
      garment_type: 'Pant, Shirt',
      order_date: '2025-01-09',
      due_date: '2025-01-15',
      total_amt: 1000.00,
      payment_amount: 300.00,
      payment_status: 'pending',
      payment_mode: 'cash',
      status: 'pending',
      customer_name: 'Test Customer'
    };

    console.log('📋 Test Data Prepared:', {
      totalAmount: testOrderData.total_amt,
      advanceAmount: testOrderData.payment_amount,
      remainingBalance: testOrderData.total_amt - testOrderData.payment_amount
    });

    // ═══════════════════════════════════════════════════════════════════════════════
    // STAGE 1 TEST: Bill Creation with Advance Payment
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🎯 STAGE 1 TEST: Creating Bill with Advance Payment...');
    
    const result = await SupabaseAPI.createBillWithAdvanceTracking(testBillData, testOrderData);
    
    if (!result) {
      throw new Error('Bill creation failed');
    }
    
    const orderId = result.order[0].id;
    const billId = result.bill[0].id;
    
    console.log('✅ STAGE 1 COMPLETED:', {
      billId,
      orderId,
      advanceRecorded: result.advance_recorded,
      advanceAmount: result.advance_amount
    });

    // Verify advance payment record
    const { data: advanceRecord } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('order_id', orderId)
      .eq('payment_type', 'advance')
      .single();

    if (advanceRecord) {
      console.log('✅ ADVANCE PAYMENT RECORD FOUND:', {
        amount: advanceRecord.amount,
        paymentDate: advanceRecord.payment_date,
        remainingBalance: advanceRecord.remaining_balance
      });
    } else {
      console.log('⚠️ No advance payment record found (amount might be 0)');
    }

    // Check current revenue
    const revenueAfterStage1 = await SupabaseAPI.calculateProfit('2025-01-09');
    console.log('💰 REVENUE AFTER STAGE 1:', revenueAfterStage1);

    // ═══════════════════════════════════════════════════════════════════════════════
    // STAGE 2 TEST: Mark Order as Paid (Final Payment)
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🎯 STAGE 2 TEST: Marking Order as Paid...');
    
    const paymentUpdateResult = await SupabaseAPI.updatePaymentStatus(orderId, 'paid');
    
    console.log('✅ STAGE 2 COMPLETED - Payment status updated');

    // Verify final payment record
    const { data: finalRecord } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('order_id', orderId)
      .eq('payment_type', 'final')
      .single();

    if (finalRecord) {
      console.log('✅ FINAL PAYMENT RECORD FOUND:', {
        amount: finalRecord.amount,
        paymentDate: finalRecord.payment_date,
        remainingBalance: finalRecord.remaining_balance
      });
    } else {
      console.log('ℹ️ No final payment record (remaining balance might be 0)');
    }

    // Check final revenue
    const revenueAfterStage2 = await SupabaseAPI.calculateProfit('2025-01-09');
    console.log('💰 REVENUE AFTER STAGE 2:', revenueAfterStage2);

    // ═══════════════════════════════════════════════════════════════════════════════
    // VALIDATION TESTS
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🔍 VALIDATION TESTS...');

    // Get all revenue records for this order
    const { data: allRecords } = await supabase
      .from('revenue_tracking')
      .select('*')
      .eq('order_id', orderId)
      .order('recorded_at', { ascending: true });

    console.log('📊 ALL REVENUE RECORDS:', allRecords);

    if (allRecords && allRecords.length > 0) {
      const totalRecorded = allRecords.reduce((sum, record) => sum + parseFloat(record.amount), 0);
      const expectedTotal = parseFloat(testOrderData.total_amt);
      
      console.log('🧮 REVENUE VALIDATION:', {
        totalRecorded,
        expectedTotal,
        match: Math.abs(totalRecorded - expectedTotal) < 0.01
      });

      if (Math.abs(totalRecorded - expectedTotal) < 0.01) {
        console.log('✅ VALIDATION PASSED: Total recorded revenue matches order total');
      } else {
        console.log('❌ VALIDATION FAILED: Revenue mismatch');
      }
    }

    // Test revenue breakdown
    if (revenueAfterStage2.revenue_breakdown) {
      console.log('📈 REVENUE BREAKDOWN:', revenueAfterStage2.revenue_breakdown);
    }

    // ═══════════════════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════════════════
    
    console.log('\n🧹 CLEANUP: Removing test data...');
    
    // Delete revenue records
    await supabase
      .from('revenue_tracking')
      .delete()
      .eq('order_id', orderId);
    
    // Delete order
    await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);
    
    // Delete bill
    await supabase
      .from('bills')
      .delete()
      .eq('id', billId);
    
    console.log('✅ Cleanup completed');

    console.log('\n🎉 TWO-STAGE REVENUE SYSTEM TEST COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    throw error;
  }
};

// Helper function to test just the calculation without creating records
const testRevenueCalculation = async () => {
  console.log('\n🧮 TESTING REVENUE CALCULATION...');
  
  try {
    // Test today's revenue
    const todayRevenue = await SupabaseAPI.calculateProfit();
    console.log('📊 TODAY\'S REVENUE:', todayRevenue);
    
    // Test specific date
    const dateRevenue = await SupabaseAPI.calculateProfit('2025-01-09');
    console.log('📊 DATE SPECIFIC REVENUE:', dateRevenue);
    
    // Test legacy fallback
    const legacyRevenue = await SupabaseAPI.calculateProfitLegacy();
    console.log('📊 LEGACY REVENUE (for comparison):', legacyRevenue);
    
  } catch (error) {
    console.error('❌ Revenue calculation test failed:', error);
  }
};

// Export test functions
export { 
  testTwoStageRevenueSystem,
  testRevenueCalculation 
};

// If running directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testTwoStageRevenueSystem = testTwoStageRevenueSystem;
  window.testRevenueCalculation = testRevenueCalculation;
  
  console.log('🧪 Test functions available:');
  console.log('- testTwoStageRevenueSystem(): Full end-to-end test');
  console.log('- testRevenueCalculation(): Test revenue calculation only');
  console.log('');
  console.log('Usage: testTwoStageRevenueSystem()');
}
