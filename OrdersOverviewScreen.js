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
} from 'react-native';
import WebScrollView from './components/WebScrollView';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseAPI } from './supabase';
import { WhatsAppService } from './whatsappService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

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
      const [ordersData, workersData] = await Promise.all([
        SupabaseAPI.getOrders(),
        SupabaseAPI.getWorkers()
      ]);
      
      // Process orders data to match frontend structure
      const processedOrders = ordersData
        // REMOVE the filter so all orders are shown
        .map(order => ({
          ...order,
          deliveryDate: order.due_date,
          workers: order.order_worker_association?.map(assoc => assoc.workers) || []
        }))
        // Sort by order_date descending, then billnumberinput2 descending
        .sort((a, b) => {
          const dateA = new Date(normalizeDate(a.order_date));
          const dateB = new Date(normalizeDate(b.order_date));
          if (dateA.getTime() === dateB.getTime()) {
            // If dates are the same, sort by billnumberinput2 descending
            return (b.billnumberinput2 || 0) - (a.billnumberinput2 || 0);
          }
          return dateB - dateA;
        });
      
      setOrders(processedOrders);
      setFilteredOrders(processedOrders);
      setWorkers(workersData);
    } catch (error) {
      console.error('OrdersOverviewScreen - Error loading data:', error);
      Alert.alert('Error', `Failed to load data: ${error.message}`);
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

    // Sort by order_date descending, then billnumberinput2 descending
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(normalizeDate(a.order_date));
      const dateB = new Date(normalizeDate(b.order_date));
      if (dateA.getTime() === dateB.getTime()) {
        return (b.billnumberinput2 || 0) - (a.billnumberinput2 || 0);
      }
      return dateB - dateA;
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
      const data = await SupabaseAPI.searchOrders(searchQuery);
      // Sort by order_date descending, then billnumberinput2 descending
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(normalizeDate(a.order_date));
        const dateB = new Date(normalizeDate(b.order_date));
        if (dateA.getTime() === dateB.getTime()) {
          return (b.billnumberinput2 || 0) - (a.billnumberinput2 || 0);
        }
        return dateB - dateA;
      });
      setFilteredOrders(sortedData);
    } catch (error) {
      Alert.alert('Error', `Search failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    if (!orderId || orderId === 'null' || orderId === null) {
      Alert.alert('Error', 'Invalid order ID. Cannot update status.');
      return;
    }

    try {
      setLoading(true);
      await SupabaseAPI.updateOrderStatus(orderId, newStatus);
      
      // If status is being set to completed, check if all orders for this bill are completed
      if (newStatus.toLowerCase() === 'completed') {
        // Find the current order to get its bill_id
        const currentOrder = orders.find(order => order.id === orderId);
        if (currentOrder && currentOrder.bill_id) {
          try {
            // Get all orders for this bill
            const { orders: billOrders, bill } = await SupabaseAPI.getOrdersByBillId(currentOrder.bill_id);
            
            // Check if all orders for this bill are completed
            const allCompleted = billOrders.every(order => 
              order.status?.toLowerCase() === 'completed'
            );
            
            if (allCompleted && bill) {
              // Send WhatsApp notification
              try {
                const customerInfo = WhatsAppService.getCustomerInfoFromBill(bill);
                const orderDetails = WhatsAppService.generateOrderDetailsString(billOrders);
                const message = WhatsAppService.generateCompletionMessage(
                  customerInfo.name,
                  bill.id,
                  orderDetails
                );
                
                if (customerInfo.mobile) {
                  await WhatsAppService.sendWhatsAppMessage(customerInfo.mobile, message);
                  Alert.alert(
                    'Success', 
                    'Order status updated successfully and WhatsApp notification sent to customer!'
                  );
                } else {
                  Alert.alert(
                    'Success', 
                    'Order status updated successfully. WhatsApp notification skipped - no mobile number found.'
                  );
                }
              } catch (whatsappError) {
                console.error('WhatsApp notification error:', whatsappError);
                Alert.alert(
                  'Success', 
                  'Order status updated successfully. WhatsApp notification failed - please check your API configuration.'
                );
              }
            } else {
              Alert.alert('Success', 'Order status updated successfully');
            }
          } catch (billError) {
            console.error('Error checking bill completion:', billError);
            Alert.alert('Success', 'Order status updated successfully');
          }
        } else {
          Alert.alert('Success', 'Order status updated successfully');
        }
      } else {
        Alert.alert('Success', 'Order status updated successfully');
      }
      
      loadData();
    } catch (error) {
      Alert.alert('Error', `Failed to update status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    if (!orderId || orderId === 'null' || orderId === null) {
      Alert.alert('Error', 'Invalid order ID. Cannot update payment status.');
      return;
    }

    try {
      setLoading(true);
      await SupabaseAPI.updatePaymentStatus(orderId, newPaymentStatus);
      loadData();
      Alert.alert('Success', 'Payment status updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update payment status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentMode = async (orderId, newPaymentMode) => {
    if (!orderId || orderId === 'null' || orderId === null) {
      Alert.alert('Error', 'Invalid order ID. Cannot update payment mode.');
      return;
    }

    try {
      setLoading(true);
      await SupabaseAPI.updatePaymentMode(orderId, newPaymentMode);
      loadData();
      Alert.alert('Success', 'Payment mode updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update payment mode: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTotalAmount = async (orderId, newAmount) => {
    if (!orderId || orderId === 'null' || orderId === null) {
      Alert.alert('Error', 'Invalid order ID. Cannot update total amount.');
      return;
    }

    if (isNaN(newAmount) || newAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      await SupabaseAPI.updateOrderTotalAmount(orderId, parseFloat(newAmount));
      loadData();
      Alert.alert('Success', 'Total amount updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update total amount: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePaymentAmount = async (orderId, newAmount) => {
    if (!orderId || orderId === 'null' || orderId === null) {
      Alert.alert('Error', 'Invalid order ID. Cannot update payment amount.');
      return;
    }

    if (isNaN(newAmount) || newAmount < 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    try {
      setLoading(true);
      await SupabaseAPI.updatePaymentAmount(orderId, parseFloat(newAmount));
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
      setSelectedWorkers(prev => ({
        ...prev,
        [orderId]: currentSelected.filter(id => id !== workerId)
      }));
    } else {
      setSelectedWorkers(prev => ({
        ...prev,
        [orderId]: [...currentSelected, workerId]
      }));
    }
  };

  const handleAssignWorkers = async (orderId) => {
    const workerIds = selectedWorkers[orderId];
    if (!workerIds || workerIds.length === 0) {
      Alert.alert('Error', 'Please select at least one worker.');
      return;
    }

    try {
      setLoading(true);
      const result = await SupabaseAPI.assignWorkersToOrder(orderId, workerIds);
      
      // Manually update the order in local state for immediate UI feedback
      const assignedWorkerObjects = workers.filter(worker => workerIds.includes(worker.id));
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, Work_pay: result.work_pay, workers: assignedWorkerObjects }
            : order
        )
      );
      setFilteredOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId
            ? { ...order, Work_pay: result.work_pay, workers: assignedWorkerObjects }
            : order
        )
      );
      
      setWorkerDropdownVisible(prev => ({ ...prev, [orderId]: false }));
      Alert.alert('Success', `Workers assigned successfully. Total Work Pay: ₹${result.work_pay.toFixed(2)}`);
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
    const isWorkerDropdownOpen = workerDropdownVisible[order.id] || false;
    const uniqueKey = `order-${order.id || 'null'}-${index}`;
    const hasValidId = order.id && order.id !== 'null' && order.id !== null;

    return (
      <View key={uniqueKey} style={[styles.tableRow, Platform.OS === 'web' && { display: 'flex', flexDirection: 'row' }]}>
        <View style={[styles.cell, { width: 60, minWidth: 60, maxWidth: 60 }]}>
          <Text style={styles.cellText}>{order.id || 'N/A'}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{order.billnumberinput2 || "N/A"}</Text>
        </View>
        <View style={[styles.cell, { width: 120, minWidth: 120, maxWidth: 120 }]}>
          <Text style={styles.cellText}>{order.garment_type || 'N/A'}</Text>
        </View>
        <View style={[styles.cell, { width: 100, minWidth: 100, maxWidth: 100 }]}>
          <Text style={styles.cellText}>{order.status || 'N/A'}</Text>
        </View>
        
        <View style={[styles.cell, { width: 200, minWidth: 200, maxWidth: 200 }]}>
          {hasValidId ? (
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.statusButton, order.status === 'pending' && styles.statusButtonActive]}
                onPress={() => handleUpdateStatus(order.id, 'pending')}
              >
                <Text style={styles.statusButtonText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, order.status === 'completed' && styles.statusButtonActive]}
                onPress={() => handleUpdateStatus(order.id, 'completed')}
              >
                <Text style={styles.statusButtonText}>Completed</Text>
              </TouchableOpacity>
    <TouchableOpacity
                style={[styles.statusButton, order.status === 'cancelled' && styles.statusButtonActive]}
                onPress={() => handleUpdateStatus(order.id, 'cancelled')}
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
                onPress={() => handleUpdatePaymentMode(order.id, 'UPI')}
              >
                <Text style={styles.paymentButtonText}>UPI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentButton, order.payment_mode === 'Cash' && styles.paymentButtonActive]}
                onPress={() => handleUpdatePaymentMode(order.id, 'Cash')}
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
                onPress={() => handleUpdatePaymentStatus(order.id, 'pending')}
              >
                <Text style={styles.paymentStatusButtonText}>Pending</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentStatusButton, order.payment_status === 'paid' && styles.paymentStatusButtonActive]}
                onPress={() => handleUpdatePaymentStatus(order.id, 'paid')}
              >
                <Text style={styles.paymentStatusButtonText}>Paid</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentStatusButton, order.payment_status === 'cancelled' && styles.paymentStatusButtonActive]}
                onPress={() => handleUpdatePaymentStatus(order.id, 'cancelled')}
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
              value={editingAmounts[`total_${order.id}`] !== undefined 
                ? editingAmounts[`total_${order.id}`] 
                : (order.total_amt?.toString() || '0')}
              onChangeText={(text) => setEditingAmounts(prev => ({
                ...prev,
                [`total_${order.id}`]: text
              }))}
              onBlur={(e) => {
                const value = editingAmounts[`total_${order.id}`] || e.nativeEvent.text;
                handleUpdateTotalAmount(order.id, value);
                setEditingAmounts(prev => {
                  const newState = { ...prev };
                  delete newState[`total_${order.id}`];
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
              value={editingAmounts[`payment_${order.id}`] !== undefined 
                ? editingAmounts[`payment_${order.id}`] 
                : (order.payment_amount?.toString() || '0')}
              onChangeText={(text) => setEditingAmounts(prev => ({
                ...prev,
                [`payment_${order.id}`]: text
              }))}
              onBlur={(e) => {
                const value = editingAmounts[`payment_${order.id}`] || e.nativeEvent.text;
                handleUpdatePaymentAmount(order.id, value);
                setEditingAmounts(prev => {
                  const newState = { ...prev };
                  delete newState[`payment_${order.id}`];
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
                onPress={() => toggleWorkerDropdown(order.id)}
              >
                <Text style={styles.dropdownButtonText}>
                  {order.workers && order.workers.length > 0
                    ? `${workerNames}`
                    : 'Select Workers'}
                </Text>
                <Text style={styles.dropdownArrow}>{isWorkerDropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              
              {isWorkerDropdownOpen && (
                <Modal
                  visible={true}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => closeWorkerDropdown(order.id)}
                >
                  <KeyboardAvoidingView 
                    style={{ flex: 1 }} 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  >
                    <TouchableOpacity
                      style={styles.modalOverlay}
                      activeOpacity={1}
                      onPress={() => closeWorkerDropdown(order.id)}
                    >
                      <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                          <Text style={styles.dropdownTitle}>Select Workers</Text>
                          <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => closeWorkerDropdown(order.id)}
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
                            const isSelected = selectedWorkers[order.id]?.includes(worker.id);
                            const selectionCount = selectedWorkers[order.id]?.length || 0;
                            const isDisabled = !isSelected && selectionCount >= 2;
                            return (
                              <TouchableOpacity
                                key={`worker-${worker.id || 'null'}-${workerIndex}`}
                                style={[
                                  styles.workerOption,
                                  isSelected && styles.workerOptionSelected,
                                  isDisabled && { opacity: 0.5 }
                                ]}
                                onPress={() => {
                                  if (!isDisabled) handleWorkerSelection(order.id, worker.id);
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
                            onPress={() => closeWorkerDropdown(order.id)}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.assignButton}
                            onPress={() => handleAssignWorkers(order.id)}
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
          <Text style={styles.cellText}>{Array.isArray(order.workers) && order.workers.length > 0 && typeof order.Work_pay === 'number' && !isNaN(order.Work_pay) ? order.Work_pay : 0}</Text>
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
        <Text style={styles.filterLabel}>Delivery Date:</Text>
        <View style={styles.dateFilterContainer}>
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
        </View>
      </View>

      {showDatePicker && (
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
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <WebScrollView style={{ overflow: 'visible' }} showsVerticalScrollIndicator={true}>
            {renderFilters()}
            {currentOrders.length > 0 ? (
              <View style={styles.tableContainer}>
                <div style={{ 
                  overflowX: 'auto', 
                  overflowY: 'auto', 
                  width: '100%',
                  maxHeight: '70vh',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    minWidth: '2470px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    {renderTableHeader()}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: '2470px'
                    }}>
                      {currentOrders.map((order, index) => renderTableRow(order, index))}
                    </div>
                  </div>
                </div>
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
    width: '85%',
    maxHeight: '70%',
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
