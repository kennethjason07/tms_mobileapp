import { SupabaseAPI } from './supabase.js';

async function testSorting() {
  try {
    console.log('🔍 Checking bill number sorting issue...');
    
    const orders = await SupabaseAPI.getOrders();
    console.log('✅ Orders loaded:', orders?.length || 0);
    
    if (orders && orders.length > 0) {
      console.log('\n📊 First 10 orders with bill numbers:');
      orders.slice(0, 10).forEach((order, index) => {
        console.log(`  ${index + 1}. Bill: ${order.billnumberinput2} (Type: ${typeof order.billnumberinput2}), ID: ${order.id}`);
      });
      
      // Check unique bill numbers and their types
      const billNumbers = orders.slice(0, 20).map(o => ({
        bill: o.billnumberinput2,
        type: typeof o.billnumberinput2,
        asNumber: Number(o.billnumberinput2)
      }));
      
      console.log('\n🔢 Bill number analysis:');
      billNumbers.forEach((item, index) => {
        console.log(`  ${index + 1}. Original: ${item.bill} (${item.type}) -> Number: ${item.asNumber}`);
      });
      
      // Test sorting manually
      const testSort = orders.slice(0, 20).sort((a, b) => {
        const billA = Number(a.billnumberinput2) || 0;
        const billB = Number(b.billnumberinput2) || 0;
        return billB - billA; // Descending
      });
      
      console.log('\n📈 After manual sorting (first 5):');
      testSort.slice(0, 5).forEach((order, index) => {
        console.log(`  ${index + 1}. Bill: ${order.billnumberinput2} -> ${Number(order.billnumberinput2)}`);
      });
      
      // Check what's the highest bill number
      const allBillNumbers = [...new Set(orders.map(o => Number(o.billnumberinput2)).filter(n => n > 0))].sort((a, b) => b - a);
      console.log('\n🏆 Top 10 bill numbers in database:');
      allBillNumbers.slice(0, 10).forEach((bill, index) => {
        console.log(`  ${index + 1}. ${bill}`);
      });
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSorting();
