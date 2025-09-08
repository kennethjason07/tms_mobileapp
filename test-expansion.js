// Test script to verify garment expansion logic
console.log('🧪 Testing Garment Expansion Logic');

// Mock data similar to what supabase returns
const mockOrders = [
  {
    id: 5001,
    bill_id: 101,
    billnumberinput2: 8054,
    garment_type: 'Pant, Shirt', // This might exist in DB but will be overridden
    order_date: '2025-09-08',
    due_date: '2025-09-22',
    status: 'pending',
    bills: {
      id: 101,
      suit_qty: 1,
      safari_qty: 0,
      pant_qty: 2,
      shirt_qty: 3,
      sadri_qty: 0,
      customer_name: 'John Doe',
      mobile_number: '9876543210'
    }
  },
  {
    id: 5002,
    bill_id: 102, 
    billnumberinput2: 8053,
    garment_type: 'Suit',
    order_date: '2025-09-07',
    due_date: '2025-09-21',
    status: 'pending',
    bills: {
      id: 102,
      suit_qty: 2,
      safari_qty: 1,
      pant_qty: 1,
      shirt_qty: 0,
      sadri_qty: 1,
      customer_name: 'Jane Smith',
      mobile_number: '9876543211'
    }
  }
];

// Copy of the expansion function from OrdersOverviewScreen.js
const expandOrdersByBillQuantities = (orders) => {
  const expandedOrders = [];
  const processedBills = new Set();
  
  console.log('\n🛠️ === GARMENT EXPANSION STARTING ===');
  console.log(`📊 Input orders: ${orders.length}`);
  
  orders.forEach((order, orderIndex) => {
    const billId = order.bill_id;
    const bill = order.bills; // Access joined bill data
    
    console.log(`\n📝 Processing order ${orderIndex + 1}/${orders.length}:`);
    console.log(`  - Order ID: ${order.id}`);
    console.log(`  - Bill ID: ${billId}`);
    console.log(`  - Bill Number: ${order.billnumberinput2}`);
    console.log(`  - Bill data exists: ${!!bill}`);
    
    // Skip if we've already processed this bill
    if (processedBills.has(billId)) {
      console.log(`  ⚠️ Skipping - Bill ${billId} already processed`);
      return;
    }
    processedBills.add(billId);
    
    if (!bill) {
      // If no bill data, create a single row with the original garment_type
      console.log(`  🔄 No bill data - using original garment_type: ${order.garment_type}`);
      expandedOrders.push({
        ...order,
        expanded_id: order.id,
        original_id: order.id,
        garment_number: 1
      });
      return;
    }
    
    // Define garment types and their quantities from the bill
    const garmentTypes = [
      { type: 'Suit', qty: parseInt(bill.suit_qty) || 0 },
      { type: 'Safari/Jacket', qty: parseInt(bill.safari_qty) || 0 },
      { type: 'Pant', qty: parseInt(bill.pant_qty) || 0 },
      { type: 'Shirt', qty: parseInt(bill.shirt_qty) || 0 },
      { type: 'Sadri', qty: parseInt(bill.sadri_qty) || 0 }
    ];
    
    console.log(`  👕 Bill quantities: ${garmentTypes.map(g => `${g.type}(${g.qty})`).join(', ')}`);
    
    let billRowCount = 0;
    
    // Create individual rows for each garment type based on quantities
    garmentTypes.forEach(({ type, qty }) => {
      if (qty > 0) {
        console.log(`    🔄 Creating ${qty} rows for ${type}:`);
        for (let i = 1; i <= qty; i++) {
          const expandedOrder = {
            ...order,
            id: `${order.id}_${type.toLowerCase()}_${i}`, // Unique ID for expanded row
            expanded_id: `${order.id}_${type.toLowerCase()}_${i}`,
            original_id: order.id, // Keep reference to original order
            garment_type: type,
            garment_number: i, // 1, 2, 3, etc. per garment type per bill
          };
          expandedOrders.push(expandedOrder);
          billRowCount++;
          console.log(`      ✅ Row ${billRowCount}: ${type} ${i} (ID: ${expandedOrder.id})`);
        }
      }
    });
    
    console.log(`  📈 Total rows created for Bill ${billId}: ${billRowCount}`);
  });
  
  console.log(`\n✅ === EXPANSION COMPLETE ===`);
  console.log(`📈 Total expanded rows: ${expandedOrders.length}`);
  console.log(`🎯 First 10 expanded rows:`);
  expandedOrders.slice(0, 10).forEach((row, i) => {
    console.log(`  ${i + 1}. Bill ${row.billnumberinput2}: ${row.garment_type} ${row.garment_number} (ID: ${row.id})`);
  });
  
  return expandedOrders;
};

// Test the expansion
const expandedResults = expandOrdersByBillQuantities(mockOrders);

// Test sorting
console.log('\n🔄 Testing Sorting...');
const sortedResults = expandedResults.sort((a, b) => {
  const billA = Number(a.billnumberinput2) || 0;
  const billB = Number(b.billnumberinput2) || 0;
  
  if (billB !== billA) {
    return billB - billA; // Descending bill order
  }
  
  // Secondary sort by garment type for same bill
  if (a.garment_type !== b.garment_type) {
    return a.garment_type.localeCompare(b.garment_type);
  }
  
  // Tertiary sort by garment number
  return (a.garment_number || 1) - (b.garment_number || 1);
});

console.log('\n🎯 Final Sorted Results:');
sortedResults.forEach((row, i) => {
  console.log(`${i + 1}. Bill ${row.billnumberinput2}: ${row.garment_type} ${row.garment_number}`);
});

console.log('\n✅ Test Complete!');
console.log(`Expected: Each garment should have its own row with proper numbering.`);
console.log(`Result: ${sortedResults.length} total rows created from ${mockOrders.length} original orders.`);
