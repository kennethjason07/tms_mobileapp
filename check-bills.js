// Simple diagnostic script to check actual bill numbers in the database
// This will help us understand why bill 7923 appears at the top instead of 8023

import { supabase } from './supabase.js';

async function checkBills() {
  console.log('🔍 Checking actual bills in database...\n');
  
  try {
    // Get top 20 orders by bill number
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, billnumberinput2, order_date, status, payment_status, garment_type')
      .order('billnumberinput2', { ascending: false })
      .limit(20);
      
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    console.log(`📊 Found ${orders.length} orders. Top 20 by bill number:`);
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}`);
    });
    
    // Check unique bill numbers
    const uniqueBills = [...new Set(orders.map(o => Number(o.billnumberinput2)))]
      .filter(num => num > 0)
      .sort((a, b) => b - a);
      
    console.log(`\n🔢 Unique bill numbers (top 10):`);
    uniqueBills.slice(0, 10).forEach((bill, index) => {
      console.log(`${index + 1}. ${bill}`);
    });
    
    // Specifically check for bill 8023
    const bill8023Count = orders.filter(o => Number(o.billnumberinput2) === 8023).length;
    console.log(`\n🎯 Bill 8023 exists: ${bill8023Count > 0 ? 'YES' : 'NO'} (${bill8023Count} orders)`);
    
    // Check what the actual highest bill is
    if (uniqueBills.length > 0) {
      console.log(`\n🏆 Highest bill number in database: ${uniqueBills[0]}`);
      
      if (uniqueBills[0] !== 8023) {
        console.log(`⚠️  ISSUE FOUND: Expected bill 8023 to be highest, but found ${uniqueBills[0]}`);
        console.log(`💡 This explains why bill 7923 might appear at the top instead of 8023`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking bills:', error);
  }
}

export default checkBills;

// If running directly, execute the function
if (typeof window === 'undefined') {
  checkBills();
}
