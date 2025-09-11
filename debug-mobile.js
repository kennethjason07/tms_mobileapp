// Debug script to check customer mobile issue
import { SupabaseAPI } from './supabase.js';

const debugCustomerMobile = async () => {
  try {
    console.log('🔍 DEBUGGING CUSTOMER MOBILE ISSUE...\n');

    // Test 1: Check orders table structure
    console.log('1. Checking orders table...');
    const { data: ordersTest, error: ordersError } = await supabase
      .from('orders')
      .select('id, bill_id, billnumberinput2, garment_type')
      .limit(3);
    
    if (ordersError) {
      console.error('Orders error:', ordersError);
    } else {
      console.log('Sample orders:', ordersTest);
    }

    // Test 2: Check bills table structure
    console.log('\n2. Checking bills table...');
    const { data: billsTest, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .limit(3);
    
    if (billsError) {
      console.error('Bills error:', billsError);
    } else {
      console.log('Sample bills:', billsTest);
      console.log('Bills field names:', billsTest[0] ? Object.keys(billsTest[0]) : 'No bills found');
    }

    // Test 3: Test the actual getOrders function
    console.log('\n3. Testing getOrders function...');
    const orders = await SupabaseAPI.getOrders();
    console.log(`Orders returned: ${orders.length}`);
    if (orders.length > 0) {
      console.log('First order customer_mobile:', orders[0].customer_mobile);
      console.log('First order bill_id:', orders[0].bill_id);
      console.log('First order bills object:', orders[0].bills);
    }

  } catch (error) {
    console.error('Debug error:', error);
  }
};

// Run the debug
debugCustomerMobile();
