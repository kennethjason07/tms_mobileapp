import React, { useState, useEffect, useRef } from 'react';
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
  StatusBar,
} from 'react-native';
import WebScrollView from './components/WebScrollView';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseAPI } from './supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { generateProfessionalBillHTML, generateMeasurementHTML } from './utils/billGenerator';

const { width } = Dimensions.get('window');

// Function to split comma-separated garment types into individual rows
const splitCommaGarmentsIntoRows = (orders) => {
  console.log('\n📋 PROCESSING ORDERS: Splitting comma-separated garments...');
  console.log(`📊 Input orders: ${orders.length}`);
  
  const finalOrders = [];
  let splitCount = 0;
  
  orders.forEach(order => {
    if (order.garment_type && order.garment_type.includes(',')) {
      // Split comma-separated garments into individual rows
      const garmentTypes = order.garment_type.split(',').map(g => g.trim());
      console.log(`🔄 Splitting order ${order.id} with garments: ${garmentTypes.join(', ')}`);
      
      garmentTypes.forEach((garmentType, index) => {
        if (garmentType) { // Skip empty strings
          finalOrders.push({
            ...order,
            // Create unique ID for split garments
            expanded_id: `${order.id}_split_${index}`,
            original_id: order.id,
            garment_type: garmentType,
            garment_index: index,
            // Distribute the total amount equally among garments
            total_amt: Math.round((order.total_amt / garmentTypes.length) * 100) / 100
          });
          splitCount++;
        }
      });
    } else {
      // Keep orders with single garment as-is
      finalOrders.push(order);
    }
  });
  
  console.log(`✅ Split ${splitCount} garment entries from comma-separated records`);
  
  // Sort the final orders
  const sortedOrders = finalOrders.sort((a, b) => {
    const billNumberA = Number(a.billnumberinput2) || 0;
    const billNumberB = Number(b.billnumberinput2) || 0;
    
    if (billNumberB !== billNumberA) {
      return billNumberB - billNumberA; // Descending: highest first
    }
    
    // Secondary sort by original order ID descending
    const orderIdA = Number(a.original_id || a.id) || 0;
    const orderIdB = Number(b.original_id || b.id) || 0;
    if (orderIdB !== orderIdA) {
      return orderIdB - orderIdA;
    }
    
    // Tertiary sort by garment index to maintain order within split garments
    return (a.garment_index || 0) - (b.garment_index || 0);
  });
  
  console.log('\n📋 FINAL SORTED ORDERS:');
  console.log('Total orders (after splitting):', sortedOrders.length);
  if (sortedOrders.length > 0) {
    console.log('Top 5 orders after sorting and splitting:');
    sortedOrders.slice(0, 5).forEach((order, index) => {
      console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}`);
    });
  }
  
  return sortedOrders;
};

// Generate measurements table for printing


// Generate measurement HTML for printing




// Legacy function - keeping for backward compatibility
const generateBillHTML = (billData, orders) => {
  // Supabase public URL for the suit icon
  const suitImageUrl = "https://oeqlxurzbdvliuqutqyo.supabase.co/storage/v1/object/public/suit-images/suit-icon.jpg";
  
  // Fallback base64 image (simple suit icon)
  const fallbackSuitIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiMyYzNlNTAiLz4KICA8IS0tIFN1aXQgamFja2V0IC0tPgogIDxyZWN0IHg9IjEwIiB5PSIxNSIgd2lkdGg9IjMwIiBoZWlnaHQ9IjI1IiBmaWxsPSIjMzQ0OTVlIi8+CiAgPCEtLSBTdWl0IGNvbGxhciAtLT4KICA8cGF0aCBkPSJNMjAgMTVMMjUgMTBMMzAgMTVaIiBmaWxsPSIjZmZmIi8+CiAgPCEtLSBTdWl0IGJ1dHRvbnMgLS0+CiAgPGNpcmNsZSBjeD0iMjUiIGN5PSIyMiIgcj0iMSIgZmlsbD0iI2ZmZiIvPgogIDxjaXJjbGUgY3g9IjI1IiBjeT0iMjciIHI9IjEiIGZpbGw9IiNmZmYiLz4KICA8Y2lyY2xlIGN4PSIyNSIgY3k9IjMyIiByPSIxIiBmaWxsPSIjZmZmIi8+CiAgPCEtLSBTdWl0IHBvY2tldCAtLT4KICA8cmVjdCB4PSIxMyIgeT0iMjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KICA8IS0tIFRleHQgLS0+CiAgPHRleHQgeD0iMjUiIHk9IjQ2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNiIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U1VJVDwvdGV4dD4KPC9zdmc+";

  // Calculate totals and organize data
  const garmentTotals = {};
  let totalAmount = 0;
  let totalQuantity = 0;
  
  // Aggregate quantities and amounts by garment type
  orders.forEach(order => {
    const garmentType = order.garment_type || 'Unknown';
    const amount = parseFloat(order.total_amt || 0);
    
    if (!garmentTotals[garmentType]) {
      garmentTotals[garmentType] = { qty: 0, amount: 0 };
    }
    
    garmentTotals[garmentType].qty += 1;
    garmentTotals[garmentType].amount += amount;
    totalAmount += amount;
    totalQuantity += 1;
  });
  
  const advanceAmount = parseFloat(billData.payment_amount || 0);
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
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bill</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    .bill-container {
      width: 100%;
      max-width: 210mm;
      margin: auto;
      padding: 20px;
      padding-top: 200px;
      box-sizing: border-box;
    }
    .section-title {
      text-align: center;
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .info-box {
      width: 100%;
      margin-bottom: 20px;
    }
    .info-box label {
      display: block;
      font-size: 14px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .info-row div {
      flex: 1;
      margin-right: 10px;
    }
    .info-row div:last-child {
      margin-right: 0;
    }
    input {
      width: 100%;
      padding: 5px;
      border: 1px solid #000;
      box-sizing: border-box;
      font-family: inherit;
      font-size: 14px;
    }
    .table-section {
      display: flex;
      justify-content: space-between;
    }
    .items-box {
      flex: 1;
      border: 1px solid #000;
      margin-right: 15px;
    }
    .items-box table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .items-box th, .items-box td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
    }
    .items-box input {
      width: 90%;
      border: none;
      text-align: center;
      background: transparent;
    }
    .image-box {
      width: 220px;
      text-align: center;
    }
    .image-box img {
      width: 100%;
      max-width: 220px;
      height: auto;
      max-height: 280px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .suit-icon {
      width: 50px !important;
      height: 50px !important;
      object-fit: contain !important;
      border-radius: 6px !important;
      background: rgba(255,255,255,0.9) !important;
      padding: 4px !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      margin: 5px auto !important;
      display: block !important;
      border: 1px solid #ddd !important;
    }
    .suit-box .suit-icon {
      width: 50px !important;
      height: 50px !important;
      margin: 5px auto !important;
    }
    .suit-icon-fallback {
      width: 50px;
      height: 50px;
      background: rgba(255,255,255,0.9);
      border-radius: 6px;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin: 5px auto;
    }
    .footer-box {
      margin-top: 20px;
      text-align: center;
      font-size: 13px;
    }
    .footer-box span {
      display: block;
      margin-top: 5px;
      color: blue;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="bill-container">

    <div class="section-title">Customer Information</div>

    <div class="info-box">
      <label>Order Number:</label>
      <input type="text" value="${billData.billnumberinput2 || ''}" readonly>

      <div class="info-row">
        <div>
          <label>Customer Name:</label>
          <input type="text" value="${billData.customer_name || ''}" readonly>
        </div>
        <div>
          <label>Mobile Number:</label>
          <input type="text" value="${billData.mobile_.number || ''}" readonly>
        </div>
      </div>

      <div class="info-row">
        <div>
          <label>Date:</label>
          <input type="text" value="${orderDate}" readonly>
        </div>
        <div>
          <label>Delivery Date:</label>
          <input type="text" value="${dueDate}" readonly>
        </div>
      </div>
    </div>

    <div class="table-section">
      <div class="items-box">
        <table>
          <tr>
            <th>Particulars</th>
            <th>Qty</th>
            <th>Amount</th>
          </tr>
          <tr>
            <td>Suit</td>
            <td><input type="text" value="${garmentTotals['Suit']?.qty || ''}" readonly></td>
            <td><input type="text" value="${garmentTotals['Suit']?.amount ? garmentTotals['Suit'].amount.toFixed(2) : ''}" readonly></td>
          </tr>
          <tr>
            <td>Safari/Jacket</td>
            <td><input type="text" value="${garmentTotals['Safari/Jacket']?.qty || garmentTotals['Safari']?.qty || garmentTotals['Jacket']?.qty || ''}" readonly></td>
            <td><input type="text" value="${(garmentTotals['Safari/Jacket']?.amount || garmentTotals['Safari']?.amount || garmentTotals['Jacket']?.amount || 0) > 0 ? (garmentTotals['Safari/Jacket']?.amount || garmentTotals['Safari']?.amount || garmentTotals['Jacket']?.amount || 0).toFixed(2) : ''}" readonly></td>
          </tr>
          <tr>
            <td>Pant</td>
            <td><input type="text" value="${garmentTotals['Pant']?.qty || ''}" readonly></td>
            <td><input type="text" value="${garmentTotals['Pant']?.amount ? garmentTotals['Pant'].amount.toFixed(2) : ''}" readonly></td>
          </tr>
          <tr>
            <td>Shirt</td>
            <td><input type="text" value="${garmentTotals['Shirt']?.qty || ''}" readonly></td>
            <td><input type="text" value="${garmentTotals['Shirt']?.amount ? garmentTotals['Shirt'].amount.toFixed(2) : ''}" readonly></td>
          </tr>
          <tr>
            <td>Sadri</td>
            <td><input type="text" value="${garmentTotals['Sadri']?.qty || ''}" readonly></td>
            <td><input type="text" value="${garmentTotals['Sadri']?.amount ? garmentTotals['Sadri'].amount.toFixed(2) : ''}" readonly></td>
          </tr>
          <tr>
            <td><b>Total</b></td>
            <td><input type="text" value="${totalQuantity}" readonly></td>
            <td><input type="text" value="${totalAmount.toFixed(2)}" readonly></td>
          </tr>
        </table>
      </div>

      <div class="image-box">
        <img src="${suitImageUrl}" 
             alt="Terms and Conditions" 
             style="width: 220px; height: auto; max-height: 280px; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; background: white;"
             onload="console.log('✅ Full Supabase image loaded!');"
             onerror="console.log('❌ Full Supabase image failed'); this.style.display='none';"
      </div>
    </div>

    <div class="footer-box">
      Thank You, Visit Again!
      <span>Sunday Holiday</span>
    </div>

  </div>
  
</body>
</html>
  `;
};

export default function GenerateBillScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [activeDateField, setActiveDateField] = useState(null); // 'order' or 'due'
  const [selectedOrderDate, setSelectedOrderDate] = useState(new Date());
  const [measurementSelectionVisible, setMeasurementSelectionVisible] = useState(false);
  const [availableMeasurements, setAvailableMeasurements] = useState({ pant: false, shirt: false, suit: false });
  
  // Use IST timezone for initial date
  const getISTDateString = () => {
    const utcDate = new Date();
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
    return istDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };
  
  const [billData, setBillData] = useState({
    customer_name: '',
    mobile_number: '',
    order_date: getISTDateString(), // Use IST date
    due_date: '',
    payment_status: 'pending',
    payment_mode: '',
    payment_amount: '0',
    billnumberinput2: '',
  });
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState({
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
    shirt_type: 'Shirt',
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
    suit_length: 0,
    suit_body: '',
    suit_loose: '',
    suit_shoulder: 0,
    suit_astin: 0,
    suit_collar: 0,
    suit_aloose: 0,
    suit_callar: '',
    suit_cuff: '',
    suit_pkt: '',
    suit_looseshirt: '',
    suit_dt_tt: '',
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
  const [measurementType, setMeasurementType] = useState({ pant: false, shirt: false, suit: false, extra: false });
  const [billFound, setBillFound] = useState(false);
  
  // Scroll refs for both web and mobile
  const webScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Responsive layout calculations
  const isSmallScreen = screenData.width < 768;
  const isMediumScreen = screenData.width >= 768 && screenData.width < 1024;
  const isLargeScreen = screenData.width >= 1024;
  const isExtraLargeScreen = screenData.width >= 1440;

  // Dynamic grid columns based on screen size
  const getMeasurementColumns = () => {
    if (isSmallScreen) return 1; // 1 column on small screens
    if (isMediumScreen) return 2; // 2 columns on medium screens
    if (isLargeScreen) return 3; // 3 columns on large screens
    if (isExtraLargeScreen) return 4; // 4 columns on extra large screens
    return 2; // fallback
  };

  // Dynamic input width based on screen size and columns
  const getMeasurementInputWidth = () => {
    const columns = getMeasurementColumns();
    const gap = 8; // gap between items
    return `${(100 / columns) - (gap * (columns - 1) / columns)}%`;
  };

  // Dynamic button layout
  const getButtonLayout = () => {
    if (isSmallScreen) return { direction: 'column', gap: 8 };
    return { direction: 'row', gap: 16 };
  };

  // Dynamic modal width
  const getModalWidth = () => {
    if (isSmallScreen) return '95%';
    if (isMediumScreen) return '80%';
    if (isLargeScreen) return '60%';
    return '50%';
  };

  // Dynamic table font size
  const getTableFontSize = () => {
    if (isSmallScreen) return 12;
    if (isMediumScreen) return 14;
    return 16;
  };

  // Dynamic padding based on screen size
  const getResponsivePadding = () => {
    if (isSmallScreen) return 12;
    if (isMediumScreen) return 16;
    if (isLargeScreen) return 20;
    return 16; // fallback
  };

  // Dynamic font sizes
  const getFontSizes = () => {
    if (isSmallScreen) return { title: 16, subtitle: 14, input: 14, label: 13 };
    if (isMediumScreen) return { title: 18, subtitle: 16, input: 15, label: 14 };
    if (isLargeScreen) return { title: 20, subtitle: 18, input: 16, label: 15 };
    return { title: 18, subtitle: 16, input: 15, label: 14 }; // fallback
  };

  // Dynamic section spacing
  const getSectionSpacing = () => {
    if (isSmallScreen) return 12;
    if (isMediumScreen) return 16;
    if (isLargeScreen) return 20;
    return 16; // fallback
  };

  const fontSizes = getFontSizes();
  const responsivePadding = getResponsivePadding();
  const measurementColumns = getMeasurementColumns();
  const measurementInputWidth = getMeasurementInputWidth();
  const sectionSpacing = getSectionSpacing();
  const buttonLayout = getButtonLayout();
  const modalWidth = getModalWidth();
  const tableFontSize = getTableFontSize();

  const calculateTotals = () => {
    const suitQty = parseFloat(itemizedBill.suit_qty) || 0;
    const suitAmt = parseFloat(itemizedBill.suit_amount) || 0;
    const safariQty = parseFloat(itemizedBill.safari_qty) || 0;
    const safariAmt = parseFloat(itemizedBill.safari_amount) || 0;
    const pantQty = parseFloat(itemizedBill.pant_qty) || 0;
    const pantAmt = parseFloat(itemizedBill.pant_amount) || 0;
    const shirtQty = parseFloat(itemizedBill.shirt_qty) || 0;
    const shirtAmt = parseFloat(itemizedBill.shirt_amount) || 0;
    const nshirtQty = parseFloat(itemizedBill.nshirt_qty) || 0;
    const nshirtAmt = parseFloat(itemizedBill.nshirt_amount) || 0;
    const sadriQty = parseFloat(itemizedBill.sadri_qty) || 0;
    const sadriAmt = parseFloat(itemizedBill.sadri_amount) || 0;

    const totalQty = suitQty + safariQty + pantQty + shirtQty + nshirtQty + sadriQty;
    const totalAmt = suitAmt + safariAmt + pantAmt + shirtAmt + nshirtAmt + sadriAmt;

    return {
      total_qty: totalQty.toString(),
      total_amt: totalAmt.toFixed(2)
    };
  };

  const handleDateChange = (event, date) => {
    setDatePickerVisible(false);
    if (date) {
      // Convert selected date to IST timezone
      const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
      const formattedDate = istDate.toISOString().split('T')[0];
      console.log('🇮🇳 Date selected (IST):', formattedDate);
      
      if (activeDateField === 'order') {
        setBillData(prev => ({ ...prev, order_date: formattedDate }));
        setSelectedOrderDate(date);
      } else if (activeDateField === 'due') {
        setBillData(prev => ({ ...prev, due_date: formattedDate }));
        setSelectedDueDate(date);
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a bill number');
      return;
    }

    try {
      setSearching(true);
      setBillFound(false);

      // Search for orders with the bill number
      const searchResults = await SupabaseAPI.searchOrders(searchQuery);
      
      if (searchResults && searchResults.length > 0) {
        // Get the first order to extract bill information
        const firstOrder = searchResults[0];
        
        if (firstOrder.bill_id) {
          // Get complete bill information
          const { orders: billOrders, bill } = await SupabaseAPI.getOrdersByBillId(firstOrder.bill_id);
          
          if (bill && billOrders) {
            // Debug: Log the actual data structure
            console.log('🔍 DEBUG: Bill data:', JSON.stringify(bill, null, 2));
            console.log('🔍 DEBUG: First order data:', JSON.stringify(billOrders[0], null, 2));
            console.log('🔍 DEBUG: Available bill fields:', Object.keys(bill));
            console.log('🔍 DEBUG: Available order fields:', billOrders[0] ? Object.keys(billOrders[0]) : 'No orders');
            
            // Populate bill data with multiple possible field names
            const orderDate = bill.order_date || bill.date_issue || bill.created_at || bill.today_date || 
                             billOrders[0]?.order_date || billOrders[0]?.date_issue || billOrders[0]?.created_at;
            
            console.log('📅 DEBUG: Trying order date fields:');
            console.log('  bill.order_date:', bill.order_date);
            console.log('  bill.date_issue:', bill.date_issue);
            console.log('  bill.created_at:', bill.created_at);
            console.log('  bill.today_date:', bill.today_date);
            console.log('  billOrders[0]?.order_date:', billOrders[0]?.order_date);
            console.log('  billOrders[0]?.date_issue:', billOrders[0]?.date_issue);
            console.log('  billOrders[0]?.created_at:', billOrders[0]?.created_at);
            console.log('  Final orderDate selected:', orderDate);
            
            setBillData({
              customer_name: bill.customer_name || '',
              mobile_number: bill.mobile_number || '',
              order_date: orderDate ? new Date(orderDate).toISOString().split('T')[0] : '',
              due_date: bill.due_date || bill.delivery_date || billOrders[0]?.due_date || '',
              payment_status: bill.payment_status || billOrders[0]?.payment_status || 'pending',
              payment_mode: bill.payment_mode || billOrders[0]?.payment_mode || '',
              payment_amount: bill.payment_amount || billOrders[0]?.payment_amount || '0',
              billnumberinput2: bill.billnumberinput2 || searchQuery,
            });
            
            // Split comma-separated garments into individual rows
            const processedOrders = splitCommaGarmentsIntoRows(billOrders);
            setOrders(processedOrders);
            
            // Calculate itemized bill from orders
            const itemized = {
              suit_qty: (bill.suit_qty || 0).toString(),
              suit_amount: (bill.suit_amount || 0).toString(),
              safari_qty: (bill.safari_qty || 0).toString(),
              safari_amount: (bill.safari_amount || 0).toString(),
              pant_qty: (bill.pant_qty || 0).toString(),
              pant_amount: (bill.pant_amount || 0).toString(),
              shirt_qty: (bill.shirt_qty || 0).toString(),
              shirt_amount: (bill.shirt_amount || 0).toString(),
              nshirt_qty: (bill.nshirt_qty || 0).toString(),
              nshirt_amount: (bill.nshirt_amount || 0).toString(),
              sadri_qty: (bill.sadri_qty || 0).toString(),
              sadri_amount: (bill.sadri_amount || 0).toString(),
              total_qty: '0',
              total_amt: '0',
            };
            
            let totalAmount = 0;
            let totalQty = 0;
            
            billOrders.forEach(order => {
              const amount = parseFloat(order.total_amt || 0);
              totalAmount += amount;
              totalQty += 1;
              
              const garmentType = order.garment_type?.toLowerCase();
              if (garmentType?.includes('suit')) {
                itemized.suit_qty = (parseInt(itemized.suit_qty) + 1).toString();
                itemized.suit_amount = (parseFloat(itemized.suit_amount) + amount).toString();
              } else if (garmentType?.includes('safari') || garmentType?.includes('jacket')) {
                itemized.safari_qty = (parseInt(itemized.safari_qty) + 1).toString();
                itemized.safari_amount = (parseFloat(itemized.safari_amount) + amount).toString();
              } else if (garmentType?.includes('pant')) {
                itemized.pant_qty = (parseInt(itemized.pant_qty) + 1).toString();
                itemized.pant_amount = (parseFloat(itemized.pant_amount) + amount).toString();
              } else if (garmentType?.includes('shirt') && !garmentType?.includes('n.shirt')) {
                itemized.shirt_qty = (parseInt(itemized.shirt_qty) + 1).toString();
                itemized.shirt_amount = (parseFloat(itemized.shirt_amount) + amount).toString();
              } else if (garmentType?.includes('n.shirt')) {
                itemized.nshirt_qty = (parseInt(itemized.nshirt_qty) + 1).toString();
                itemized.nshirt_amount = (parseFloat(itemized.nshirt_amount) + amount).toString();
              } else if (garmentType?.includes('sadri')) {
                itemized.sadri_qty = (parseInt(itemized.sadri_qty) + 1).toString();
                itemized.sadri_amount = (parseFloat(itemized.sadri_amount) + amount).toString();
              }
            });
            
            itemized.total_amt = totalAmount.toString();
            itemized.total_qty = totalQty.toString();
            setItemizedBill(itemized);
            
            // Try to get measurements if mobile number is available
            if (bill.mobile_number) {
              try {
                const customerMeasurements = await SupabaseAPI.getMeasurementsByMobileNumber(bill.mobile_number);
                if (customerMeasurements) {
                  setMeasurements(customerMeasurements);
                  // Set measurement types based on found measurements
                  const hasShirt = Object.keys(customerMeasurements).some(key => key.includes('shirt'));
                  const hasPant = Object.keys(customerMeasurements).some(key => key.includes('pant'));
                  const hasSuit = Object.keys(customerMeasurements).some(key => key.includes('suit'));
                  const hasSafari = Object.keys(customerMeasurements).some(key => key.includes('safari'));
                  const hasNShirt = Object.keys(customerMeasurements).some(key => key.includes('nshirt'));
                  const hasSadri = Object.keys(customerMeasurements).some(key => key.includes('sadri'));
                  const hasExtra = customerMeasurements.extra_measurements;
                  setMeasurementType({ 
                    pant: hasPant, 
                    shirt: hasShirt, 
                    suit: hasSuit, 
                    safari: hasSafari, 
                    nshirt: hasNShirt, 
                    sadri: hasSadri, 
                    extra: !!hasExtra 
                  });
                }
              } catch (measurementError) {
                console.log('No measurements found for customer:', measurementError);
              }
            }
            
            setBillFound(true);
            Alert.alert('Success', 'Bill found successfully!');
          } else {
            Alert.alert('Error', 'Bill details not found');
          }
        } else {
          Alert.alert('Error', 'Invalid bill data');
        }
      } else {
        Alert.alert('Not Found', 'No bill found with this number');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', `Search failed: ${error.message}`);
    } finally {
      setSearching(false);
    }
  };

  const toggleMeasurementType = (type) => {
    setMeasurementType(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const resetSearch = () => {
    setSearchQuery('');
    setBillData({
      customer_name: '',
      mobile_number: '',
      order_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_status: 'pending',
      payment_mode: '',
      payment_amount: '0',
      billnumberinput2: '',
    });
    setOrders([]);
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
      shirt_type: 'Shirt',
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
      suit_length: 0,
      suit_body: '',
      suit_loose: '',
      suit_shoulder: 0,
      suit_astin: 0,
      suit_collar: 0,
      suit_aloose: 0,
      suit_callar: '',
      suit_cuff: '',
      suit_pkt: '',
      suit_looseshirt: '',
      suit_dt_tt: '',
      // Safari/Jacket measurements
      safari_length: 0,
      safari_body: '',
      safari_loose: '',
      safari_shoulder: 0,
      safari_astin: 0,
      safari_collar: 0,
      safari_aloose: 0,
      safari_callar: '',
      safari_cuff: '',
      safari_pkt: '',
      safari_looseshirt: '',
      safari_dt_tt: '',
      // N.Shirt measurements
      nshirt_length: 0,
      nshirt_body: '',
      nshirt_loose: '',
      nshirt_shoulder: 0,
      nshirt_astin: 0,
      nshirt_collar: 0,
      nshirt_aloose: 0,
      nshirt_callar: '',
      nshirt_cuff: '',
      nshirt_pkt: '',
      nshirt_looseshirt: '',
      nshirt_dt_tt: '',
      // Sadri measurements
      sadri_length: 0,
      sadri_body: '',
      sadri_loose: '',
      sadri_shoulder: 0,
      sadri_astin: 0,
      sadri_collar: 0,
      sadri_aloose: 0,
      sadri_callar: '',
      sadri_cuff: '',
      sadri_pkt: '',
      sadri_looseshirt: '',
      sadri_dt_tt: '',
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
      nshirt_qty: '0',
      nshirt_amount: '0',
      sadri_qty: '0',
      sadri_amount: '0',
      total_qty: '0',
      total_amt: '0',
    });
    setMeasurementType({ pant: false, shirt: false, suit: false, safari: false, nshirt: false, sadri: false, extra: false });
    setBillFound(false);
  };

  const handlePrintBill = async () => {
    console.log('🖨️ handlePrintBill called');
    console.log('📱 Platform.OS:', Platform.OS);
    
    if (!billData) {
      console.log('❌ No bill data');
      Alert.alert('Error', 'No bill data to print');
      return;
    }

    try {
      console.log('📄 Generating professional bill HTML...');
      
      // Transform orders to itemizedBill format expected by shared utility
      const itemizedBill = {
        suit_qty: 0, suit_amount: 0,
        safari_qty: 0, safari_amount: 0,
        pant_qty: 0, pant_amount: 0,
        shirt_qty: 0, shirt_amount: 0,
        nshirt_qty: 0, nshirt_amount: 0,
        sadri_qty: 0, sadri_amount: 0,
      };
      
      orders.forEach(order => {
        const type = (order.garment_type || '').toLowerCase();
        const amount = parseFloat(order.total_amt || 0);
        
        if (type.includes('suit')) {
          itemizedBill.suit_qty++;
          itemizedBill.suit_amount += amount;
        } else if (type.includes('safari') || type.includes('jacket')) {
          itemizedBill.safari_qty++;
          itemizedBill.safari_amount += amount;
        } else if (type.includes('pant')) {
          itemizedBill.pant_qty++;
          itemizedBill.pant_amount += amount;
        } else if (type.includes('shirt') && !type.includes('n.shirt')) {
          itemizedBill.shirt_qty++;
          itemizedBill.shirt_amount += amount;
        } else if (type.includes('n.shirt')) {
          itemizedBill.nshirt_qty++;
          itemizedBill.nshirt_amount += amount;
        } else if (type.includes('sadri')) {
          itemizedBill.sadri_qty++;
          itemizedBill.sadri_amount += amount;
        }
      });
      
      const orderNumber = billData.billnumberinput2;
      const html = generateProfessionalBillHTML(billData, itemizedBill, orderNumber, true);
      console.log('✅ HTML generated, length:', html.length);
      
      if (Platform.OS === 'web') {
        console.log('🌐 Web platform - opening print window');
        // For web, create a new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for images to load before printing
        printWindow.onload = () => {
          const images = printWindow.document.querySelectorAll('img');
          let loadedImages = 0;
          
          if (images.length === 0) {
            // No images, print immediately
            console.log('🖨️ No images found, printing immediately');
            printWindow.print();
            return;
          }
          
          console.log(`📸 Found ${images.length} images, waiting for them to load...`);
          images.forEach((img) => {
            if (img.complete) {
              loadedImages++;
            } else {
              img.onload = () => {
                loadedImages++;
                console.log(`✅ Image loaded (${loadedImages}/${images.length})`);
                if (loadedImages === images.length) {
                  console.log('🖨️ All images loaded, printing now');
                  printWindow.print();
                }
              };
              img.onerror = () => {
                loadedImages++;
                console.log(`❌ Image failed to load (${loadedImages}/${images.length})`);
                if (loadedImages === images.length) {
                  console.log('🖨️ All images processed (some failed), printing now');
                  printWindow.print();
                }
              };
            }
          });
          
          if (loadedImages === images.length) {
            console.log('🖨️ All images already loaded, printing now');
            printWindow.print();
          }
        };
        
        // Show success message
        Alert.alert(
          'Print Ready', 
          `Bill #${billData.billnumberinput2 || 'N/A'} is ready to print. The print dialog will open once images load.`,
          [{ text: 'OK' }]
        );
      } else {
        console.log('📱 Mobile platform - using Expo Print');
        // For mobile, use Expo Print
        const result = await Print.printToFileAsync({
          html,
          base64: false,
        });
        
        console.log('Print result:', result);
        
        if (result && result.uri) {
          console.log('PDF generated successfully, sharing:', result.uri);
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(result.uri);
          } else {
            Alert.alert('Success', `Bill #${billData.billnumberinput2 || 'N/A'} generated successfully`);
          }
          
          // Show success message
          Alert.alert(
            'Bill Generated', 
            `Bill #${billData.billnumberinput2 || 'N/A'} has been generated and is ready to print or share.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Failed to generate bill PDF file');
          console.error('Print result is undefined or missing uri:', result);
        }
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', `Failed to generate bill: ${error.message}`);
    }
  };

  const executePrintMeasurements = async (selection) => {
    setMeasurementSelectionVisible(false);

    if (!billData || !measurements) {
      Alert.alert('Error', 'No measurements data to print');
      return;
    }

    try {
      // Filter measurements based on selection
      if (selection === 'both') {
         measurementsToPrint = { ...measurements };
      } else {
         measurementsToPrint = { extra_measurements: measurements.extra_measurements }; // Always keep extra
         
         Object.keys(measurements).forEach(key => {
            if (key === 'extra_measurements') return;
            
            const lowerKey = key.toLowerCase();
            let include = false;
            
            if (selection === 'pant') {
               include = lowerKey.includes('pant') || ['sidep_cross', 'plates', 'belt', 'back_p', 'wp'].includes(lowerKey);
            } else if (selection === 'shirt') {
               include = (lowerKey.includes('shirt') && !lowerKey.includes('nshirt') && !lowerKey.includes('looseshirt') && !lowerKey.includes('looseshirt')) || 
                        ['callar', 'cuff', 'pkt', 'looseshirt', 'dt_tt'].includes(lowerKey);
            } else if (selection === 'suit') {
               include = lowerKey.startsWith('suit');
            } else if (selection === 'safari') {
               include = lowerKey.startsWith('safari');
            } else if (selection === 'nshirt') {
               include = lowerKey.startsWith('nshirt');
            } else if (selection === 'sadri') {
               include = lowerKey.startsWith('sadri');
            }
            
            if (include) {
               measurementsToPrint[key] = measurements[key];
            }
         });
      }

      console.log('📄 Generating measurements HTML for selection:', selection);
      const html = generateMeasurementHTML(billData, measurementsToPrint);
      
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500); 
      } else {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Success', 'Measurements generated successfully');
        }
      }
    } catch (error) {
      console.error('Print measurements error:', error);
      Alert.alert('Error', `Failed to generate measurements: ${error.message}`);
    }
  };

  const handlePrintMeasurements = async () => {
    if (!billData || !measurements) {
      Alert.alert('Error', 'No measurements data to print');
      return;
    }
    
    // Check available measurements
    const pantKeys = ['pant_length', 'pant_kamar', 'pant_hips', 'pant_waist', 'pant_ghutna', 'pant_bottom', 'pant_seat', 'SideP_Cross', 'Plates', 'Belt', 'Back_P', 'WP'];
    const hasPant = pantKeys.some(key => measurements[key] && measurements[key] !== '0' && measurements[key] !== 0);
    
    const shirtKeys = ['shirt_length', 'shirt_body', 'shirt_loose', 'shirt_shoulder', 'shirt_astin', 'shirt_collar', 'shirt_aloose', 'Callar', 'Cuff', 'Pkt', 'LooseShirt', 'DT_TT'];
    const hasShirt = shirtKeys.some(key => measurements[key] && measurements[key] !== '0' && measurements[key] !== 0);

    const hasSuit = measurements.suit_length && measurements.suit_length !== '0';
    const hasSafari = measurements.safari_length && measurements.safari_length !== '0';
    const hasNShirt = measurements.nshirt_length && measurements.nshirt_length !== '0';
    const hasSadri = measurements.sadri_length && measurements.sadri_length !== '0';
    
    const activeTypes = [
      hasPant && 'pant', 
      hasShirt && 'shirt', 
      hasSuit && 'suit',
      hasSafari && 'safari',
      hasNShirt && 'nshirt',
      hasSadri && 'sadri'
    ].filter(Boolean);
    
    setAvailableMeasurements({ 
      pant: hasPant, 
      shirt: hasShirt, 
      suit: hasSuit,
      safari: hasSafari,
      nshirt: hasNShirt,
      sadri: hasSadri
    });
    
    if (activeTypes.length > 1) {
      setMeasurementSelectionVisible(true);
    } else if (activeTypes.length === 1) {
      executePrintMeasurements(activeTypes[0]);
    } else {
      executePrintMeasurements('both');
    }
  };


  // Dynamic styles that use responsive values
  const dynamicStyles = {
    section: {
      backgroundColor: '#fff',
      borderRadius: 16,
      padding: responsivePadding,
      marginBottom: sectionSpacing,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    sectionTitle: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: sectionSpacing,
    },
    inputLabel: {
      fontSize: fontSizes.label,
      fontWeight: '600',
      color: '#2c3e50',
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: responsivePadding,
      fontSize: fontSizes.input,
      backgroundColor: '#fff',
    },
    measurementInput: {
      width: measurementInputWidth,
      marginRight: isSmallScreen ? 0 : 8,
      marginBottom: 8,
    },
    measurementGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: isSmallScreen ? 'center' : 'flex-start',
    },
    measurementTextInput: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: responsivePadding / 2,
      fontSize: fontSizes.input,
      backgroundColor: '#fff',
      minHeight: isSmallScreen ? 40 : 44,
    },
    measurementLabel: {
      fontSize: fontSizes.label,
      color: '#2c3e50',
      marginBottom: 4,
    },
    searchRow: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      alignItems: isSmallScreen ? 'stretch' : 'center',
      gap: isSmallScreen ? 8 : 0,
    },
    searchInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: responsivePadding,
      fontSize: fontSizes.input,
      backgroundColor: '#fff',
      marginRight: isSmallScreen ? 0 : 8,
    },
    searchButton: {
      backgroundColor: '#2980b9',
      paddingHorizontal: responsivePadding,
      paddingVertical: responsivePadding,
      borderRadius: 8,
      minWidth: isSmallScreen ? '100%' : 'auto',
    },
    checkboxRow: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      gap: isSmallScreen ? 8 : 0,
    },
    checkbox: {
      paddingHorizontal: responsivePadding,
      paddingVertical: responsivePadding / 2,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      backgroundColor: '#fff',
      marginRight: isSmallScreen ? 0 : 8,
      marginBottom: isSmallScreen ? 8 : 0,
      alignItems: 'center',
    },
  };

  if (loading && !billFound) {
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
        paddingTop: Platform.OS === 'ios' ? 50 : 32,
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Generate Bill</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <WebScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingBottom: 180,
            paddingHorizontal: responsivePadding,
            minHeight: '100%'
          }}
          showsVerticalScrollIndicator={true}
        >
          {/* Search Section */}
          <View style={[dynamicStyles.section, { marginHorizontal: 0, marginTop: sectionSpacing }]}>
            <Text style={dynamicStyles.sectionTitle}>Search by Bill Number</Text>
            <View style={dynamicStyles.searchRow}>
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Enter bill number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={dynamicStyles.searchButton}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {searchQuery !== '' && (
              <TouchableOpacity
                style={[dynamicStyles.searchButton, { backgroundColor: '#95a5a6', marginTop: 10 }]}
                onPress={resetSearch}
              >
                <Text style={styles.searchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Order Number Display */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Order Number</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[dynamicStyles.input, { fontWeight: 'bold', fontSize: fontSizes.title, color: '#2c3e50' }]}
                  value={billData.billnumberinput2 ? billData.billnumberinput2.toString() : ''}
                  onChangeText={text => {
                    const numeric = text.replace(/[^0-9]/g, '');
                    setBillData(prev => ({ ...prev, billnumberinput2: numeric }));
                  }}
                  placeholder="Order Number"
                  keyboardType="numeric"
                  maxLength={12}
                />
              </View>
            </View>
          )}

          {/* Customer Information */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Customer Information</Text>
              
              <View style={styles.inputRow}>
                <Text style={dynamicStyles.inputLabel}>Customer Name:</Text>
                <TextInput
                  style={dynamicStyles.input}
                  value={billData.customer_name}
                  onChangeText={(text) => setBillData({ ...billData, customer_name: text })}
                  placeholder="Customer name"
                />
              </View>

              <View style={styles.inputRow}>
                <Text style={dynamicStyles.inputLabel}>Mobile Number:</Text>
                <TextInput
                  style={dynamicStyles.input}
                  value={billData.mobile_number}
                  onChangeText={(text) => setBillData({ ...billData, mobile_number: text })}
                  placeholder="Mobile number"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {/* Measurements Section */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Measurements</Text>
              
              {/* Measurement Type Selection */}
              <View style={styles.measurementTypeContainer}>
                <Text style={dynamicStyles.inputLabel}>Select Measurement Type:</Text>
                <View style={dynamicStyles.checkboxRow}>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.pant && styles.checkboxSelected]}
                    onPress={() => toggleMeasurementType('pant')}
                  >
                    <Text style={styles.checkboxText}>Pant</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.shirt && styles.checkboxSelected]}
                    onPress={() => toggleMeasurementType('shirt')}
                  >
                    <Text style={styles.checkboxText}>Shirt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.suit && styles.checkboxSelected]}
                    onPress={() => toggleMeasurementType('suit')}
                  >
                    <Text style={styles.checkboxText}>Suit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.safari && styles.checkboxSelected]}
                    onPress={() => toggleMeasurementType('safari')}
                  >
                    <Text style={styles.checkboxText}>Safari/Jacket</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.nshirt && styles.checkboxSelected]}
                    onPress={() => toggleMeasurementType('nshirt')}
                  >
                    <Text style={styles.checkboxText}>N.Shirt</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.sadri && styles.checkboxSelected]}
                    onPress={() => toggleMeasurementType('sadri')}
                  >
                    <Text style={styles.checkboxText}>Sadri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[dynamicStyles.checkbox, measurementType.extra && styles.checkboxSelected]}
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
                  <View style={dynamicStyles.measurementGrid}>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_length.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_length: parseFloat(text) || 0 })}
                        placeholder="Length"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Kamar:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_kamar.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_kamar: parseFloat(text) || 0 })}
                        placeholder="Kamar"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Hips:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_hips.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_hips: parseFloat(text) || 0 })}
                        placeholder="Hips"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Ran:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_waist.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_waist: parseFloat(text) || 0 })}
                        placeholder="Ran"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Ghutna:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_ghutna.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_ghutna: parseFloat(text) || 0 })}
                        placeholder="Ghutna"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Bottom:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_bottom.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_bottom: parseFloat(text) || 0 })}
                        placeholder="Bottom"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Seat:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.pant_seat.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, pant_seat: parseFloat(text) || 0 })}
                        placeholder="Seat"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Shirt Measurements */}
              {measurementType.shirt && (
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementTitle}>Shirt Measurements</Text>
                  <View style={dynamicStyles.measurementGrid}>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_length.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_length: parseFloat(text) || 0 })}
                        placeholder="Length"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Body:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_body}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_body: text })}
                        placeholder="Body"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_loose}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_loose: text })}
                        placeholder="Loose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Shoulder:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_shoulder.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_shoulder: parseFloat(text) || 0 })}
                        placeholder="Shoulder"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Astin:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_astin.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_astin: parseFloat(text) || 0 })}
                        placeholder="Astin"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Aloose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_aloose.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_aloose: parseFloat(text) || 0 })}
                        placeholder="Aloose"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.shirt_collar.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, shirt_collar: parseFloat(text) || 0 })}
                        placeholder="Collar"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Suit Measurements */}
              {measurementType.suit && (
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementTitle}>Suit Measurements</Text>
                  <View style={dynamicStyles.measurementGrid}>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_length.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_length: parseFloat(text) || 0 })}
                        placeholder="Length"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Body:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_body}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_body: text })}
                        placeholder="Body"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_loose}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_loose: text })}
                        placeholder="Loose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Shoulder:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_shoulder.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_shoulder: parseFloat(text) || 0 })}
                        placeholder="Shoulder"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Astin:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_astin.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_astin: parseFloat(text) || 0 })}
                        placeholder="Astin"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Aloose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_aloose.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_aloose: parseFloat(text) || 0 })}
                        placeholder="Aloose"
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_collar.toString()}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_collar: parseFloat(text) || 0 })}
                        placeholder="Collar"
                        keyboardType="numeric"
                      />
                    </View>
                     <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar (Detail):</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_callar}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_callar: text })}
                        placeholder="Collar Detail"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Cuff:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_cuff}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_cuff: text })}
                        placeholder="Cuff"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Pkt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_pkt}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_pkt: text })}
                        placeholder="Pkt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose Shirt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_looseshirt}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_looseshirt: text })}
                        placeholder="Loose Shirt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>DT/TT:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.suit_dt_tt}
                        onChangeText={(text) => setMeasurements({ ...measurements, suit_dt_tt: text })}
                        placeholder="DT/TT"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Safari/Jacket Measurements */}
              {measurementType.safari && (
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementTitle}>Safari/Jacket Measurements</Text>
                  <View style={dynamicStyles.measurementGrid}>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_length ? measurements.safari_length.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_length: text })}
                        placeholder="Length"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Body:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_body || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_body: text })}
                        placeholder="Body"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_loose || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_loose: text })}
                        placeholder="Loose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Shoulder:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_shoulder ? measurements.safari_shoulder.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_shoulder: text })}
                        placeholder="Shoulder"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Astin:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_astin ? measurements.safari_astin.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_astin: text })}
                        placeholder="Astin"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Aloose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_aloose ? measurements.safari_aloose.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_aloose: text })}
                        placeholder="Aloose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_collar ? measurements.safari_collar.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_collar: text })}
                        placeholder="Collar"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar (Detail):</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_callar || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_callar: text })}
                        placeholder="Collar Detail"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Cuff:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_cuff || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_cuff: text })}
                        placeholder="Cuff"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Pkt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_pkt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_pkt: text })}
                        placeholder="Pkt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose Shirt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_looseshirt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_looseshirt: text })}
                        placeholder="Loose Shirt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>DT/TT:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.safari_dt_tt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, safari_dt_tt: text })}
                        placeholder="DT/TT"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* N.Shirt Measurements */}
              {measurementType.nshirt && (
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementTitle}>N.Shirt Measurements</Text>
                  <View style={dynamicStyles.measurementGrid}>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_length ? measurements.nshirt_length.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_length: text })}
                        placeholder="Length"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Body:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_body || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_body: text })}
                        placeholder="Body"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_loose || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_loose: text })}
                        placeholder="Loose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Shoulder:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_shoulder ? measurements.nshirt_shoulder.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_shoulder: text })}
                        placeholder="Shoulder"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Astin:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_astin ? measurements.nshirt_astin.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_astin: text })}
                        placeholder="Astin"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Aloose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_aloose ? measurements.nshirt_aloose.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_aloose: text })}
                        placeholder="Aloose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_collar ? measurements.nshirt_collar.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_collar: text })}
                        placeholder="Collar"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar (Detail):</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_callar || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_callar: text })}
                        placeholder="Collar Detail"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Cuff:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_cuff || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_cuff: text })}
                        placeholder="Cuff"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Pkt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_pkt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_pkt: text })}
                        placeholder="Pkt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose Shirt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_looseshirt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_looseshirt: text })}
                        placeholder="Loose Shirt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>DT/TT:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.nshirt_dt_tt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, nshirt_dt_tt: text })}
                        placeholder="DT/TT"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Sadri Measurements */}
              {measurementType.sadri && (
                <View style={styles.measurementSection}>
                  <Text style={styles.measurementTitle}>Sadri Measurements</Text>
                  <View style={dynamicStyles.measurementGrid}>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_length ? measurements.sadri_length.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_length: text })}
                        placeholder="Length"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Body:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_body || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_body: text })}
                        placeholder="Body"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_loose || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_loose: text })}
                        placeholder="Loose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Shoulder:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_shoulder ? measurements.sadri_shoulder.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_shoulder: text })}
                        placeholder="Shoulder"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Astin:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_astin ? measurements.sadri_astin.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_astin: text })}
                        placeholder="Astin"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Aloose:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_aloose ? measurements.sadri_aloose.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_aloose: text })}
                        placeholder="Aloose"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_collar ? measurements.sadri_collar.toString() : ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_collar: text })}
                        placeholder="Collar"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Collar (Detail):</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_callar || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_callar: text })}
                        placeholder="Collar Detail"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Cuff:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_cuff || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_cuff: text })}
                        placeholder="Cuff"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Pkt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_pkt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_pkt: text })}
                        placeholder="Pkt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>Loose Shirt:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_looseshirt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_looseshirt: text })}
                        placeholder="Loose Shirt"
                      />
                    </View>
                    <View style={dynamicStyles.measurementInput}>
                      <Text style={dynamicStyles.measurementLabel}>DT/TT:</Text>
                      <TextInput
                        style={dynamicStyles.measurementTextInput}
                        value={measurements.sadri_dt_tt || ''}
                        onChangeText={(text) => setMeasurements({ ...measurements, sadri_dt_tt: text })}
                        placeholder="DT/TT"
                      />
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
          )}

          {/* Itemized Billing */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Itemized Billing</Text>
              
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
                
                {/* N.Shirt */}
                <View style={styles.tableRow}>
                  <Text style={styles.tableItemText}>N.Shirt</Text>
                  <TextInput
                    style={styles.tableQtyInput}
                    value={itemizedBill.nshirt_qty}
                    onChangeText={(text) => setItemizedBill({ ...itemizedBill, nshirt_qty: text })}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.tableAmountInput}
                    value={itemizedBill.nshirt_amount}
                    onChangeText={(text) => setItemizedBill({ ...itemizedBill, nshirt_amount: text })}
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
                  <Text style={[styles.tableQtyInput, styles.totalInput]}>{calculateTotals().total_qty}</Text>
                  <Text style={[styles.tableAmountInput, styles.totalInput]}>₹{calculateTotals().total_amt}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Order Details */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Order Details</Text>

              <View style={styles.inputRow}>
                <Text style={dynamicStyles.inputLabel}>Order Date:</Text>
                <View style={styles.dateFilterContainer}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={billData.order_date}
                      onChange={e => setBillData(prev => ({ ...prev, order_date: e.target.value }))}
                      style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
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
                </View>
              </View>

              <View style={styles.inputRow}>
                <Text style={dynamicStyles.inputLabel}>Due Date:</Text>
                <View style={styles.dateFilterContainer}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={billData.due_date}
                      onChange={e => setBillData(prev => ({ ...prev, due_date: e.target.value }))}
                      style={{ padding: 8, borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
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
                </View>
              </View>

              <View style={styles.inputRow}>
                <Text style={dynamicStyles.inputLabel}>Payment Status:</Text>
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
                <Text style={dynamicStyles.inputLabel}>Payment Mode:</Text>
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
                <Text style={dynamicStyles.inputLabel}>Advance Amount:</Text>
                <TextInput
                  style={dynamicStyles.input}
                  value={billData.payment_amount}
                  onChangeText={(text) => setBillData({ ...billData, payment_amount: text })}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Summary */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Summary</Text>
              
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
          )}

          {/* Action Buttons */}
          {billFound && (
            <View style={[styles.actionButtons, {
              flexDirection: buttonLayout.direction,
              gap: buttonLayout.gap,
              marginTop: sectionSpacing,
              marginBottom: sectionSpacing * 2,
              paddingHorizontal: 0
            }]}>
              <TouchableOpacity
                style={[styles.actionButton, styles.printButton, {
                  flex: buttonLayout.direction === 'row' ? 1 : 0,
                  paddingVertical: isSmallScreen ? 14 : 16,
                  marginRight: buttonLayout.direction === 'row' ? 8 : 0,
                  marginBottom: buttonLayout.direction === 'column' ? 8 : 0,
                  minHeight: 48,
                  backgroundColor: '#27ae60'
                }]}
                onPress={handlePrintMeasurements}
                disabled={saving}
              >
                <Text style={styles.printButtonText}>Print Measurements</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, {
                  flex: buttonLayout.direction === 'row' ? 1 : 0,
                  paddingVertical: isSmallScreen ? 14 : 16,
                  marginLeft: buttonLayout.direction === 'row' ? 8 : 0,
                  minHeight: 48
                }]}
                onPress={handlePrintBill}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Print Bill</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </WebScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingBottom: 180,
            paddingHorizontal: responsivePadding,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Section */}
          <View style={[dynamicStyles.section, { marginHorizontal: 0, marginTop: sectionSpacing }]}>
            <Text style={dynamicStyles.sectionTitle}>Search by Bill Number</Text>
            <View style={dynamicStyles.searchRow}>
              <TextInput
                style={dynamicStyles.searchInput}
                placeholder="Enter bill number..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={dynamicStyles.searchButton}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {searchQuery !== '' && (
              <TouchableOpacity
                style={[dynamicStyles.searchButton, { backgroundColor: '#95a5a6', marginTop: 10 }]}
                onPress={resetSearch}
              >
                <Text style={styles.searchButtonText}>Clear Search</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bill Details Section */}
          {billFound && billData && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Bill Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bill Number:</Text>
                <Text style={styles.detailValue}>{billData.billnumberinput2}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Customer Name:</Text>
                <Text style={styles.detailValue}>{billData.customer_name}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile Number:</Text>
                <Text style={styles.detailValue}>{billData.mobile_number}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Mode:</Text>
                <Text style={styles.detailValue}>{billData.payment_mode || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Status:</Text>
                <Text style={styles.detailValue}>{billData.payment_status || 'N/A'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total Amount:</Text>
                <Text style={styles.detailValue}>₹{billData.total_amt || 0}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Advance Amount:</Text>
                <Text style={styles.detailValue}>₹{billData.payment_amount || 0}</Text>
              </View>
            </View>
          )}

          {/* Orders Section */}
          {billFound && orders.length > 0 && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Order Items ({orders.length})</Text>
              
              {orders.map((order, index) => {
                const displayGarmentType = order.expanded_garment_type || order.garment_type || 'N/A';
                // Add garment count indicator if garment_index is a valid number (including 0)
                const hasValidIndex = typeof order.garment_index === 'number' && order.garment_index >= 0;
                const garmentDisplay = hasValidIndex ? displayGarmentType + ' (' + (order.garment_index + 1) + ')' : displayGarmentType;
                
                return (
                  <View key={index} style={styles.orderItem}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Item:</Text>
                      <Text style={styles.detailValue}>{garmentDisplay}</Text>
                    </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: order.status === 'completed' ? '#27ae60' : '#e74c3c' }]}>
                      {order.status}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>₹{order.total_amt}</Text>
                  </View>
                  {index < orders.length - 1 && <View style={styles.orderSeparator} />}
                  </View>
                );
              })}
            </View>
          )}

          {/* Measurements Section */}
          {billFound && measurements && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Customer Measurements</Text>
              <Text style={styles.measurementNote}>Measurements are available for this customer</Text>
            </View>
          )}

          {/* Action Buttons */}
          {billFound && (
            <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
              <Text style={dynamicStyles.sectionTitle}>Actions</Text>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePrintBill}
              >
                <Ionicons name="print" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Print/Download Bill</Text>
              </TouchableOpacity>
              
              {measurements && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#27ae60' }]}
                  onPress={handlePrintMeasurements}
                >
                  <Ionicons name="resize" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Print/Download Measurements</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}
      
      {datePickerVisible && (
        <DateTimePicker
          value={activeDateField === 'order' ? selectedOrderDate : selectedDueDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      <Modal
        visible={measurementSelectionVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMeasurementSelectionVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%', maxWidth: 400, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2c3e50' }}>
              Select Measurements to Print
            </Text>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#2980b9', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('shirt')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print Shirt Only</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#2980b9', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('pant')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print Pant Only</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#2980b9', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('suit')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print Suit Only</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#2980b9', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('safari')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print Safari/Jacket Only</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#2980b9', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('nshirt')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print N.Shirt Only</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ backgroundColor: '#2980b9', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('sadri')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print Sadri Only</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ backgroundColor: '#27ae60', padding: 15, borderRadius: 8, marginBottom: 10, width: '100%', alignItems: 'center' }}
              onPress={() => executePrintMeasurements('both')}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Print All Available</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ marginTop: 10, padding: 10 }}
              onPress={() => setMeasurementSelectionVisible(false)}
            >
              <Text style={{ color: '#95a5a6', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
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
    textAlign: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  orderSeparator: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 8,
  },
  measurementNote: {
    fontSize: 14,
    color: '#27ae60',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  actionButton: {
    backgroundColor: '#2980b9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  inputRow: {
    marginBottom: 16,
  },
  measurementTypeContainer: {
    marginBottom: 16,
  },
  checkboxSelected: {
    backgroundColor: '#2980b9',
  },
  checkboxText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  measurementSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  measurementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  extraTextArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  billingTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2980b9',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    flex: 1,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableItemText: {
    flex: 2,
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  tableQtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  tableAmountInput: {
    flex: 1.5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 14,
    textAlign: 'right',
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  totalRow: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 2,
    borderTopColor: '#2980b9',
  },
  totalText: {
    fontWeight: 'bold',
    color: '#2980b9',
  },
  totalInput: {
    backgroundColor: '#f8f9fa',
    borderColor: '#2980b9',
    fontWeight: 'bold',
    color: '#2980b9',
  },
  dateFilterContainer: {
    flex: 1,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  datePickerButtonText: {
    fontSize: 14,
    color: '#2c3e50',
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
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#fff',
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
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: 'bold',
  },
  remainingAmount: {
    color: '#e74c3c',
    fontSize: 16,
  },
  actionButtons: {
    paddingHorizontal: 16,
  },
  printButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#2980b9',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
