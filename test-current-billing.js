// Test script to verify current billing state in Supabase
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://oeqlxurzbdvliuqutqyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWx4dXJ6YmR2bGl1cXV0cXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjQ2MywiZXhwIjoyMDY2ODA4NDYzfQ.wC1DH3v10iAHjsIhKyr3heOvNsQAX7DaLxlEM5ySc7Q';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to get highest bill number
async function getHighestBillNumber() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('billnumberinput2')
      .not('billnumberinput2', 'is', null)
      .order('billnumberinput2', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }
    
    return data ? Number(data.billnumberinput2) : 0;
  } catch (error) {
    console.error('Error getting highest bill number:', error);
    return 0; // Return 0 if no bill numbers found or error occurs
  }
}

// Helper function to get orders with basic sorting
async function getOrdersSorted() {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('billnumberinput2', { ascending: false })
      .order('id', { ascending: false })
      .limit(10); // Just get first 10 for testing
    
    if (ordersError) {
      throw ordersError;
    }
    
    return orders || [];
  } catch (error) {
    console.error('Error getting orders:', error);
    return [];
  }
}

// Helper function to search orders
async function searchOrders(billNumber) {
  try {
    const { data: ordersData, error: ordersDataError } = await supabase
      .from('orders')
      .select('*')
      .eq('billnumberinput2', billNumber)
      .order('billnumberinput2', { ascending: false })
      .order('id', { ascending: false });
    
    if (ordersDataError) throw ordersDataError;
    
    return ordersData || [];
  } catch (error) {
    console.error('Error searching orders:', error);
    return [];
  }
}

async function testCurrentBillingState() {
  console.log('\n🔍 === TESTING CURRENT BILLING STATE ===');
  
  try {
    // 1. Test getHighestBillNumber function
    console.log('\n1️⃣ Testing getHighestBillNumber function...');
    const highestBill = await getHighestBillNumber();
    console.log(`📊 Highest bill number from query: ${highestBill}`);
    console.log(`✅ Expected: 8052 (should match your observation)`);
    console.log(`🎯 Match: ${highestBill === 8052 ? 'YES ✓' : 'NO ✗'}`);
    
    // 2. Test getOrders function to see first few orders
    console.log('\n2️⃣ Testing getOrders function (first 10 orders)...');
    const allOrders = await getOrdersSorted();
    console.log(`📊 Total orders fetched: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      console.log('\n🏆 TOP 5 ORDERS FROM DATABASE:');
      allOrders.slice(0, 5).forEach((order, index) => {
        const isBill8052 = Number(order.billnumberinput2) === 8052;
        const isId1159 = Number(order.id) === 1159;
        const icon = isBill8052 ? '🎯' : '📋';
        console.log(`  ${icon} ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}${isBill8052 ? ' ← BILL 8052!' : ''}${isId1159 ? ' (ID 1159)' : ''}`);
      });
      
      // Check if bill 8052 is at the top
      const firstOrder = allOrders[0];
      const firstBillNumber = Number(firstOrder.billnumberinput2);
      const firstId = Number(firstOrder.id);
      
      console.log(`\n🎯 VERIFICATION:`);
      console.log(`   First order bill number: ${firstBillNumber}`);
      console.log(`   First order ID: ${firstId}`);
      console.log(`   Is bill 8052 first? ${firstBillNumber === 8052 ? 'YES ✓' : 'NO ✗'}`);
      console.log(`   Is ID 1159 first? ${firstId === 1159 ? 'YES ✓' : 'NO ✗'}`);
      
      if (firstBillNumber !== 8052) {
        console.log(`\n⚠️  ISSUE FOUND:`);
        console.log(`   Expected bill 8052 to be first, but got ${firstBillNumber}`);
        console.log(`   This suggests either:`);
        console.log(`   • Bill 8052 doesn't exist in the database`);
        console.log(`   • There's a newer bill number > 8052`);
        console.log(`   • The sorting logic needs adjustment`);
      }
    }
    
    // 3. Test search for bill 8052
    console.log('\n3️⃣ Testing search for bill 8052...');
    const searchResults = await searchOrders('8052');
    console.log(`📊 Search results for "8052": ${searchResults.length} orders`);
    
    if (searchResults.length > 0) {
      console.log('🔍 Search results:');
      searchResults.forEach((order, index) => {
        console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}`);
      });
    } else {
      console.log('❌ No search results found for bill 8052');
      console.log('🔍 This might indicate the bill doesn\'t exist or there\'s a search issue');
    }
    
    // 4. Raw database query to double-check
    console.log('\n4️⃣ Raw database verification...');
    console.log('This would be equivalent to running: SELECT MAX(billnumberinput2) FROM orders;');
    console.log(`Result: ${highestBill}`);
    
    console.log('\n✅ === TESTING COMPLETED ===');
    console.log('\nNEXT STEPS:');
    console.log('• If bill 8052 is not showing as highest, check if it exists in database');
    console.log('• If search returns no results, verify the bill number in Supabase directly');
    console.log('• If sorting is wrong, the issue is in our sort logic');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    console.error('This might indicate a connection or query issue');
  }
}

// Run the test
testCurrentBillingState().catch(console.error);
