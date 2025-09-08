// Test script to verify garment display formatting
// This simulates how the garment display logic works

function testGarmentDisplay() {
  console.log('🧪 Testing Garment Display Format...\n');
  
  // Simulate some test orders with garment data
  const testOrders = [
    {
      id: 1001,
      billnumberinput2: 8023,
      expanded_garment_type: 'Shirt',
      garment_type: 'Shirt',
      garment_index: 0
    },
    {
      id: 1001,
      billnumberinput2: 8023,
      expanded_garment_type: 'Shirt',
      garment_type: 'Shirt',
      garment_index: 1
    },
    {
      id: 1002,
      billnumberinput2: 8023,
      expanded_garment_type: 'Pant',
      garment_type: 'Pant',
      garment_index: 0
    },
    {
      id: 1002,
      billnumberinput2: 8023,
      expanded_garment_type: 'Pant',
      garment_type: 'Pant',
      garment_index: 1
    },
    {
      id: 1003,
      billnumberinput2: 8022,
      expanded_garment_type: 'Suit',
      garment_type: 'Suit',
      garment_index: 0
    }
  ];
  
  console.log('📋 Test Orders:');
  testOrders.forEach((order, index) => {
    // Simulate the display logic from OrdersOverviewScreen.js
    const displayGarmentType = order.expanded_garment_type || order.garment_type || 'N/A';
    const hasValidIndex = typeof order.garment_index === 'number' && order.garment_index >= 0;
    
    // OLD FORMAT: displayGarmentType + ' (' + (order.garment_index + 1) + ')'
    const oldFormat = hasValidIndex ? displayGarmentType + ' (' + (order.garment_index + 1) + ')' : displayGarmentType;
    
    // NEW FORMAT: displayGarmentType + ' ' + (order.garment_index + 1)
    const newFormat = hasValidIndex ? displayGarmentType + ' ' + (order.garment_index + 1) : displayGarmentType;
    
    console.log(`  ${index + 1}. Bill ${order.billnumberinput2}:`);
    console.log(`     OLD: "${oldFormat}"`);
    console.log(`     NEW: "${newFormat}" ✅`);
    console.log('');
  });
  
  console.log('✅ Expected Results:');
  console.log('   - Shirt 1, Shirt 2 (instead of Shirt (1), Shirt (2))');
  console.log('   - Pant 1, Pant 2 (instead of Pant (1), Pant (2))');
  console.log('   - Suit 1 (instead of Suit (1))');
  console.log('\n🎯 The fix changes parentheses format to space format for better readability');
}

// Run the test
testGarmentDisplay();

export default testGarmentDisplay;
