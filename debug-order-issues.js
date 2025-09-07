import { SupabaseAPI, supabase } from './supabase.js';

// Debug script to identify order sorting and update issues
async function debugOrderIssues() {
  console.log('🔍 === DEBUGGING ORDER ISSUES ===\n');
  
  try {
    // 1. Check the highest bill numbers in the database
    console.log('📊 Checking highest bill numbers...');
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, billnumberinput2, order_date, status, payment_status')
      .order('billnumberinput2', { ascending: false })
      .limit(20);
      
    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }
    
    console.log(`📈 Found ${orders.length} orders. Top 10 by bill number:`);
    orders.slice(0, 10).forEach((order, index) => {
      console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Date: ${order.order_date}`);
    });
    
    // 2. Check if bill 8023 exists
    const bill8023 = orders.filter(order => Number(order.billnumberinput2) === 8023);
    console.log(`\n🎯 Bill 8023 found: ${bill8023.length} orders`);
    if (bill8023.length > 0) {
      bill8023.forEach((order, index) => {
        console.log(`  8023-${index + 1}: ID ${order.id}, Status: ${order.status}, Payment: ${order.payment_status}`);
      });
    } else {
      console.log('❌ Bill 8023 does NOT exist in the database!');
      console.log('🔍 Instead, the highest bill numbers are:');
      const uniqueBills = [...new Set(orders.map(o => Number(o.billnumberinput2)))].sort((a, b) => b - a);
      uniqueBills.slice(0, 10).forEach((bill, index) => {
        console.log(`  ${index + 1}. Bill: ${bill}`);
      });
    }
    
    // 3. Test updating a real order
    console.log('\n🧪 Testing order update functionality...');
    if (orders.length > 0) {
      const testOrder = orders[0];
      console.log(`📝 Testing with order ID: ${testOrder.id} (Bill: ${testOrder.billnumberinput2})`);
      
      try {
        // Test updating payment status
        const result = await SupabaseAPI.updatePaymentStatus(testOrder.id, 'paid');
        console.log('✅ Payment status update successful:', result);
        
        // Revert back to original status  
        await SupabaseAPI.updatePaymentStatus(testOrder.id, testOrder.payment_status);
        console.log('✅ Reverted payment status back to original');
        
      } catch (updateError) {
        console.error('❌ Update failed:', updateError.message);
        console.error('   Full error:', updateError);
      }
    }
    
    // 4. Check the bills table to see if there's a mismatch
    console.log('\n📋 Checking bills table...');
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, billnumberinput2, customer_name')
      .order('billnumberinput2', { ascending: false })
      .limit(10);
      
    if (billsError) {
      console.error('❌ Error fetching bills:', billsError);
    } else {
      console.log(`📈 Found ${bills.length} bills. Top 10 by bill number:`);
      bills.forEach((bill, index) => {
        console.log(`  ${index + 1}. Bill: ${bill.billnumberinput2}, ID: ${bill.id}, Customer: ${bill.customer_name}`);
      });
      
      // Check if bill 8023 exists in bills table
      const bill8023InBills = bills.filter(bill => Number(bill.billnumberinput2) === 8023);
      console.log(`\n🎯 Bill 8023 in bills table: ${bill8023InBills.length} found`);
    }
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
  
  console.log('\n🏁 === DEBUG COMPLETE ===');
}

// Run the debug if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  debugOrderIssues();
}

export default debugOrderIssues;
