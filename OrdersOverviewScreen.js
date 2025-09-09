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
  FlatList,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  Linking,
} from 'react-native';
import WebScrollView from './components/WebScrollView';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseAPI, supabase } from './supabase';
import { WhatsAppService, WhatsAppRedirectService } from './whatsappService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Function to expand orders by garment type and quantity while preserving sort order
// NOTE: Based on schema analysis, orders table already contains individual garments
// This function should only sort and prepare orders, not expand them
const expandOrdersByGarmentAndQuantity = (orders, expectedHighestBillNumber = null) => {
  console.log('\n📋 EXPANSION FUNCTION: Processing orders...');
  console.log(`📊 Input orders: ${orders.length}`);
  
  // Check if orders are already individual garments (they should be based on schema)
  const sampleOrder = orders[0];
  if (sampleOrder && sampleOrder.garment_type) {
    console.log('✅ Orders are already individual garments (garment_type exists)');
    console.log('🔄 Skipping expansion, just sorting and preparing...');
    
    // Just sort the existing orders
    const sortedOrders = orders.sort((a, b) => {
      const billNumberA = Number(a.billnumberinput2) || 0;
      const billNumberB = Number(b.billnumberinput2) || 0;
      
      if (billNumberB !== billNumberA) {
        return billNumberB - billNumberA; // Descending: highest first
      }
      
      // Secondary sort by order ID descending if bill numbers are same
      return (b.id || 0) - (a.id || 0);
    });
    
    console.log('\n📋 FINAL SORT VERIFICATION:');
    console.log('Total orders (no expansion needed):', sortedOrders.length);
    if (sortedOrders.length > 0) {
      const actualHighestBill = Number(sortedOrders[0].billnumberinput2) || 0;
      console.log('Top 5 orders after sorting:');
      sortedOrders.slice(0, 5).forEach((order, index) => {
        console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}`);
      });
      console.log(`Actual highest bill number in results: ${actualHighestBill}`);
      if (expectedHighestBillNumber !== null) {
        console.log(`Expected highest bill number: ${expectedHighestBillNumber}`);
        console.log(`✅ VERIFICATION: First order matches expected highest?`, 
          actualHighestBill === expectedHighestBillNumber ? 'YES ✓' : `NO ✗ (Expected: ${expectedHighestBillNumber}, Got: ${actualHighestBill})`);
      }
    }
    
    return sortedOrders;
  }
  
  // If orders don't have garment_type, proceed with legacy expansion logic
  console.log('⚠️ Orders do not have garment_type, proceeding with expansion...');
  
  // First, ensure orders are sorted by bill number descending
  const sortedOrders = orders.sort((a, b) => {
    const billNumberA = Number(a.billnumberinput2) || 0;
    const billNumberB = Number(b.billnumberinput2) || 0;
    
    if (billNumberB !== billNumberA) {
      return billNumberB - billNumberA; // Descending: highest first
    }
    
    // Secondary sort by order ID descending if bill numbers are same
    return (b.id || 0) - (a.id || 0);
  });

  // Group orders by bill_id first (maintaining sort order)
  const ordersByBill = {};
  const billOrder = []; // Track the order of bills
  
  sortedOrders.forEach(order => {
    const billId = order.bill_id || 'no-bill';
    if (!ordersByBill[billId]) {
      ordersByBill[billId] = [];
      billOrder.push(billId); // Preserve the order we encounter bills
    }
    ordersByBill[billId].push(order);
  });
  
  const finalExpandedOrders = [];
  
  // Process each bill group in the order we encountered them (highest bill numbers first)
  billOrder.forEach(billId => {
    const billOrders = ordersByBill[billId];
    
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
          const expandedId = firstOrder.id + '_' + type + '_' + i;
          console.log(`Creating expanded order: ${expandedId} for original order ${firstOrder.id}`);
          
          finalExpandedOrders.push({
            ...firstOrder,
            // Create unique ID for each expanded row
            expanded_id: expandedId,
            original_id: firstOrder.id, // Keep reference to original order
            garment_type: type,
            expanded_garment_type: type,
            garment_quantity: 1, // Each row represents quantity of 1
            garment_index: i, // This will be 0, 1, 2, etc. for each garment type
            // Set worker limit based on garment type
            max_workers: type.toLowerCase().includes('shirt') ? 3 : 2
          });
        }
      }
    });
  });
  
  // Final sort to ensure the expanded orders maintain bill number descending order
  const finalSorted = finalExpandedOrders.sort((a, b) => {
    const billNumberA = Number(a.billnumberinput2) || 0;
    const billNumberB = Number(b.billnumberinput2) || 0;
    
    if (billNumberB !== billNumberA) {
      return billNumberB - billNumberA; // Descending: highest first
    }
    
    // Secondary sort by original order ID
    const orderIdA = Number(a.original_id || a.id) || 0;
    const orderIdB = Number(b.original_id || b.id) || 0;
    if (orderIdB !== orderIdA) {
      return orderIdB - orderIdA;
    }
    
    // Tertiary sort by garment index to maintain consistent order within same bill/order
    return (a.garment_index || 0) - (b.garment_index || 0);
  });
  
  console.log('\n📋 FINAL SORT VERIFICATION:');
  console.log('Total expanded orders:', finalSorted.length);
  if (finalSorted.length > 0) {
    const actualHighestBill = Number(finalSorted[0].billnumberinput2) || 0;
    console.log('Top 5 orders after expansion and final sort:');
    finalSorted.slice(0, 5).forEach((order, index) => {
      console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}`);
    });
    console.log(`Actual highest bill number in results: ${actualHighestBill}`);
    if (expectedHighestBillNumber !== null) {
      console.log(`Expected highest bill number: ${expectedHighestBillNumber}`);
      console.log(`✅ VERIFICATION: First order matches expected highest?`, 
        actualHighestBill === expectedHighestBillNumber ? 'YES ✓' : `NO ✗ (Expected: ${expectedHighestBillNumber}, Got: ${actualHighestBill})`);
    }
    console.log(`Lowest bill number in top 10: ${Number(finalSorted[Math.min(9, finalSorted.length - 1)].billnumberinput2) || 0}`);
  }
  
  return finalSorted;
};

export default function OrdersOverviewScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [selectedWorkers, setSelectedWorkers] = useState({});
  const [filters, setFilters] = useState({
    deliveryStatus: '',
    paymentStatus: '',
    deliveryDate: '',
  });
  const [workerDropdownVisible, setWorkerDropdownVisible] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingAmounts, setEditingAmounts] = useState({});

  useEffect(() => {
    // Always reset filters when opening the screen
    setFilters({
      deliveryStatus: '',
      paymentStatus: '',
      deliveryDate: '',
    });
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get the highest bill number first for verification
      const highestBillNumber = await SupabaseAPI.getHighestBillNumber();
      console.log('\n🎯 === EXPECTED HIGHEST BILL NUMBER ===');
      console.log('📊 Highest bill number from query:', highestBillNumber);
      console.log('✅ This should be the first row in orders overview');
      console.log('🎯 === END HIGHEST BILL VERIFICATION ===\n');
      
      const [ordersData, workersData] = await Promise.all([
        SupabaseAPI.getOrders(),
        SupabaseAPI.getWorkers()
      ]);
      
      // Debug raw data from Supabase
      console.log('\n🔍 === RAW DATA FROM SUPABASE ===');
      console.log('📊 Total orders fetched from Supabase:', ordersData?.length || 0);
      if (ordersData && ordersData.length > 0) {
        // Show first few raw orders
        console.log('\n🐁 First 3 RAW orders from Supabase:');
        ordersData.slice(0, 3).forEach((order, index) => {
          console.log(`  ${index + 1}. ID: ${order.id}, Bill: ${order.billnumberinput2}, Date: ${order.order_date}`);
        });
        
        // Check if bill 8023 is in the raw data
        const rawBill8023 = ordersData.filter(order => Number(order.billnumberinput2) === 8023);
        console.log(`\n🎯 Bill 8023 in RAW data: ${rawBill8023.length} orders`);
        if (rawBill8023.length > 0) {
          rawBill8023.forEach((order, index) => {
            console.log(`  🏅 Raw 8023-${index + 1}: ID ${order.id}, Garment: ${order.garment_type}`);
          });
        }
      }
      console.log('🔍 === END RAW DATA DEBUG ===\n');
      
      // Process orders data to match frontend structure
      const processedOrders = ordersData
        // REMOVE the filter so all orders are shown
        .map(order => ({
          ...order,
          deliveryDate: order.due_date,
          workers: order.order_worker_association?.map(assoc => assoc.workers) || []
        }))
        // Sort by billnumberinput2 descending (8023, 8022, 8021... with 8023 at the top)
        .sort((a, b) => {
          // Handle billnumberinput2 - it can be stored as double precision in DB
          const billNumberA = Number(a.billnumberinput2) || 0;
          const billNumberB = Number(b.billnumberinput2) || 0;
          
          // Primary sort: by bill number descending (highest first)
          if (billNumberB !== billNumberA) {
            const result = billNumberB - billNumberA; // Descending: 8023, 8022, 8021...
            console.log(`🔢 Sorting: Bill ${billNumberB} vs ${billNumberA} = ${result > 0 ? 'B first' : 'A first'}`);
            return result;
          }
          
          // Secondary sort: by order ID descending if bill numbers are same
          const orderResult = (b.id || 0) - (a.id || 0);
          console.log(`🆔 Same bill numbers, sorting by ID: ${b.id} vs ${a.id} = ${orderResult}`);
          return orderResult;
        });
      
      // COMPREHENSIVE BILL NUMBER ANALYSIS
      console.log('\n🔢 === COMPREHENSIVE BILL ANALYSIS ===');
      console.log('📊 Total processed orders:', processedOrders.length);
      
      if (processedOrders.length > 0) {
        // Extract all unique bill numbers and sort them
        const allBillNumbers = [...new Set(processedOrders.map(order => Number(order.billnumberinput2) || 0))]
          .filter(num => num > 0)
          .sort((a, b) => b - a); // Descending order
        
        console.log('\n📈 ALL UNIQUE BILL NUMBERS IN DATABASE:');
        console.log(`🔢 Total unique bills: ${allBillNumbers.length}`);
        console.log(`🏆 Highest bill number: ${allBillNumbers[0]}`);
        console.log(`🔴 Lowest bill number: ${allBillNumbers[allBillNumbers.length - 1]}`);
        
        // Show top 20 bill numbers
        console.log('\n🏅 TOP 20 BILL NUMBERS:');
        allBillNumbers.slice(0, 20).forEach((billNum, index) => {
          const isBill8023 = billNum === 8023;
          const icon = isBill8023 ? '🏅' : (index < 5 ? '🔵' : '⚫');
          const count = processedOrders.filter(o => Number(o.billnumberinput2) === billNum).length;
          console.log(`  ${icon} ${index + 1}. Bill: ${billNum} (${count} orders)${isBill8023 ? ' ← BILL 8023 FOUND!' : ''}`);
        });
        
        // Check for bill 8023 specifically
        const bill8023Index = allBillNumbers.indexOf(8023);
        if (bill8023Index === -1) {
          console.log('\n❌ PROBLEM FOUND: Bill 8023 does NOT exist in the database!');
          console.log('🔍 Instead, we have these recent bills:');
          allBillNumbers.slice(0, 10).forEach((bill, index) => {
            console.log(`  ${index + 1}. Bill ${bill}`);
          });
        } else {
          console.log(`\n✅ Bill 8023 found at position ${bill8023Index + 1} in bill list`);
        }
        
      // Show actual first order details with user-friendly explanation
      console.log('\n📜 ACTUAL TOP ORDER DETAILS:');
      const topOrder = processedOrders[0];
      console.log(`  Bill Number: ${topOrder.billnumberinput2}`);
      console.log(`  Order ID: ${topOrder.id}`);
      console.log(`  Order Date: ${topOrder.order_date}`);
      console.log(`  Status: ${topOrder.status}`);
      console.log(`  Payment Status: ${topOrder.payment_status}`);
      
      // User-friendly explanation of sorting
      if (allBillNumbers[0] !== 8023) {
        console.log(`\n📋 SORTING EXPLANATION FOR USER:`);
        console.log(`  ✅ Orders are sorted correctly by bill number (highest to lowest)`);
        console.log(`  🏆 Highest bill in database: ${allBillNumbers[0]}`);
        console.log(`  ❓ If you expected bill 8023 to be at the top, it may not exist in the database yet`);
      }
      }
      
      // Expand orders by garment type and quantity
      const expandedOrders = expandOrdersByGarmentAndQuantity(processedOrders, highestBillNumber);
      
      console.log('\n📎 Total expanded orders:', expandedOrders.length);
      if (expandedOrders.length > 0) {
        console.log('\n📝 TOP 10 EXPANDED ORDERS:');
        expandedOrders.slice(0, 10).forEach((order, index) => {
          const isBill8023 = Number(order.billnumberinput2) === 8023;
          const icon = isBill8023 ? '🏅' : (index < 5 ? '🔵' : '⚫');
          console.log(`  ${icon} ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}${isBill8023 ? ' ← BILL 8023!' : ''}`);
        });
        
        // Check if bill 8023 orders are at the top
        const bill8023Orders = expandedOrders.filter(o => Number(o.billnumberinput2) === 8023);
        console.log(`\n🎯 Bill 8023 expanded orders found: ${bill8023Orders.length}`);
        bill8023Orders.forEach((order, index) => {
          console.log(`  🏅 8023-${index + 1}: ${order.garment_type} (ID: ${order.id}, Expanded: ${order.expanded_id})`);
        });
      }
      console.log('\n🏁 === END SORTING DEBUG ===\n');
      
      setOrders(expandedOrders);
      setFilteredOrders(expandedOrders);
      setWorkers(workersData);
    } catch (error) {
      console.error('OrdersOverviewScreen - Error loading data:', error);
      Alert.alert('Error', 'Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.deliveryStatus) {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === filters.deliveryStatus.toLowerCase()
      );
    }

    if (filters.paymentStatus) {
      filtered = filtered.filter(order => 
        order.payment_status?.toLowerCase() === filters.paymentStatus.toLowerCase()
      );
    }

    if (filters.deliveryDate) {
      filtered = filtered.filter(order => 
        order.due_date === filters.deliveryDate
      );
    }

    // Sort by billnumberinput2 descending (8023, 8022, 8021... with latest at top)
    filtered = filtered.sort((a, b) => {
      const billNumberA = Number(a.billnumberinput2) || 0;
      const billNumberB = Number(b.billnumberinput2) || 0;
      
      if (billNumberB !== billNumberA) {
        return billNumberB - billNumberA; // Descending: 8023, 8022, 8021...
      }
      
      // Secondary sort by order ID if bill numbers are same
      return (b.id || 0) - (a.id || 0);
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    try {
      setLoading(true);
      console.log(`\n🔍 === SEARCH STARTED FOR: "${searchQuery}" ===`);
      
      const data = await SupabaseAPI.searchOrders(searchQuery);
      console.log(`📊 Search returned ${data?.length || 0} orders`);
      
      if (!data || data.length === 0) {
        console.log('❌ No search results found');
        setFilteredOrders([]);
        return;
      }
      
      // Process search results to match frontend structure
      const processedData = data.map(order => ({
        ...order,
        deliveryDate: order.due_date,
        workers: order.order_worker_association?.map(assoc => assoc.workers) || []
      }));
      
      console.log('\n📋 RAW SEARCH RESULTS (before sorting):');
      processedData.slice(0, 5).forEach((order, index) => {
        console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}`);
      });
      
      // Sort by billnumberinput2 descending (search results should show highest bill numbers first)
      const sortedData = processedData.sort((a, b) => {
        const billNumberA = Number(a.billnumberinput2) || 0;
        const billNumberB = Number(b.billnumberinput2) || 0;
        
        if (billNumberB !== billNumberA) {
          return billNumberB - billNumberA; // Descending: highest first
        }
        
        return (b.id || 0) - (a.id || 0);
      });
      
      console.log('\n📋 SORTED SEARCH RESULTS (after sorting):');
      sortedData.slice(0, 5).forEach((order, index) => {
        console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}`);
      });
      
      // Find the highest bill number in search results for verification
      const searchResultHighestBill = Math.max(...sortedData.map(order => Number(order.billnumberinput2) || 0));
      console.log(`\n🎯 Highest bill number in search results: ${searchResultHighestBill}`);
      console.log(`🎯 First result bill number: ${Number(sortedData[0].billnumberinput2) || 0}`);
      console.log(`✅ Search results properly sorted? ${searchResultHighestBill === (Number(sortedData[0].billnumberinput2) || 0) ? 'YES' : 'NO'}`);
      
      // Expand search results by garment type and quantity
      const expandedSearchResults = expandOrdersByGarmentAndQuantity(sortedData, searchResultHighestBill);
      
      console.log(`\n📦 Expanded search results: ${expandedSearchResults.length} total items`);
      if (expandedSearchResults.length > 0) {
        console.log('🏆 Top 5 expanded search results:');
        expandedSearchResults.slice(0, 5).forEach((order, index) => {
          console.log(`  ${index + 1}. Bill: ${order.billnumberinput2}, ID: ${order.id}, Garment: ${order.garment_type}`);
        });
      }
      
      console.log('🔍 === SEARCH COMPLETED ===\n');
      setFilteredOrders(expandedSearchResults);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', `Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (expandedOrderId, newStatus) => {
    if (!expandedOrderId) {
      Alert.alert('Error', 'Invalid order ID. Cannot update status.');
      return;
    }

    try {
      setLoading(true);
      
      // Debug: Log all available orders to understand the structure
      console.log('\n=== DELIVERY UPDATE DEBUG ===');
      console.log('Looking for expandedOrderId:', expandedOrderId, '(type:', typeof expandedOrderId, ')');
      console.log('New delivery status:', newStatus);
      console.log('Total orders in state:', orders.length);
      console.log('Total filtered orders:', filteredOrders.length);
      
      // Try multiple search strategies with better validation
      let expandedOrder = null;
      let searchStrategy = null;
      
      // Strategy 1: Direct expanded_id match
      expandedOrder = orders.find(order => order.expanded_id === expandedOrderId);
      if (expandedOrder) searchStrategy = 'orders.expanded_id';
      
      // Strategy 2: If not found, try searching in filteredOrders
      if (!expandedOrder) {
        expandedOrder = filteredOrders.find(order => order.expanded_id === expandedOrderId);
        if (expandedOrder) searchStrategy = 'filteredOrders.expanded_id';
      }
      
      // Strategy 3: If still not found, try regular ID match (string and number)
      if (!expandedOrder) {
        expandedOrder = orders.find(order => 
          order.id.toString() === expandedOrderId.toString() ||
          order.id === expandedOrderId
        );
        if (expandedOrder) searchStrategy = 'orders.id';
      }
      
      // Strategy 4: Try filteredOrders with regular ID
      if (!expandedOrder) {
        expandedOrder = filteredOrders.find(order => 
          order.id.toString() === expandedOrderId.toString() ||
          order.id === expandedOrderId
        );
        if (expandedOrder) searchStrategy = 'filteredOrders.id';
      }
      
      // Get original order ID with validation
      const originalOrderId = expandedOrder?.original_id || expandedOrder?.id;
      
      console.log('Delivery search results:', {
        searchStrategy,
        expandedOrder: expandedOrder ? {
          id: expandedOrder.id,
          original_id: expandedOrder.original_id,
          expanded_id: expandedOrder.expanded_id,
          billnumberinput2: expandedOrder.billnumberinput2,
          garment_type: expandedOrder.garment_type
        } : null,
        originalOrderId,
        originalOrderIdType: typeof originalOrderId
      });
      
      // Enhanced validation
      if (!expandedOrder) {
        console.error('❌ Order not found using any strategy');
        console.error('Available order IDs in orders:', orders.slice(0, 10).map(o => ({ id: o.id, expanded_id: o.expanded_id })));
        console.error('Available order IDs in filteredOrders:', filteredOrders.slice(0, 10).map(o => ({ id: o.id, expanded_id: o.expanded_id })));
        Alert.alert(
          'Error', 
          `Order not found with ID: ${expandedOrderId}\n\nThis might happen if:\n• The page needs refreshing\n• The order was deleted\n• There's a data sync issue\n\nPlease try refreshing the page.`
        );
        setLoading(false);
        return;
      }
      
      if (!originalOrderId || originalOrderId === 'null' || originalOrderId === null || originalOrderId === undefined) {
        console.error('❌ Invalid original order ID:', originalOrderId);
        Alert.alert(
          'Error', 
          `Invalid order reference found.\n\nOrder ID: ${expandedOrderId}\nOriginal ID: ${originalOrderId}\n\nPlease try refreshing the page.`
        );
        setLoading(false);
        return;
      }
      
      // Ensure originalOrderId is a number
      const numericOrderId = Number(originalOrderId);
      if (isNaN(numericOrderId) || numericOrderId <= 0) {
        console.error('❌ Original order ID is not a valid number:', originalOrderId);
        Alert.alert(
          'Error', 
          `Invalid order ID format: ${originalOrderId}\n\nExpected a positive number. Please try refreshing the page.`
        );
        setLoading(false);
        return;
      }
      
      console.log('✅ About to update delivery status:', {
        numericOrderId,
        newStatus,
        billNumber: expandedOrder.billnumberinput2
      });
      console.log('=== END DELIVERY DEBUG ===\n');
      
      await SupabaseAPI.updateOrderStatus(numericOrderId, newStatus);
      
        // If status is being set to completed, check if all orders for this bill are completed
        if (newStatus.toLowerCase() === 'completed') {
          // Find the current order to get its bill_id (use the expanded order)
          const currentOrder = expandedOrder;
        if (currentOrder && currentOrder.bill_id) {
          try {
            // Get all orders for this bill
            const { orders: billOrders, bill } = await SupabaseAPI.getOrdersByBillId(currentOrder.bill_id);
            
            // Check if all orders for this bill are completed
            const allCompleted = billOrders.every(order => 
              order.status?.toLowerCase() === 'completed'
            );
            
            if (allCompleted && bill) {
              // Redirect to WhatsApp with pre-filled message
              try {
                const customerInfo = WhatsAppService.getCustomerInfoFromBill(bill);
                const orderDetails = WhatsAppService.generateOrderDetailsString(billOrders);
                const message = WhatsAppService.generateCompletionMessage(
                  customerInfo.name,
                  bill.id,
                  orderDetails
                );
                
                if (customerInfo.mobile && customerInfo.mobile.trim() !== '') {
                  // Validate mobile number format
                  const cleanMobile = customerInfo.mobile.replace(/\D/g, '');
                  
                  // Check if mobile number is valid (should be 10 digits starting with 6-9 for India)
                  if (cleanMobile.length === 10 && /^[6-9]/.test(cleanMobile)) {
                    // Use redirect service to open WhatsApp with pre-filled message AND CONFIRMATION
                    try {
                      const result = WhatsAppRedirectService.openWhatsAppWithMessage(customerInfo.mobile, message, true);
                      
                      if (result.success === 'confirmation_needed') {
                        // Show Yes/No confirmation popup
                        Alert.alert(
                          '📱 Send WhatsApp Message?', 
                          `Order completed! Would you like to send a WhatsApp notification to customer ${customerInfo.name}?\n\nNumber: ${customerInfo.mobile}\n\nMessage preview:\n${message.substring(0, 100)}...`,
                          [
                            {
                              text: 'No',
                              onPress: () => {
                                Alert.alert(
                                  'Success', 
                                  `Order status updated to "${newStatus}" for bill ${expandedOrder.billnumberinput2}. WhatsApp message not sent.`
                                );
                              },
                              style: 'cancel'
                            },
                            {
                              text: 'Yes, Open WhatsApp',
                              onPress: () => {
                                try {
                                  const openResult = result.openWhatsApp();
                                  if (openResult.success) {
                                    Alert.alert(
                                      'Success', 
                                      'Order status updated successfully! WhatsApp opened with your completion message ready to send.'
                                    );
                                  } else {
                                    Alert.alert(
                                      'Success', 
                                      `Order status updated successfully. ${openResult.message}`
                                    );
                                  }
                                } catch (openError) {
                                  console.error('WhatsApp opening failed:', openError);
                                  Alert.alert(
                                    'Error', 
                                    'Failed to open WhatsApp. Please make sure WhatsApp is installed on your device.'
                                  );
                                }
                              }
                            }
                          ],
                          { cancelable: false }
                        );
                      } else if (result.success === true) {
                        Alert.alert(
                          'Success', 
                          'Order status updated successfully! WhatsApp opened with your completion message ready to send.'
                        );
                      } else {
                        Alert.alert(
                          'Success', 
                          `Order status updated successfully. ${result.message}`
                        );
                      }
                    } catch (redirectError) {
                      console.error('WhatsApp redirect failed:', redirectError);
                      Alert.alert(
                        'Success', 
                        'Order status updated successfully. WhatsApp is not available for this number.'
                      );
                    }
                  } else {
                    // Invalid mobile number format
                    Alert.alert(
                      'Success', 
                      `Order status updated successfully. WhatsApp redirect skipped - invalid mobile number format (${customerInfo.mobile}).`
                    );
                  }
                } else {
                  Alert.alert(
                    'Success', 
                    'Order status updated successfully. WhatsApp redirect skipped - no mobile number found.'
                  );
                }
              } catch (whatsappError) {
                console.error('WhatsApp redirect error:', whatsappError);
                Alert.alert(
                  'Success', 
                  'Order status updated successfully. WhatsApp redirect failed - please make sure WhatsApp is installed.'
                );
              }
            } else {
              Alert.alert('Success', `Delivery status updated to "${newStatus}" for bill ${expandedOrder.billnumberinput2}`);
            }
          } catch (billError) {
            console.error('Error checking bill completion:', billError);
            Alert.alert('Success', `Delivery status updated to "${newStatus}" for bill ${expandedOrder.billnumberinput2}`);
          }
        } else {
          Alert.alert('Success', `Delivery status updated to "${newStatus}" for bill ${expandedOrder.billnumberinput2}`);
        }
      } else {
        Alert.alert('Success', `Delivery status updated to "${newStatus}" for bill ${expandedOrder.billnumberinput2}`);
      }
      
      loadData();
    } catch (error) {
      console.error('❌ Delivery status update failed:', error);
      Alert.alert(
        'Error', 
        `Failed to update delivery status: ${error.message}\n\nIf this persists, please check:\n• Internet connection\n• Database permissions\n• Contact support`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (expandedOrderId, newPaymentStatus) => {
    if (!expandedOrderId) {
      Alert.alert('Error', 'Invalid order ID. Cannot update payment status.');
      return;
    }

    try {
      setLoading(true);
      
      // Debug: Log all available orders to understand the structure
      console.log('\n=== PAYMENT UPDATE DEBUG ===');
      console.log('Looking for expandedOrderId:', expandedOrderId, '(type:', typeof expandedOrderId, ')');
      console.log('New payment status:', newPaymentStatus);
      console.log('Total orders in state:', orders.length);
      console.log('Total filtered orders:', filteredOrders.length);
      
      // Try multiple search strategies with better validation
      let expandedOrder = null;
      let searchStrategy = null;
      
      // Strategy 1: Direct expanded_id match
      expandedOrder = orders.find(order => order.expanded_id === expandedOrderId);
      if (expandedOrder) searchStrategy = 'orders.expanded_id';
      
      // Strategy 2: If not found, try searching in filteredOrders
      if (!expandedOrder) {
        expandedOrder = filteredOrders.find(order => order.expanded_id === expandedOrderId);
        if (expandedOrder) searchStrategy = 'filteredOrders.expanded_id';
      }
      
      // Strategy 3: If still not found, try regular ID match (string and number)
      if (!expandedOrder) {
        expandedOrder = orders.find(order => 
          order.id.toString() === expandedOrderId.toString() ||
          order.id === expandedOrderId
        );
        if (expandedOrder) searchStrategy = 'orders.id';
      }
      
      // Strategy 4: Try filteredOrders with regular ID
      if (!expandedOrder) {
        expandedOrder = filteredOrders.find(order => 
          order.id.toString() === expandedOrderId.toString() ||
          order.id === expandedOrderId
        );
        if (expandedOrder) searchStrategy = 'filteredOrders.id';
      }
      
      // Get original order ID with validation
      const originalOrderId = expandedOrder?.original_id || expandedOrder?.id;
      
      console.log('Search results:', {
        searchStrategy,
        expandedOrder: expandedOrder ? {
          id: expandedOrder.id,
          original_id: expandedOrder.original_id,
          expanded_id: expandedOrder.expanded_id,
          billnumberinput2: expandedOrder.billnumberinput2,
          garment_type: expandedOrder.garment_type
        } : null,
        originalOrderId,
        originalOrderIdType: typeof originalOrderId
      });
      
      // Enhanced validation
      if (!expandedOrder) {
        console.error('❌ Order not found using any strategy');
        console.error('Available order IDs in orders:', orders.slice(0, 10).map(o => ({ id: o.id, expanded_id: o.expanded_id })));
        console.error('Available order IDs in filteredOrders:', filteredOrders.slice(0, 10).map(o => ({ id: o.id, expanded_id: o.expanded_id })));
        Alert.alert(
          'Error', 
          `Order not found with ID: ${expandedOrderId}\n\nThis might happen if:\n• The page needs refreshing\n• The order was deleted\n• There's a data sync issue\n\nPlease try refreshing the page.`
        );
        setLoading(false);
        return;
      }
      
      if (!originalOrderId || originalOrderId === 'null' || originalOrderId === null || originalOrderId === undefined) {
        console.error('❌ Invalid original order ID:', originalOrderId);
        Alert.alert(
          'Error', 
          `Invalid order reference found.\n\nOrder ID: ${expandedOrderId}\nOriginal ID: ${originalOrderId}\n\nPlease try refreshing the page.`
        );
        setLoading(false);
        return;
      }
      
      // Ensure originalOrderId is a number
      const numericOrderId = Number(originalOrderId);
      if (isNaN(numericOrderId) || numericOrderId <= 0) {
        console.error('❌ Original order ID is not a valid number:', originalOrderId);
        Alert.alert(
          'Error', 
          `Invalid order ID format: ${originalOrderId}\n\nExpected a positive number. Please try refreshing the page.`
        );
        setLoading(false);
        return;
      }
      
      console.log('✅ About to update payment status:', {
        numericOrderId,
        newPaymentStatus,
        billNumber: expandedOrder.billnumberinput2
      });
      console.log('=== END PAYMENT DEBUG ===\n');
      
      await SupabaseAPI.updatePaymentStatus(numericOrderId, newPaymentStatus);
      
      Alert.alert('Success', `Payment status updated to "${newPaymentStatus}" for bill ${expandedOrder.billnumberinput2}`);
      loadData();
      
    } catch (error) {
      console.error('❌ Payment status update failed:', error);
      Alert.alert(
        'Error', 
        `Failed to update payment status: ${error.message}\n\nIf this persists, please check:\n• Internet connection\n• Database permissions\n• Contact support`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMode = async (expandedOrderId, newPaymentMode) => {
    if (!expandedOrderId) {
      Alert.alert('Error', 'Invalid order ID. Cannot update payment mode.');
      return;
    }

    try {
      setLoading(true);
      // Find the expanded order to get the original order ID
      const expandedOrder = orders.find(order => (order.expanded_id || order.id) === expandedOrderId);
      const originalOrderId = expandedOrder?.original_id || expandedOrder?.id;
      
      if (!originalOrderId || originalOrderId === 'null' || originalOrderId === null) {
        Alert.alert('Error', 'Invalid original order ID. Cannot update payment mode.');
        setLoading(false);
        return;
      }
      
      await SupabaseAPI.updatePaymentMode(originalOrderId, newPaymentMode);
      loadData();
      Alert.alert('Success', 'Payment mode updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update payment mode: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTotalAmount = async (expandedOrderId, newAmount) => {
    if (!expandedOrderId) {
      Alert.alert('Error', 'Invalid order ID. Cannot update total amount.');
      return;
    }

    if (isNaN(newAmount) || newAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      // Find the expanded order to get the original order ID
      const expandedOrder = orders.find(order => (order.expanded_id || order.id) === expandedOrderId);
      const originalOrderId = expandedOrder?.original_id || expandedOrder?.id;
      
      if (!originalOrderId || originalOrderId === 'null' || originalOrderId === null) {
        Alert.alert('Error', 'Invalid original order ID. Cannot update total amount.');
        setLoading(false);
        return;
      }
      
      await SupabaseAPI.updateOrderTotalAmount(originalOrderId, parseFloat(newAmount));
      loadData();
      Alert.alert('Success', 'Total amount updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update total amount: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentAmount = async (expandedOrderId, newAmount) => {
    if (!expandedOrderId) {
      Alert.alert('Error', 'Invalid order ID. Cannot update payment amount.');
      return;
    }

    if (isNaN(newAmount) || newAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      // Find the expanded order to get the original order ID
      const expandedOrder = orders.find(order => (order.expanded_id || order.id) === expandedOrderId);
      const originalOrderId = expandedOrder?.original_id || expandedOrder?.id;
      
      if (!originalOrderId || originalOrderId === 'null' || originalOrderId === null) {
        Alert.alert('Error', 'Invalid original order ID. Cannot update payment amount.');
        setLoading(false);
        return;
      }
      
      await SupabaseAPI.updatePaymentAmount(originalOrderId, parseFloat(newAmount));
      loadData();
      Alert.alert('Success', 'Payment amount updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update payment amount: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkerDropdown = (orderId) => {
    setWorkerDropdownVisible(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleWorkerSelection = (orderId, workerId) => {
    if (!selectedWorkers[orderId]) {
      setSelectedWorkers(prev => ({ ...prev, [orderId]: [] }));
    }
    
    const currentSelected = selectedWorkers[orderId] || [];
    const isSelected = currentSelected.includes(workerId);
    
    if (isSelected) {
      // Remove worker if already selected
      setSelectedWorkers(prev => ({
        ...prev,
        [orderId]: currentSelected.filter(id => id !== workerId)
      }));
    } else {
      // Find the order to get worker limit
      const order = orders.find(o => (o.expanded_id || o.id) === orderId) || 
                    filteredOrders.find(o => (o.expanded_id || o.id) === orderId);
      
      let maxWorkers = 2; // Default for pant
      if (order) {
        // Check if it's a shirt order (3 workers) or pant/other (2 workers)
        const garmentType = order.garment_type || order.expanded_garment_type || '';
        maxWorkers = garmentType.toLowerCase().includes('shirt') ? 3 : 2;
      }
      
      // Check if we've reached the worker limit
      if (currentSelected.length >= maxWorkers) {
        const garmentName = order?.garment_type || 'this garment';
        Alert.alert(
          'Worker Limit Reached',
          `Maximum ${maxWorkers} workers allowed for ${garmentName} orders.\n\nPlease unselect a worker first if you want to assign a different worker.`
        );
        return;
      }
      
      // Add worker if limit not reached
      setSelectedWorkers(prev => ({
        ...prev,
        [orderId]: [...currentSelected, workerId]
      }));
    }
  };

  const handleAssignWorkers = async (expandedOrderId) => {
    const workerIds = selectedWorkers[expandedOrderId];
    if (!workerIds || workerIds.length === 0) {
      Alert.alert('Error', 'Please select at least one worker.');
      return;
    }

    try {
      setLoading(true);
      // Find the expanded order to get the original order ID
      const expandedOrder = orders.find(order => (order.expanded_id || order.id) === expandedOrderId);
      const originalOrderId = expandedOrder?.original_id || expandedOrder?.id;
      
      if (!originalOrderId) {
        Alert.alert('Error', 'Could not find original order ID.');
        setLoading(false);
        return;
      }
      
      const result = await SupabaseAPI.assignWorkersToOrder(originalOrderId, workerIds);
      
      // Find the current order to get bill information (use the expanded order)
      const currentOrder = expandedOrder;
      
      // Debug logging
      console.log('Current order data:', {
        id: currentOrder?.id,
        bill_id: currentOrder?.bill_id,
        customer_mobile: currentOrder?.customer_mobile,
        customer_name: currentOrder?.customer_name,
        bills: currentOrder?.bills
      });
      
      // Manually update the order in local state for immediate UI feedback
      const assignedWorkerObjects = workers.filter(worker => workerIds.includes(worker.id));
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          (order.expanded_id || order.id) === expandedOrderId
            ? { ...order, Work_pay: result.work_pay, workers: assignedWorkerObjects }
            : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          (order.expanded_id || order.id) === expandedOrderId
            ? { ...order, Work_pay: result.work_pay, workers: assignedWorkerObjects }
            : order
        )
      );
      
      // Send measurements to each assigned worker via WhatsApp
      try {
        // Try to get customer mobile from multiple possible sources
        let customerMobile = currentOrder?.customer_mobile || 
                           currentOrder?.bills?.mobile_number || 
                           null;
        
        console.log('=== MEASUREMENT DEBUG INFO ===');
        console.log('Customer mobile resolved to:', customerMobile);
        console.log('Bill number being worked on:', currentOrder?.billnumberinput2);
        console.log('Number of workers to assign:', assignedWorkerObjects.length);
        console.log('Worker names being assigned:', assignedWorkerObjects.map(w => w.name));
        console.log('Available mobile sources:', {
          customer_mobile: currentOrder?.customer_mobile,
          bills_mobile: currentOrder?.bills?.mobile_number
        });
        
        // If no customer mobile found but we have bill_id, try to fetch bill data directly
        if (!customerMobile && currentOrder?.bill_id) {
          console.log('No customer mobile found, attempting direct bill lookup for bill_id:', currentOrder.bill_id);
          try {
            const { data: bill, error: billError } = await supabase
              .from('bills')
              .select('*')
              .eq('id', currentOrder.bill_id)
              .single();
              
            if (!billError && bill) {
              console.log('Direct bill lookup successful:', {
                customer_name: bill.customer_name,
                mobile_number: bill.mobile_number
              });
              customerMobile = bill.mobile_number;
              // Update currentOrder with bill data for this session
              currentOrder.bills = bill;
              currentOrder.customer_mobile = bill.mobile_number;
              currentOrder.customer_name = bill.customer_name;
            } else {
              console.error('Direct bill lookup failed:', billError);
            }
          } catch (directBillError) {
            console.error('Error in direct bill lookup:', directBillError);
          }
        }
        
        if (currentOrder && customerMobile) {
          console.log('Attempting to fetch measurements for mobile:', customerMobile);
          
          // Fetch measurements for the customer
          const measurements = await SupabaseAPI.getMeasurementsByMobileNumber(customerMobile);
          
          console.log('Measurements fetched:', measurements ? 'Found' : 'Not found');
          console.log('Measurement data preview:', measurements ? Object.keys(measurements) : 'N/A');
          
          // Send WhatsApp message to each assigned worker
          for (const worker of assignedWorkerObjects) {
            if (worker.number) {
              try {
                const message = WhatsAppService.generateWorkerAssignmentMessage(
                  currentOrder.customer_name || currentOrder?.bills?.customer_name || 'Customer',
                  currentOrder.billnumberinput2 || orderId,
                  currentOrder.garment_type || 'N/A',
                  measurements
                );
                
                console.log(`Sending WhatsApp to worker ${worker.name} at ${worker.number}`);
                
                // Use WhatsApp redirect service with confirmation (for worker assignment)
                const whatsappResult = WhatsAppRedirectService.openWhatsAppWithMessage(worker.number, message, true);
                
                if (whatsappResult.success === 'confirmation_needed') {
                  // Show Yes/No confirmation popup for worker assignment
                  Alert.alert(
                    '📱 Send Work Assignment?',
                    `Send measurement details to worker ${worker.name}?\n\nNumber: ${worker.number}\n\nThis will open WhatsApp with work assignment and measurement details.`,
                    [
                      {
                        text: 'Skip',
                        style: 'cancel'
                      },
                      {
                        text: 'Yes, Open WhatsApp',
                        onPress: () => {
                          try {
                            const openResult = whatsappResult.openWhatsApp();
                            if (!openResult.success) {
                              console.warn(`Failed to open WhatsApp for worker ${worker.name}: ${openResult.message}`);
                            }
                          } catch (openError) {
                            console.error('WhatsApp opening failed for worker:', openError);
                          }
                        }
                      }
                    ],
                    { cancelable: false }
                  );
                } else if (!whatsappResult.success) {
                  console.warn(`Failed to open WhatsApp for worker ${worker.name}: ${whatsappResult.message}`);
                }
              } catch (workerMessageError) {
                console.error(`Error sending message to worker ${worker.name}:`, workerMessageError);
              }
            } else {
              console.warn(`Worker ${worker.name} has no phone number`);
            }
          }
          
          Alert.alert(
            'Success', 
            `Workers assigned successfully. Total Work Pay: ₹${result.work_pay.toFixed(2)}\n\nWhatsApp messages with measurement details have been prepared for each worker.`
          );
        } else {
          console.warn('Customer mobile not found. Order data:', currentOrder);
          
          // Still send WhatsApp messages to workers but without measurements
          for (const worker of assignedWorkerObjects) {
            if (worker.number) {
              try {
                const message = WhatsAppService.generateWorkerAssignmentMessage(
                  currentOrder?.customer_name || currentOrder?.bills?.customer_name || 'Customer',
                  currentOrder?.billnumberinput2 || orderId,
                  currentOrder?.garment_type || 'N/A',
                  null // No measurements
                );
                
                console.log(`Sending WhatsApp (without measurements) to worker ${worker.name} at ${worker.number}`);
                
                // Use WhatsApp redirect service with confirmation (no measurements)
                const whatsappResult = WhatsAppRedirectService.openWhatsAppWithMessage(worker.number, message, true);
                
                if (whatsappResult.success === 'confirmation_needed') {
                  // Show Yes/No confirmation popup for worker assignment (no measurements)
                  Alert.alert(
                    '📱 Send Work Assignment?',
                    `Send work assignment to worker ${worker.name}?\n\nNumber: ${worker.number}\n\nNote: Customer measurements not available.`,
                    [
                      {
                        text: 'Skip',
                        style: 'cancel'
                      },
                      {
                        text: 'Yes, Open WhatsApp',
                        onPress: () => {
                          try {
                            const openResult = whatsappResult.openWhatsApp();
                            if (!openResult.success) {
                              console.warn(`Failed to open WhatsApp for worker ${worker.name}: ${openResult.message}`);
                            }
                          } catch (openError) {
                            console.error('WhatsApp opening failed for worker:', openError);
                          }
                        }
                      }
                    ],
                    { cancelable: false }
                  );
                } else if (!whatsappResult.success) {
                  console.warn(`Failed to open WhatsApp for worker ${worker.name}: ${whatsappResult.message}`);
                }
              } catch (workerMessageError) {
                console.error(`Error sending message to worker ${worker.name}:`, workerMessageError);
              }
            }
          }
          
          Alert.alert(
            'Success', 
            `Workers assigned successfully. Total Work Pay: ₹${result.work_pay.toFixed(2)}\n\nNote: Customer mobile number not found, measurements could not be sent.`
          );
        }
      } catch (measurementError) {
        console.error('Error fetching measurements or sending WhatsApp messages:', measurementError);
        Alert.alert(
          'Success', 
          `Workers assigned successfully. Total Work Pay: ₹${result.work_pay.toFixed(2)}\n\nNote: Failed to send measurements to workers.`
        );
      }
      
      setWorkerDropdownVisible(prev => ({ ...prev, [expandedOrderId]: false }));
    } catch (error) {
      Alert.alert('Error', `Failed to assign workers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeWorkerDropdown = (orderId) => {
    setWorkerDropdownVisible(prev => ({ ...prev, [orderId]: false }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#27ae60';
      case 'pending':
        return '#e74c3c';
      case 'cancelled':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return '#27ae60';
      case 'pending':
        return '#f39c12';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#7f8c8d';
    }
  };

  // Helper to normalize date string to YYYY-MM-DD (no conversion needed, just return as is)
  function normalizeDate(dateStr) {
    return dateStr || '';
  }

  const renderTableHeader = () => (
    <View style={[styles.tableHeader, Platform.OS === 'web' && { display: 'flex', flexDirection: 'row', minWidth: '2470px' }]}>
      <View style={[styles.headerCell, { width: 60, minWidth: 60, maxWidth: 60 }]}>
        <Text style={styles.headerText}>ID</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Bill Number</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Garment Type</Text>
      </View>
      <View style={[styles.headerCell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
        <Text style={styles.headerText}>Delivery Status</Text>
      </View>
      <View style={[styles.headerCell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
        <Text style={styles.headerText}>Update Delivery Status</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Order Date</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Delivery Date</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Payment Mode</Text>
      </View>
      <View style={[styles.headerCell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
        <Text style={styles.headerText}>Payment Status</Text>
      </View>
      <View style={[styles.headerCell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
        <Text style={styles.headerText}>Update Payment Status</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Total Amount</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Advance Amount</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Pending Amount</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
        <Text style={styles.headerText}>Customer Mobile</Text>
      </View>
      <View style={[styles.headerCell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
        <Text style={styles.headerText}>Bill ID</Text>
      </View>
      <View style={[styles.headerCell, { width: 150, minWidth: 150, maxWidth: 150 }]}>
        <Text style={styles.headerText}>Worker Assignment</Text>
      </View>
      <View style={[styles.headerCell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
        <Text style={styles.headerText}>Worker Names</Text>
      </View>
      <View style={[styles.headerCell, { width: 120, minWidth: 120, maxWidth: 120, borderRightWidth: 0 }]}>
        <Text style={styles.headerText}>Total Worker Pay</Text>
      </View>
    </View>
  );

  const renderTableRow = (order, index) => {
    const workerNames = order.workers?.map(worker => worker.name).join(", ") || "Not Assigned";
    const pendingAmount = (order.total_amt || 0) - (order.payment_amount || 0);
    const expandedOrderId = order.expanded_id || order.id;
    const isWorkerDropdownOpen = workerDropdownVisible[expandedOrderId] || false;
    const uniqueKey = 'order-' + (expandedOrderId || 'null') + '-' + index;
    const hasValidId = order.original_id || order.id;
    const displayGarmentType = order.expanded_garment_type || order.garment_type || 'N/A';
    // Add garment count indicator if garment_index is a valid number (including 0)
    const hasValidIndex = typeof order.garment_index === 'number' && order.garment_index >= 0;
    const garmentDisplay = hasValidIndex ? displayGarmentType + ' (' + (order.garment_index + 1) + ')' : displayGarmentType;
    

    return (
      <View key={uniqueKey} style={[styles.tableRow, Platform.OS === 'web' && { display: 'flex', flexDirection: 'row' }]}>
        <View style={[styles.cell, { width: 60, minWidth: 60, maxWidth: 60 }]}>
          <Text style={styles.cellText}>{order.id || 'N/A'}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{order.billnumberinput2 || "N/A"}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{garmentDisplay}</Text>
        </View>
        <View style={[styles.cell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
          <Text style={styles.cellText}>{order.status || 'N/A'}</Text>
        </View>
        
        <View style={[styles.cell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
          {hasValidId ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.statusButton, order.status === 'pending' && styles.statusButtonActive]}
                onPress={() => handleUpdateStatus(expandedOrderId, 'pending')}
              >
                <Text style={styles.statusButtonText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, order.status === 'completed' && styles.statusButtonActive]}
                onPress={() => handleUpdateStatus(expandedOrderId, 'completed')}
              >
                <Text style={styles.statusButtonText}>Completed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, order.status === 'cancelled' && styles.statusButtonActive]}
                onPress={() => handleUpdateStatus(expandedOrderId, 'cancelled')}
              >
                <Text style={styles.statusButtonText}>Cancelled</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>
        
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{normalizeDate(order.order_date)}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{normalizeDate(order.due_date)}</Text>
        </View>
        
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          {hasValidId ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.paymentButton, order.payment_mode === 'UPI' && styles.paymentButtonActive]}
                onPress={() => handleUpdatePaymentMode(expandedOrderId, 'UPI')}
              >
                <Text style={styles.paymentButtonText}>UPI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentButton, order.payment_mode === 'Cash' && styles.paymentButtonActive]}
                onPress={() => handleUpdatePaymentMode(expandedOrderId, 'Cash')}
              >
                <Text style={styles.paymentButtonText}>Cash</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>

        <View style={[styles.cell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
          <Text style={styles.cellText}>{order.payment_status || 'N/A'}</Text>
        </View>
        
        <View style={[styles.cell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
          {hasValidId ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.paymentStatusButton, order.payment_status === 'pending' && styles.paymentStatusButtonActive]}
                onPress={() => handleUpdatePaymentStatus(expandedOrderId, 'pending')}
              >
                <Text style={styles.paymentStatusButtonText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentStatusButton, order.payment_status === 'paid' && styles.paymentStatusButtonActive]}
                onPress={() => handleUpdatePaymentStatus(expandedOrderId, 'paid')}
              >
                <Text style={styles.paymentStatusButtonText}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentStatusButton, order.payment_status === 'cancelled' && styles.paymentStatusButtonActive]}
                onPress={() => handleUpdatePaymentStatus(expandedOrderId, 'cancelled')}
              >
                <Text style={styles.paymentStatusButtonText}>Cancelled</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>

        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          {hasValidId ? (
            <TextInput
              style={styles.amountInput}
              value={editingAmounts[`total_${expandedOrderId}`] !== undefined 
                ? editingAmounts[`total_${expandedOrderId}`] 
                : (order.total_amt?.toString() || '0')}
              onChangeText={(text) => setEditingAmounts(prev => ({
                ...prev,
                [`total_${expandedOrderId}`]: text
              }))}
              onBlur={(e) => {
                const value = editingAmounts[`total_${expandedOrderId}`] || e.nativeEvent.text;
                handleUpdateTotalAmount(expandedOrderId, value);
                setEditingAmounts(prev => {
                  const newState = { ...prev };
                  delete newState[`total_${expandedOrderId}`];
                  return newState;
                });
              }}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>
        
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          {hasValidId ? (
            <TextInput
              style={styles.amountInput}
              value={editingAmounts[`payment_${expandedOrderId}`] !== undefined 
                ? editingAmounts[`payment_${expandedOrderId}`] 
                : (order.payment_amount?.toString() || '0')}
              onChangeText={(text) => setEditingAmounts(prev => ({
                ...prev,
                [`payment_${expandedOrderId}`]: text
              }))}
              onBlur={(e) => {
                const value = editingAmounts[`payment_${expandedOrderId}`] || e.nativeEvent.text;
                handleUpdatePaymentAmount(expandedOrderId, value);
                setEditingAmounts(prev => {
                  const newState = { ...prev };
                  delete newState[`payment_${expandedOrderId}`];
                  return newState;
                });
              }}
              keyboardType="numeric"
            />
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{pendingAmount}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{order.customer_mobile || "N/A"}</Text>
        </View>
        <View style={[styles.cell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
          <Text style={styles.cellText}>{order.bill_id || 'N/A'}</Text>
        </View>
        
        <View style={[styles.cell, { width: 150, minWidth: 150, maxWidth: 150 }]}>
          {hasValidId ? (
            <>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleWorkerDropdown(expandedOrderId)}
              >
                <Text style={styles.dropdownButtonText}>
                  {order.workers && order.workers.length > 0
                    ? workerNames + ' (max: ' + (order.max_workers || 2) + ')'
                    : 'Select Workers (max: ' + (order.max_workers || 2) + ')'}
                </Text>
                <Text style={styles.dropdownArrow}>{isWorkerDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {isWorkerDropdownOpen && (
                <Modal
                  visible={true}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => closeWorkerDropdown(expandedOrderId)}
                >
                  <KeyboardAvoidingView 
                    style={{ flex: 1 }} 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  >
                    <TouchableOpacity
                      style={styles.modalOverlay}
                      activeOpacity={1}
                      onPress={() => closeWorkerDropdown(expandedOrderId)}
                    >
                      <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                          <View>
                            <Text style={styles.dropdownTitle}>Select Workers</Text>
                            <Text style={styles.dropdownSubtitle}>
                              {order.garment_type} - Max {order.max_workers || 2} workers ({(selectedWorkers[order.expanded_id || order.id]?.length || 0)} selected)
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => closeWorkerDropdown(expandedOrderId)}
                          >
                            <Text style={styles.modalCloseButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <ScrollView 
                          style={styles.workerList}
                          showsVerticalScrollIndicator={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {workers.map((worker, workerIndex) => {
                            const isSelected = selectedWorkers[order.expanded_id || order.id]?.includes(worker.id);
                            const selectionCount = selectedWorkers[order.expanded_id || order.id]?.length || 0;
                            // Use the max_workers from the expanded order data
                            const maxWorkers = order.max_workers || 2;
                            const isDisabled = !isSelected && selectionCount >= maxWorkers;
                            return (
                              <TouchableOpacity
                                key={'worker-' + (worker.id || 'null') + '-' + workerIndex}
                                style={[
                                  styles.workerOption,
                                  isSelected && styles.workerOptionSelected,
                                  isDisabled && { opacity: 0.5 }
                                ]}
                                onPress={() => {
                                  if (!isDisabled) handleWorkerSelection(order.expanded_id || order.id, worker.id);
                                }}
                                disabled={isDisabled}
                              >
                                <Text style={[
                                  styles.workerOptionText,
                                  isSelected && styles.workerOptionTextSelected
                                ]}>
                                  {worker.name || 'Unknown Worker'}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        
                        <View style={styles.dropdownActions}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => closeWorkerDropdown(expandedOrderId)}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => handleAssignWorkers(expandedOrderId)}
                          >
                            <Text style={styles.assignButtonText}>Assign Workers</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </KeyboardAvoidingView>
                </Modal>
              )}
            </>
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>
        
        <View style={[styles.cell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
          <Text style={styles.cellText}>{workerNames}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>
            {(() => {
              if (Array.isArray(order.workers) && order.workers.length > 0 && typeof order.Work_pay === 'number' && !isNaN(order.Work_pay)) {
                return order.Work_pay;
              }
              return 0;
            })()}
          </Text>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Delivery Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filters.deliveryStatus === '' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, deliveryStatus: '' }))}
          >
            <Text style={styles.filterButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.deliveryStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, deliveryStatus: 'pending' }))}
          >
            <Text style={styles.filterButtonText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.deliveryStatus === 'completed' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, deliveryStatus: 'completed' }))}
          >
            <Text style={styles.filterButtonText}>Completed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.deliveryStatus === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, deliveryStatus: 'cancelled' }))}
          >
            <Text style={styles.filterButtonText}>Cancelled</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Payment Status:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, filters.paymentStatus === '' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, paymentStatus: '' }))}
          >
            <Text style={styles.filterButtonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.paymentStatus === 'pending' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, paymentStatus: 'pending' }))}
          >
            <Text style={styles.filterButtonText}>Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.paymentStatus === 'paid' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, paymentStatus: 'paid' }))}
          >
            <Text style={styles.filterButtonText}>Paid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filters.paymentStatus === 'cancelled' && styles.filterButtonActive]}
            onPress={() => setFilters(prev => ({ ...prev, paymentStatus: 'cancelled' }))}
          >
            <Text style={styles.filterButtonText}>Cancelled</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>📅 Delivery Date:</Text>
        <View style={styles.dateFilterContainer}>
          {Platform.OS === 'web' ? (
            // Web HTML5 date picker with calendar
            <View style={styles.webDateInputContainer}>
              <input
                type="date"
                value={filters.deliveryDate || ''}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  setFilters(prev => ({ ...prev, deliveryDate: selectedDate }));
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  backgroundColor: 'transparent',
                  color: '#2c3e50',
                  minWidth: '160px',
                  height: '36px',
                  cursor: 'pointer',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  WebkitAppearance: 'none',
                  MozAppearance: 'textfield'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
                placeholder="Select delivery date"
              />
              {filters.deliveryDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDateFilter}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Mobile date picker button
            <>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={openDatePicker}
              >
                <Text style={styles.datePickerButtonText}>
                  {filters.deliveryDate ? filters.deliveryDate : 'Select Date'}
                </Text>
              </TouchableOpacity>
              {filters.deliveryDate && (
                <TouchableOpacity
                  style={styles.clearDateButton}
                  onPress={clearDateFilter}
                >
                  <Text style={styles.clearDateButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {showDatePicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date(2030, 11, 31)}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}
    </View>
  );

  const renderPagination = () => {
    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentOrders = filteredOrders.slice(startIndex, endIndex);

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>
        
        <View style={styles.paginationButtons}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <Text style={styles.paginationButtonText}>Previous</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
            onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.paginationButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      setFilters(prev => ({ ...prev, deliveryDate: formattedDate }));
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const clearDateFilter = () => {
    setFilters(prev => ({ ...prev, deliveryDate: '' }));
  };

  if (loading && orders.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  return (
    <View style={styles.container}>
      {/* Header matching NewBillScreen */}
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
          onPress={() => navigation.goBack()}
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Orders Overview</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter Order Number"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>


      {Platform.OS === 'web' ? (
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <WebScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
            {renderFilters()}
            {currentOrders.length > 0 ? (
              <View style={styles.tableContainer}>
                <View style={{ 
                  overflow: 'auto', 
                  flex: 1,
                  maxHeight: 600,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8
                }}>
                  <View style={{
                    minWidth: 2470,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {renderTableHeader()}
                    <View style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 2470
                    }}>
                      {currentOrders.map((order, index) => renderTableRow(order, index))}
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No orders found.</Text>
              </View>
            )}
            {renderPagination()}
          </WebScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Filters Section */}
            <View style={styles.filtersContainer}>
              <Text style={styles.filtersTitle}>Filters</Text>
              {renderFilters()}
            </View>
            
            {currentOrders.length > 0 ? (
              <View style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.tableWrapper}>
                    {renderTableHeader()}
                    {currentOrders.map((order, index) => renderTableRow(order, index))}
                </View>
                </ScrollView>
                </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No orders found.</Text>
              </View>
            )}

            {renderPagination()}
          </ScrollView>
        </KeyboardAvoidingView>
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
          onPress={loadData}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Ionicons name="refresh" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2980b9',
    elevation: 4,
    paddingTop: Platform.OS === 'ios' ? 0 : 32, // iOS safe area handled by SafeAreaView
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    minWidth: 120,
  },
  filterButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#2980b9',
  },
  filterButtonText: {
    color: '#2c3e50',
    fontSize: 14,
    fontWeight: '500',
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
  webDateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  tableContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableWrapper: {
    minWidth: 2470, // Ensure table has minimum width for scrolling to show all columns
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#34495e',
    borderBottomWidth: 2,
    borderBottomColor: '#2c3e50',
  },
  headerCell: {
    padding: 12,
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#2c3e50',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
    backgroundColor: 'white',
  },
  cell: {
    padding: 8,
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  statusButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    marginHorizontal: 2,
    minHeight: Platform.OS === 'ios' ? 44 : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#27ae60',
  },
  statusButtonText: {
    fontSize: Platform.OS === 'ios' ? 12 : 10,
    color: '#2c3e50',
    fontWeight: '500',
    textAlign: 'center',
  },
  paymentButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    marginHorizontal: 2,
    minHeight: Platform.OS === 'ios' ? 44 : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#3498db',
  },
  paymentButtonText: {
    fontSize: Platform.OS === 'ios' ? 12 : 10,
    color: '#2c3e50',
    fontWeight: '500',
    textAlign: 'center',
  },
  paymentStatusButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    marginHorizontal: 2,
    minHeight: Platform.OS === 'ios' ? 44 : 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentStatusButtonActive: {
    backgroundColor: '#e74c3c',
  },
  paymentStatusButtonText: {
    fontSize: Platform.OS === 'ios' ? 12 : 10,
    color: '#2c3e50',
    fontWeight: '500',
    textAlign: 'center',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 6,
    fontSize: 11,
    textAlign: 'center',
    width: '95%',
    maxWidth: 100,
    height: 32,
  },
  dropdownButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: Platform.OS === 'ios' ? 12 : 8,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: Platform.OS === 'ios' ? 140 : 120,
    minHeight: Platform.OS === 'ios' ? 44 : 'auto',
  },
  dropdownButtonText: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '95%',
    height: '80%',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dropdownSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
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
  modalCloseButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    lineHeight: 20,
  },
  workerList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  workerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#f8f9fa',
  },
  workerOptionSelected: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12',
  },
  workerOptionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  workerOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  dropdownActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  assignButton: {
    flex: 1,
    backgroundColor: '#2980b9',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  paginationContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationInfo: {
    flex: 1,
  },
  paginationText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  paginationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  disabledText: {
    color: '#7f8c8d',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
  },
});

