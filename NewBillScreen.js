import React, { useState, useEffect } from 'react';
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

      // Upsert measurements for the customer (like legacy backend)
      try {
        const upsertResult = await SupabaseAPI.upsertMeasurements(measurements, billData.mobile_number);
        console.log('Measurements upsert result:', upsertResult);
      } catch (err) {
        console.error('Error upserting measurements:', err);
        Alert.alert('Error', 'Failed to save measurements.');
        setSaving(false);
        return false;
      }

      // 1. Fetch current order number
      const currentBillNumber = await SupabaseAPI.getCurrentBillNumber();
      const orderNumber = currentBillNumber.billno;
      const rowId = currentBillNumber.id;

      // 2. Use orderNumber for the new bill
      const totals = calculateTotals();
      const todayStr = new Date().toISOString().split('T')[0]; // Always use today
      let billToSave = {
        customer_name: billData.customer_name,
        mobile_number: billData.mobile_number,
        date_issue: todayStr, // force today
        delivery_date: billData.due_date,
        today_date: todayStr, // force today
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

      const billResult = await SupabaseAPI.createNewBill(billToSave);
      console.log('Bill save result:', billResult);
      if (!billResult || !billResult[0] || typeof billResult[0].id !== 'number') {
        Alert.alert('Error', 'Failed to create bill. Please try again.');
        setSaving(false);
        console.log('handleSaveBill failed: bill not created');
        return false;
      }
      const billId = billResult[0].id;

      // Validate bill_id and billnumberinput2 before creating order
      console.log('orderNumber:', orderNumber, 'billId:', billId);
      if (typeof billId !== 'number' || !orderNumber || orderNumber === 'undefined' || orderNumber === undefined) {
        Alert.alert('Error', 'Order number or bill ID is invalid. Please try again.');
        setSaving(false);
        return false;
      }

      // Create individual orders for each garment based on quantities
      const garmentOrders = createIndividualGarmentOrders(billId, orderNumber, todayStr);
      
      if (garmentOrders.length === 0) {
        Alert.alert('Error', 'No garments to create orders for.');
        setSaving(false);
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
          setSaving(false);
          return false;
        }
      }
      
      console.log(`✅ Successfully created ${orderResults.length} individual garment orders`);
      
      // Check if all orders were created successfully
      if (orderResults.length !== garmentOrders.length) {
        Alert.alert('Error', 'Some orders failed to create. Please try again.');
        setSaving(false);
        return false;
      }

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
        `Bill ${orderNumber} created successfully!\n\nIndividual orders created:\n${garmentList}\n\nTotal: ${orderResults.length} garment orders`,
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

  // Create individual order objects for each garment based on quantities
  const createIndividualGarmentOrders = (billId, orderNumber, todayStr) => {
    const orders = [];
    const totals = calculateTotals();
    
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
          payment_amount: parseFloat(billData.payment_amount) || 0,
          payment_status: billData.payment_status,
          payment_mode: billData.payment_mode,
          status: 'pending',
          Work_pay: null, // Only set after workers are assigned
        };
        
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
      const html = generateMeasurementHTML(billData, measurements);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate or share measurement PDF');
      console.error(error);
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
            contentContainerStyle={Platform.OS === 'web' ? { paddingBottom: 120 } : undefined}
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
            <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_length.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_length: parseFloat(text) || 0 })}
                    placeholder="Length"
              keyboardType="numeric"
            />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Kamar:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_kamar.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_kamar: parseFloat(text) || 0 })}
                    placeholder="Kamar"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Hips:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_hips.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_hips: parseFloat(text) || 0 })}
                    placeholder="Hips"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ran:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_waist.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_waist: parseFloat(text) || 0 })}
                    placeholder="Ran"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ghutna:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_ghutna.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_ghutna: parseFloat(text) || 0 })}
                    placeholder="Ghutna"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Bottom:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_bottom.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_bottom: parseFloat(text) || 0 })}
                    placeholder="Bottom"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Seat:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_seat.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_seat: parseFloat(text) || 0 })}
                    placeholder="Seat"
                    keyboardType="numeric"
                  />
                </View>
          </View>

              {/* Pant Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Pant Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>SideP/Cross:</Text>
            <TextInput
                      style={styles.detailTextInput}
                      value={measurements.SideP_Cross}
                      onChangeText={(text) => setMeasurements({ ...measurements, SideP_Cross: text })}
                      placeholder="SideP/Cross"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Plates:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Plates}
                      onChangeText={(text) => setMeasurements({ ...measurements, Plates: text })}
                      placeholder="Plates"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Belt:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Belt}
                      onChangeText={(text) => setMeasurements({ ...measurements, Belt: text })}
                      placeholder="Belt"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Back P:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Back_P}
                      onChangeText={(text) => setMeasurements({ ...measurements, Back_P: text })}
                      placeholder="Back P"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>WP:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.WP}
                      onChangeText={(text) => setMeasurements({ ...measurements, WP: text })}
                      placeholder="WP"
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
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_length.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_length: parseFloat(text) || 0 })}
                    placeholder="Length"
              keyboardType="numeric"
            />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Body:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_body}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_body: text })}
                    placeholder="Body"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Loose:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_loose}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_loose: text })}
                    placeholder="Loose"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Shoulder:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_shoulder.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_shoulder: parseFloat(text) || 0 })}
                    placeholder="Shoulder"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Astin:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_astin.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_astin: parseFloat(text) || 0 })}
                    placeholder="Astin"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Collar:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_collar.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_collar: parseFloat(text) || 0 })}
                    placeholder="Collar"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Aloose:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_aloose.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_aloose: parseFloat(text) || 0 })}
                    placeholder="Aloose"
                    keyboardType="numeric"
                  />
                </View>
          </View>
              
              {/* Shirt Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Shirt Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Collar:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Callar}
                      onChangeText={(text) => setMeasurements({ ...measurements, Callar: text })}
                      placeholder="Collar"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Cuff:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Cuff}
                      onChangeText={(text) => setMeasurements({ ...measurements, Cuff: text })}
                      placeholder="Cuff"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Pkt:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Pkt}
                      onChangeText={(text) => setMeasurements({ ...measurements, Pkt: text })}
                      placeholder="Pkt"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Loose:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.LooseShirt}
                      onChangeText={(text) => setMeasurements({ ...measurements, LooseShirt: text })}
                      placeholder="Loose"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>DT/TT:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.DT_TT}
                      onChangeText={(text) => setMeasurements({ ...measurements, DT_TT: text })}
                      placeholder="DT/TT"
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
            <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_length.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_length: parseFloat(text) || 0 })}
                    placeholder="Length"
              keyboardType="numeric"
            />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Kamar:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_kamar.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_kamar: parseFloat(text) || 0 })}
                    placeholder="Kamar"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Hips:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_hips.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_hips: parseFloat(text) || 0 })}
                    placeholder="Hips"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ran:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_waist.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_waist: parseFloat(text) || 0 })}
                    placeholder="Ran"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Ghutna:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_ghutna.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_ghutna: parseFloat(text) || 0 })}
                    placeholder="Ghutna"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Bottom:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_bottom.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_bottom: parseFloat(text) || 0 })}
                    placeholder="Bottom"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Seat:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.pant_seat.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, pant_seat: parseFloat(text) || 0 })}
                    placeholder="Seat"
                    keyboardType="numeric"
                  />
                </View>
          </View>

              {/* Pant Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Pant Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>SideP/Cross:</Text>
            <TextInput
                      style={styles.detailTextInput}
                      value={measurements.SideP_Cross}
                      onChangeText={(text) => setMeasurements({ ...measurements, SideP_Cross: text })}
                      placeholder="SideP/Cross"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Plates:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Plates}
                      onChangeText={(text) => setMeasurements({ ...measurements, Plates: text })}
                      placeholder="Plates"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Belt:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Belt}
                      onChangeText={(text) => setMeasurements({ ...measurements, Belt: text })}
                      placeholder="Belt"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Back P:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Back_P}
                      onChangeText={(text) => setMeasurements({ ...measurements, Back_P: text })}
                      placeholder="Back P"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>WP:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.WP}
                      onChangeText={(text) => setMeasurements({ ...measurements, WP: text })}
                      placeholder="WP"
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
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_length.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_length: parseFloat(text) || 0 })}
                    placeholder="Length"
              keyboardType="numeric"
            />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Body:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_body}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_body: text })}
                    placeholder="Body"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Loose:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_loose}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_loose: text })}
                    placeholder="Loose"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Shoulder:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_shoulder.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_shoulder: parseFloat(text) || 0 })}
                    placeholder="Shoulder"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Astin:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_astin.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_astin: parseFloat(text) || 0 })}
                    placeholder="Astin"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Collar:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_collar.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_collar: parseFloat(text) || 0 })}
                    placeholder="Collar"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.measurementInput}>
                  <Text style={styles.measurementLabel}>Aloose:</Text>
                  <TextInput
                    style={styles.measurementTextInput}
                    value={measurements.shirt_aloose.toString()}
                    onChangeText={(text) => setMeasurements({ ...measurements, shirt_aloose: parseFloat(text) || 0 })}
                    placeholder="Aloose"
                    keyboardType="numeric"
                  />
                </View>
          </View>
              
              {/* Shirt Details */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>Shirt Details</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Collar:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Callar}
                      onChangeText={(text) => setMeasurements({ ...measurements, Callar: text })}
                      placeholder="Collar"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Cuff:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Cuff}
                      onChangeText={(text) => setMeasurements({ ...measurements, Cuff: text })}
                      placeholder="Cuff"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Pkt:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.Pkt}
                      onChangeText={(text) => setMeasurements({ ...measurements, Pkt: text })}
                      placeholder="Pkt"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>Loose:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.LooseShirt}
                      onChangeText={(text) => setMeasurements({ ...measurements, LooseShirt: text })}
                      placeholder="Loose"
                    />
                  </View>
                  <View style={styles.detailInput}>
                    <Text style={styles.detailLabel}>DT/TT:</Text>
                    <TextInput
                      style={styles.detailTextInput}
                      value={measurements.DT_TT}
                      onChangeText={(text) => setMeasurements({ ...measurements, DT_TT: text })}
                      placeholder="DT/TT"
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