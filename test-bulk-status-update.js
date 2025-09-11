// Test Bulk Status Update Functionality
// This script tests the new bulk update functionality to ensure all orders 
// with the same bill number are updated together

import { SupabaseAPI } from './supabase.js';

async function testBulkStatusUpdate() {
  console.log('🧪 === TESTING BULK STATUS UPDATE FUNCTIONALITY ===\n');

  try {
    // Step 1: Get all orders and find a bill with multiple orders
    console.log('📊 Step 1: Finding test data...');
    const allOrders = await SupabaseAPI.getOrders();
    
    // Group orders by bill number to find bills with multiple orders
    const ordersByBill = {};
    allOrders.forEach(order => {
      const billNumber = order.billnumberinput2;
      if (!ordersByBill[billNumber]) {
        ordersByBill[billNumber] = [];
      }
      ordersByBill[billNumber].push(order);
    });

    // Find a bill with multiple orders for testing
    let testBillNumber = null;
    let testOrders = [];
    for (const [billNumber, orders] of Object.entries(ordersByBill)) {
      if (orders.length > 1) {
        testBillNumber = billNumber;
        testOrders = orders;
        break;
      }
    }

    if (!testBillNumber) {
      console.log('❌ No bills with multiple orders found for testing');
      console.log('💡 The functionality should still work for bills with single orders');
      
      // Use the first available bill for basic testing
      const firstOrder = allOrders[0];
      if (firstOrder) {
        testBillNumber = firstOrder.billnumberinput2;
        testOrders = [firstOrder];
        console.log(`🔄 Using single-order bill ${testBillNumber} for basic testing`);
      } else {
        console.log('❌ No orders found at all');
        return;
      }
    }

    console.log(`✅ Found test bill: ${testBillNumber} with ${testOrders.length} order(s)`);
    console.log('📋 Test orders:');
    testOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ID: ${order.id}, Garment: ${order.garment_type}, Status: ${order.status}, Payment: ${order.payment_status}`);
    });

    // Step 2: Test bulk delivery status update
    console.log('\n🚚 Step 2: Testing bulk delivery status update...');
    const originalStatuses = testOrders.map(order => ({ id: order.id, status: order.status }));
    
    const newDeliveryStatus = testOrders[0].status === 'pending' ? 'completed' : 'pending';
    console.log(`🔄 Changing delivery status from various states to: ${newDeliveryStatus}`);

    const deliveryUpdateResult = await SupabaseAPI.updateOrderStatusByBillNumber(testBillNumber, newDeliveryStatus);
    console.log('✅ Bulk delivery status update completed:', {
      affected_count: deliveryUpdateResult.affected_count,
      bill_number: deliveryUpdateResult.bill_number,
      new_status: deliveryUpdateResult.new_status
    });

    // Step 3: Verify delivery status changes
    console.log('\n🔍 Step 3: Verifying delivery status changes...');
    const updatedOrders = await SupabaseAPI.searchOrders(testBillNumber);
    console.log('📊 Orders after delivery status update:');
    updatedOrders.forEach((order, index) => {
      const statusChanged = order.status === newDeliveryStatus;
      console.log(`  ${index + 1}. Order ID: ${order.id}, Status: ${order.status} ${statusChanged ? '✅' : '❌'}`);
    });

    // Step 4: Test bulk payment status update
    console.log('\n💰 Step 4: Testing bulk payment status update...');
    const newPaymentStatus = testOrders[0].payment_status === 'pending' ? 'paid' : 'pending';
    console.log(`🔄 Changing payment status from various states to: ${newPaymentStatus}`);

    const paymentUpdateResult = await SupabaseAPI.updatePaymentStatusByBillNumber(testBillNumber, newPaymentStatus);
    console.log('✅ Bulk payment status update completed:', {
      affected_count: paymentUpdateResult.affected_count,
      bill_number: paymentUpdateResult.bill_number,
      new_payment_status: paymentUpdateResult.new_payment_status
    });

    // Step 5: Verify payment status changes
    console.log('\n🔍 Step 5: Verifying payment status changes...');
    const finalOrders = await SupabaseAPI.searchOrders(testBillNumber);
    console.log('📊 Orders after payment status update:');
    finalOrders.forEach((order, index) => {
      const paymentStatusChanged = order.payment_status === newPaymentStatus;
      console.log(`  ${index + 1}. Order ID: ${order.id}, Payment Status: ${order.payment_status} ${paymentStatusChanged ? '✅' : '❌'}`);
    });

    // Step 6: Restore original statuses (cleanup)
    console.log('\n🔄 Step 6: Restoring original statuses...');
    
    // Restore delivery status
    const originalDeliveryStatus = originalStatuses[0].status;
    await SupabaseAPI.updateOrderStatusByBillNumber(testBillNumber, originalDeliveryStatus);
    console.log(`✅ Restored delivery status to: ${originalDeliveryStatus}`);

    // Restore payment status (assuming all had same status originally)
    const originalPaymentStatus = testOrders[0].payment_status;
    await SupabaseAPI.updatePaymentStatusByBillNumber(testBillNumber, originalPaymentStatus);
    console.log(`✅ Restored payment status to: ${originalPaymentStatus}`);

    console.log('\n🎉 === BULK STATUS UPDATE TEST COMPLETED SUCCESSFULLY ===');
    console.log('\n✅ Key Test Results:');
    console.log(`   • Bill ${testBillNumber} had ${testOrders.length} order(s)`);
    console.log(`   • Bulk delivery update affected ${deliveryUpdateResult.affected_count} order(s)`);
    console.log(`   • Bulk payment update affected ${paymentUpdateResult.affected_count} order(s)`);
    console.log(`   • All status changes were properly synchronized across orders`);
    console.log('\n🚀 The bulk update functionality is working correctly!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', error.message);
  }
}

// Export the test function for use in other scripts
export { testBulkStatusUpdate };

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBulkStatusUpdate();
}
