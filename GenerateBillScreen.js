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

const { width } = Dimensions.get('window');

// Function to expand orders by garment type and quantity
// Based on the backend logic: each garment gets its own order row, so we need to group by bill_id and number them
const expandOrdersByGarmentAndQuantity = (orders) => {
  // Group orders by bill_id first
  const ordersByBill = {};
  orders.forEach(order => {
    const billId = order.bill_id || 'no-bill';
    if (!ordersByBill[billId]) {
      ordersByBill[billId] = [];
    }
    ordersByBill[billId].push(order);
  });
  
  const finalExpandedOrders = [];
  
  // Process each bill group to create proper garment rows
  Object.entries(ordersByBill).forEach(([billId, billOrders]) => {
    // Get the first order to access bill data
    const firstOrder = billOrders[0];
    const bill = firstOrder.bills || {};
    
    // Define garment types and their quantities from the bill
    const garmentTypes = [
      { type: 'Suit', qty: parseInt(bill.suit_qty) || 0 },
      { type: 'Safari/Jacket', qty: parseInt(bill.safari_qty) || 0 },
      { type: 'Pant', qty: parseInt(bill.pant_qty) || 0 },
      { type: 'Shirt', qty: parseInt(bill.shirt_qty) || 0 },
      { type: 'Sadri', qty: parseInt(bill.sadri_qty) || 0 }
    ];
    
    // Create rows for each garment type based on quantities
    garmentTypes.forEach(({ type, qty }) => {
      if (qty > 0) {
        // Create multiple rows if quantity > 1
        for (let i = 0; i < qty; i++) {
          finalExpandedOrders.push({
            ...firstOrder,
            // Create unique ID for each expanded row
            expanded_id: firstOrder.id + '_' + type + '_' + i,
            original_id: firstOrder.id, // Keep reference to original order
            garment_type: type,
            expanded_garment_type: type,
            garment_quantity: 1, // Each row represents quantity of 1
            garment_index: i, // This will be 0, 1, 2, etc. for each garment type
          });
        }
      }
    });
  });
  
  return finalExpandedOrders;
};

// Generate measurements table for printing
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

// Generate bill items table for printing
function generateBillItemsTable(orders) {
  if (!orders || orders.length === 0) {
    return '<tr><td colspan="3" style="text-align: center;">No items found</td></tr>';
  }
  
  const rows = orders.map(order => `
    <tr>
      <td style="text-align: left;">${order.garment_type || 'Unknown'}</td>
      <td style="text-align: center;">1</td>
      <td style="text-align: right;">₹${parseFloat(order.total_amt || 0).toFixed(2)}</td>
    </tr>
  `).join('');
    
  return rows || '<tr><td colspan="3" style="text-align: center;">No items found</td></tr>';
}

// Generate measurement HTML for printing
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
          <td><b>Bill Number:</b> ${billData.billnumberinput2}</td>
          <td><b>Date:</b> ${billData.created_at ? new Date(billData.created_at).toLocaleDateString() : 'N/A'}</td>
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

// Generate bill HTML for printing
const generateBillHTML = (billData, orders) => {
  const totalAmount = orders.reduce((sum, order) => sum + (parseFloat(order.total_amt || 0)), 0);
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
            border: 1px solid #ddd;
            padding: 8px 5px;
            font-size: 14px;
          }
          .total-section {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 14px;
          }
          .total-row.final {
            font-weight: bold;
            font-size: 16px;
            border-top: 1px solid #333;
            padding-top: 5px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="shop-name">YAK'S MEN'S WEAR</div>
            <div class="shop-subtitle">Tailoring Services</div>
            <div class="shop-address">Shop Address, City - 123456</div>
            <div class="shop-contact">Phone: +91 9876543210 | Email: info@yaksmensware.com</div>
          </div>
          
          <div class="bill-info">
            <div><strong>Bill No:</strong> ${billData.billnumberinput2}</div>
            <div><strong>Date:</strong> ${billData.created_at ? new Date(billData.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
          
          <div class="customer-info">
            <div class="info-row">
              <span><strong>Customer:</strong></span>
              <span>${billData.customer_name}</span>
            </div>
            <div class="info-row">
              <span><strong>Mobile:</strong></span>
              <span>${billData.mobile_number}</span>
            </div>
            <div class="info-row">
              <span><strong>Payment Mode:</strong></span>
              <span>${billData.payment_mode || 'N/A'}</span>
            </div>
          </div>
          
          <table class="items-table">
            <tr>
              <th style="width: 60%;">Item</th>
              <th style="width: 20%;">Qty</th>
              <th style="width: 20%;">Amount</th>
            </tr>
            ${generateBillItemsTable(orders)}
          </table>
          
          <div class="total-section">
            <div class="total-row">
              <span>Total Amount:</span>
              <span>₹${totalAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Advance Paid:</span>
              <span>₹${advanceAmount.toFixed(2)}</span>
            </div>
            <div class="total-row final">
              <span>Balance Due:</span>
              <span>₹${remainingAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>Thank you for your business!</div>
            <div>Visit us again at YAK'S MEN'S WEAR</div>
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
  const [measurementType, setMeasurementType] = useState({ pant: false, shirt: false, extra: false });
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
    const sadriQty = parseFloat(itemizedBill.sadri_qty) || 0;
    const sadriAmt = parseFloat(itemizedBill.sadri_amount) || 0;

    const totalQty = suitQty + safariQty + pantQty + shirtQty + sadriQty;
    const totalAmt = suitAmt + safariAmt + pantAmt + shirtAmt + sadriAmt;

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
            // Populate bill data
            setBillData({
              customer_name: bill.customer_name || '',
              mobile_number: bill.mobile_number || '',
              order_date: bill.created_at ? new Date(bill.created_at).toISOString().split('T')[0] : '',
              due_date: billOrders[0]?.due_date || '',
              payment_status: bill.payment_status || '',
              payment_mode: bill.payment_mode || '',
              payment_amount: bill.payment_amount || '0',
              billnumberinput2: bill.billnumberinput2 || searchQuery,
            });
            
            // Expand orders by garment type and quantity
            const expandedOrders = expandOrdersByGarmentAndQuantity(billOrders);
            setOrders(expandedOrders);
            
            // Calculate itemized bill from orders
            const itemized = {
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
              } else if (garmentType?.includes('shirt')) {
                itemized.shirt_qty = (parseInt(itemized.shirt_qty) + 1).toString();
                itemized.shirt_amount = (parseFloat(itemized.shirt_amount) + amount).toString();
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
                  const hasExtra = customerMeasurements.extra_measurements;
                  setMeasurementType({ pant: hasPant, shirt: hasShirt, extra: !!hasExtra });
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
    setBillFound(false);
  };

  const handlePrintBill = async () => {
    if (!billData) {
      Alert.alert('Error', 'No bill data to print');
      return;
    }

    try {
      const html = generateBillHTML(billData, orders);
      
      if (Platform.OS === 'web') {
        // For web, create a new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        // For mobile, use Expo Print
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Success', 'Bill generated successfully');
        }
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', `Failed to generate bill: ${error.message}`);
    }
  };

  const handlePrintMeasurements = async () => {
    if (!billData || !measurements) {
      Alert.alert('Error', 'No measurements data to print');
      return;
    }

    try {
      const html = generateMeasurementHTML(billData, measurements);
      
      if (Platform.OS === 'web') {
        // For web, create a new window and print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        // For mobile, use Expo Print
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
