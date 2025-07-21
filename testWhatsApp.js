// WhatsApp API Test Script
// This script helps you test the WhatsApp integration without using the full app

import { WhatsAppService, WhatsAppConfig } from './whatsappService';

// Test configuration
const TEST_CONFIG = {
  phoneNumberId: 'YOUR_PHONE_NUMBER_ID', // Replace with your actual Phone Number ID
  token: 'YOUR_ACCESS_TOKEN', // Replace with your actual Access Token
  testPhoneNumber: '919876543210', // Replace with a test phone number (with country code)
};

// Test functions
export const WhatsAppTest = {
  // Test the API connection
  async testConnection() {
    console.log('🔍 Testing WhatsApp API connection...');
    
    try {
      WhatsAppConfig.setCredentials(TEST_CONFIG.phoneNumberId, TEST_CONFIG.token);
      const result = await WhatsAppConfig.testConnection();
      
      if (result.success) {
        console.log('✅ Connection successful!');
        return true;
      } else {
        console.log('❌ Connection failed:', result.message);
        return false;
      }
    } catch (error) {
      console.log('❌ Connection error:', error.message);
      return false;
    }
  },

  // Test sending a message
  async testSendMessage() {
    console.log('📤 Testing message sending...');
    
    try {
      const message = WhatsAppService.generateCompletionMessage(
        'Test Customer',
        '12345',
        '• Suit: 1 piece(s)\n• Shirt: 2 piece(s)'
      );
      
      const result = await WhatsAppService.sendWhatsAppMessage(
        TEST_CONFIG.testPhoneNumber,
        message
      );
      
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', result.messages?.[0]?.id);
      return true;
    } catch (error) {
      console.log('❌ Message sending failed:', error.message);
      return false;
    }
  },

  // Test customer info extraction
  testCustomerInfoExtraction() {
    console.log('👤 Testing customer info extraction...');
    
    const mockBill = {
      customer_name: 'John Doe',
      mobile_number: '9876543210'
    };
    
    const customerInfo = WhatsAppService.getCustomerInfoFromBill(mockBill);
    console.log('Customer Info:', customerInfo);
    
    if (customerInfo.name && customerInfo.mobile) {
      console.log('✅ Customer info extraction successful!');
      return true;
    } else {
      console.log('❌ Customer info extraction failed');
      return false;
    }
  },

  // Test order completion check
  testOrderCompletionCheck() {
    console.log('✅ Testing order completion check...');
    
    const mockOrders = [
      { id: 1, bill_id: 1, status: 'completed' },
      { id: 2, bill_id: 1, status: 'completed' },
      { id: 3, bill_id: 1, status: 'pending' }
    ];
    
    const allCompleted = mockOrders.every(order => 
      order.status?.toLowerCase() === 'completed'
    );
    
    console.log('All orders completed:', allCompleted);
    return !allCompleted; // Should be false since one is pending
  },

  // Test message generation
  testMessageGeneration() {
    console.log('📝 Testing message generation...');
    
    const message = WhatsAppService.generateCompletionMessage(
      'John Doe',
      '12345',
      '• Suit: 1 piece(s)\n• Shirt: 2 piece(s)'
    );
    
    console.log('Generated message:');
    console.log(message);
    
    if (message.includes('John Doe') && message.includes('12345')) {
      console.log('✅ Message generation successful!');
      return true;
    } else {
      console.log('❌ Message generation failed');
      return false;
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting WhatsApp API tests...\n');
    
    const tests = [
      { name: 'Connection Test', fn: () => this.testConnection() },
      { name: 'Customer Info Test', fn: () => this.testCustomerInfoExtraction() },
      { name: 'Order Completion Test', fn: () => this.testOrderCompletionCheck() },
      { name: 'Message Generation Test', fn: () => this.testMessageGeneration() },
      { name: 'Message Sending Test', fn: () => this.testSendMessage() }
    ];
    
    const results = [];
    
    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      try {
        const result = await test.fn();
        results.push({ name: test.name, success: result });
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
      console.log('🎉 All tests passed! WhatsApp integration is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check your configuration.');
    }
    
    return results;
  }
};

// Usage instructions
console.log(`
📱 WhatsApp API Test Script
============================

To use this test script:

1. Update the TEST_CONFIG object with your actual credentials:
   - phoneNumberId: Your Meta Phone Number ID
   - token: Your Meta Access Token
   - testPhoneNumber: A phone number to test with (include country code)

2. Run the tests:
   import { WhatsAppTest } from './testWhatsApp';
   WhatsAppTest.runAllTests();

3. Check the console output for results.

Note: Make sure you have:
- Valid Meta Developer account
- WhatsApp Business API access
- Proper API credentials
- Test phone number with WhatsApp
`);

export default WhatsAppTest; 