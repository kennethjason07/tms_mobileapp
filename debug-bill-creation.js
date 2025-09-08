// Debug script to check bill creation logic
console.log('🔍 Debug: Bill Creation Logic Check');

// Check if there are any other places where orders might be created
const fs = require('fs');
const path = require('path');

// Read the NewBillScreen.js file to check current implementation
const newBillScreenPath = path.join(__dirname, 'NewBillScreen.js');
const content = fs.readFileSync(newBillScreenPath, 'utf8');

console.log('📄 Checking NewBillScreen.js for order creation patterns...\n');

// Check for any calls to the old getGarmentTypes function in order creation
if (content.includes('garment_type: getGarmentTypes()')) {
  console.log('❌ FOUND PROBLEM: Still using getGarmentTypes() in order creation!');
  console.log('🔧 This should have been replaced with individual order creation.');
} else {
  console.log('✅ Good: Not using getGarmentTypes() in order creation');
}

// Check for individual order creation logic
if (content.includes('createIndividualGarmentOrders')) {
  console.log('✅ Good: Using createIndividualGarmentOrders function');
} else {
  console.log('❌ PROBLEM: Missing createIndividualGarmentOrders function');
}

// Check for the loop that creates individual orders
if (content.includes('for (let i = 0; i < qty; i++)')) {
  console.log('✅ Good: Found loop to create individual orders per quantity');
} else {
  console.log('❌ PROBLEM: Missing loop to create individual orders');
}

// Check for individual garment_type assignment
if (content.includes('garment_type: type,')) {
  console.log('✅ Good: Found individual garment_type assignment');
} else {
  console.log('❌ PROBLEM: Missing individual garment_type assignment');
}

console.log('\n📋 Debugging steps:');
console.log('1. Make sure to RESTART/RELOAD the React Native app after code changes');
console.log('2. Check console logs when creating a bill to see if individual orders are being created');
console.log('3. Verify the SupabaseAPI.createOrder is being called multiple times (once per garment)');
console.log('4. Check database directly after creating a test bill');

console.log('\n🧪 Test suggestion:');
console.log('Create a bill with: 2 Shirts, 1 Pant');
console.log('Expected result: 3 separate rows in orders table');
console.log('- Row 1: garment_type = "Shirt"');
console.log('- Row 2: garment_type = "Shirt"'); 
console.log('- Row 3: garment_type = "Pant"');
console.log('NOT: garment_type = "Shirt, Pant"');
