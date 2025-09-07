// WhatsApp Redirect Test Script
// This script helps you test the WhatsApp redirect functionality

import { WhatsAppService, WhatsAppRedirectService } from './whatsappService';

// Test data to simulate order completion
const TEST_DATA = {
  customerInfo: {
    name: 'John Doe',
    mobile: '9876543210'
  },
  billId: 12345,
  orderDetails: [
    { garment_type: 'Suit', quantity: 1 },
    { garment_type: 'Shirt', quantity: 2 }
  ]
};

// Test functions
export const WhatsAppRedirectTest = {
  // Test message generation
  testMessageGeneration() {
    console.log('📝 Testing message generation...');
    
    const orderDetailsString = WhatsAppService.generateOrderDetailsString(TEST_DATA.orderDetails);
    const message = WhatsAppService.generateCompletionMessage(
      TEST_DATA.customerInfo.name,
      TEST_DATA.billId,
      orderDetailsString
    );
    
    console.log('Generated order details:', orderDetailsString);
    console.log('Generated message:', message);
    
    if (message.includes(TEST_DATA.customerInfo.name) && 
        message.includes(TEST_DATA.billId.toString()) && 
        message.includes('Suit') && 
        message.includes('Shirt')) {
      console.log('✅ Message generation successful!');
      return { success: true, message: 'Message generated correctly' };
    } else {
      console.log('❌ Message generation failed');
      return { success: false, message: 'Message generation failed' };
    }
  },

  // Test WhatsApp URL generation
  testWhatsAppUrlGeneration() {
    console.log('🔗 Testing WhatsApp URL generation...');
    
    try {
      const orderDetailsString = WhatsAppService.generateOrderDetailsString(TEST_DATA.orderDetails);
      const message = WhatsAppService.generateCompletionMessage(
        TEST_DATA.customerInfo.name,
        TEST_DATA.billId,
        orderDetailsString
      );
      
      const url = WhatsAppRedirectService.generateWhatsAppUrl(TEST_DATA.customerInfo.mobile, message);
      console.log('Generated URL:', url);
      
      if (url && url.includes('wa.me') && url.includes('919876543210')) {
        console.log('✅ URL generation successful!');
        return { success: true, url };
      } else {
        console.log('❌ URL generation failed');
        return { success: false, message: 'URL generation failed' };
      }
    } catch (error) {
      console.log('❌ URL generation error:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Test phone number formatting
  testPhoneNumberFormatting() {
    console.log('📞 Testing phone number formatting...');
    
    const testNumbers = [
      '9876543210',      // 10 digits starting with 9
      '8765432109',      // 10 digits starting with 8
      '919876543210',    // Already with country code
      '+919876543210',   // With plus and country code
      '09876543210',     // 11 digits starting with 0
    ];
    
    const results = testNumbers.map(number => {
      const url = WhatsAppRedirectService.generateWhatsAppUrl(number, 'Test message');
      return { original: number, url };
    });
    
    console.log('Phone number formatting results:', results);
    
    // Check if numbers starting with 9 get country code added
    const nineStartResult = results.find(r => r.original === '9876543210');
    const alreadyFormattedResult = results.find(r => r.original === '919876543210');
    
    if (nineStartResult?.url.includes('919876543210') && 
        alreadyFormattedResult?.url.includes('919876543210')) {
      console.log('✅ Phone number formatting successful!');
      return { success: true, results };
    } else {
      console.log('❌ Phone number formatting failed');
      return { success: false, results };
    }
  },

  // Test WhatsApp redirect (simulation)
  testWhatsAppRedirect() {
    console.log('📱 Testing WhatsApp redirect (simulation)...');
    
    try {
      const orderDetailsString = WhatsAppService.generateOrderDetailsString(TEST_DATA.orderDetails);
      const message = WhatsAppService.generateCompletionMessage(
        TEST_DATA.customerInfo.name,
        TEST_DATA.billId,
        orderDetailsString
      );
      
      // Note: This won't actually open WhatsApp in test mode, but will validate the logic
      const result = WhatsAppRedirectService.openWhatsAppWithMessage(TEST_DATA.customerInfo.mobile, message);
      
      console.log('Redirect result:', result);
      
      if (result.success) {
        console.log('✅ WhatsApp redirect logic successful!');
        return result;
      } else {
        console.log('❌ WhatsApp redirect failed:', result.message);
        return result;
      }
    } catch (error) {
      console.log('❌ WhatsApp redirect error:', error.message);
      return { success: false, message: error.message };
    }
  },

  // Test edge cases
  testEdgeCases() {
    console.log('⚠️ Testing edge cases...');
    
    const edgeCases = [
      { name: 'Empty mobile number', mobile: '', shouldFail: true },
      { name: 'Invalid mobile number', mobile: '123', shouldFail: true },
      { name: 'Empty customer name', customerInfo: { name: '', mobile: '9876543210' }, shouldFail: false },
      { name: 'Special characters in name', customerInfo: { name: 'John & Jane Doe', mobile: '9876543210' }, shouldFail: false },
      { name: 'Empty order details', orderDetails: [], shouldFail: false },
    ];
    
    const results = edgeCases.map(testCase => {
      try {
        const mobile = testCase.mobile || testCase.customerInfo?.mobile || TEST_DATA.customerInfo.mobile;
        const name = testCase.customerInfo?.name || TEST_DATA.customerInfo.name;
        const orderDetails = testCase.orderDetails || TEST_DATA.orderDetails;
        
        const orderDetailsString = WhatsAppService.generateOrderDetailsString(orderDetails);
        const message = WhatsAppService.generateCompletionMessage(name, TEST_DATA.billId, orderDetailsString);
        
        const result = WhatsAppRedirectService.openWhatsAppWithMessage(mobile, message);
        
        return {
          testCase: testCase.name,
          expected: testCase.shouldFail ? 'failure' : 'success',
          actual: result.success ? 'success' : 'failure',
          result
        };
      } catch (error) {
        return {
          testCase: testCase.name,
          expected: testCase.shouldFail ? 'failure' : 'success',
          actual: 'failure',
          result: { success: false, message: error.message }
        };
      }
    });
    
    console.log('Edge case results:', results);
    
    const passedTests = results.filter(r => 
      (r.expected === 'success' && r.actual === 'success') ||
      (r.expected === 'failure' && r.actual === 'failure')
    );
    
    console.log(`✅ Edge case tests: ${passedTests.length}/${results.length} passed`);
    
    return { 
      success: passedTests.length === results.length, 
      results,
      passed: passedTests.length,
      total: results.length
    };
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting WhatsApp Redirect tests...\n');
    
    const tests = [
      { name: 'Message Generation Test', fn: () => this.testMessageGeneration() },
      { name: 'WhatsApp URL Generation Test', fn: () => this.testWhatsAppUrlGeneration() },
      { name: 'Phone Number Formatting Test', fn: () => this.testPhoneNumberFormatting() },
      { name: 'WhatsApp Redirect Test', fn: () => this.testWhatsAppRedirect() },
      { name: 'Edge Cases Test', fn: () => this.testEdgeCases() },
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      try {
        const result = await test.fn();
        results.push({ name: test.name, success: result.success, result });
      } catch (error) {
        console.log(`❌ ${test.name} failed:`, error.message);
        results.push({ name: test.name, success: false, error: error.message });
      }
    }
    
    console.log('\n📊 Test Results:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    const passedTests = results.filter(r => r.success).length;
    const totalTests = results.length;
    
    console.log(`\n🎯 Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests passed! WhatsApp redirect functionality is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
    
    return results;
  }
};

// Manual test instructions
console.log(`
📱 WhatsApp Redirect Test Script
===============================

To test WhatsApp redirect functionality:

1. **Run the test suite:**
   import { WhatsAppRedirectTest } from './testWhatsAppRedirect';
   WhatsAppRedirectTest.runAllTests();

2. **Manual testing:**
   - Mark an order as completed in the Orders Overview
   - Check if WhatsApp opens with the pre-filled message
   - Verify the message contains correct customer info and order details

3. **Test different scenarios:**
   - Test with different mobile number formats
   - Test with special characters in customer names
   - Test with empty order details
   - Test on both mobile and web platforms

4. **Expected behavior:**
   - On mobile: WhatsApp app should open with pre-filled message
   - On web: WhatsApp Web should open in browser with pre-filled message
   - Message should be ready to send, user just needs to press send

Note: Make sure WhatsApp is installed on the device for mobile testing.
`);

export default WhatsAppRedirectTest;
