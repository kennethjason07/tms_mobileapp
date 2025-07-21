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
      loadData();
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
    <View style={styles.tableHeader}>
      <Text style={[styles.headerCell, { width: 60 }]}>ID</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Bill Number</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Garment Type</Text>
      <Text style={[styles.headerCell, { width: 100 }]}>Delivery Status</Text>
      <Text style={[styles.headerCell, { width: 200 }]}>Update Delivery Status</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Order Date</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Delivery Date</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Payment Mode</Text>
      <Text style={[styles.headerCell, { width: 100 }]}>Payment Status</Text>
      <Text style={[styles.headerCell, { width: 200 }]}>Update Payment Status</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Total Amount</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Advance Amount</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Pending Amount</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Customer Mobile</Text>
      <Text style={[styles.headerCell, { width: 100 }]}>Bill ID</Text>
      <Text style={[styles.headerCell, { width: 150 }]}>Worker Assignment</Text>
      <Text style={[styles.headerCell, { width: 200 }]}>Worker Names</Text>
      <Text style={[styles.headerCell, { width: 120 }]}>Total Worker Pay</Text>
    </View>
  );

  const renderTableRow = (order, index) => {
    const workerNames = order.workers?.map(worker => worker.name).join(", ") || "Not Assigned";
    const pendingAmount = (order.total_amt || 0) - (order.payment_amount || 0);
    const isWorkerDropdownOpen = workerDropdownVisible[order.id] || false;
    const uniqueKey = `order-${order.id || 'null'}-${index}`;
    const hasValidId = order.id && order.id !== 'null' && order.id !== null;

    return (
      <View key={uniqueKey} style={styles.tableRow}>
        <Text style={[styles.cell, { width: 60 }]}>{order.id || 'N/A'}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{order.billnumberinput2 || "N/A"}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{order.garment_type || 'N/A'}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{order.status || 'N/A'}</Text>
        
        <View style={[styles.cell, { width: 200 }]}>
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
        
        <Text style={[styles.cell, { width: 120 }]}>{normalizeDate(order.order_date)}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{normalizeDate(order.due_date)}</Text>
        
        <View style={[styles.cell, { width: 120 }]}>
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

        <Text style={[styles.cell, { width: 100 }]}>{order.payment_status || 'N/A'}</Text>
        
        <View style={[styles.cell, { width: 200 }]}>
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

        <View style={[styles.cell, { width: 120 }]}>
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
        
        <View style={[styles.cell, { width: 120 }]}>
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
        <Text style={[styles.cell, { width: 120 }]}>{pendingAmount}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{order.customer_mobile || "N/A"}</Text>
        <Text style={[styles.cell, { width: 100 }]}>{order.bill_id || 'N/A'}</Text>
        
        <View style={[styles.cell, { width: 150 }]}>
          {hasValidId ? (
            <>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => toggleWorkerDropdown(order.id)}
              >
                <Text style={styles.dropdownButtonText}>
                  {selectedWorkers[order.id]?.length > 0 
                    ? `${selectedWorkers[order.id].length} selected` 
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
                  <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => closeWorkerDropdown(order.id)}
                  >
                    <View style={styles.dropdownModal} onStartShouldSetResponder={() => true}>
                      <Text style={styles.dropdownTitle}>Select Workers</Text>
                      <ScrollView style={styles.workerList}>
                        {workers.map((worker, workerIndex) => (
                          <TouchableOpacity
                            key={`worker-${worker.id || 'null'}-${workerIndex}`}
                            style={[
                              styles.workerOption,
                              selectedWorkers[order.id]?.includes(worker.id) && styles.workerOptionSelected
                            ]}
                            onPress={() => handleWorkerSelection(order.id, worker.id)}
                          >
                            <Text style={[
                              styles.workerOptionText,
                              selectedWorkers[order.id]?.includes(worker.id) && styles.workerOptionTextSelected
                            ]}>
                              {worker.name || 'Unknown Worker'}
        </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <View style={styles.dropdownActions}>
                        <TouchableOpacity
                          style={styles.assignButton}
                          onPress={() => handleAssignWorkers(order.id)}
                        >
                          <Text style={styles.assignButtonText}>Assign Workers</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
            </>
          ) : (
            <Text style={styles.disabledText}>No ID</Text>
          )}
        </View>
        
        <Text style={[styles.cell, { width: 200 }]}>{workerNames}</Text>
        <Text style={[styles.cell, { width: 120 }]}>{Array.isArray(order.workers) && order.workers.length > 0 && typeof order.Work_pay === 'number' && !isNaN(order.Work_pay) ? order.Work_pay : 0}</Text>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
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
      <View style={styles.header}>
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[styles.headerTitle, { textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 1 }]}>Orders Overview</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('WhatsAppConfig')}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              padding: 8,
              marginRight: 8,
            }}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff' }} />
        </View>
      </View>

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
          <ScrollView
            style={{ overflow: 'visible' }}
            showsVerticalScrollIndicator={true}
          >
            {renderFilters()}
            
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
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {renderFilters()}
            
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
      {/* Floating Reload Button */}
      <View style={{ position: 'absolute', right: 24, bottom: 32, alignItems: 'flex-end', zIndex: 100 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#2980b9',
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
        >
          <Ionicons name="refresh-circle" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{ height: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#2980b9',
    elevation: 4,
    marginTop: 32, // bring header down
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
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
  },
  tableWrapper: {
    minWidth: 2000, // Ensure table has minimum width for scrolling
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  statusButtonActive: {
    backgroundColor: '#27ae60',
  },
  statusButtonText: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: '500',
  },
  paymentButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  paymentButtonActive: {
    backgroundColor: '#3498db',
  },
  paymentButtonText: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: '500',
  },
  paymentStatusButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  paymentStatusButtonActive: {
    backgroundColor: '#e74c3c',
  },
  paymentStatusButtonText: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: '500',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    textAlign: 'center',
    minWidth: 80,
  },
  dropdownButton: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 120,
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
    padding: 16,
    borderRadius: 8,
    width: '80%',
    maxHeight: '60%',
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  workerList: {
    maxHeight: 200,
    marginBottom: 16,
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
    justifyContent: 'center',
    marginTop: 16,
  },
  assignButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  assignButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
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
}); 