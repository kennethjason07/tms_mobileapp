// Demo of the new garment numbering system for OrdersOverviewScreen.js

// Mock data similar to what your database has
const mockOrders = [
    { id: 5925, bill_id: 101, billnumberinput2: 8052, garment_type: 'Pant', status: 'pending' },
    { id: 5924, bill_id: 102, billnumberinput2: 8051, garment_type: 'Pant', status: 'pending' },
    { id: 5923, bill_id: 102, billnumberinput2: 8051, garment_type: 'Shirt', status: 'pending' },
    { id: 5922, bill_id: 103, billnumberinput2: 8050, garment_type: 'Pant', status: 'pending' },
    { id: 5921, bill_id: 103, billnumberinput2: 8050, garment_type: 'Pant', status: 'pending' },
    { id: 5920, bill_id: 103, billnumberinput2: 8050, garment_type: 'Shirt', status: 'pending' },
];

console.log('🎯 GARMENT NUMBERING DEMO');
console.log('========================');

// Function that matches the logic in OrdersOverviewScreen.js
function calculateGarmentDisplay(order, allOrders) {
    const displayGarmentType = order.garment_type || 'N/A';
    
    // Find all orders with the same bill_id and garment type
    const sameTypeOrdersInBill = allOrders.filter(o => 
        o.bill_id === order.bill_id && 
        (o.garment_type?.toLowerCase()?.trim() === order.garment_type?.toLowerCase()?.trim())
    );
    
    // Sort same-type orders by ID to ensure consistent numbering
    sameTypeOrdersInBill.sort((a, b) => (a.id || 0) - (b.id || 0));
    
    // Find the index of current order within orders of same type in the same bill
    const orderIndex = sameTypeOrdersInBill.findIndex(o => o.id === order.id);
    const garmentNumber = orderIndex + 1;
    
    // Only add number if there are multiple garments of the same type in the bill
    const garmentDisplay = sameTypeOrdersInBill.length > 1 
        ? `${displayGarmentType} ${garmentNumber}` 
        : displayGarmentType;
    
    return {
        display: garmentDisplay,
        sameTypeCount: sameTypeOrdersInBill.length,
        garmentNumber: garmentNumber
    };
}

// Process each order and show the result
mockOrders.forEach((order, index) => {
    const result = calculateGarmentDisplay(order, mockOrders);
    
    console.log(`\n${index + 1}. Order ID: ${order.id}`);
    console.log(`   Bill Number: ${order.billnumberinput2}`);
    console.log(`   Original Garment Type: "${order.garment_type}"`);
    console.log(`   NEW Display: "${result.display}"`);
    console.log(`   Same type in bill: ${result.sameTypeCount}`);
    console.log(`   Garment number: ${result.garmentNumber}`);
});

console.log('\n📋 SUMMARY OF WHAT YOU\'LL SEE:');
console.log('===============================');
console.log('Bill 8052: "Pant" (only 1 pant, no number needed)');
console.log('Bill 8051: "Pant" (only 1 pant, no number needed)');
console.log('Bill 8051: "Shirt" (only 1 shirt, no number needed)');
console.log('Bill 8050: "Pant 1" (first pant of 2)');
console.log('Bill 8050: "Pant 2" (second pant of 2)');
console.log('Bill 8050: "Shirt" (only 1 shirt, no number needed)');

console.log('\n✅ BENEFITS:');
console.log('- Each garment gets its own row');
console.log('- Workers can be assigned to specific garments (Pant 1, Pant 2, etc.)');
console.log('- Numbers only appear when there are multiple of the same type');
console.log('- Bill numbers remain the same for all items in a bill');
console.log('- All calculations (daily profit, etc.) remain unchanged');
