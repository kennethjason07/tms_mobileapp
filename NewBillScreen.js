  // Professional bill HTML generator with inline styles for PDF compatibility
  const generateProfessionalBillHTML = (billData, itemizedBill, orderNumber, includeMeasurements = true) => {
    console.log('🏭 generateProfessionalBillHTML called');

    // Calculate totals and organize data
    const garmentTotals = {};
    let totalAmount = 0;
    let totalQuantity = 0;

    // Process itemized bill data to create garment totals
    const garmentTypes = [
      { type: 'Suit', qty: parseInt(itemizedBill.suit_qty) || 0, amount: parseFloat(itemizedBill.suit_amount) || 0 },
      { type: 'Safari/Jacket', qty: parseInt(itemizedBill.safari_qty) || 0, amount: parseFloat(itemizedBill.safari_amount) || 0 },
      { type: 'Pant', qty: parseInt(itemizedBill.pant_qty) || 0, amount: parseFloat(itemizedBill.pant_amount) || 0 },
      { type: 'Shirt', qty: parseInt(itemizedBill.shirt_qty) || 0, amount: parseFloat(itemizedBill.shirt_amount) || 0 }
    ];

    garmentTypes.forEach(({ type, qty, amount }) => {
      if (qty > 0) {
        garmentTotals[type] = { qty, amount };
        totalAmount += amount;
        totalQuantity += qty;
      }
    });

    const advanceAmount = parseFloat(billData.payment_amount) || 0;
    const remainingAmount = totalAmount - advanceAmount;

    // Format dates
    const orderDate = billData.order_date ? 
      new Date(billData.order_date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '-') : '';
      
    const dueDate = billData.due_date ? 
      new Date(billData.due_date).toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }).replace(/\//g, '-') : '';
    
    // Generate measurements with separate boxes for PANT and SHIRT
    const generateMeasurementsForPDF = (measurements) => {
      console.log('🎯 generateMeasurementsForPDF called with:', measurements);
      console.log('🔍 SideP_Cross value specifically:', measurements.SideP_Cross);
      console.log('📋 All measurement keys:', Object.keys(measurements));
      console.log('💡 All measurement entries:', Object.entries(measurements));
      
      // Format date as dd-mm-yyyy
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          const date = new Date(dateString);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}-${month}-${year}`;
        } catch {
          return dateString; // Return original if parsing fails
        }
      };
      
      if (!measurements || Object.keys(measurements).length === 0) {
        return '<div style="font-size: 10px; color: #666;">No measurements available</div>';
      }
      
      const excludedFields = ['id', 'customer_id', 'bill_id', 'order_id', 'phone', 'mobile', 'mobile_number', 'phone_number', 'customer_name', 'name', 'email', 'address', 'order_date', 'due_date', 'created_at', 'updated_at'];
      
      const allEntries = Object.entries(measurements).filter(([key, value]) => {
        const hasValue = value !== '' && value !== null && value !== undefined && value !== 0;
        // More precise exclusion - only exclude exact matches or fields that START with excluded terms
        const isNotExcluded = !excludedFields.some(excludedField => {
          return key.toLowerCase() === excludedField.toLowerCase() || 
                 key.toLowerCase().startsWith(excludedField.toLowerCase() + '_') ||
                 (excludedField === 'phone' && (key.toLowerCase() === 'phone' || key.toLowerCase() === 'phone_number'));
        });
        // Special logging for SideP_Cross
        if (key === 'SideP_Cross') {
          console.log(`🔍 SideP_Cross check: key=${key}, value=${value}, hasValue=${hasValue}, isNotExcluded=${isNotExcluded}`);
        }
        return hasValue && isNotExcluded;
      });
      
      if (allEntries.length === 0) {
        return '<div style="font-size: 10px; color: #666;">No measurements entered</div>';
      }
      
      // Group measurements
      const pantMeasurements = allEntries.filter(([key]) => 
        key.toLowerCase().includes('pant') || 
        ['length', 'kamar', 'hips', 'waist', 'ghutna', 'bottom', 'seat', 'sidep_cross', 'plates', 'belt', 'back_p', 'wp', 'sidep', 'cross'].includes(key.toLowerCase()) ||
        key.toLowerCase().replace('_', '').includes('sidepcross')
      );
      
      const shirtMeasurements = allEntries.filter(([key]) => 
        key.toLowerCase().includes('shirt') || 
        ['shirtlength', 'body', 'loose', 'shoulder', 'astin', 'collar', 'collor', 'aloose', 'allose', 'callar', 'cuff', 'pkt', 'looseshirt', 'dt_tt'].includes(key.toLowerCase())
      );
      
      const extraMeasurements = allEntries.filter(([key]) => 
        !pantMeasurements.some(([pantKey]) => pantKey === key) &&
        !shirtMeasurements.some(([shirtKey]) => shirtKey === key)
      );
      
      let result = [];
      
      // Generate PANT measurements box
      if (pantMeasurements.length > 0) {
        // Special boxed fields for PANT - exact field name matching
        const pantBoxedFieldsExact = ['SideP_Cross', 'Plates', 'Belt', 'Back_P', 'WP'];
        const pantBoxedFieldsLower = ['sidep_cross', 'sidepcross', 'plates', 'belt', 'back_p', 'backp', 'wp'];
        
        const isBoxedPantField = (key) => {
          return pantBoxedFieldsExact.includes(key) || 
                 pantBoxedFieldsLower.includes(key.toLowerCase()) ||
                 pantBoxedFieldsLower.includes(key.toLowerCase().replace('_', ''));
        };
        
        const regularPantFields = pantMeasurements.filter(([key]) => !isBoxedPantField(key));
        const boxedPantFields = pantMeasurements.filter(([key]) => isBoxedPantField(key));
        
        // Debug logging for SideP_Cross
        console.log('🔍 PANT measurements found:', pantMeasurements.map(([key, value]) => `${key}:${value}`));
        console.log('📦 Boxed pant fields:', boxedPantFields.map(([key, value]) => `${key}:${value}`));
        console.log('📝 Regular pant fields:', regularPantFields.map(([key, value]) => `${key}:${value}`));
        
        let pantContent = '';
        
        // Regular pant measurements in single line (numbers only)
        if (regularPantFields.length > 0) {
          const regularValues = regularPantFields.map(([key, value]) => {
            return `${value}`;
          }).join(' | ');
          pantContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
        }
        
        // Boxed pant fields (SideP/Cross, Plates, Belt, Back P., WP)
        if (boxedPantFields.length > 0) {
          const boxedValues = boxedPantFields.map(([key, value]) => {
            let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Pant ', '');
            // Clean up specific field labels
            if (key === 'SideP_Cross' || key.toLowerCase() === 'sidep_cross') {
              label = 'SideP/Cross';
            } else if (key === 'Back_P' || key.toLowerCase() === 'back_p') {
              label = 'Back P.';
            }
            return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #e8f5e8; border: 1px solid #2e7d32; border-radius: 3px; font-size: 12px; font-weight: bold; color: #1b5e20;">${label}:${value}</span>`;
          }).join('');
          pantContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
        }
        
        result.push(`
          <div style="width: 100%; border: 1px solid #2e7d32; border-radius: 4px; padding: 4px; background: #f9fdf9; margin-bottom: 3px; min-height: 45px;">
            <div style="font-weight: bold; font-size: 10px; color: #2e7d32; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #2e7d32; padding-bottom: 1px;">PANT</div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
            ${pantContent}
          </div>
        `);
      }
      
      // Generate SHIRT measurements box
      if (shirtMeasurements.length > 0) {
        // Special boxed fields for SHIRT
        const shirtBoxedFields = ['collar', 'collor', 'callar', 'cuff', 'pkt', 'looseshirt', 'dt_tt'];
        const regularShirtFields = shirtMeasurements.filter(([key]) => 
          !shirtBoxedFields.includes(key.toLowerCase())
        );
        const boxedShirtFields = shirtMeasurements.filter(([key]) => 
          shirtBoxedFields.includes(key.toLowerCase())
        );
        
        let shirtContent = '';
        
        // Regular shirt measurements in single line (numbers only)
        if (regularShirtFields.length > 0) {
          const regularValues = regularShirtFields.map(([key, value]) => {
            return `${value}`;
          }).join(' | ');
          shirtContent += `<div style="margin-bottom: 2px; font-size: 16px; font-weight: bold;">${regularValues}</div>`;
        }
        
        // Boxed shirt fields
        if (boxedShirtFields.length > 0) {
          const boxedValues = boxedShirtFields.map(([key, value]) => {
            let label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase()).replace('Shirt ', '');
            // Clean up label names
            if (label.toLowerCase().includes('collar') || label.toLowerCase().includes('collor') || label.toLowerCase().includes('callar')) {
              label = 'Collar';
            } else if (label.toLowerCase().includes('looseshirt')) {
              label = 'Loose';
            }
            return `<span style="display: inline-block; margin: 1px; padding: 2px 4px; background: #fff8e1; border: 1px solid #f57c00; border-radius: 3px; font-size: 12px; font-weight: bold; color: #e65100;">${label}:${value}</span>`;
          }).join('');
          shirtContent += `<div style="margin-top: 2px;">${boxedValues}</div>`;
        }
        
        result.push(`
          <div style="width: 100%; border: 1px solid #f57c00; border-radius: 4px; padding: 4px; background: #fffbf5; margin-bottom: 3px; min-height: 45px;">
            <div style="font-weight: bold; font-size: 10px; color: #f57c00; margin-bottom: 2px; text-align: center; border-bottom: 1px solid #f57c00; padding-bottom: 1px;">SHIRT</div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-bottom: 2px;">Bill No: ${orderNumber || billData.billnumberinput2 || 'N/A'} | Delivery: ${formatDate(billData.due_date)}</div>
            ${shirtContent}
          </div>
        `);
      }
      
      // Add EXTRA measurements if any (in simple format)
      if (extraMeasurements.length > 0) {
        const extraValues = extraMeasurements.map(([key, value]) => {
          const label = key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, l => l.toUpperCase());
          return `${label}:${value}`;
        }).join(' | ');
        result.push(`<div style="margin-top: 4px; font-size: 10px;"><strong style="color: #2c5282;">EXTRA:</strong> ${extraValues}</div>`);
      }
      
      return result.join('');
    };
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bill</title>
  <style>
    @page {
      size: A4;
      margin: 10mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: Calibri, Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .bill-container {
      width: 100%;
      padding: 5mm;
      box-sizing: border-box;
      border: 2px solid #333;
      position: relative;
    }
  </style>
</head>
<body>
  <div class="bill-container">

    <!-- Header Section -->
    <div style="margin-bottom: 10px;">
      <img src="https://oeqlxurzbdvliuqutqyo.supabase.co/storage/v1/object/public/suit-images/Shop.jpeg"
           alt="Shop Header"
           style="width: 100%; height: auto; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact;"
           onerror="this.style.display='none';">
    </div>

    <!-- Customer Info Fields -->
    <div style="margin-bottom: 8px; font-size: 21px; padding: 0 5px;">
      <!-- Line 1: Name and Order No. -->
      <div style="display: flex; border-bottom: 1px solid #000; padding: 2px 0; min-height: 18px; margin-bottom: 8px;">
        <div style="width: 50%; display: flex; gap: 5px;">
          <span style="font-weight: bold;">Name</span>
          <span>${billData.customer_name || ''}</span>
        </div>
        <div style="width: 50%; display: flex; gap: 5px;">
          <span style="font-weight: bold;">Order No.</span>
          <span>${orderNumber || billData.billnumberinput2 || ''}</span>
        </div>
      </div>

      <!-- Line 2: Date (right column) -->
      <div style="display: flex; border-bottom: 1px solid #000; padding: 2px 0; min-height: 18px; margin-bottom: 8px;">
        <div style="width: 50%;"></div>
        <div style="width: 50%; display: flex; gap: 5px;">
          <span style="font-weight: bold;">Date</span>
          <span>${orderDate}</span>
        </div>
      </div>

      <!-- Line 3: Cell and D. Date -->
      <div style="display: flex; border-bottom: 1px solid #000; padding: 2px 0; min-height: 18px; margin-bottom: 8px;">
        <div style="width: 50%; display: flex; gap: 5px;">
          <span style="font-weight: bold;">Cell</span>
          <span>${billData.mobile_number || ''}</span>
        </div>
        <div style="width: 50%; display: flex; gap: 5px;">
          <span style="font-weight: bold;">D. Date</span>
          <span>${dueDate}</span>
        </div>
      </div>
    </div>

    <!-- Main Content: Table and Image Side by Side -->
    <div style="display: flex; gap: 8px; margin-bottom: 8px;">

      <!-- Left Side: Particulars Table -->
      <div style="flex: 0 0 70%;">
        <!-- Column Headers -->
        <div style="display: flex; background: #514849; border: 2px solid #000; border-bottom: none; border-radius: 8px 8px 0 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div style="flex: 0 0 40%; padding: 8px 10px; text-align: left; font-weight: bold; font-size: 23px; border-right: 2px solid #000; color: #fff;">PARTICULARS</div>
          <div style="flex: 0 0 20%; padding: 8px 10px; text-align: center; font-weight: bold; font-size: 23px; border-right: 2px solid #000; color: #fff;">QTY.</div>
          <div style="flex: 0 0 40%; padding: 8px 30px 8px 41px; font-weight: bold; font-size: 23px; color: #fff;">AMOUNT</div>
        </div>

        <!-- Item Rows -->
        <div style="display: flex; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000;">
          <div style="flex: 0 0 40%; padding: 10px; text-align: left; font-size: 21px; font-weight: 600; border-right: 2px solid #000;">Suit</div>
          <div style="flex: 0 0 20%; padding: 10px; text-align: center; font-size: 21px; border-right: 2px solid #000;">${garmentTotals['Suit']?.qty || ''}</div>
          <div style="flex: 0 0 40%; padding: 10px 30px 10px 54px; font-size: 21px;">${garmentTotals['Suit']?.amount || ''}</div>
        </div>

        <div style="display: flex; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000;">
          <div style="flex: 0 0 40%; padding: 10px; text-align: left; font-size: 21px; font-weight: 600; border-right: 2px solid #000;">Safari/Jacket</div>
          <div style="flex: 0 0 20%; padding: 10px; text-align: center; font-size: 21px; border-right: 2px solid #000;">${garmentTotals['Safari/Jacket']?.qty || ''}</div>
          <div style="flex: 0 0 40%; padding: 10px 30px 10px 54px; font-size: 21px;">${garmentTotals['Safari/Jacket']?.amount || ''}</div>
        </div>

        <div style="display: flex; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000;">
          <div style="flex: 0 0 40%; padding: 10px; text-align: left; font-size: 21px; font-weight: 600; border-right: 2px solid #000;">Pant</div>
          <div style="flex: 0 0 20%; padding: 10px; text-align: center; font-size: 21px; border-right: 2px solid #000;">${garmentTotals['Pant']?.qty || ''}</div>
          <div style="flex: 0 0 40%; padding: 10px 30px 10px 54px; font-size: 21px;">${garmentTotals['Pant']?.amount || ''}</div>
        </div>

        <div style="display: flex; border-left: 2px solid #000; border-right: 2px solid #000; border-bottom: 1px solid #000;">
          <div style="flex: 0 0 40%; padding: 10px; text-align: left; font-size: 21px; font-weight: 600; border-right: 2px solid #000;">Shirt</div>
          <div style="flex: 0 0 20%; padding: 10px; text-align: center; font-size: 21px; border-right: 2px solid #000;">${garmentTotals['Shirt']?.qty || ''}</div>
          <div style="flex: 0 0 40%; padding: 10px 30px 10px 54px; font-size: 21px;">${garmentTotals['Shirt']?.amount || ''}</div>
        </div>

        <!-- Total Row -->
        <div style="display: flex; border: 2px solid #000; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; background: #e8e8e8; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div style="flex: 0 0 40%; padding: 10px; text-align: center; font-size: 21px; font-weight: bold; border-right: 2px solid #000;">
            <div style="margin-bottom: 2px;">Good Service</div>
            <div>Prompt Delivery</div>
          </div>
          <div style="flex: 0 0 20%; padding: 10px; text-align: center; font-size: 24px; font-weight: bold; border-right: 2px solid #000; color: #db9b68; -webkit-print-color-adjust: exact; print-color-adjust: exact;">TOTAL</div>
          <div style="flex: 0 0 40%; padding: 10px 30px 10px 54px; font-size: 21px; font-weight: bold;"></div>
        </div>
      </div>

      <!-- Right Side: Image -->
      <div style="flex: 0 0 20%; display: flex; align-items: stretch;">
        <img src="https://oeqlxurzbdvliuqutqyo.supabase.co/storage/v1/object/public/suit-images/suit-icon.jpg"
             alt="Suit"
             style="width: 140%; height: 100%;"
             onerror="this.style.display='none';">
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; border: 2px solid #000; border-radius: 8px; padding: 12px 20px; background: #fff;">
        <div style="flex: 1; text-align: left; font-size: 21px; font-weight: bold;">Thank You, Visit Again</div>
        <div style="flex: 0 0 auto; text-align: center;">
          <div style="background: #db9b68; color: #000; padding: 6px 20px; border-radius: 8px; font-weight: bold; font-size: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">Sunday Holiday</div>
        </div>
        <div style="flex: 1; text-align: right; font-size: 21px; font-weight: bold; color: #db9b68; padding-right: 40px;">Signature</div>
      </div>
    </div>

  </div>
</body>
</html>
    `;
  };

import React, { useState, useEffect, useRef } from 'react';
// Test function to verify template system works
const testTemplateSystem = () => {
  console.log('🧪 Testing template system...');
  const testBillData = {
    customer_name: 'Test Customer',
    mobile_number: '1234567890',
    order_date: '2024-01-15',
    due_date: '2024-01-25',
    billnumberinput2: '1001'
  };
  
  const testItemizedBill = {
    suit_qty: '1',
    suit_amount: '2500',
    pant_qty: '1', 
    pant_amount: '800',
    shirt_qty: '2',
    shirt_amount: '1000'
  };
  
  try {
    const html = generateBillHTMLFromTemplate(testBillData, testItemizedBill, '1001');
    console.log('✅ Template system working! HTML generated:', html.length, 'characters');
    return true;
  } catch (error) {
    console.error('❌ Template system failed:', error);
    return false;
  }
};
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  Switch,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Platform,
  Share,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import WebScrollView from './components/WebScrollView';
import FractionalInput from './components/FractionalInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseAPI } from './supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Helper function to parse fractional and decimal measurements
// Supports formats like: "4 2/5", "4.5", "4", "2/5", "0.5"
function parseMeasurementInput(input) {
  if (!input || input.trim() === '') return 0;
  
  const text = input.trim();
  
  // Handle pure decimal numbers (e.g., "4.5", "4", "0.5")
  if (/^\d+\.?\d*$/.test(text)) {
    const value = parseFloat(text);
    return isNaN(value) ? 0 : value;
  }
  
  // Handle pure fractions (e.g., "2/5", "3/4")
  if (/^\d+\/\d+$/.test(text)) {
    const [numerator, denominator] = text.split('/').map(Number);
    if (denominator === 0) return 0;
    return numerator / denominator;
  }
  
  // Handle mixed fractions (e.g., "4 2/5", "3 1/4")
  if (/^\d+\s+\d+\/\d+$/.test(text)) {
    const parts = text.split(' ');
    const wholeNumber = parseInt(parts[0]);
    const [numerator, denominator] = parts[1].split('/').map(Number);
    if (denominator === 0) return wholeNumber;
    return wholeNumber + (numerator / denominator);
  }
  
  // If format doesn't match any pattern, try parseFloat as fallback
  const fallbackValue = parseFloat(text);
  return isNaN(fallbackValue) ? 0 : fallbackValue;
}

// Helper function to format measurement value for display
// Converts decimal back to fractional display if needed
function formatMeasurementDisplay(value) {
  if (!value || value === 0) return '0';
  
  // If it's a whole number, display as is
  if (value % 1 === 0) {
    return value.toString();
  }
  
  // For decimal values, show up to 3 decimal places (removes trailing zeros)
  return parseFloat(value.toFixed(3)).toString();
}

function generateAllMeasurementsTable(measurements) {
  const labelize = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  const entries = Object.entries(measurements).filter(
    ([, value]) => value !== '' && value !== null && value !== undefined && value !== 0
  );
  if (entries.length === 0) return '<tr><td colspan="2">No measurements entered.</td></tr>';
  return entries
    .map(
      ([key, value]) =>
        `<tr><td>${labelize(key)}</td><td>${value}</td></tr>`
    )
    .join('');
}

// Generate measurements in pure text format for inclusion in the bill
function generateMeasurementsTextForBill(billData) {
  const labelize = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  
  // Fields to exclude from measurements display
  const excludedFields = [
    'id', 'customer_id', 'bill_id', 'order_id',
    'phone', 'mobile', 'mobile_number', 'phone_number',
    'customer_name', 'name', 'email', 'address',
    'order_date', 'due_date', 'created_at', 'updated_at'
  ];
  
  // Check if we have measurements in billData
  if (billData.measurements) {
    const allEntries = Object.entries(billData.measurements).filter(
      ([key, value]) => {
        // Filter out empty values
        const hasValue = value !== '' && value !== null && value !== undefined && value !== 0;
        // Filter out excluded fields (case insensitive)
        const isNotExcluded = !excludedFields.some(excludedField => 
          key.toLowerCase().includes(excludedField.toLowerCase())
        );
        return hasValue && isNotExcluded;
      }
    );
    
    if (allEntries.length === 0) {
      return '<div class="measurement-line">No measurements available</div>';
    }
    
    // Group measurements by category
    const pantMeasurements = allEntries.filter(([key]) => 
      key.toLowerCase().includes('pant') || 
      ['length', 'kamar', 'hips', 'waist', 'ghutna', 'bottom', 'seat', 'sidep_cross', 'plates', 'belt', 'back_p', 'wp'].includes(key.toLowerCase())
    );
    
    const shirtMeasurements = allEntries.filter(([key]) => 
      key.toLowerCase().includes('shirt') || 
      ['shirtlength', 'body', 'loose', 'shoulder', 'astin', 'collar', 'collor', 'aloose', 'allose', 'callar', 'cuff', 'pkt', 'looseshirt', 'dt_tt'].includes(key.toLowerCase())
    );
    
    const extraMeasurements = allEntries.filter(([key]) => 
      !pantMeasurements.some(([pantKey]) => pantKey === key) &&
      !shirtMeasurements.some(([shirtKey]) => shirtKey === key)
    );
    
    let result = [];
    
    // Add Pant measurements line
    if (pantMeasurements.length > 0) {
      const pantLine = '<div class="measurement-line"><strong>Pant:</strong> ' +
        pantMeasurements
          .map(([key, value]) => 
            `<span class="measurement-item"><span class="measurement-value">${value}</span></span>`
          )
          .join('&nbsp;&nbsp;') + '</div>';
      result.push(pantLine);
    }
    
    // Add Shirt measurements line
    if (shirtMeasurements.length > 0) {
      const shirtLine = '<div class="measurement-line"><strong>Shirt:</strong> ' +
        shirtMeasurements
          .map(([key, value]) => 
            `<span class="measurement-item"><span class="measurement-value">${value}</span></span>`
          )
          .join('&nbsp;&nbsp;') + '</div>';
      result.push(shirtLine);
    }
    
    // Add Extra measurements line
    if (extraMeasurements.length > 0) {
      const extraLine = '<div class="measurement-line"><strong>Extra:</strong> ' +
        extraMeasurements
          .map(([key, value]) => 
            `<span class="measurement-item"><span class="measurement-value">${value}</span></span>`
          )
          .join('&nbsp;&nbsp;') + '</div>';
      result.push(extraLine);
    }
    
    return result.join('');
  }
  
  return '<div class="measurement-line">No measurements available</div>';
}

// Template-based bill generation functions
const generateBillHTMLFromTemplate = async (billData, itemizedBill, orderNumber) => {
  let htmlTemplate;
  
  // Try to read the actual print-format.html file
  try {
    if (Platform.OS === 'web' && typeof fetch !== 'undefined') {
      console.log('📄 Attempting to load print-format.html file...');
      const response = await fetch('./print-format.html');
      if (response.ok) {
        htmlTemplate = await response.text();
        console.log('✅ Successfully loaded print-format.html file!');
      } else {
        throw new Error('Failed to fetch print-format.html');
      }
    } else {
      throw new Error('Not web platform, using inline template');
    }
  } catch (error) {
    console.warn('⚠️ Could not load print-format.html, using inline template:', error.message);
    // Fallback to inline template (copy of print-format.html content)
    htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill Print Format</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 10px;
      background: white;
      color: #333;
      font-size: 12px;
      line-height: 1.3;
    }
    .bill-container {
      width: 600px;
      margin: 0 auto;
      background: white;
      border: 1px solid #ddd;
      box-shadow: 0 0 5px rgba(0,0,0,0.1);
    }
    .header {
      background: #4a4a4a;
      color: white;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .logo {
      background: white;
      color: #333;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border-radius: 2px;
    }
    .shop-name-left {
      font-size: 16px;
      font-weight: bold;
      color: #ff6600;
      margin: 0;
      line-height: 1;
    }
    .shop-prop {
      font-size: 10px;
      color: white;
      margin: 0;
      line-height: 1;
    }
    .shop-name-right {
      color: #ff6600;
      font-size: 16px;
      font-weight: bold;
      margin-left: 4px;
    }
    .header-right {
      text-align: right;
      font-size: 9px;
      line-height: 1.2;
    }
    .address-bar {
      background: #f5f5f5;
      padding: 4px 12px;
      font-size: 9px;
      text-align: center;
      border-bottom: 1px solid #ddd;
    }
    .customer-section {
      padding: 12px;
    }
    .section-title {
      text-align: center;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 12px;
      color: #333;
    }
    .order-number {
      margin-bottom: 8px;
    }
    .order-label {
      color: #0066cc;
      font-weight: bold;
      font-size: 11px;
    }
    .order-value {
      color: #0066cc;
      font-size: 11px;
    }
    .customer-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .field-group {
      flex: 1;
    }
    .field-label {
      font-weight: bold;
      color: #333;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .field-value {
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 4px 6px;
      font-size: 11px;
      min-height: 16px;
    }
    .main-content {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .items-section {
      flex: 1;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #333;
      font-size: 11px;
    }
    .items-table th {
      background: #f0f0f0;
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: center;
      font-weight: bold;
    }
    .items-table td {
      border: 1px solid #333;
      padding: 6px 8px;
      text-align: center;
    }
    .items-table td:first-child {
      text-align: left;
    }
    .total-row {
      background: #f8f8f8;
      font-weight: bold;
    }
    .suit-specialist {
      width: 80px;
      background: #333;
      color: white;
      padding: 8px;
      text-align: center;
      border-radius: 4px;
      font-size: 8px;
      line-height: 1.2;
    }
    .specialist-title {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 9px;
    }
    .suit-icon {
      width: 50px;
      height: 60px;
      background: white;
      margin: 0 auto 6px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #333;
      font-size: 24px;
    }
    .specialist-text {
      margin-bottom: 2px;
    }
    .footer {
      text-align: center;
      padding: 8px;
      border-top: 1px solid #ddd;
      font-size: 11px;
    }
    .footer-main {
      font-weight: bold;
      color: #333;
    }
    .footer-holiday {
      color: #ff6600;
      margin-top: 2px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="bill-container">
    <div class="header">
      <div class="header-left">
        <div class="logo">Y</div>
        <div>
          <div class="shop-name-left">Yak's</div>
          <div class="shop-prop">Prop : Jaganath Sidda</div>
        </div>
        <div class="shop-name-right">Men's Wear</div>
      </div>
      <div class="header-right">
        <div>Shop : 8660897168</div>
        <div>9448678033</div>
      </div>
    </div>
    
    <div class="address-bar">
      Sulgunte Complex, Opp. Old Service Stand, Near SBI Bank, BIDAR-585 401 (K.S.)
    </div>
    
    <div class="customer-section">
      <div class="section-title">
        Customer Information
      </div>
      
      <div class="order-number">
        <span class="order-label">Order Number: </span>
        <span class="order-value">{{ORDER_NUMBER}}</span>
      </div>
      
      <div class="customer-grid">
        <div class="field-group">
          <div class="field-label">Customer Name:</div>
          <div class="field-value">
            {{CUSTOMER_NAME}}
          </div>
        </div>
        <div class="field-group">
          <div class="field-label">Mobile Number:</div>
          <div class="field-value">
            {{MOBILE_NUMBER}}
          </div>
        </div>
      </div>
      
      <div class="customer-grid">
        <div class="field-group">
          <div class="field-label">Date:</div>
          <div class="field-value">
            {{ORDER_DATE}}
          </div>
        </div>
        <div class="field-group">
          <div class="field-label">Delivery Date:</div>
          <div class="field-value">
            {{DUE_DATE}}
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="items-section">
          <table class="items-table">
            <thead>
              <tr>
                <th>Particulars</th>
                <th style="width: 60px;">Qty</th>
                <th style="width: 80px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              {{BILL_ITEMS_TABLE}}
              <tr class="total-row">
                <td><strong>Total</strong></td>
                <td><strong>{{TOTAL_QUANTITY}}</strong></td>
                <td><strong>₹{{TOTAL_AMOUNT}}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="image-box">
          <img src="https://oeqlxurzbdvliuqutqyo.supabase.co/storage/v1/object/public/suit-images/suit-icon.jpg" 
               alt="Terms and Conditions" 
               style="width: 220px; height: auto; max-height: 280px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; background: white;"
               onerror="this.style.display='none';">
        </div>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-main">Thank You, Visit Again!</div>
      <div class="footer-holiday">Sunday Holiday</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Helper functions - now properly parameterized
  function generateBillItemsTable(itemizedBillData) {
    const items = [
      { name: 'Suit', qty: itemizedBillData.suit_qty || '0', amount: itemizedBillData.suit_amount || '0' },
      { name: 'Safari/Jacket', qty: itemizedBillData.safari_qty || '0', amount: itemizedBillData.safari_amount || '0' },
      { name: 'Pant', qty: itemizedBillData.pant_qty || '0', amount: itemizedBillData.pant_amount || '0' },
      { name: 'Shirt', qty: itemizedBillData.shirt_qty || '0', amount: itemizedBillData.shirt_amount || '0' },
      { name: 'Sadri', qty: itemizedBillData.sadri_qty || '0', amount: itemizedBillData.sadri_amount || '0' }
    ];
    
    const rows = items
      .filter(item => parseFloat(item.qty) > 0 || parseFloat(item.amount) > 0)
      .map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>₹${parseFloat(item.amount).toFixed(2)}</td>
        </tr>
      `).join('');
      
    if (rows === '') {
      return '<tr><td colspan="3" style="text-align: center;">No items added</td></tr>';
    }
    
    return rows;
  }
  
  function getTotalQuantity(itemizedBillData) {
    const totalQty = parseInt(itemizedBillData.suit_qty || 0) + 
                    parseInt(itemizedBillData.safari_qty || 0) + 
                    parseInt(itemizedBillData.pant_qty || 0) + 
                    parseInt(itemizedBillData.shirt_qty || 0) + 
                    parseInt(itemizedBillData.sadri_qty || 0);
    return totalQty > 0 ? totalQty.toString() : '0';
  }
  
  function getTotalAmount(itemizedBillData) {
    const totalAmount = (parseFloat(itemizedBillData.suit_amount) || 0) + 
                       (parseFloat(itemizedBillData.safari_amount) || 0) + 
                       (parseFloat(itemizedBillData.pant_amount) || 0) + 
                       (parseFloat(itemizedBillData.shirt_amount) || 0) + 
                       (parseFloat(itemizedBillData.sadri_amount) || 0);
    return totalAmount.toFixed(2);
  }
  
  console.log('🔄 Processing template with data:', {
    orderNumber: orderNumber || billData.billnumberinput2 || 'N/A',
    customerName: billData.customer_name || 'N/A',
    totalItems: getTotalQuantity(itemizedBill)
  });
  
  // Prepare the data for replacement
  const billItemsTable = generateBillItemsTable(itemizedBill);
  const totalQuantity = getTotalQuantity(itemizedBill);
  const totalAmount = getTotalAmount(itemizedBill);
  
  console.log('📊 Generated table HTML:', billItemsTable.substring(0, 100) + '...');
  
  // Replace placeholders with actual data
  const replacements = {
    '{{ORDER_NUMBER}}': orderNumber || billData.billnumberinput2 || 'N/A',
    '{{CUSTOMER_NAME}}': billData.customer_name || 'N/A',
    '{{MOBILE_NUMBER}}': billData.mobile_number || 'N/A',
    '{{ORDER_DATE}}': billData.order_date || 'N/A',
    '{{DUE_DATE}}': billData.due_date || 'N/A',
    '{{BILL_ITEMS_TABLE}}': billItemsTable,
    '{{TOTAL_QUANTITY}}': totalQuantity,
    '{{TOTAL_AMOUNT}}': totalAmount
  };
  
  // Replace all placeholders
  let finalHTML = htmlTemplate;
  Object.keys(replacements).forEach(placeholder => {
    const value = replacements[placeholder];
    const before = finalHTML.includes(placeholder);
    finalHTML = finalHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    if (before) {
      console.log(`✅ Replaced ${placeholder} with:`, value.substring(0, 50) + (value.length > 50 ? '...' : ''));
    }
  });
  
  console.log('🎯 Final HTML length:', finalHTML.length, 'characters');
  return finalHTML;
};

// Traditional Measurement Card HTML Generator with inline styles for PDF compatibility
const generateMeasurementHTML = (billData, measurements) => {
  // Generate measurement card with full inline styling
  const generateMeasurementCard = (type, measurements) => {
    const cardConfig = {
      pant: {
        title: "PANT",
        fields: [
          { key: "pant_length", label: "Length", position: "top-left" },
          { key: "pant_kamar", label: "Kamar", position: "top-center" },
          { key: "pant_hips", label: "Hips", position: "top-right" },
          { key: "pant_waist", label: "Waist", position: "middle-left" },
          { key: "pant_ghutna", label: "Ghutna", position: "middle-center" },
          { key: "pant_bottom", label: "Bottom", position: "middle-right" },
          { key: "pant_seat", label: "Seat", position: "bottom-left" },
          { key: "SideP_Cross", label: "SideP/Cross", position: "labeled-box-1" },
          { key: "Plates", label: "Plates", position: "labeled-box-2" },
          { key: "Belt", label: "Belt", position: "labeled-box-3" },
          { key: "Back_P", label: "Back P.", position: "labeled-box-4" },
          { key: "WP", label: "WP.", position: "labeled-box-5" }
        ]
      },
      shirt: {
        title: "SHIRT",
        fields: [
          { key: "shirt_length", label: "Length", position: "top-left" },
          { key: "shirt_body", label: "Body", position: "top-center" },
          { key: "shirt_loose", label: "Loose", position: "top-right" },
          { key: "shirt_shoulder", label: "Shoulder", position: "middle-left" },
          { key: "shirt_astin", label: "Astin", position: "middle-center" },
          { key: "shirt_collar", label: "Collar", position: "middle-right" },
          { key: "shirt_aloose", label: "A.Loose", position: "bottom-left" },
          { key: "Callar", label: "Collar", position: "labeled-box-1" },
          { key: "Cuff", label: "Cuff", position: "labeled-box-2" },
          { key: "Pkt", label: "Pkt", position: "labeled-box-3" },
          { key: "LooseShirt", label: "Loose", position: "labeled-box-4" },
          { key: "DT_TT", label: "DT/TT", position: "labeled-box-5" }
        ]
      }
    };
    
    const config = cardConfig[type];
    if (!config) return '';
    
    // Generate main grid fields with inline styling
    const positions = [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ];
    
    const gridFields = positions.map(position => {
      const field = config.fields.find(f => f.position === position);
      if (!field) {
        return `<td style="width: 33.33%; padding: 8px; text-align: center; border: 1px solid #ddd;"></td>`;
      }
      
      const value = measurements[field.key] || '';
      const hasValue = value !== '' && value !== 0;
      
      const bgColor = hasValue ? '#e8f5e8' : '#ffffff';
      const borderColor = hasValue ? '#2e7d32' : '#333333';
      const textColor = hasValue ? '#1b5e20' : '#333333';
      
      return `
        <td style="width: 33.33%; padding: 8px; text-align: center; border: 1px solid #ddd; vertical-align: top;">
          <div style="font-size: 11px; font-weight: bold; margin-bottom: 4px; color: #666; background: #f5f5f5; padding: 2px 4px; border-radius: 2px;">${field.label}</div>
          <div style="border: 3px solid ${borderColor}; border-radius: 4px; padding: 8px; min-height: 25px; font-size: 13px; font-weight: bold; background: ${bgColor}; color: ${textColor}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">${value}</div>
        </td>
      `;
    });
    
    // Create grid table (3x3)
    const gridTable = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; background: #fafafa; border: 1px solid #ddd;">
        <tr>
          ${gridFields[0]}
          ${gridFields[1]}
          ${gridFields[2]}
        </tr>
        <tr>
          ${gridFields[3]}
          ${gridFields[4]}
          ${gridFields[5]}
        </tr>
        <tr>
          ${gridFields[6]}
          ${gridFields[7]}
          ${gridFields[8]}
        </tr>
      </table>
    `;
    
    // Generate labeled boxes with inline styling
    const labeledFields = config.fields.filter(f => f.position.includes('labeled-box-'));
    const labeledBoxes = labeledFields.map(field => {
      const value = measurements[field.key] || '';
      const hasValue = value !== '' && value !== 0;
      
      const bgColor = hasValue ? '#fff8e1' : '#ffffff';
      const borderColor = hasValue ? '#f57c00' : '#666666';
      const textColor = hasValue ? '#e65100' : '#333333';
      
      return `
        <td style="width: 20%; padding: 4px; text-align: center; border: 1px solid #eee; vertical-align: top;">
          <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px; color: #444; background: #e0e0e0; padding: 2px 4px; border-radius: 2px; border: 1px solid #ccc;">${field.label}</div>
          <div style="border: 2px solid ${borderColor}; border-radius: 3px; padding: 6px 2px; min-height: 18px; font-size: 11px; font-weight: bold; background: ${bgColor}; color: ${textColor}; display: flex; align-items: center; justify-content: center; box-sizing: border-box;">${value}</div>
        </td>
      `;
    }).join('');
    
    const labeledTable = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px; padding-top: 10px; border-top: 2px solid #666; background: #f8f8f8;">
        <tr>
          ${labeledBoxes}
        </tr>
      </table>
    `;
    
    return `
      <div style="flex: 1; border: 4px solid #333333; border-radius: 8px; margin: 10px; background: white; box-shadow: 0 4px 8px rgba(0,0,0,0.15); page-break-inside: avoid;">
        <div style="background: #333333; color: white; padding: 8px 15px; text-align: center; font-weight: bold; font-size: 16px; margin: 0; border-radius: 4px 4px 0 0;">${config.title}</div>
        <div style="position: absolute; top: 10px; right: 15px; font-size: 11px;">
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 5px;">
            <span>Date:</span>
            <div style="border: 1px solid #666; border-radius: 2px; background: white; padding: 2px 4px; width: 60px; height: 16px;"></div>
          </div>
          <div style="margin: 3px 0; display: flex; align-items: center; gap: 5px;">
            <span>No.</span>
            <div style="border: 1px solid #666; border-radius: 2px; background: white; padding: 2px 4px; width: 60px; height: 16px;"></div>
          </div>
        </div>
        <div style="padding: 15px; position: relative; min-height: 180px; border: 1px solid #ddd; border-radius: 0 0 4px 4px;">
          ${gridTable}
          ${labeledTable}
        </div>
      </div>
    `;
  };
  
  // Generate extra measurements section with inline styling
  const generateExtraMeasurements = (measurements) => {
    const extraValue = measurements.extra_measurements || '';
    return `
      <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border: 2px solid #4A90E2; border-radius: 5px;">
        <h4 style="margin: 0 0 10px 0; color: #2c5282; font-size: 14px;">Additional Notes / Extra Measurements:</h4>
        <div style="background: white; border: 1px solid #ddd; border-radius: 3px; padding: 10px; min-height: 30px; font-size: 13px; line-height: 1.4; color: #333;">${extraValue || 'No additional measurements specified.'}</div>
      </div>
    `;
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Customer Measurement Sheet</title>
      <style>
        @page {
          size: A4;
          margin: 15mm;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body { 
          font-family: Arial, sans-serif !important;
          margin: 0;
          padding: 15px;
          background: white !important;
          color: #333 !important;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <!-- Header with inline styling -->
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #333333; padding-bottom: 15px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <h2 style="margin: 0; font-size: 24px; color: #333333; font-weight: bold;">Yak's Men's Wear</h2>
        <div style="font-size: 16px; color: #ff6600; margin: 8px 0 4px 0; font-weight: bold;">Customer Measurement Sheet</div>
        <div style="font-size: 11px; color: #666666; margin-top: 4px;">Prop: Jaganath Sidda | Shop: 8660897168, 9448678033</div>
      </div>

      <!-- Customer Info with inline styling -->
      <table style="width: 100%; margin: 15px 0; border-collapse: collapse; border: 2px solid #dddddd; background: #f9f9f9;">
        <tr>
          <td style="padding: 8px; border: 1px solid #dddddd; font-size: 13px; width: 25%;"><strong>Customer Name:</strong><br>${billData.customer_name || '___________________'}</td>
          <td style="padding: 8px; border: 1px solid #dddddd; font-size: 13px; width: 25%;"><strong>Mobile Number:</strong><br>${billData.mobile_number || '___________________'}</td>
          <td style="padding: 8px; border: 1px solid #dddddd; font-size: 13px; width: 25%;"><strong>Date:</strong><br>${billData.order_date || '___________'}</td>
          <td style="padding: 8px; border: 1px solid #dddddd; font-size: 13px; width: 25%;"><strong>Delivery Date:</strong><br>${billData.due_date || '___________'}</td>
        </tr>
      </table>

      <!-- Measurement Cards with inline styling -->
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="width: 50%; vertical-align: top; padding-right: 10px;">
            ${generateMeasurementCard('pant', measurements)}
          </td>
          <td style="width: 50%; vertical-align: top; padding-left: 10px;">
            ${generateMeasurementCard('shirt', measurements)}
          </td>
        </tr>
      </table>

      ${generateExtraMeasurements(measurements)}

      <!-- Footer with inline styling -->
      <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #dddddd; font-size: 14px; font-weight: bold; color: #333333;">
        <div style="color: #ff6600; margin-bottom: 4px;">Thank You, Visit Again!</div>
        <div style="font-size: 11px; color: #666666; margin-top: 8px;">Sunday Holiday</div>
      </div>
    </body>
    </html>
  `;
};

// IST Timezone Utility Functions
const getISTTimestamp = () => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const now = new Date();
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);
  return istDate.toISOString();
};

const getISTDateString = () => {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const now = new Date();
  const istDate = new Date(now.getTime() + IST_OFFSET_MS);
  
  const yyyy = istDate.getFullYear();
  const mm = String(istDate.getMonth() + 1).padStart(2, '0');
  const dd = String(istDate.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

export default function NewBillScreen({ navigation }) {
  // Responsive design hook
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isMobile = screenWidth < 768;
  const isSmallMobile = screenWidth < 480;

  useEffect(() => {
    const onChange = (result) => {
      setScreenWidth(result.window.width);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  const [measurementType, setMeasurementType] = useState({
    pant: false,
    shirt: false,
    extra: false,
  });
  
  const [billData, setBillData] = useState({
    customer_name: '',
    mobile_number: '',
    order_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_status: 'pending',
    payment_mode: '',
    payment_amount: '0',
  });

  const [measurements, setMeasurements] = useState({
    // Pant measurements
    pant_length: 0,
    pant_kamar: 0,
    pant_hips: 0,
    pant_waist: 0,
    pant_ghutna: 0,
    pant_bottom: 0,
    pant_seat: 0,
    SideP_Cross: '',
    Plates: '',
    Belt: '',
    Back_P: '',
    WP: '',
    
    // Shirt measurements
    shirt_length: 0,
    shirt_body: '',
    shirt_loose: '',
    shirt_shoulder: 0,
    shirt_astin: 0,
    shirt_collar: 0,
    shirt_aloose: 0,
    Callar: '',
    Cuff: '',
    Pkt: '',
    LooseShirt: '',
    DT_TT: '',
    
    // Extra measurements
    extra_measurements: '',
  });

  const [itemizedBill, setItemizedBill] = useState({
    suit_qty: '0',
    suit_amount: '0',
    safari_qty: '0',
    safari_amount: '0',
    pant_qty: '0',
    pant_amount: '0',
    shirt_qty: '0',
    shirt_amount: '0',
    sadri_qty: '0',
    sadri_amount: '0',
    total_qty: '0',
    total_amt: '0',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchMobile, setCustomerSearchMobile] = useState('');
  // Add state for which date field is being picked
  const [activeDateField, setActiveDateField] = useState(null); // 'order' or 'due'
  const [selectedOrderDate, setSelectedOrderDate] = useState(new Date());

  useEffect(() => {
    loadData();
    generateBillNumber();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const customersData = await SupabaseAPI.getAllCustomers();
      setCustomers(customersData);
    } catch (error) {
      console.error('Data loading error:', error);
      Alert.alert('Error', `Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateBillNumber = async () => {
    try {
      const currentBillNumber = await SupabaseAPI.getCurrentBillNumber();
      // Extract the billno property if present, otherwise use 1000
      const billNumber = (currentBillNumber && currentBillNumber.billno) ? currentBillNumber.billno : 1000;
      console.log('Generated bill number:', billNumber);
      setBillData(prev => ({ ...prev, billnumberinput2: billNumber.toString() }));
    } catch (error) {
      console.error('Error generating bill number:', error);
      setBillData(prev => ({ ...prev, billnumberinput2: '1000' }));
    }
  };

  const calculateTotals = () => {
    const suitQty = parseFloat(itemizedBill.suit_qty) || 0;
    const suitAmt = parseFloat(itemizedBill.suit_amount) || 0;
    const safariQty = parseFloat(itemizedBill.safari_qty) || 0;
    const safariAmt = parseFloat(itemizedBill.safari_amount) || 0;
    const pantQty = parseFloat(itemizedBill.pant_qty) || 0;
    const pantAmt = parseFloat(itemizedBill.pant_amount) || 0;
    const shirtQty = parseFloat(itemizedBill.shirt_qty) || 0;
    const shirtAmt = parseFloat(itemizedBill.shirt_amount) || 0;
    const sadriQty = parseFloat(itemizedBill.sadri_qty) || 0;
    const sadriAmt = parseFloat(itemizedBill.sadri_amount) || 0;

    const totalQty = suitQty + safariQty + pantQty + shirtQty + sadriQty;
    const totalAmt = suitAmt + safariAmt + pantAmt + shirtAmt + sadriAmt;

    return {
      total_qty: totalQty.toString(),
      total_amt: totalAmt.toFixed(2)
    };
  };

  const handleCustomerSearch = async () => {
    if (!customerSearchMobile || customerSearchMobile.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setSearching(true);
      const customerData = await SupabaseAPI.getCustomerInfo(customerSearchMobile);
      console.log('Fetched customerData:', customerData); // For debugging
      console.log('Fetched measurements:', customerData.measurements);

      if (customerData) {
        // Fill customer info
        setBillData(prev => ({
          ...prev,
          customer_name: customerData.customer_name || customerData.name || '',
          mobile_number: customerData.mobile_number || customerData.phone || '',
          order_date: customerData.order_date || prev.order_date,
          due_date: customerData.due_date || prev.due_date,
          payment_status: customerData.payment_status || prev.payment_status,
          payment_mode: customerData.payment_mode || prev.payment_mode,
          payment_amount: customerData.payment_amount?.toString() || prev.payment_amount,
        }));

        // Fill measurements if available, else reset to defaults
        if (customerData.measurements) {
          setMeasurements({ ...customerData.measurements });
        } else {
          setMeasurements({
            pant_length: 0,
            pant_kamar: 0,
            pant_hips: 0,
            pant_waist: 0,
            pant_ghutna: 0,
            pant_bottom: 0,
            pant_seat: 0,
            SideP_Cross: '',
            Plates: '',
            Belt: '',
            Back_P: '',
            WP: '',
            shirt_length: 0,
            shirt_body: '',
            shirt_loose: '',
            shirt_shoulder: 0,
            shirt_astin: 0,
            shirt_collar: 0,
            shirt_aloose: 0,
            Callar: '',
            Cuff: '',
            Pkt: '',
            LooseShirt: '',
            DT_TT: '',
            extra_measurements: '',
          });
        }

        // Optionally fill itemizedBill if your API returns it
        if (customerData.itemizedBill) {
          setItemizedBill(prev => ({
            ...prev,
            ...customerData.itemizedBill
          }));
        }

        Alert.alert('Success', 'Customer data loaded successfully');
      } else {
        Alert.alert('Not Found', 'No customer found with this mobile number');
      }
    } catch (error) {
      console.error('Bill creation error:', error);
      Alert.alert('Error', 'Bill creation failed: ' + error.message);
      return false;
    }
  };

  const toggleMeasurementType = (type) => {
    setMeasurementType(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleCustomerSelect = (customer) => {
    setBillData({
      ...billData,
      customer_name: customer.name,
      mobile_number: customer.phone,
    });
    setCustomerModalVisible(false);
  };

  const handleDueDateChange = (event, date) => {
    setShowDueDatePicker(false);
    if (date) {
      setSelectedDueDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setBillData(prev => ({ ...prev, due_date: formattedDate }));
    }
  };

  const openDueDatePicker = () => {
    setShowDueDatePicker(true);
  };

  const clearDueDate = () => {
    setBillData(prev => ({ ...prev, due_date: '' }));
  };

  const validateForm = () => {
    console.log('🔍 Validating form...');
    console.log('📋 billData:', billData);

    if (!billData.customer_name || !billData.mobile_number) {
      console.log('❌ Validation failed: Missing customer name or mobile');
      console.log('  customer_name:', billData.customer_name);
      console.log('  mobile_number:', billData.mobile_number);
      Alert.alert('Error', 'Please select a customer');
      return false;
    }
    if (!billData.order_date) {
      console.log('❌ Validation failed: Missing order date');
      Alert.alert('Error', 'Please enter order date');
      return false;
    }
    if (!billData.due_date) {
      console.log('❌ Validation failed: Missing due date');
      Alert.alert('Error', 'Please enter due date');
      return false;
    }
    const totals = calculateTotals();
    console.log('💰 Calculated totals:', totals);
    if (parseFloat(totals.total_amt) <= 0) {
      console.log('❌ Validation failed: Invalid amounts (total <= 0)');
      Alert.alert('Error', 'Please enter valid amounts');
      return false;
    }
    console.log('✅ Validation passed!');
    return true;
  };

  const handleSaveBill = async () => {
    console.log('handleSaveBill called');
    if (!validateForm()) return false;

    try {
      // Upsert measurements for the customer (like legacy backend)
      try {
        const upsertResult = await SupabaseAPI.upsertMeasurements(measurements, billData.mobile_number);
        console.log('Measurements upsert result:', upsertResult);
      } catch (err) {
        console.error('Error upserting measurements:', err);
        Alert.alert('Error', 'Failed to save measurements.');
        return false;
      }

      // 1. Fetch current order number
      const currentBillNumber = await SupabaseAPI.getCurrentBillNumber();
      const orderNumber = currentBillNumber.billno;
      const rowId = currentBillNumber.id;

      // 2. Use orderNumber for the new bill
      const totals = calculateTotals();
      const todayStr = getISTDateString(); // Use IST date for today
      const currentISTTimestamp = getISTTimestamp(); // Full IST timestamp
      const advanceAmount = parseFloat(billData.payment_amount) || 0;
      
      console.log('🇮🇳 USING IST TIMEZONE FOR BILL CREATION:');
      console.log(`   IST Date: ${todayStr}`);
      console.log(`   IST Timestamp: ${currentISTTimestamp}`);
      console.log(`   UTC would be: ${new Date().toISOString()}`);
      console.log('   This ensures bills appear in Today\'s Profit correctly');
      
      let billToSave = {
        customer_name: billData.customer_name,
        mobile_number: billData.mobile_number,
        date_issue: todayStr, // force today
        delivery_date: billData.due_date,
        today_date: todayStr, // force today
        due_date: billData.due_date,
        payment_status: billData.payment_status,
        payment_mode: billData.payment_mode,
        payment_amount: advanceAmount,
        total_amt: parseFloat(totals.total_amt),
        total_qty: parseInt(totals.total_qty),
        suit_qty: parseInt(itemizedBill.suit_qty) || 0,
        safari_qty: parseInt(itemizedBill.safari_qty) || 0,
        pant_qty: parseInt(itemizedBill.pant_qty) || 0,
        shirt_qty: parseInt(itemizedBill.shirt_qty) || 0,
        sadri_qty: parseInt(itemizedBill.sadri_qty) || 0,
      };
      
      // Note: bills table doesn't have updated_at column per schema
      // The updated_at will be added to individual orders instead
      if (advanceAmount > 0) {
        console.log(`\u{1F4B0} Advance payment detected: ₹${advanceAmount}, will add updated_at to individual orders`);
      }
      // Sanitize billToSave
      Object.keys(billToSave).forEach(key => {
        if (billToSave[key] === undefined || billToSave[key] === 'undefined') {
          billToSave[key] = null;
        }
      });

      console.log('📋 About to create bill with data:', JSON.stringify(billToSave, null, 2));
      
      const billResult = await SupabaseAPI.createNewBill(billToSave);
      console.log('✅ Bill save result:', billResult);
      
      if (!billResult || !billResult[0] || typeof billResult[0].id !== 'number') {
        console.error('❌ Bill creation failed - Invalid result:', billResult);
        Alert.alert('Error', 'Failed to create bill. Please try again.');
        console.log('handleSaveBill failed: bill not created');
        return false;
      }
      const billId = billResult[0].id;

      // Validate bill_id and billnumberinput2 before creating order
      console.log('orderNumber:', orderNumber, 'billId:', billId);
      if (typeof billId !== 'number' || !orderNumber || orderNumber === 'undefined' || orderNumber === undefined) {
        Alert.alert('Error', 'Order number or bill ID is invalid. Please try again.');
        return false;
      }

      // Create individual orders for each garment based on quantities (using IST date)
      const garmentOrders = createIndividualGarmentOrders(billId, orderNumber, todayStr, currentISTTimestamp);
      
      if (garmentOrders.length === 0) {
        Alert.alert('Error', 'No garments to create orders for.');
        return false;
      }
      
      console.log(`Creating ${garmentOrders.length} individual garment orders:`);
      garmentOrders.forEach((order, i) => {
        console.log(`  ${i + 1}. ${order.garment_type}`);
      });
      
      // Create all individual orders
      const orderResults = [];
      for (const orderData of garmentOrders) {
        try {
          console.log(`Creating order for: ${orderData.garment_type}`);
          const orderResult = await SupabaseAPI.createOrder(orderData);
          
          if (!orderResult || !orderResult[0] || typeof orderResult[0].id !== 'number') {
            throw new Error(`Failed to create ${orderData.garment_type} order`);
          }
          
          orderResults.push(orderResult[0]);
          console.log(`✅ Created ${orderData.garment_type} order with ID: ${orderResult[0].id}`);
        } catch (error) {
          console.error(`❌ Failed to create ${orderData.garment_type} order:`, error);
          Alert.alert('Error', `Failed to create ${orderData.garment_type} order: ${error.message}`);
          return false;
        }
      }
      
      console.log(`✅ Successfully created ${orderResults.length} individual garment orders`);
      
      // Check if all orders were created successfully
      if (orderResults.length !== garmentOrders.length) {
        Alert.alert('Error', 'Some orders failed to create. Please try again.');
        return false;
      }
      
      console.log('\u2705 BILL CREATED WITH TWO-STAGE REVENUE TRACKING:', {
        billId: billResult[0].id,
        ordersCreated: orderResults.length,
        advanceAmount
      });

      // 3. After bill is created, increment billno
      console.log('Incrementing bill number with rowId:', rowId, 'orderNumber:', orderNumber);
      if (!rowId || !orderNumber || rowId === 'undefined' || orderNumber === 'undefined') {
        console.error('Cannot increment bill number: rowId or orderNumber is undefined');
        return false;
      }
      await SupabaseAPI.incrementBillNumber(rowId, orderNumber);

      // Reset form after successful save
      resetForm();
      
      // Create success message with garment breakdown
      const garmentSummary = garmentOrders.reduce((acc, order) => {
        acc[order.garment_type] = (acc[order.garment_type] || 0) + 1;
        return acc;
      }, {});
      
      const garmentList = Object.entries(garmentSummary)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');
      
      Alert.alert(
        'Success', 
        `Bill ${orderNumber} created successfully!

Individual orders created:
${garmentList}

Total: ${orderResults.length} garment orders`,
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('OrdersOverview')
          },
          {
            text: 'Create Another',
            onPress: () => resetForm()
          }
        ]
      );
      console.log('handleSaveBill succeeded');
      return true;
    } catch (error) {
      console.error('Bill creation error:', error);
      Alert.alert('Error', `Failed to create bill: ${error.message}`);
      console.log('handleSaveBill failed: exception', error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Create individual order objects for each garment based on quantities (with IST support)
  const createIndividualGarmentOrders = (billId, orderNumber, todayStr, istTimestamp = null) => {
    const orders = [];
    const totals = calculateTotals();
    const advanceAmount = parseFloat(billData.payment_amount) || 0;
    
    console.log('🇮🇳 createIndividualGarmentOrders - Using IST timezone:');
    console.log(`   IST Date: ${todayStr}`);
    console.log(`   IST Timestamp: ${istTimestamp || 'not provided'}`);
    console.log(`   Advance Amount: ₹${advanceAmount}`);
    
    // Define garment types and their quantities
    const garmentTypes = [
      { type: 'Suit', qty: parseInt(itemizedBill.suit_qty) || 0 },
      { type: 'Safari/Jacket', qty: parseInt(itemizedBill.safari_qty) || 0 },
      { type: 'Pant', qty: parseInt(itemizedBill.pant_qty) || 0 },
      { type: 'Shirt', qty: parseInt(itemizedBill.shirt_qty) || 0 },
      { type: 'Sadri', qty: parseInt(itemizedBill.sadri_qty) || 0 }
    ];
    
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
          payment_amount: advanceAmount,
          payment_status: billData.payment_status,
          payment_mode: billData.payment_mode,
          status: 'pending',
          Work_pay: null, // Only set after workers are assigned
        };
        
        // Add updated_at date if there's an advance payment (orders.updated_at is date type per schema)
        if (advanceAmount > 0) {
          orderData.updated_at = todayStr; // Use date format (YYYY-MM-DD) not timestamp
          console.log(`  ✅ Adding updated_at date to ${type} order: ${todayStr}`);
        }
        
        // Sanitize orderData
        Object.keys(orderData).forEach(key => {
          if (orderData[key] === undefined || orderData[key] === 'undefined') {
            orderData[key] = null;
          }
        });
        
        orders.push(orderData);
      }
    });
    
    return orders;
  };
  
  const getGarmentTypes = () => {
    const types = [];
    if (parseFloat(itemizedBill.suit_qty) > 0) types.push('Suit');
    if (parseFloat(itemizedBill.safari_qty) > 0) types.push('Safari/Jacket');
    if (parseFloat(itemizedBill.pant_qty) > 0) types.push('Pant');
    if (parseFloat(itemizedBill.shirt_qty) > 0) types.push('Shirt');
    if (parseFloat(itemizedBill.sadri_qty) > 0) types.push('Sadri');
    return types.join(', ');
  };

  const resetForm = () => {
    setBillData({
      customer_name: '',
      mobile_number: '',
      order_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_status: 'pending',
      payment_mode: '',
      payment_amount: '0',
    });
    setMeasurements({
      pant_length: 0,
      pant_kamar: 0,
      pant_hips: 0,
      pant_waist: 0,
      pant_ghutna: 0,
      pant_bottom: 0,
      pant_seat: 0,
      SideP_Cross: '',
      Plates: '',
      Belt: '',
      Back_P: '',
      WP: '',
      shirt_length: 0,
      shirt_body: '',
      shirt_loose: '',
      shirt_shoulder: 0,
      shirt_astin: 0,
      shirt_collar: 0,
      shirt_aloose: 0,
      Callar: '',
      Cuff: '',
      Pkt: '',
      LooseShirt: '',
      DT_TT: '',
      extra_measurements: '',
    });
    setItemizedBill({
      suit_qty: '0',
      suit_amount: '0',
      safari_qty: '0',
      safari_amount: '0',
      pant_qty: '0',
      pant_amount: '0',
      shirt_qty: '0',
      shirt_amount: '0',
      sadri_qty: '0',
      sadri_amount: '0',
      total_qty: '0',
      total_amt: '0',
    });
    setMeasurementType({ pant: false, shirt: false, extra: false });
    
    // Generate new bill number after reset
    generateBillNumber();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone?.includes(searchQuery)
  );

  const renderCalendar = () => {
    const today = new Date();
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Add day headers
    dayNames.forEach((day, index) => {
      days.push(
        <View key={`header-${day}-${index}`} style={styles.calendarDayHeader}>
          <Text style={styles.calendarDayHeaderText}>{day}</Text>
        </View>
      );
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(<View key={`empty-${currentYear}-${currentMonth}-${i}`} style={styles.calendarDayEmpty} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      
      // Fix timezone issue in date comparison
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${dayStr}`;
      const isSelected = billData.due_date === formattedDate;
      
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      days.push(
        <TouchableOpacity
          key={`day-${currentYear}-${currentMonth}-${day}`}
          style={[
            styles.calendarDay,
            isToday && styles.calendarDayToday,
            isSelected && styles.calendarDaySelected,
            isPast && styles.calendarDayPast
          ]}
          onPress={() => {
            // Fix timezone issue by using local date formatting
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dayStr = String(date.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${dayStr}`;
            
            setBillData({ ...billData, due_date: formattedDate });
            setDatePickerVisible(false);
          }}
        >
          <Text style={[
            styles.calendarDayText,
            isToday && styles.calendarDayTodayText,
            isSelected && styles.calendarDaySelectedText,
            isPast && styles.calendarDayPastText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.calendarWrapper}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            style={styles.calendarNavButton}
            onPress={() => {
              const prevMonth = new Date(currentYear, currentMonth - 1, 1);
              setSelectedDate(prevMonth);
            }}
          >
            <Text style={styles.calendarNavButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            style={styles.calendarNavButton}
            onPress={() => {
              const nextMonth = new Date(currentYear, currentMonth + 1, 1);
              setSelectedDate(nextMonth);
            }}
          >
            <Text style={styles.calendarNavButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendToday]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.legendSelected]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
        </View>
        
        <View style={styles.calendarGrid}>
          {days}
        </View>
        
        <View style={styles.calendarFooter}>
          <Text style={styles.calendarFooterText}>
            Selected: {billData.due_date || 'No date selected'}
          </Text>
        </View>
      </View>
    );
  };

  const handlePrintMeasurement = async () => {
    try {
      console.log('🎯 Generating traditional measurement cards PDF...');
      console.log('📊 Current measurements data:', measurements);
      
      // Generate the traditional measurement card HTML
      const html = generateMeasurementHTML(billData, measurements);
      
      console.log('📄 Generated measurement HTML length:', html.length);
      
      if (Platform.OS === 'web') {
        // For web, create a new window and print
        console.log('🌐 Opening measurement card preview for web...');
        const printWindow = window.open('', '_blank', 'width=800,height=1000');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait a moment for rendering then print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        };
        
        Alert.alert(
          'Measurement Cards Ready', 
          'Traditional measurement cards are ready to print. The print dialog will open automatically.',
          [{ text: 'OK' }]
        );
      } else {
        // For mobile, use Expo Print
        console.log('📱 Generating measurement PDF for mobile...');
        const { uri } = await Print.printToFileAsync({ html });
        
        if (uri) {
          console.log('✅ Measurement PDF generated:', uri);
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
          }
          
          Alert.alert(
            'Measurement Cards Generated',
            'Traditional measurement cards have been generated successfully!',
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('Failed to generate PDF file');
        }
      }
    } catch (error) {
      console.error('❌ Error generating measurement cards:', error);
      Alert.alert('Error', 'Failed to generate measurement cards: ' + error.message);
    }
  };

  // Function to get image source for different platforms
  const getSuitImageSrc = () => {
    if (Platform.OS === 'web') {
      // For web, use direct path
      return 'suitpic.jpg';
    } else {
      // For mobile, use direct path
      return 'suitpic.jpg';
    }
  };


  const handlePrintBill = async (orderNumber) => {
    try {
      // Use provided order number or current bill number or generate fallback
      let billNumber = orderNumber || billData.billnumberinput2;
      if (!billNumber) {
        billNumber = 'TEMP_' + Date.now(); // Fallback order number
      }

      console.log('🖨️ Generating professional bill HTML for order:', billNumber);
      console.log('📏 Current measurements state:', measurements);
      console.log('🔍 SideP_Cross in measurements:', measurements.SideP_Cross);

      // Generate professional bill HTML using the same format as GenerateBillScreen
      // Pass measurements from the component state
      const billDataWithMeasurements = { ...billData, measurements };
      console.log('📊 billDataWithMeasurements.measurements:', billDataWithMeasurements.measurements);
      const html = generateProfessionalBillHTML(billDataWithMeasurements, itemizedBill, billNumber, false);
      console.log('✅ HTML generated, length:', html.length);
      
      if (Platform.OS === 'web') {
        // For web, create a new window and print
        console.log('📄 Opening print window for web...');
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for images to load before printing
        printWindow.onload = () => {
          const images = printWindow.document.querySelectorAll('img');
          let loadedImages = 0;
          
          if (images.length === 0) {
            // No images, print immediately
            printWindow.print();
            return;
          }
          
          images.forEach((img) => {
            if (img.complete) {
              loadedImages++;
            } else {
              img.onload = () => {
                loadedImages++;
                if (loadedImages === images.length) {
                  printWindow.print();
                }
              };
              img.onerror = () => {
                loadedImages++;
                if (loadedImages === images.length) {
                  printWindow.print();
                }
              };
            }
          });
          
          if (loadedImages === images.length) {
            printWindow.print();
          }
        };
        
        // Show success message
        Alert.alert(
          'Print Ready', 
          `Bill #${billNumber} is ready to print. The print dialog will open once images load.`,
          [{ text: 'OK' }]
        );
      } else {
        // For mobile, use Expo Print
        console.log('📱 Generating PDF for mobile...');
        const result = await Print.printToFileAsync({ 
          html,
          base64: false 
        });
        
        console.log('Print result:', result);
        
        if (result && result.uri) {
          console.log('PDF generated successfully, sharing:', result.uri);
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri);
          } else {
            Alert.alert('Success', `Bill #${billNumber} generated successfully`);
          }
          
          // Show success message
          Alert.alert(
            'Bill Generated', 
            `Bill #${billNumber} has been generated and is ready to print or share.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to generate bill PDF file');
          console.error('Print result is undefined or missing uri:', result);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate or share bill PDF');
      console.error('Print error:', error);
    }
  };

  const handleDateChange = (event, date) => {
    setDatePickerVisible(false);
    if (date) {
      const formattedDate = date.toISOString().split('T')[0];
      if (activeDateField === 'order') {
        setBillData(prev => ({ ...prev, order_date: formattedDate }));
        setSelectedOrderDate(date);
      } else if (activeDateField === 'due') {
        setBillData(prev => ({ ...prev, due_date: formattedDate }));
        setSelectedDueDate(date);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{
        backgroundColor: '#2980b9',
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}>
        <Pressable
          onPress={() => navigation.navigate('Dashboard')}
          style={({ pressed }) => [{
            backgroundColor: pressed ? 'rgba(255,255,255,0.18)' : 'transparent',
            borderRadius: 26,
            marginRight: 8,
            width: 52,
            height: 52,
            justifyContent: 'center',
            alignItems: 'center',
          }]}
        >
          <Ionicons name="chevron-back-circle" size={40} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>New Bill</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <ScrollView
            style={{ overflow: 'visible' }}
            contentContainerStyle={Platform.OS === 'web' ? { paddingBottom: isMobile ? 180 : 120 } : undefined}
            showsVerticalScrollIndicator={true}
          >
        {/* Order Number Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Number</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { fontWeight: 'bold', fontSize: 18, color: '#2c3e50' }]}
              value={billData.billnumberinput2 ? billData.billnumberinput2.toString() : ''}
              onChangeText={text => {
                // Only allow numbers
                const numeric = text.replace(/[^0-9]/g, '');
                setBillData(prev => ({ ...prev, billnumberinput2: numeric }));
              }}
              placeholder="Enter Order Number"
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          {/* Customer Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.inputLabel}>Search by Mobile Number:</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={customerSearchMobile}
                onChangeText={setCustomerSearchMobile}
                placeholder="Enter 10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
          <TouchableOpacity
                style={styles.searchButton}
                onPress={handleCustomerSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
          </TouchableOpacity>
            </View>
        </View>

          {/* Customer Details */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Customer Name:</Text>
            <TextInput
              style={styles.input}
              value={billData.customer_name}
              onChangeText={(text) => setBillData({ ...billData, customer_name: text })}
              placeholder="Customer name"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Mobile Number:</Text>
            <TextInput
              style={styles.input}
              value={billData.mobile_number}
              onChangeText={(text) => setBillData({ ...billData, mobile_number: text })}
              placeholder="Mobile number"
              keyboardType="phone-pad"
            />
          </View>
          </View>

        {/* Measurements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          
          {/* Measurement Type Selection */}
          <View style={styles.measurementTypeContainer}>
            <Text style={styles.inputLabel}>Select Measurement Type:</Text>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, measurementType.pant && styles.checkboxSelected]}
                onPress={() => toggleMeasurementType('pant')}
              >
                <Text style={styles.checkboxText}>Pant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkbox, measurementType.shirt && styles.checkboxSelected]}
                onPress={() => toggleMeasurementType('shirt')}
              >
                <Text style={styles.checkboxText}>Shirt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkbox, measurementType.extra && styles.checkboxSelected]}
                onPress={() => toggleMeasurementType('extra')}
              >
                <Text style={styles.checkboxText}>Extra</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pant Measurements */}
          {measurementType.pant && (
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Pant Measurements</Text>
              <View style={styles.measurementGrid}>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Length:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_length}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_length: value })}
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Kamar:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_kamar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_kamar: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Hips:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_hips}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_hips: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ran:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_waist}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_waist: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ghutna:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_ghutna}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_ghutna: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Bottom:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_bottom}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_bottom: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Seat:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_seat}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_seat: value })}

                    keyboardType="default"
                  />
                </View>
          </View>

              {/* Pant Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Pant Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>SideP/Cross:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.SideP_Cross}
                      onChangeValue={(value) => setMeasurements({ ...measurements, SideP_Cross: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Plates:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Plates}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Plates: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Belt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Belt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Belt: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Back P:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Back_P}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Back_P: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>WP:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.WP}
                      onChangeValue={(value) => setMeasurements({ ...measurements, WP: value })}

                      allowText={true}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Shirt Measurements */}
          {measurementType.shirt && (
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Shirt Measurements</Text>
              <View style={styles.measurementGrid}>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Length:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_length}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_length: value })}

                    keyboardType="default"
                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Body:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_body}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_body: value })}

                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Loose:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_loose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_loose: value })}

                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Shoulder:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_shoulder}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_shoulder: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Astin:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_astin}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_astin: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Collar:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_collar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_collar: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Aloose:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_aloose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_aloose: value })}

                    keyboardType="default"
                  />
                </View>
          </View>
              
              {/* Shirt Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Shirt Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Collar:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Callar}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Callar: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Cuff:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Cuff}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Cuff: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Pkt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Pkt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Pkt: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Loose:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.LooseShirt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, LooseShirt: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>DT/TT:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.DT_TT}
                      onChangeValue={(value) => setMeasurements({ ...measurements, DT_TT: value })}

                      allowText={true}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Extra Measurements */}
          {measurementType.extra && (
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Extra Measurements</Text>
              <TextInput
                style={styles.extraTextArea}
                value={measurements.extra_measurements}
                onChangeText={(text) => setMeasurements({ ...measurements, extra_measurements: text })}
                placeholder="Enter extra measurements or special instructions..."
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </View>

        {/* Itemized Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itemized Billing</Text>
          
          <View style={styles.billingTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Item</Text>
              <Text style={styles.tableHeaderText}>Qty</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
            
            {/* Suit */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Suit</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.suit_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, suit_qty: text })}
              keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.suit_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, suit_amount: text })}
                keyboardType="numeric"
                placeholder="0"
            />
          </View>

            {/* Safari/Jacket */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Safari/Jacket</Text>
            <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.safari_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, safari_qty: text })}
              keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.safari_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, safari_amount: text })}
                keyboardType="numeric"
                placeholder="0"
            />
          </View>
            
            {/* Pant */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Pant</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.pant_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, pant_qty: text })}
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.pant_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, pant_amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            {/* Shirt */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Shirt</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.shirt_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, shirt_qty: text })}
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.shirt_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, shirt_amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            {/* Sadri */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Sadri</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.sadri_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, sadri_qty: text })}
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.sadri_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, sadri_amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            {/* Total Row */}
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableItemText, styles.totalText]}>Total</Text>
              <Text style={[styles.tableQtyInput, styles.totalInput]}>{calculateTotals().total_qty || 0}</Text>
              <Text style={[styles.tableAmountInput, styles.totalInput]}>₹{calculateTotals().total_amt || 0}</Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Order Date:</Text>
            <View style={styles.dateFilterContainer}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={billData.order_date}
                  onChange={e => setBillData(prev => ({ ...prev, order_date: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
                  min={new Date().toISOString().split('T')[0]}
                  max="2030-12-31"
                />
              ) : (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    setActiveDateField('order');
                    setDatePickerVisible(true);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>
                    {billData.order_date ? billData.order_date : 'Select Order Date'}
                  </Text>
                </TouchableOpacity>
              )}
              {billData.order_date && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setBillData(prev => ({ ...prev, order_date: '' }))}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Due Date:</Text>
            <View style={styles.dateFilterContainer}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={billData.due_date}
                  onChange={e => setBillData(prev => ({ ...prev, due_date: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
                  min={new Date().toISOString().split('T')[0]}
                  max="2030-12-31"
                />
              ) : (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    setActiveDateField('due');
                    setDatePickerVisible(true);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>
                    {billData.due_date ? billData.due_date : 'Select Due Date'}
                  </Text>
                </TouchableOpacity>
              )}
              {billData.due_date && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDueDate}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Payment Status:</Text>
            <View style={styles.pickerContainer}>
            <TouchableOpacity
                  style={[styles.pickerOption, billData.payment_status === 'pending' && styles.pickerOptionSelected]}
                  onPress={() => setBillData({ ...billData, payment_status: 'pending' })}
                >
                  <Text style={[styles.pickerOptionText, billData.payment_status === 'pending' && styles.pickerOptionTextSelected]}>
                    Pending
            </Text>
          </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, billData.payment_status === 'paid' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ ...billData, payment_status: 'paid' })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_status === 'paid' && styles.pickerOptionTextSelected]}>
                  Paid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, billData.payment_status === 'advance' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ ...billData, payment_status: 'advance' })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_status === 'advance' && styles.pickerOptionTextSelected]}>
                  Advance
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Payment Mode:</Text>
            <View style={styles.pickerContainer}>
                  <TouchableOpacity
                style={[styles.pickerOption, billData.payment_mode === 'Cash' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ 
                  ...billData, 
                  payment_mode: billData.payment_mode === 'Cash' ? '' : 'Cash' 
                })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_mode === 'Cash' && styles.pickerOptionTextSelected]}>
                  Cash
                </Text>
                  </TouchableOpacity>
                </View>
            </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Advance Amount:</Text>
            <TextInput
              style={styles.input}
              value={billData.payment_amount}
              onChangeText={(text) => setBillData({ ...billData, payment_amount: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>₹{parseFloat(calculateTotals().total_amt) || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Advance Amount:</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(billData.payment_amount) || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Amount:</Text>
            <Text style={[styles.summaryValue, styles.remainingAmount]}>
                ₹{((parseFloat(calculateTotals().total_amt) || 0) - (parseFloat(billData.payment_amount) || 0)).toFixed(2)}
            </Text>
          </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.printButton]}
            onPress={handlePrintMeasurement}
            disabled={saving}
          >
            <Text style={styles.printButtonText}>Print Measurements</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={async () => {
              console.log('Save and Print button pressed');
              
              try {
                setSaving(true);
                
                // Get the order number that will be used for this bill
                const currentBillNumber = await SupabaseAPI.getCurrentBillNumber();
                const orderNumber = currentBillNumber.billno;
                console.log('📋 Order number for printing:', orderNumber);
                
                // Save the bill first
                const saved = await handleSaveBill();
                
                if (saved) {
                  console.log('✅ Bill saved successfully, now printing...');
                  // Use the orderNumber we got before saving
                  await handlePrintBill(orderNumber);
                } else {
                  console.log('❌ Not printing because save failed');
                }
              } catch (error) {
                console.error('Error in save and print:', error);
                Alert.alert('Error', 'Failed to save and print bill: ' + error.message);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save and Print</Text>
            )}
          </TouchableOpacity>
        </View> 
      </ScrollView>
    </View>
  ) : (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Number Display */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Number</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { fontWeight: 'bold', fontSize: 18, color: '#2c3e50' }]}
              value={billData.billnumberinput2 ? billData.billnumberinput2.toString() : ''}
              onChangeText={text => {
                // Only allow numbers
                const numeric = text.replace(/[^0-9]/g, '');
                setBillData(prev => ({ ...prev, billnumberinput2: numeric }));
              }}
              placeholder="Enter Order Number"
              keyboardType="numeric"
              maxLength={12}
            />
          </View>
        </View>

        {/* Customer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          
          {/* Customer Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.inputLabel}>Search by Mobile Number:</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={customerSearchMobile}
                onChangeText={setCustomerSearchMobile}
                placeholder="Enter 10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
          <TouchableOpacity
                style={styles.searchButton}
                onPress={handleCustomerSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
          </TouchableOpacity>
            </View>
        </View>

          {/* Customer Details */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Customer Name:</Text>
            <TextInput
              style={styles.input}
              value={billData.customer_name}
              onChangeText={(text) => setBillData({ ...billData, customer_name: text })}
              placeholder="Customer name"
            />
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Mobile Number:</Text>
            <TextInput
              style={styles.input}
              value={billData.mobile_number}
              onChangeText={(text) => setBillData({ ...billData, mobile_number: text })}
              placeholder="Mobile number"
              keyboardType="phone-pad"
            />
          </View>
          </View>

        {/* Measurements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Measurements</Text>
          
          {/* Measurement Type Selection */}
          <View style={styles.measurementTypeContainer}>
            <Text style={styles.inputLabel}>Select Measurement Type:</Text>
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={[styles.checkbox, measurementType.pant && styles.checkboxSelected]}
                onPress={() => toggleMeasurementType('pant')}
              >
                <Text style={styles.checkboxText}>Pant</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkbox, measurementType.shirt && styles.checkboxSelected]}
                onPress={() => toggleMeasurementType('shirt')}
              >
                <Text style={styles.checkboxText}>Shirt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.checkbox, measurementType.extra && styles.checkboxSelected]}
                onPress={() => toggleMeasurementType('extra')}
              >
                <Text style={styles.checkboxText}>Extra</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pant Measurements */}
          {measurementType.pant && (
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Pant Measurements</Text>
              <View style={styles.measurementGrid}>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Length:</Text>
            <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_length}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_length: value })}
                    placeholder="32, 1/2, 22/7/2"
              keyboardType="default"
            />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Kamar:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_kamar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_kamar: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Hips:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_hips}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_hips: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ran:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_waist}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_waist: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ghutna:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_ghutna}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_ghutna: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Bottom:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_bottom}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_bottom: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Seat:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_seat}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_seat: value })}

                    keyboardType="default"
                  />
                </View>
          </View>

              {/* Pant Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Pant Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>SideP/Cross:</Text>
            <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.SideP_Cross}
                      onChangeValue={(value) => setMeasurements({ ...measurements, SideP_Cross: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Plates:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Plates}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Plates: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Belt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Belt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Belt: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Back P:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Back_P}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Back_P: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>WP:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.WP}
                      onChangeValue={(value) => setMeasurements({ ...measurements, WP: value })}

                      allowText={true}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Shirt Measurements */}
          {measurementType.shirt && (
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Shirt Measurements</Text>
              <View style={styles.measurementGrid}>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Length:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_length}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_length: value })}

              keyboardType="default"
                    allowText={true}
            />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Body:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_body}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_body: value })}

                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Loose:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_loose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_loose: value })}

                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Shoulder:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_shoulder}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_shoulder: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Astin:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_astin}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_astin: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Collar:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_collar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_collar: value })}

                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Aloose:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_aloose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_aloose: value })}

                    keyboardType="default"
                  />
                </View>
          </View>
              
              {/* Shirt Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Shirt Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Collar:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Callar}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Callar: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Cuff:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Cuff}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Cuff: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Pkt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Pkt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Pkt: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Loose:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.LooseShirt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, LooseShirt: value })}

                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>DT/TT:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.DT_TT}
                      onChangeValue={(value) => setMeasurements({ ...measurements, DT_TT: value })}

                      allowText={true}
                    />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Extra Measurements */}
          {measurementType.extra && (
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Extra Measurements</Text>
              <TextInput
                style={styles.extraTextArea}
                value={measurements.extra_measurements}
                onChangeText={(text) => setMeasurements({ ...measurements, extra_measurements: text })}
                placeholder="Enter extra measurements or special instructions..."
                multiline
                numberOfLines={4}
              />
            </View>
          )}
        </View>

        {/* Itemized Billing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itemized Billing</Text>
          
          <View style={styles.billingTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Item</Text>
              <Text style={styles.tableHeaderText}>Qty</Text>
              <Text style={styles.tableHeaderText}>Amount</Text>
            </View>
            
            {/* Suit */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Suit</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.suit_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, suit_qty: text })}
              keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.suit_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, suit_amount: text })}
                keyboardType="numeric"
                placeholder="0"
            />
          </View>

            {/* Safari/Jacket */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Safari/Jacket</Text>
            <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.safari_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, safari_qty: text })}
              keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.safari_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, safari_amount: text })}
                keyboardType="numeric"
                placeholder="0"
            />
          </View>
            
            {/* Pant */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Pant</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.pant_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, pant_qty: text })}
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.pant_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, pant_amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            {/* Shirt */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Shirt</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.shirt_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, shirt_qty: text })}
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.shirt_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, shirt_amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            {/* Sadri */}
            <View style={styles.tableRow}>
              <Text style={styles.tableItemText}>Sadri</Text>
              <TextInput
                style={styles.tableQtyInput}
                value={itemizedBill.sadri_qty}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, sadri_qty: text })}
                keyboardType="numeric"
                placeholder="0"
              />
              <TextInput
                style={styles.tableAmountInput}
                value={itemizedBill.sadri_amount}
                onChangeText={(text) => setItemizedBill({ ...itemizedBill, sadri_amount: text })}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            {/* Total Row */}
            <View style={[styles.tableRow, styles.totalRow]}>
              <Text style={[styles.tableItemText, styles.totalText]}>Total</Text>
              <Text style={[styles.tableQtyInput, styles.totalInput]}>{calculateTotals().total_qty || 0}</Text>
              <Text style={[styles.tableAmountInput, styles.totalInput]}>₹{calculateTotals().total_amt || 0}</Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Order Date:</Text>
            <View style={styles.dateFilterContainer}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={billData.order_date}
                  onChange={e => setBillData(prev => ({ ...prev, order_date: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
                  min={new Date().toISOString().split('T')[0]}
                  max="2030-12-31"
                />
              ) : (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    setActiveDateField('order');
                    setDatePickerVisible(true);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>
                    {billData.order_date ? billData.order_date : 'Select Order Date'}
                  </Text>
                </TouchableOpacity>
              )}
              {billData.order_date && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={() => setBillData(prev => ({ ...prev, order_date: '' }))}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Due Date:</Text>
            <View style={styles.dateFilterContainer}>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={billData.due_date}
                  onChange={e => setBillData(prev => ({ ...prev, due_date: e.target.value }))}
                  style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
                  min={new Date().toISOString().split('T')[0]}
                  max="2030-12-31"
                />
              ) : (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => {
                    setActiveDateField('due');
                    setDatePickerVisible(true);
                  }}
                >
                  <Text style={styles.datePickerButtonText}>
                    {billData.due_date ? billData.due_date : 'Select Due Date'}
                  </Text>
                </TouchableOpacity>
              )}
              {billData.due_date && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDueDate}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Payment Status:</Text>
            <View style={styles.pickerContainer}>
          <TouchableOpacity
                style={[styles.pickerOption, billData.payment_status === 'pending' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ ...billData, payment_status: 'pending' })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_status === 'pending' && styles.pickerOptionTextSelected]}>
                  Pending
            </Text>
          </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, billData.payment_status === 'paid' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ ...billData, payment_status: 'paid' })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_status === 'paid' && styles.pickerOptionTextSelected]}>
                  Paid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerOption, billData.payment_status === 'advance' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ ...billData, payment_status: 'advance' })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_status === 'advance' && styles.pickerOptionTextSelected]}>
                  Advance
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Payment Mode:</Text>
            <View style={styles.pickerContainer}>
                  <TouchableOpacity
                style={[styles.pickerOption, billData.payment_mode === 'Cash' && styles.pickerOptionSelected]}
                onPress={() => setBillData({ 
                  ...billData, 
                  payment_mode: billData.payment_mode === 'Cash' ? '' : 'Cash' 
                })}
              >
                <Text style={[styles.pickerOptionText, billData.payment_mode === 'Cash' && styles.pickerOptionTextSelected]}>
                  Cash
                </Text>
                  </TouchableOpacity>
                </View>
            </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Advance Amount:</Text>
            <TextInput
              style={styles.input}
              value={billData.payment_amount}
              onChangeText={(text) => setBillData({ ...billData, payment_amount: text })}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          
          <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>₹{parseFloat(calculateTotals().total_amt) || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Advance Amount:</Text>
            <Text style={styles.summaryValue}>₹{parseFloat(billData.payment_amount) || 0}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Remaining Amount:</Text>
            <Text style={[styles.summaryValue, styles.remainingAmount]}>
                ₹{((parseFloat(calculateTotals().total_amt) || 0) - (parseFloat(billData.payment_amount) || 0)).toFixed(2)}
            </Text>
          </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.printButton]}
            onPress={handlePrintMeasurement}
            disabled={saving}
          >
            <Text style={styles.printButtonText}>Print Measurements</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={async () => {
              console.log('Save and Print button pressed (Mobile)');
              
              try {
                setSaving(true);
                
                // Get the order number that will be used for this bill
                const currentBillNumber = await SupabaseAPI.getCurrentBillNumber();
                const orderNumber = currentBillNumber.billno;
                console.log('📋 Order number for printing (Mobile):', orderNumber);
                
                // Save the bill first
                const saved = await handleSaveBill();
                
                if (saved) {
                  console.log('✅ Bill saved successfully, now printing (Mobile)...');
                  // Use the orderNumber we got before saving
                  await handlePrintBill(orderNumber);
                } else {
                  console.log('❌ Not printing because save failed (Mobile)');
                }
              } catch (error) {
                console.error('Error in save and print (Mobile):', error);
                Alert.alert('Error', 'Failed to save and print bill: ' + error.message);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save and Print</Text>
            )}
          </TouchableOpacity>
        </View> 
      </ScrollView>
    </KeyboardAvoidingView>
  )}

      {/* Customer Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={customerModalVisible}
        onRequestClose={() => setCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Customer</Text>
              <TouchableOpacity onPress={() => setCustomerModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search customers..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredCustomers}
              keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerItem}
                  onPress={() => handleCustomerSelect(item)}
                >
                  <Text style={styles.customerItemName}>{item.name}</Text>
                  <Text style={styles.customerItemPhone}>{item.phone}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      {Platform.OS === 'web' ? null : (
        datePickerVisible && (
          <DateTimePicker
            value={activeDateField === 'order' ? selectedOrderDate : selectedDueDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date(2030, 11, 31)}
            minimumDate={new Date()}
          />
        )
      )}

      {/* Floating Action Buttons */}
      <View style={{ position: 'absolute', right: 24, bottom: 96, alignItems: 'flex-end', zIndex: 100 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#e74c3c',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 0,
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
          onPress={resetForm}
          activeOpacity={0.85}
          disabled={saving}
        >
          <Ionicons name="refresh" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{ height: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginTop: 32, // bring header down
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2980b9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  resetButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  measurementTypeContainer: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
  },
  checkbox: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: '#2980b9',
    borderColor: '#2980b9',
  },
  checkboxText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  measurementSection: {
    marginBottom: 16,
  },
  measurementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  measurementInput: {
    width: '48%',
    marginBottom: 12,
    marginRight: '4%',
  },
  measurementLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  measurementTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  detailsSection: {
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailInput: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 4,
  },
  detailTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  extraTextArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  billingTable: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: Platform.select({ web: 8, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: Platform.select({ web: 13, default: 16 }),
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: Platform.select({ web: 6, default: 12 }),
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableItemText: {
    flex: 2,
    fontSize: Platform.select({ web: 12, default: 16 }),
    color: '#2c3e50',
  },
  tableQtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: Platform.select({ web: 4, default: 8 }),
    fontSize: Platform.select({ web: 12, default: 16 }),
    textAlign: 'center',
    backgroundColor: '#fff',
    minWidth: Platform.select({ web: 40, default: 60 }),
  },
  tableAmountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: Platform.select({ web: 4, default: 8 }),
    fontSize: Platform.select({ web: 12, default: 16 }),
    textAlign: 'center',
    backgroundColor: '#fff',
    minWidth: Platform.select({ web: 50, default: 70 }),
  },
  totalRow: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 2,
    borderTopColor: '#ddd',
  },
  totalText: {
    fontSize: Platform.select({ web: 13, default: 16 }),
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalInput: {
    fontSize: Platform.select({ web: 13, default: 16 }),
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickerOptionSelected: {
    backgroundColor: '#2980b9',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  pickerOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  workerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  workerSelectorText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  workerSelectorArrow: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  selectedWorkersContainer: {
    marginTop: 12,
  },
  selectedWorkerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedWorkerText: {
    fontSize: 16,
    color: '#2c3e50',
  },
  removeWorkerButton: {
    backgroundColor: '#e74c3c',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeWorkerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#2c3e50',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  remainingAmount: {
    color: '#e74c3c',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: Platform.select({ web: 24, default: 16 }),
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Platform.select({ web: 14, default: 16 }),
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
  },
  printButton: {
    backgroundColor: '#27ae60',
  },
  printButtonText: {
    color: '#fff',
    fontSize: Platform.select({ web: 14, default: 16 }),
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2980b9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: Platform.select({ web: 14, default: 16 }),
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalSearchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  customerItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  customerItemPhone: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  workerItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  workerItemInfo: {
    flex: 1,
  },
  workerItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  workerItemRate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  workerItemCheck: {
    fontSize: 18,
    color: '#27ae60',
    fontWeight: 'bold',
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    minWidth: 150,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  clearDateButton: {
    padding: 4,
    marginLeft: 4,
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearDateButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  calendarContainer: {
    padding: 16,
  },
  calendarWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  calendarNavButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  calendarMonthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: 0.5,
  },
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendToday: {
    backgroundColor: '#10b981',
  },
  legendSelected: {
    backgroundColor: '#6366f1',
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: '13.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  calendarDayHeader: {
    width: '13.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calendarDayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarDayEmpty: {
    width: '13.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  calendarDayToday: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    elevation: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  calendarDayTodayText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  calendarDaySelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    elevation: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  calendarDaySelectedText: {
    fontWeight: '700',
    color: '#ffffff',
  },
  calendarDayPast: {
    backgroundColor: '#f9fafb',
    borderColor: '#f3f4f6',
  },
  calendarDayPastText: {
    color: '#9ca3af',
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  calendarFooter: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calendarFooterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
}); 