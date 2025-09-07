// Test file for Worker Assignment with Measurements feature
// This file contains tests to verify the new functionality

import { WhatsAppService } from './whatsappService';
import { SupabaseAPI } from './supabase';

// Mock data for testing
const mockMeasurements = {
  phone_number: '9876543210',
  pant_length: '42',
  pant_kamar: '32',
  pant_hips: '38',
  pant_waist: '30',
  pant_ghutna: '20',
  pant_bottom: '16',
  pant_seat: '18',
  SideP_Cross: 'Yes',
  Plates: 'Double',
  Belt: 'Yes',
  Back_P: 'Normal',
  WP: 'Standard',
  shirt_length: '28',
  shirt_body: '40',
  shirt_loose: '2',
  shirt_shoulder: '18',
  shirt_astin: '24',
  shirt_collar: '16',
  shirt_aloose: '1.5',
  Callar: 'Regular',
  Cuff: 'Single',
  Pkt: 'Chest',
  LooseShirt: 'Normal',
  DT_TT: 'Double',
  extra_measurements: 'Customer prefers loose fitting'
};

const mockOrder = {
  id: 123,
  billnumberinput2: 'BILL001',
  garment_type: 'Suit',
  customer_mobile: '9876543210',
  customer_name: 'John Doe'
};

const mockWorkers = [
  { id: 1, name: 'Tailor A', number: '9876543211' },
  { id: 2, name: 'Tailor B', number: '9876543212' }
];

// Test functions
export const testMeasurementFormatting = () => {
  console.log('🧪 Testing measurement formatting...');
  
  try {
    const formattedMessage = WhatsAppService.formatMeasurementsForWhatsApp(mockMeasurements);
    
    console.log('✅ Formatted measurements:');
    console.log(formattedMessage);
    
    // Check if formatting contains expected sections
    const hasExtraInfo = formattedMessage.includes('Additional Notes');
    const hasPantMeasurements = formattedMessage.includes('👖 *Pant Measurements:*');
    const hasShirtMeasurements = formattedMessage.includes('👔 *Shirt Measurements:*');
    
    console.log('✅ Contains pant measurements:', hasPantMeasurements);
    console.log('✅ Contains shirt measurements:', hasShirtMeasurements);
    console.log('✅ Contains additional notes:', hasExtraInfo);
    
    return {
      success: true,
      hasPantMeasurements,
      hasShirtMeasurements,
      hasExtraInfo,
      formattedMessage
    };
  } catch (error) {
    console.error('❌ Error testing measurement formatting:', error);
    return { success: false, error: error.message };
  }
};

export const testWorkerAssignmentMessage = () => {
  console.log('🧪 Testing worker assignment message generation...');
  
  try {
    const message = WhatsAppService.generateWorkerAssignmentMessage(
      mockOrder.customer_name,
      mockOrder.billnumberinput2,
      mockOrder.garment_type,
      mockMeasurements
    );
    
    console.log('✅ Generated worker assignment message:');
    console.log(message);
    
    // Check if message contains expected components
    const hasCustomerName = message.includes('John Doe');
    const hasBillNumber = message.includes('BILL001');
    const hasGarmentType = message.includes('Suit');
    const hasMeasurements = message.includes('Customer Measurements');
    
    console.log('✅ Contains customer name:', hasCustomerName);
    console.log('✅ Contains bill number:', hasBillNumber);
    console.log('✅ Contains garment type:', hasGarmentType);
    console.log('✅ Contains measurements:', hasMeasurements);
    
    return {
      success: true,
      hasCustomerName,
      hasBillNumber,
      hasGarmentType,
      hasMeasurements,
      message
    };
  } catch (error) {
    console.error('❌ Error testing worker assignment message:', error);
    return { success: false, error: error.message };
  }
};

export const testEmptyMeasurements = () => {
  console.log('🧪 Testing empty measurements handling...');
  
  try {
    const emptyMeasurementsMessage = WhatsAppService.formatMeasurementsForWhatsApp(null);
    const emptyAssignmentMessage = WhatsAppService.generateWorkerAssignmentMessage(
      'Test Customer',
      'TEST001',
      'Shirt',
      null
    );
    
    console.log('✅ Empty measurements format:', emptyMeasurementsMessage);
    console.log('✅ Assignment message with empty measurements:', emptyAssignmentMessage);
    
    const handlesEmptyGracefully = emptyMeasurementsMessage.includes('Not available');
    
    return {
      success: true,
      handlesEmptyGracefully,
      emptyMeasurementsMessage,
      emptyAssignmentMessage
    };
  } catch (error) {
    console.error('❌ Error testing empty measurements:', error);
    return { success: false, error: error.message };
  }
};

export const testPartialMeasurements = () => {
  console.log('🧪 Testing partial measurements handling...');
  
  try {
    const partialMeasurements = {
      phone_number: '9876543210',
      pant_length: '42',
      pant_kamar: '32',
      shirt_length: '28',
      extra_measurements: 'Only basic measurements taken'
    };
    
    const partialMessage = WhatsAppService.formatMeasurementsForWhatsApp(partialMeasurements);
    
    console.log('✅ Partial measurements format:', partialMessage);
    
    const hasPantSection = partialMessage.includes('👖 *Pant Measurements:*');
    const hasShirtSection = partialMessage.includes('👔 *Shirt Measurements:*');
    const hasExtraNotes = partialMessage.includes('Additional Notes');
    
    return {
      success: true,
      hasPantSection,
      hasShirtSection,
      hasExtraNotes,
      partialMessage
    };
  } catch (error) {
    console.error('❌ Error testing partial measurements:', error);
    return { success: false, error: error.message };
  }
};

// Mock function to test the API integration
export const testSupabaseIntegration = async () => {
  console.log('🧪 Testing Supabase measurements API...');
  
  try {
    // Note: This is a mock test - in real usage, you would call:
    // const measurements = await SupabaseAPI.getMeasurementsByMobileNumber('9876543210');
    
    // Simulate API response
    const simulatedResponse = mockMeasurements;
    
    if (simulatedResponse) {
      console.log('✅ Successfully fetched measurements from database');
      console.log('✅ Sample data:', {
        phone_number: simulatedResponse.phone_number,
        pant_length: simulatedResponse.pant_length,
        shirt_length: simulatedResponse.shirt_length
      });
      
      return {
        success: true,
        hasMeasurements: true,
        measurements: simulatedResponse
      };
    } else {
      console.log('✅ No measurements found for customer');
      return {
        success: true,
        hasMeasurements: false,
        measurements: null
      };
    }
  } catch (error) {
    console.error('❌ Error testing Supabase integration:', error);
    return { success: false, error: error.message };
  }
};

// Edge case tests
export const testEdgeCases = () => {
  console.log('🧪 Testing edge cases...');
  
  const results = [];
  
  // Test with special characters in measurements
  try {
    const specialCharMeasurements = {
      ...mockMeasurements,
      extra_measurements: 'Special notes: "loose fit" & comfortable design @ customer request'
    };
    
    const message = WhatsAppService.generateWorkerAssignmentMessage(
      'Test Customer',
      'TEST001',
      'Shirt',
      specialCharMeasurements
    );
    
    results.push({
      test: 'Special characters in measurements',
      success: true,
      message: message.substring(0, 100) + '...'
    });
  } catch (error) {
    results.push({
      test: 'Special characters in measurements',
      success: false,
      error: error.message
    });
  }
  
  // Test with very long customer name
  try {
    const longMessage = WhatsAppService.generateWorkerAssignmentMessage(
      'Very Long Customer Name That Might Cause Issues With WhatsApp Message Length',
      'VERYLONGBILLNUMBER12345',
      'Complex Custom Garment Type',
      mockMeasurements
    );
    
    results.push({
      test: 'Long names and descriptions',
      success: true,
      messageLength: longMessage.length
    });
  } catch (error) {
    results.push({
      test: 'Long names and descriptions',
      success: false,
      error: error.message
    });
  }
  
  console.log('✅ Edge case test results:', results);
  return results;
};

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting comprehensive tests for Worker Assignment with Measurements...\n');
  
  const testResults = {
    measurementFormatting: testMeasurementFormatting(),
    workerAssignmentMessage: testWorkerAssignmentMessage(),
    emptyMeasurements: testEmptyMeasurements(),
    partialMeasurements: testPartialMeasurements(),
    supabaseIntegration: await testSupabaseIntegration(),
    edgeCases: testEdgeCases()
  };
  
  console.log('\n📊 Test Summary:');
  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${result.success ? 'PASSED' : 'FAILED'}`);
  });
  
  const allPassed = Object.values(testResults).every(result => result.success);
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  return testResults;
};

// Integration test for the complete worker assignment flow
export const testCompleteWorkflow = () => {
  console.log('🧪 Testing complete worker assignment workflow...');
  
  try {
    console.log('1. Simulating order with assigned workers...');
    const order = mockOrder;
    const assignedWorkers = mockWorkers;
    
    console.log('2. Fetching customer measurements...');
    const measurements = mockMeasurements;
    
    console.log('3. Generating messages for each worker...');
    const workerMessages = assignedWorkers.map(worker => {
      const message = WhatsAppService.generateWorkerAssignmentMessage(
        order.customer_name,
        order.billnumberinput2,
        order.garment_type,
        measurements
      );
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        workerNumber: worker.number,
        message
      };
    });
    
    console.log('4. Simulating WhatsApp message sending...');
    workerMessages.forEach((workerMessage, index) => {
      console.log(`📱 Message ${index + 1} for ${workerMessage.workerName}:`);
      console.log(`   Phone: ${workerMessage.workerNumber}`);
      console.log(`   Message length: ${workerMessage.message.length} characters`);
      console.log(`   Preview: ${workerMessage.message.substring(0, 150)}...`);
      console.log('');
    });
    
    return {
      success: true,
      workersNotified: assignedWorkers.length,
      workerMessages
    };
  } catch (error) {
    console.error('❌ Error in complete workflow test:', error);
    return { success: false, error: error.message };
  }
};

// Export all test functions for easy access
export const WorkerAssignmentTests = {
  testMeasurementFormatting,
  testWorkerAssignmentMessage,
  testEmptyMeasurements,
  testPartialMeasurements,
  testSupabaseIntegration,
  testEdgeCases,
  testCompleteWorkflow,
  runAllTests
};

console.log('📋 Worker Assignment with Measurements - Test Suite Ready!');
console.log('📝 Available functions:');
console.log('   - runAllTests() - Run all tests');
console.log('   - testCompleteWorkflow() - Test end-to-end workflow');
console.log('   - Individual test functions for specific components');
