# Debug Customer Mobile Issue - Browser Console Test

Copy and paste this code into your browser console (F12 -> Console tab) while on the Orders Overview page:

```javascript
// Test to debug customer mobile issue
(async function debugCustomerMobile() {
  try {
    console.log('🔍 DEBUGGING CUSTOMER MOBILE ISSUE...\n');

    // Access the imported SupabaseAPI from your app
    const { SupabaseAPI } = window; // If SupabaseAPI is global
    // OR if you need to import it differently, use:
    // const { SupabaseAPI } = await import('./supabase.js');

    // Test 1: Check a few orders directly
    console.log('1. Checking orders table directly...');
    const { data: ordersTest, error: ordersError } = await supabase
      .from('orders')
      .select('id, bill_id, billnumberinput2, garment_type')
      .limit(3);
    
    if (ordersError) {
      console.error('❌ Orders error:', ordersError);
    } else {
      console.log('✅ Sample orders:', ordersTest);
    }

    // Test 2: Check bills table directly
    console.log('\n2. Checking bills table directly...');
    const { data: billsTest, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .limit(3);
    
    if (billsError) {
      console.error('❌ Bills error:', billsError);
    } else {
      console.log('✅ Sample bills:', billsTest);
      if (billsTest && billsTest.length > 0) {
        console.log('📋 Bills field names:', Object.keys(billsTest[0]));
        billsTest.forEach((bill, index) => {
          console.log(`📱 Bill ${index + 1} Mobile Fields:`, {
            id: bill.id,
            mobile_number: bill.mobile_number,
            mobile: bill.mobile,
            phone: bill.phone,
            customer_name: bill.customer_name,
            all_fields: Object.keys(bill)
          });
        });
      }
    }

    // Test 3: Check if orders have matching bill_ids
    if (ordersTest && billsTest) {
      console.log('\n3. Checking order-bill relationships...');
      ordersTest.forEach(order => {
        const matchingBill = billsTest.find(bill => bill.id === order.bill_id);
        console.log(`🔗 Order ${order.id} (Bill ID: ${order.bill_id}) -> ${matchingBill ? 'BILL FOUND' : 'NO BILL FOUND'}`);
        if (matchingBill) {
          console.log(`   📱 Bill mobile: ${matchingBill.mobile_number || 'NULL'}`);
        }
      });
    }

    // Test 4: Test the actual getOrders function (with debug output)
    console.log('\n4. Testing getOrders function (check console for debug output)...');
    const orders = await SupabaseAPI.getOrders();
    console.log(`📊 Orders returned: ${orders.length}`);
    if (orders.length > 0) {
      console.log('📋 First 3 orders mobile data:');
      orders.slice(0, 3).forEach((order, index) => {
        console.log(`  ${index + 1}. Order ${order.id}:`);
        console.log(`     customer_mobile: ${order.customer_mobile || 'NULL'}`);
        console.log(`     bill_id: ${order.bill_id}`);
        console.log(`     bills object:`, order.bills);
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
})();
```

## How to Use:

1. Open your TMS app in the browser
2. Navigate to the Orders Overview page 
3. Press F12 to open Developer Tools
4. Click on the "Console" tab
5. Copy and paste the above code
6. Press Enter to run it

## What to Look For:

1. **Bills field names**: Check what fields actually exist in your bills table
2. **Mobile number values**: See if mobile numbers are stored and in which field
3. **Order-Bill relationships**: Verify that orders have valid bill_id references
4. **Final processing**: See what the getOrders function returns

This will help identify exactly where the issue is occurring!
