// Simple debug script - Copy and paste this into your browser console (F12)
// Run this on the Orders Overview page

console.log('🔍 DEBUGGING MOBILE ISSUE...');

// Check if supabase is available
if (typeof supabase !== 'undefined') {
  console.log('✅ Supabase found');
  
  // Test direct database queries
  (async function() {
    try {
      // Check bills table
      console.log('\n1. Checking bills table...');
      const { data: bills, error: billsError } = await supabase
        .from('bills')
        .select('id, customer_name, mobile_number')
        .limit(3);
      
      if (billsError) {
        console.error('❌ Bills error:', billsError);
      } else {
        console.log('✅ Sample bills:');
        bills.forEach(bill => {
          console.log(`  Bill ${bill.id}: ${bill.customer_name} - Mobile: ${bill.mobile_number}`);
        });
      }
      
      // Check orders table
      console.log('\n2. Checking orders table...');
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, bill_id, billnumberinput2, garment_type')
        .limit(3);
      
      if (ordersError) {
        console.error('❌ Orders error:', ordersError);
      } else {
        console.log('✅ Sample orders:');
        orders.forEach(order => {
          console.log(`  Order ${order.id}: Bill ID ${order.bill_id} - Bill# ${order.billnumberinput2}`);
        });
      }
      
      // Check relationship
      if (bills && orders) {
        console.log('\n3. Checking order-bill relationships...');
        orders.forEach(order => {
          const matchingBill = bills.find(bill => bill.id === order.bill_id);
          if (matchingBill) {
            console.log(`✅ Order ${order.id} -> Bill ${matchingBill.id} (Mobile: ${matchingBill.mobile_number})`);
          } else {
            console.log(`❌ Order ${order.id} -> No matching bill found for Bill ID ${order.bill_id}`);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Debug error:', error);
    }
  })();
  
} else {
  console.error('❌ Supabase not found in global scope');
}
