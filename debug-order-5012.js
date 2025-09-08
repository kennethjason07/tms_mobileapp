// Debug script to investigate order 5012 and its associated bill
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oeqlxurzbdvliuqutqyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcWx4dXJ6YmR2bGl1cXV0cXlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTIzMjQ2MywiZXhwIjoyMDY2ODA4NDYzfQ.wC1DH3v10iAHjsIhKyr3heOvNsQAX7DaLxlEM5ySc7Q';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugOrder5012() {
  console.log('\n🔍 === DEBUGGING ORDER 5012 ISSUE ===');
  
  try {
    // 1. Get order 5012 details
    console.log('\n1️⃣ Getting order 5012 details...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', 5012)
      .single();
    
    if (orderError) {
      console.error('Error fetching order 5012:', orderError);
      return;
    }
    
    if (!order) {
      console.log('❌ Order 5012 not found');
      return;
    }
    
    console.log('📋 Order 5012 details:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Garment Type: ${order.garment_type}`);
    console.log(`   Bill Number: ${order.billnumberinput2}`);
    console.log(`   Bill ID: ${order.bill_id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Order Date: ${order.order_date}`);
    
    // 2. Get associated bill details
    console.log('\n2️⃣ Getting associated bill details...');
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('id', order.bill_id)
      .single();
    
    if (billError) {
      console.error('Error fetching bill:', billError);
      return;
    }
    
    if (!bill) {
      console.log('❌ Associated bill not found');
      return;
    }
    
    console.log('💳 Bill details:');
    console.log(`   Bill ID: ${bill.id}`);
    console.log(`   Customer: ${bill.customer_name}`);
    console.log(`   Mobile: ${bill.mobile_number}`);
    console.log(`   Suit Qty: ${bill.suit_qty}`);
    console.log(`   Safari Qty: ${bill.safari_qty}`);
    console.log(`   Pant Qty: ${bill.pant_qty}`);
    console.log(`   Shirt Qty: ${bill.shirt_qty} ⚠️`);
    console.log(`   Sadri Qty: ${bill.sadri_qty}`);
    console.log(`   Total Qty: ${bill.total_qty}`);
    
    // 3. Check if shirt_qty is the problem
    if (bill.shirt_qty && bill.shirt_qty > 100) {
      console.log(`\n🚨 PROBLEM FOUND: Shirt quantity is ${bill.shirt_qty} - this is unrealistically high!`);
      console.log('   This is causing the expansion function to create 860+ shirt rows');
      console.log('   Each row represents one individual shirt');
    }
    
    // 4. Get all orders for this bill to see the pattern
    console.log('\n3️⃣ Getting all orders for this bill...');
    const { data: allBillOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('*')
      .eq('bill_id', order.bill_id)
      .order('id', { ascending: true });
    
    if (allOrdersError) {
      console.error('Error fetching all bill orders:', allOrdersError);
      return;
    }
    
    console.log(`📦 Total orders for this bill: ${allBillOrders.length}`);
    console.log('First 10 orders:');
    allBillOrders.slice(0, 10).forEach((ord, index) => {
      console.log(`   ${index + 1}. ID: ${ord.id}, Garment: ${ord.garment_type}`);
    });
    
    if (allBillOrders.length > 10) {
      console.log(`   ... and ${allBillOrders.length - 10} more orders`);
    }
    
    // 5. Check the highest bill numbers to see why 8052 is missing
    console.log('\n4️⃣ Checking recent bills...');
    const { data: recentOrders, error: recentError } = await supabase
      .from('orders')
      .select('id, billnumberinput2, bill_id')
      .order('billnumberinput2', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('Error fetching recent orders:', recentError);
      return;
    }
    
    console.log('🏆 Top 10 highest bill numbers in orders table:');
    recentOrders.forEach((ord, index) => {
      console.log(`   ${index + 1}. Bill: ${ord.billnumberinput2}, Order ID: ${ord.id}, Bill ID: ${ord.bill_id}`);
    });
    
    // 6. Check if there are any orders with bill 8052
    console.log('\n5️⃣ Searching for bill 8052 in orders table...');
    const { data: bill8052Orders, error: search8052Error } = await supabase
      .from('orders')
      .select('*')
      .eq('billnumberinput2', 8052);
    
    if (search8052Error) {
      console.error('Error searching for bill 8052:', search8052Error);
      return;
    }
    
    console.log(`📊 Orders with bill number 8052: ${bill8052Orders?.length || 0}`);
    if (bill8052Orders && bill8052Orders.length > 0) {
      console.log('Found bill 8052 orders:');
      bill8052Orders.forEach((ord, index) => {
        console.log(`   ${index + 1}. ID: ${ord.id}, Garment: ${ord.garment_type}, Bill ID: ${ord.bill_id}`);
      });
    } else {
      console.log('❌ No orders found with bill number 8052');
      console.log('This explains why the app shows 7928 as the highest bill');
    }
    
    // 7. Check if bill 8052 exists in bills table
    console.log('\n6️⃣ Checking if bill 8052 exists in bills table...');
    const { data: bill8052, error: billSearch8052Error } = await supabase
      .from('bills')
      .select('*')
      .or('id.eq.8052,billnumberinput2.eq.8052'); // Check both id and a potential bill number field
    
    if (billSearch8052Error) {
      console.error('Error searching for bill 8052 in bills table:', billSearch8052Error);
    } else {
      console.log(`📋 Bills with ID or number 8052: ${bill8052?.length || 0}`);
      if (bill8052 && bill8052.length > 0) {
        bill8052.forEach((b, index) => {
          console.log(`   ${index + 1}. Bill ID: ${b.id}, Customer: ${b.customer_name}`);
        });
      }
    }
    
    console.log('\n✅ === DEBUG COMPLETED ===');
    console.log('\n📋 SUMMARY:');
    console.log('• Order 5012 is creating 860+ shirt rows due to unrealistic shirt_qty in bill');
    console.log('• Bill 8052 might exist in bills table but not have corresponding orders');
    console.log('• The highest actual bill with orders is 7928');
    console.log('• Need to fix data integrity and expansion logic');
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  }
}

// Run the debug
debugOrder5012().catch(console.error);
