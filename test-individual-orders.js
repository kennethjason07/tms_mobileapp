// Test script to verify individual garment order creation
console.log('🧪 Testing Individual Garment Order Creation');

// Simulate the createIndividualGarmentOrders function
const createIndividualGarmentOrders = (billId, orderNumber, todayStr, itemizedBill, billData, totals) => {
  const orders = [];
  
  // Define garment types and their quantities
  const garmentTypes = [
    { type: 'Suit', qty: parseInt(itemizedBill.suit_qty) || 0 },
    { type: 'Safari/Jacket', qty: parseInt(itemizedBill.safari_qty) || 0 },
    { type: 'Pant', qty: parseInt(itemizedBill.pant_qty) || 0 },
    { type: 'Shirt', qty: parseInt(itemizedBill.shirt_qty) || 0 },
    { type: 'Sadri', qty: parseInt(itemizedBill.sadri_qty) || 0 }
  ];
  
  console.log('📊 Garment quantities:', garmentTypes);
  
  // Create individual order for each garment instance
  garmentTypes.forEach(({ type, qty }) => {
    for (let i = 0; i < qty; i++) {
      const orderData = {
        bill_id: billId,
        billnumberinput2: orderNumber ? orderNumber.toString() : null,
        garment_type: type, // Individual garment type (not combined)
        order_date: todayStr,
        due_date: billData.due_date,
        total_amt: parseFloat(totals.total_amt),
        payment_amount: parseFloat(billData.payment_amount) || 0,
        payment_status: billData.payment_status,
        payment_mode: billData.payment_mode,
        status: 'pending',
        Work_pay: null,
      };
      
      orders.push(orderData);
      console.log(`  ✅ Created order ${orders.length}: ${type} (Bill ID: ${billId})`);
    }
  });
  
  return orders;
};

// Test Case 1: 2 Shirts, 1 Pant
console.log('\n🧪 Test Case 1: 2 Shirts, 1 Pant');
const testBill1 = {
  suit_qty: '0',
  safari_qty: '0', 
  pant_qty: '1',
  shirt_qty: '2',
  sadri_qty: '0'
};

const testBillData1 = {
  due_date: '2025-01-15',
  payment_status: 'pending',
  payment_mode: 'Cash',
  payment_amount: '0'
};

const testTotals1 = { total_amt: '1500' };

const result1 = createIndividualGarmentOrders(123, '8062', '2025-01-08', testBill1, testBillData1, testTotals1);
console.log(`📈 Expected: 3 orders (1 Pant + 2 Shirts), Got: ${result1.length} orders`);
console.log('📋 Orders created:');
result1.forEach((order, i) => {
  console.log(`  ${i + 1}. ID=${order.bill_id}, Bill=${order.billnumberinput2}, Garment="${order.garment_type}"`);
});

// Test Case 2: 3 Shirts only
console.log('\n🧪 Test Case 2: 3 Shirts only');
const testBill2 = {
  suit_qty: '0',
  safari_qty: '0',
  pant_qty: '0', 
  shirt_qty: '3',
  sadri_qty: '0'
};

const result2 = createIndividualGarmentOrders(124, '8063', '2025-01-08', testBill2, testBillData1, testTotals1);
console.log(`📈 Expected: 3 orders (3 Shirts), Got: ${result2.length} orders`);
console.log('📋 Orders created:');
result2.forEach((order, i) => {
  console.log(`  ${i + 1}. ID=${order.bill_id}, Bill=${order.billnumberinput2}, Garment="${order.garment_type}"`);
});

// Test Case 3: Mixed garments - 1 Suit, 2 Pants, 2 Shirts
console.log('\n🧪 Test Case 3: Mixed garments - 1 Suit, 2 Pants, 2 Shirts');
const testBill3 = {
  suit_qty: '1',
  safari_qty: '0',
  pant_qty: '2',
  shirt_qty: '2', 
  sadri_qty: '0'
};

const result3 = createIndividualGarmentOrders(125, '8064', '2025-01-08', testBill3, testBillData1, testTotals1);
console.log(`📈 Expected: 5 orders (1 Suit + 2 Pants + 2 Shirts), Got: ${result3.length} orders`);
console.log('📋 Orders created:');
result3.forEach((order, i) => {
  console.log(`  ${i + 1}. ID=${order.bill_id}, Bill=${order.billnumberinput2}, Garment="${order.garment_type}"`);
});

console.log('\n✅ Test completed! The logic should create individual database rows for each garment.');
console.log('🎯 Key points:');
console.log('  - Each garment gets its own row in the orders table');
console.log('  - All orders from same bill have same bill_id');
console.log('  - garment_type contains only one garment (no commas)');
console.log('  - Multiple orders can have same billnumberinput2 (bill number)');
