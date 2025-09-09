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
import FractionalInput from './components/FractionalInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseAPI } from './supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

function generateAllMeasurementsTable(measurements) {
  const labelize = (key) =>
    key
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  const entries = Object.entries(measurements).filter(
    ([, value]) => value !== '' && value !== null && value !== undefined
  );
  if (entries.length === 0) return '<tr><td colspan="2">No measurements entered.</td></tr>';
  return entries
    .map(
      ([key, value]) =>
        `<tr><td>${labelize(key)}</td><td>${value}</td></tr>`
    )
    .join('');
}

const generateMeasurementHTML = (billData, measurements) => `
  <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { text-align: center; }
        .info-table, .measure-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .info-table td { padding: 4px 8px; }
        .measure-table th, .measure-table td { border: 1px solid #333; padding: 8px; text-align: left; }
        .measure-table th { background: #eee; }
        .footer { text-align: center; margin-top: 24px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Yak's Men's Wear</h2>
        <div>Customer Measurement Sheet</div>
      </div>
      <table class="info-table">
        <tr>
          <td><b>Customer Name:</b> ${billData.customer_name}</td>
          <td><b>Mobile Number:</b> ${billData.mobile_number}</td>
        </tr>
        <tr>
          <td><b>Date:</b> ${billData.order_date}</td>
          <td><b>Delivery Date:</b> ${billData.due_date}</td>
        </tr>
      </table>
      <h3>All Measurements</h3>
      <table class="measure-table">
        <tr>
          <th>Measurement</th>
          <th>Value</th>
        </tr>
        ${generateAllMeasurementsTable(measurements)}
      </table>
      <div class="footer">
        Thank You, Visit Again!
      </div>
    </body>
  </html>
`;

function generateBillItemsTable(itemizedBill) {
  const items = [
    { name: 'Suit', qty: itemizedBill.suit_qty, amount: itemizedBill.suit_amount },
    { name: 'Safari/Jacket', qty: itemizedBill.safari_qty, amount: itemizedBill.safari_amount },
    { name: 'Pant', qty: itemizedBill.pant_qty, amount: itemizedBill.pant_amount },
    { name: 'Shirt', qty: itemizedBill.shirt_qty, amount: itemizedBill.shirt_amount }
  ];
  
  const rows = items
    .filter(item => parseFloat(item.qty) > 0 || parseFloat(item.amount) > 0)
    .map(item => `
      <tr>
        <td style="text-align: left;">${item.name}</td>
        <td style="text-align: center;">${item.qty || '0'}</td>
        <td style="text-align: right;">₹${parseFloat(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');
    
  if (rows === '') {
    return '<tr><td colspan="3" style="text-align: center;">No items added</td></tr>';
  }
  
  return rows;
}

const generateBillHTML = (billData, itemizedBill, orderNumber) => {
  const totalAmount = parseFloat(itemizedBill.suit_amount || 0) + 
                     parseFloat(itemizedBill.safari_amount || 0) + 
                     parseFloat(itemizedBill.pant_amount || 0) + 
                     parseFloat(itemizedBill.shirt_amount || 0);
  const advanceAmount = parseFloat(billData.payment_amount || 0);
  const remainingAmount = totalAmount - advanceAmount;
  
  return `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .bill-container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .shop-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin: 0;
          }
          .shop-subtitle {
            font-size: 16px;
            color: #ff6600;
            margin: 5px 0;
          }
          .shop-address {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .shop-contact {
            font-size: 12px;
            color: #666;
            margin: 5px 0;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 14px;
          }
          .customer-info {
            margin: 15px 0;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          .items-table th {
            background: #333;
            color: white;
            padding: 10px 5px;
            text-align: center;
            font-size: 14px;
          }
          .items-table td {
            padding: 8px 5px;
            border-bottom: 1px solid #ddd;
            font-size: 14px;
          }
          .total-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 2px solid #333;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 16px;
          }
          .terms {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 11px;
            color: #666;
          }
          .terms h4 {
            margin: 0 0 10px 0;
            color: #ff6600;
            font-size: 13px;
          }
          .terms ul {
            margin: 5px 0;
            padding-left: 15px;
          }
          .terms li {
            margin: 3px 0;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 14px;
            font-weight: bold;
          }
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <h1 class="shop-name">Yak's Men's Wear</h1>
            <p class="shop-subtitle">Prop : Jaganath Sidda</p>
            <p class="shop-address">Sulgunte Complex, Opp. Old Service Stand, Near SBI Bank, BIDAR-585 401 (K.S.)</p>
            <p class="shop-contact">Shop : 8660897168 &nbsp;&nbsp; 9448678033</p>
          </div>
          
          <div class="bill-info">
            <div><strong>Date:</strong> ${billData.order_date || new Date().toISOString().split('T')[0]}</div>
            <div><strong>No:</strong> ${orderNumber || billData.billnumberinput2 || '---'}</div>
          </div>
          
          <div class="customer-info">
            <div class="info-row">
              <span><strong>Name:</strong></span>
              <span>${billData.customer_name || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>Order No:</strong></span>
              <span>${orderNumber || billData.billnumberinput2 || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>Date:</strong></span>
              <span>${billData.order_date || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>Cell:</strong></span>
              <span>${billData.mobile_number || '---'}</span>
            </div>
            <div class="info-row">
              <span><strong>D. Date:</strong></span>
              <span>${billData.due_date || '---'}</span>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">PARTICULARS</th>
                <th>QTY.</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${generateBillItemsTable(itemizedBill)}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span><strong>TOTAL</strong></span>
              <span class="total-amount">₹${totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin: 15px 0; font-size: 12px; color: #666;">
            Good Service<br>
            Prompt Delivery
          </div>
          
          <div class="terms">
            <h4>Terms & Conditions :</h4>
            <ul>
              <li>1. Delivery will not made without <strong>Receipt</strong></li>
              <li>2. We are not responsible, if the delivery is not taken within <strong>2 months.</strong></li>
              <li>3. Trial and Complaint after <strong>7pm &</strong></li>
              <li><strong>Delivery after 7pm</strong></li>
            </ul>
          </div>
          
          <div class="footer">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Thank You, Visit Again</span>
              <span style="border: 1px solid #333; padding: 5px 15px; background: #fff;">Sunday Holiday</span>
              <span>Signature</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Helper function to parse fractional measurements
const parseFractionalMeasurement = (input) => {
  if (!input || input.trim() === '') return '';
  
  const trimmedInput = input.trim();
  
  // If it's already a decimal number, return as string
  if (!isNaN(parseFloat(trimmedInput)) && isFinite(trimmedInput)) {
    return trimmedInput;
  }
  
  // Handle mixed fractions like "22/7/2" -> 22 + 7/2 = 25.5
  const mixedFractionMatch = trimmedInput.match(/^(\d+)\/(\d+)\/(\d+)$/);
  if (mixedFractionMatch) {
    const [, whole, numerator, denominator] = mixedFractionMatch;
    const wholeNum = parseInt(whole);
    const num = parseInt(numerator);
    const den = parseInt(denominator);
    if (den !== 0) {
      const result = wholeNum + (num / den);
      return result.toString();
    }
  }
  
  // Handle simple fractions like "1/2" -> 0.5
  const fractionMatch = trimmedInput.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [, numerator, denominator] = fractionMatch;
    const num = parseInt(numerator);
    const den = parseInt(denominator);
    if (den !== 0) {
      const result = num / den;
      return result.toString();
    }
  }
  
  // If no pattern matches, return the input as is (for text fields)
  return trimmedInput;
};

// Helper function to convert measurement for database storage
const convertMeasurementForStorage = (value, isNumericField) => {
  if (!value || value.trim() === '') {
    return isNumericField ? 0 : '';
  }
  
  if (isNumericField) {
    const parsed = parseFractionalMeasurement(value);
    const numValue = parseFloat(parsed);
    return isNaN(numValue) ? 0 : numValue;
  } else {
    // For text fields, store the original input as entered by user
    return value.trim();
  }
};

export default function NewBillScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedDueDate, setSelectedDueDate] = useState(new Date());
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
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
    // Pant measurements (stored as strings to allow fractions)
    pant_length: '',
    pant_kamar: '',
    pant_hips: '',
    pant_waist: '',
    pant_ghutna: '',
    pant_bottom: '',
    pant_seat: '',
    SideP_Cross: '',
    Plates: '',
    Belt: '',
    Back_P: '',
    WP: '',
    
    // Shirt measurements (stored as strings to allow fractions)
    shirt_length: '',
    shirt_body: '',
    shirt_loose: '',
    shirt_shoulder: '',
    shirt_astin: '',
    shirt_collar: '',
    shirt_aloose: '',
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
  
  // Scroll refs for both web and mobile
  const webScrollRef = useRef(null);
  const mobileScrollRef = useRef(null);

  useEffect(() => {
    loadData();
    generateBillNumber();
  }, []);

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

        // Fill measurements if available, converting database values for display
        if (customerData.measurements) {
          const dbMeasurements = customerData.measurements;
          setMeasurements({
            // Convert numeric database values to strings for display
            pant_length: (dbMeasurements.pant_length || dbMeasurements.pant_length === 0) ? dbMeasurements.pant_length.toString() : '',
            pant_kamar: (dbMeasurements.pant_kamar || dbMeasurements.pant_kamar === 0) ? dbMeasurements.pant_kamar.toString() : '',
            pant_hips: (dbMeasurements.pant_hips || dbMeasurements.pant_hips === 0) ? dbMeasurements.pant_hips.toString() : '',
            pant_waist: (dbMeasurements.pant_waist || dbMeasurements.pant_waist === 0) ? dbMeasurements.pant_waist.toString() : '',
            pant_ghutna: (dbMeasurements.pant_ghutna || dbMeasurements.pant_ghutna === 0) ? dbMeasurements.pant_ghutna.toString() : '',
            pant_bottom: (dbMeasurements.pant_bottom || dbMeasurements.pant_bottom === 0) ? dbMeasurements.pant_bottom.toString() : '',
            pant_seat: (dbMeasurements.pant_seat || dbMeasurements.pant_seat === 0) ? dbMeasurements.pant_seat.toString() : '',
            shirt_shoulder: (dbMeasurements.shirt_shoulder || dbMeasurements.shirt_shoulder === 0) ? dbMeasurements.shirt_shoulder.toString() : '',
            shirt_astin: (dbMeasurements.shirt_astin || dbMeasurements.shirt_astin === 0) ? dbMeasurements.shirt_astin.toString() : '',
            shirt_collar: (dbMeasurements.shirt_collar || dbMeasurements.shirt_collar === 0) ? dbMeasurements.shirt_collar.toString() : '',
            shirt_aloose: (dbMeasurements.shirt_aloose || dbMeasurements.shirt_aloose === 0) ? dbMeasurements.shirt_aloose.toString() : '',
            
            // Text fields stored as-is
            SideP_Cross: dbMeasurements.SideP_Cross || '',
            Plates: dbMeasurements.Plates || '',
            Belt: dbMeasurements.Belt || '',
            Back_P: dbMeasurements.Back_P || '',
            WP: dbMeasurements.WP || '',
            shirt_length: dbMeasurements.shirt_length || '',
            shirt_body: dbMeasurements.shirt_body || '',
            shirt_loose: dbMeasurements.shirt_loose || '',
            Callar: dbMeasurements.Callar || '',
            Cuff: dbMeasurements.Cuff || '',
            Pkt: dbMeasurements.Pkt || '',
            LooseShirt: dbMeasurements.LooseShirt || '',
            DT_TT: dbMeasurements.DT_TT || '',
            extra_measurements: dbMeasurements.extra_measurements || '',
          });
        } else {
          setMeasurements({
            // Reset all measurements to empty strings to allow fractional input
            pant_length: '',
            pant_kamar: '',
            pant_hips: '',
            pant_waist: '',
            pant_ghutna: '',
            pant_bottom: '',
            pant_seat: '',
            SideP_Cross: '',
            Plates: '',
            Belt: '',
            Back_P: '',
            WP: '',
            shirt_length: '',
            shirt_body: '',
            shirt_loose: '',
            shirt_shoulder: '',
            shirt_astin: '',
            shirt_collar: '',
            shirt_aloose: '',
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
        
        // Auto-scroll to measurements section after customer data is loaded
        setTimeout(() => {
          if (Platform.OS === 'web' && webScrollRef.current) {
            try {
              webScrollRef.current.scrollTo({ y: 600, animated: true });
            } catch (error) {
              console.log('Web scroll error:', error);
            }
          } else if (mobileScrollRef.current) {
            try {
              mobileScrollRef.current.scrollTo({ y: 600, animated: true });
            } catch (error) {
              console.log('Mobile scroll error:', error);
            }
          }
        }, 500); // Small delay to ensure UI has updated
        
      } else {
        Alert.alert('Not Found', 'No customer found with this mobile number');
      }
    } catch (error) {
      console.error('Customer search error:', error);
      Alert.alert('Error', 'Failed to search customer data');
    } finally {
      setSearching(false);
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
    if (!billData.customer_name || !billData.mobile_number) {
      Alert.alert('Error', 'Please select a customer');
      return false;
    }
    if (!billData.order_date) {
      Alert.alert('Error', 'Please enter order date');
      return false;
    }
    if (!billData.due_date) {
      Alert.alert('Error', 'Please enter due date');
      return false;
    }
    const totals = calculateTotals();
    if (parseFloat(totals.total_amt) <= 0) {
      Alert.alert('Error', 'Please enter valid amounts');
      return false;
    }
    return true;
  };

  const handleSaveBill = async () => {
    console.log('handleSaveBill called');
    if (!validateForm()) return false;

    try {
      setSaving(true);

      // Convert measurements for database storage
      const measurementsForStorage = {
        // Numeric fields in database - convert fractions to decimals
        pant_length: convertMeasurementForStorage(measurements.pant_length, true),
        pant_kamar: convertMeasurementForStorage(measurements.pant_kamar, true),
        pant_hips: convertMeasurementForStorage(measurements.pant_hips, true),
        pant_waist: convertMeasurementForStorage(measurements.pant_waist, true),
        pant_ghutna: convertMeasurementForStorage(measurements.pant_ghutna, true),
        pant_bottom: convertMeasurementForStorage(measurements.pant_bottom, true),
        pant_seat: convertMeasurementForStorage(measurements.pant_seat, true),
        shirt_shoulder: convertMeasurementForStorage(measurements.shirt_shoulder, true),
        shirt_astin: convertMeasurementForStorage(measurements.shirt_astin, true),
        shirt_collar: convertMeasurementForStorage(measurements.shirt_collar, true),
        shirt_aloose: convertMeasurementForStorage(measurements.shirt_aloose, true),
        
        // Text fields in database - store as entered
        SideP_Cross: convertMeasurementForStorage(measurements.SideP_Cross, false),
        Plates: convertMeasurementForStorage(measurements.Plates, false),
        Belt: convertMeasurementForStorage(measurements.Belt, false),
        Back_P: convertMeasurementForStorage(measurements.Back_P, false),
        WP: convertMeasurementForStorage(measurements.WP, false),
        shirt_length: convertMeasurementForStorage(measurements.shirt_length, false),
        shirt_body: convertMeasurementForStorage(measurements.shirt_body, false),
        shirt_loose: convertMeasurementForStorage(measurements.shirt_loose, false),
        Callar: convertMeasurementForStorage(measurements.Callar, false),
        Cuff: convertMeasurementForStorage(measurements.Cuff, false),
        Pkt: convertMeasurementForStorage(measurements.Pkt, false),
        LooseShirt: convertMeasurementForStorage(measurements.LooseShirt, false),
        DT_TT: convertMeasurementForStorage(measurements.DT_TT, false),
        extra_measurements: convertMeasurementForStorage(measurements.extra_measurements, false),
      };

      // Upsert measurements for the customer (like legacy backend)
      try {
        const upsertResult = await SupabaseAPI.upsertMeasurements(measurementsForStorage, billData.mobile_number);
        console.log('Measurements upsert result:', upsertResult);
      } catch (err) {
        console.error('Error upserting measurements:', err);
        // Do not block bill save if measurements fail; warn and continue
        Alert.alert('Warning', 'Measurements could not be saved due to network issue. Bill will still be saved.');
      }

      // 1. Fetch current order number
      const currentBillNumber = await SupabaseAPI.getCurrentBillNumber();
      const orderNumber = currentBillNumber.billno;
      const rowId = currentBillNumber.id;

      // 2. Use orderNumber for the new bill
      const totals = calculateTotals();
      
      // CRITICAL FIX: Use IST timezone for bill dates (not UTC)
      const getISTDateString = () => {
        const utcDate = new Date();
        const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
        return istDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      };
      
      const todayStr = getISTDateString(); // Use IST date instead of UTC
      console.log('🇮🇳 Saving bill with IST date:', todayStr);
      
      let billToSave = {
        customer_name: billData.customer_name,
        mobile_number: billData.mobile_number,
        date_issue: todayStr, // IST today
        delivery_date: billData.due_date,
        today_date: todayStr, // IST today
        due_date: billData.due_date,
        payment_status: billData.payment_status,
        payment_mode: billData.payment_mode,
        payment_amount: parseFloat(billData.payment_amount) || 0,
        total_amt: parseFloat(totals.total_amt),
        total_qty: parseInt(totals.total_qty),
        suit_qty: parseInt(itemizedBill.suit_qty) || 0,
        safari_qty: parseInt(itemizedBill.safari_qty) || 0,
        pant_qty: parseInt(itemizedBill.pant_qty) || 0,
        shirt_qty: parseInt(itemizedBill.shirt_qty) || 0,
        sadri_qty: parseInt(itemizedBill.sadri_qty) || 0,
      };
      // Sanitize billToSave
      Object.keys(billToSave).forEach(key => {
        if (billToSave[key] === undefined || billToSave[key] === 'undefined') {
          billToSave[key] = null;
        }
      });

      // ✨ ENHANCED: Use Two-Stage Revenue Recognition System
      let orderData = {
        billnumberinput2: orderNumber ? orderNumber.toString() : null, // Ensure string or null
        garment_type: getGarmentTypes(),
        order_date: todayStr, // IST today
        due_date: billData.due_date,
        total_amt: parseFloat(totals.total_amt),
        payment_amount: parseFloat(billData.payment_amount) || 0,
        payment_status: billData.payment_status,
        payment_mode: billData.payment_mode,
        status: 'pending',
        Work_pay: null, // Only set after workers are assigned
        customer_name: billData.customer_name, // Add customer name for tracking
      };
      
      // Sanitize orderData
      Object.keys(orderData).forEach(key => {
        if (orderData[key] === undefined || orderData[key] === 'undefined') {
          orderData[key] = null;
        }
      });
      
      // Validate before creating
      if (!orderData.billnumberinput2) {
        Alert.alert('Error', 'Order number is missing. Please try again.');
        setSaving(false);
        return false;
      }
      
      console.log('\ud83c\udfaf Creating bill with enhanced tracking:', {
        billData: billToSave,
        orderData: orderData,
        advanceAmount: parseFloat(billData.payment_amount) || 0
      });
      
      // Use enhanced bill creation with advance payment tracking
      const result = await SupabaseAPI.createBillWithAdvanceTracking(billToSave, orderData);
      console.log('\u2705 Enhanced bill creation result:', result);
      
      if (!result || !result.bill || !result.order) {
        Alert.alert('Error', 'Failed to create bill and order. Please try again.');
        setSaving(false);
        return false;
      }
      
      const billResult = result.bill;
      const orderResult = result.order;
      const advanceRecorded = result.advance_recorded;
      const advanceAmount = result.advance_amount;
      
      if (!billResult[0] || !orderResult[0]) {
        Alert.alert('Error', 'Bill or order creation returned invalid data. Please try again.');
        setSaving(false);
        return false;
      }
      
      console.log('\u2705 BILL CREATED WITH TWO-STAGE REVENUE TRACKING:', {
        billId: billResult[0].id,
        orderId: orderResult[0].id,
        advanceRecorded,
        advanceAmount
      });

      // 3. After bill is created, increment billno
      console.log('Incrementing bill number with rowId:', rowId, 'orderNumber:', orderNumber);
      if (!rowId || !orderNumber || rowId === 'undefined' || orderNumber === 'undefined') {
        console.error('Cannot increment bill number: rowId or orderNumber is undefined');
        setSaving(false);
        return false;
      }
      await SupabaseAPI.incrementBillNumber(rowId, orderNumber);

      // Reset form after successful save
      resetForm();
      
      // Create success message with advance payment info
      let successMessage = `Bill created successfully with bill number: ${orderNumber}!`;
      if (advanceRecorded && advanceAmount > 0) {
        successMessage += `\n\n💰 Advance payment of ₹${advanceAmount.toFixed(2)} recorded as today's revenue.`;
        const remainingBalance = parseFloat(totals.total_amt) - advanceAmount;
        if (remainingBalance > 0) {
          successMessage += `\n💳 Remaining balance: ₹${remainingBalance.toFixed(2)} (will be recorded when order is marked as paid).`;
        }
      } else {
        successMessage += `\n\nℹ️ No advance payment recorded. Full amount will be recorded when order is marked as paid.`;
      }
      
      Alert.alert(
        'Success', 
        successMessage,
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
    // Use IST timezone for form reset too
    const getISTDateString = () => {
      const utcDate = new Date();
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5.5 hours for IST
      return istDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    };
    
    setBillData({
      customer_name: '',
      mobile_number: '',
      order_date: getISTDateString(), // Use IST for initial date
      due_date: '',
      payment_status: 'pending',
      payment_mode: '',
      payment_amount: '0',
    });
    setMeasurements({
      // Reset all measurements to empty strings to allow fractional input
      pant_length: '',
      pant_kamar: '',
      pant_hips: '',
      pant_waist: '',
      pant_ghutna: '',
      pant_bottom: '',
      pant_seat: '',
      SideP_Cross: '',
      Plates: '',
      Belt: '',
      Back_P: '',
      WP: '',
      shirt_length: '',
      shirt_body: '',
      shirt_loose: '',
      shirt_shoulder: '',
      shirt_astin: '',
      shirt_collar: '',
      shirt_aloose: '',
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
      const html = generateMeasurementHTML(billData, measurements);
      const result = await Print.printToFileAsync({ html });
      
      if (result && result.uri) {
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert('Error', 'Failed to generate PDF file');
        console.error('Print result:', result);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate or share measurement PDF');
      console.error('Print error:', error);
    }
  };

  const handlePrintBill = async () => {
    try {
      // Web: use pre-printed template printer if available
      if (typeof window !== 'undefined') {
        try {
          if (typeof window.printPreprintedBill === 'function') {
            console.log('Using pre-printed bill template for printing');
            window.printPreprintedBill();
            return;
          }
          if (typeof window.enhancedSaveAndPrint === 'function') {
            console.log('Using enhancedSaveAndPrint fallback');
            window.enhancedSaveAndPrint();
            return;
          }
        } catch (webPrintErr) {
          console.warn('Web print path failed, falling back to RN print:', webPrintErr);
        }
      }

      // Use current bill number or generate one if not available
      let orderNumber = billData.billnumberinput2;
      if (!orderNumber) {
        try {
          const billNumber = await generateBillNumber();
          orderNumber = billNumber;
        } catch (genError) {
          console.error('Error generating bill number:', genError);
          orderNumber = 'TEMP_' + Date.now(); // Fallback order number
        }
      }
      console.log('Generating bill HTML for order:', orderNumber);
      const html = generateBillHTML(billData, itemizedBill, orderNumber);
      console.log('HTML generated, calling Print.printToFileAsync');
      const result = await Print.printToFileAsync({ html });
      console.log('Print result:', result);
      
      if (result && result.uri) {
        console.log('PDF generated successfully, sharing:', result.uri);
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert('Error', 'Failed to generate bill PDF file');
        console.error('Print result is undefined or missing uri:', result);
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
    pickerContainer: {
      flexDirection: isSmallScreen ? 'column' : 'row',
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      overflow: 'hidden',
    },
    pickerOption: {
      flex: isSmallScreen ? 0 : 1,
      paddingVertical: responsivePadding,
      paddingHorizontal: responsivePadding,
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    tableText: {
      fontSize: tableFontSize,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: 12,
      width: modalWidth,
      maxHeight: '80%',
    },
    header: {
      backgroundColor: '#2980b9',
      paddingTop: responsivePadding * 2,
      paddingBottom: responsivePadding * 1.5,
      paddingHorizontal: responsivePadding,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      elevation: 6,
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    headerTitle: {
      fontSize: fontSizes.title + 4,
      fontWeight: 'bold',
      color: '#fff',
      textAlign: 'center',
      letterSpacing: 1,
    },
  };

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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>New Bill</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <WebScrollView
          ref={webScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingBottom: isSmallScreen ? 200 : 180,
            paddingHorizontal: responsivePadding,
            minHeight: '100%'
          }}
          showsVerticalScrollIndicator={true}
        >
        {/* Order Number Display */}
        <View style={[dynamicStyles.section, { marginHorizontal: 0, marginTop: sectionSpacing }]}>
          <Text style={dynamicStyles.sectionTitle}>Order Number</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[dynamicStyles.input, { fontWeight: 'bold', fontSize: fontSizes.title, color: '#2c3e50' }]}
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
        <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
          <Text style={dynamicStyles.sectionTitle}>Customer Information</Text>
          
          {/* Customer Search */}
          <View style={styles.searchContainer}>
            <Text style={dynamicStyles.inputLabel}>Search by Mobile Number:</Text>
            <View style={dynamicStyles.searchRow}>
              <TextInput
                style={dynamicStyles.searchInput}
                value={customerSearchMobile}
                onChangeText={setCustomerSearchMobile}
                placeholder="Enter 10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
              />
          <TouchableOpacity
                style={dynamicStyles.searchButton}
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

        {/* Measurements Section */}
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
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_length}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_length: value })}
                    placeholder="32, 1/2, 22/7/2"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Kamar:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_kamar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_kamar: value })}
                    placeholder="34, 3/4"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Hips:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_hips}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_hips: value })}
                    placeholder="36, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Ran:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_waist}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_waist: value })}
                    placeholder="32, 1/4"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Ghutna:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_ghutna}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_ghutna: value })}
                    placeholder="24, 3/8"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Bottom:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_bottom}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_bottom: value })}
                    placeholder="18, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Seat:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.pant_seat}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_seat: value })}
                    placeholder="40, 5/8"
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
                      placeholder="2, 1/2, Plain"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Plates:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Plates}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Plates: value })}
                      placeholder="4, Double"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Belt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Belt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Belt: value })}
                      placeholder="Yes, No, 1/2"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Back P:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Back_P}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Back_P: value })}
                      placeholder="2, 1/4"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>WP:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.WP}
                      onChangeValue={(value) => setMeasurements({ ...measurements, WP: value })}
                      placeholder="High, Low"
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
              <View style={dynamicStyles.measurementGrid}>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Length:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_length}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_length: value })}
                    placeholder="28, 1/2, 28/5/8"
                    keyboardType="default"
                    allowText={true}
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Body:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_body}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_body: value })}
                    placeholder="40, Loose, 3/4"
                    allowText={true}
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Loose:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_loose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_loose: value })}
                    placeholder="Regular, 1/4"
                    allowText={true}
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Shoulder:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_shoulder}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_shoulder: value })}
                    placeholder="18, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Astin:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_astin}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_astin: value })}
                    placeholder="24, 3/4"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Collar:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_collar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_collar: value })}
                    placeholder="15, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={dynamicStyles.measurementInput}>
                  <Text style={dynamicStyles.measurementLabel}>Aloose:</Text>
                  <FractionalInput
                    style={dynamicStyles.measurementTextInput}
                    value={measurements.shirt_aloose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_aloose: value })}
                    placeholder="2, 1/4"
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
                      placeholder="Round, Square"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Cuff:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Cuff}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Cuff: value })}
                      placeholder="Single, Double"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Pkt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Pkt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Pkt: value })}
                      placeholder="1, 2, Flap"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Loose:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.LooseShirt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, LooseShirt: value })}
                      placeholder="Tight, 1/4"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>DT/TT:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.DT_TT}
                      onChangeValue={(value) => setMeasurements({ ...measurements, DT_TT: value })}
                      placeholder="DT, TT"
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
        <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
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
              <Text style={[styles.tableQtyInput, styles.totalInput]}>{calculateTotals().total_qty}</Text>
              <Text style={[styles.tableAmountInput, styles.totalInput]}>₹{calculateTotals().total_amt}</Text>
            </View>
          </View>
        </View>

        {/* Order Details */}
        <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
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
        <View style={[dynamicStyles.section, { marginHorizontal: 0 }]}>
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
              minHeight: 48
            }]}
            onPress={handlePrintMeasurement}
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
            onPress={async () => {
              console.log('Save and Print button pressed');
              const saved = await handleSaveBill();
              if (saved) {
                console.log('Calling handlePrintBill after save');
                await handlePrintBill();
              } else {
                console.log('Not printing because save failed');
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
        
      </WebScrollView>
  ) : (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={mobileScrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingBottom: isSmallScreen ? 220 : 180,
          paddingHorizontal: responsivePadding
        }}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
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
                    placeholder="34, 3/4"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Hips:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_hips}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_hips: value })}
                    placeholder="36, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ran:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_waist}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_waist: value })}
                    placeholder="32, 1/4"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ghutna:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_ghutna}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_ghutna: value })}
                    placeholder="24, 3/8"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Bottom:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_bottom}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_bottom: value })}
                    placeholder="18, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Seat:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_seat}
                    onChangeValue={(value) => setMeasurements({ ...measurements, pant_seat: value })}
                    placeholder="40, 5/8"
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
                      placeholder="2, 1/2, Plain"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Plates:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Plates}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Plates: value })}
                      placeholder="4, Double"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Belt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Belt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Belt: value })}
                      placeholder="Yes, No, 1/2"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Back P:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Back_P}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Back_P: value })}
                      placeholder="2, 1/4"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>WP:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.WP}
                      onChangeValue={(value) => setMeasurements({ ...measurements, WP: value })}
                      placeholder="High, Low"
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
                    placeholder="28, 1/2, 28/5/8"
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
                    placeholder="40, Loose, 3/4"
                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Loose:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_loose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_loose: value })}
                    placeholder="Regular, 1/4"
                    allowText={true}
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Shoulder:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_shoulder}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_shoulder: value })}
                    placeholder="18, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Astin:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_astin}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_astin: value })}
                    placeholder="24, 3/4"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Collar:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_collar}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_collar: value })}
                    placeholder="15, 1/2"
                    keyboardType="default"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Aloose:</Text>
                  <FractionalInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_aloose}
                    onChangeValue={(value) => setMeasurements({ ...measurements, shirt_aloose: value })}
                    placeholder="2, 1/4"
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
                      placeholder="Round, Square"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Cuff:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Cuff}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Cuff: value })}
                      placeholder="Single, Double"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Pkt:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.Pkt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, Pkt: value })}
                      placeholder="1, 2, Flap"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Loose:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.LooseShirt}
                      onChangeValue={(value) => setMeasurements({ ...measurements, LooseShirt: value })}
                      placeholder="Tight, 1/4"
                      allowText={true}
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>DT/TT:</Text>
                    <FractionalInput
                      style={styles.detailTextInput}
                      value={measurements.DT_TT}
                      onChangeValue={(value) => setMeasurements({ ...measurements, DT_TT: value })}
                      placeholder="DT, TT"
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
              <Text style={[styles.tableQtyInput, styles.totalInput]}>{calculateTotals().total_qty}</Text>
              <Text style={[styles.tableAmountInput, styles.totalInput]}>₹{calculateTotals().total_amt}</Text>
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
              const saved = await handleSaveBill();
              if (saved) {
                console.log('Calling handlePrintMeasurement after save');
                await handlePrintMeasurement();
              } else {
                console.log('Not printing because save failed');
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
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setCustomerModalVisible(false)}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Customer</Text>
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={() => setCustomerModalVisible(false)}
                >
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
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
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

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setCustomerModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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

      {/* Fixed Floating Refresh Button - Always Visible */}
      <View style={{ position: 'absolute', right: 24, bottom: 180, alignItems: 'flex-end', zIndex: 1000 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#e74c3c',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 10,
            shadowColor: '#000',
            shadowOpacity: 0.3,
            shadowRadius: 10,
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
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tableItemText: {
    flex: 2,
    fontSize: 16,
    color: '#2c3e50',
  },
  tableQtyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  tableAmountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  totalRow: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 2,
    borderTopColor: '#ddd',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  totalInput: {
    fontSize: 16,
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
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  printButton: {
    backgroundColor: '#27ae60',
  },
  printButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#2980b9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
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
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
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
  modalCloseButton: {
    padding: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  closeButton: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalCancelButton: {
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
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