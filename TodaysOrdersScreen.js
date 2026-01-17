import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebScrollView from './components/WebScrollView';
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function TodaysOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedOrders, setGroupedOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadOrders(selectedDate);
  }, [selectedDate]);

  const loadOrders = async (dateToFilter = new Date()) => {
    try {
      setLoading(true);
      const ordersData = await SupabaseAPI.getOrders();
      
      // Get selected date in YYYY-MM-DD format
      const selectedDateString = dateToFilter.toISOString().split('T')[0];
      
      // Filter orders that have due_date matching selected date
      const filteredOrders = ordersData.filter(order => {
        if (!order.due_date && !order.bills?.due_date) return false;
        
        const dueDate = order.due_date || order.bills?.due_date;
        const dueDateString = new Date(dueDate).toISOString().split('T')[0];
        
        return dueDateString === selectedDateString;
      });
      
      console.log(`Total orders: ${ordersData.length}, Filtered orders for ${selectedDateString}: ${filteredOrders.length}`);
      
      // Group orders by bill number
      const grouped = groupOrdersByBill(filteredOrders);
      setGroupedOrders(grouped);
      setOrders(filteredOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('Error', 'Failed to load orders: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'web') {
      // For web, event.target.value contains the date string
      const dateValue = event.target?.value;
      if (dateValue) {
        setSelectedDate(new Date(dateValue));
      }
    } else {
      // For mobile (iOS/Android)
      setShowDatePicker(Platform.OS === 'ios');
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === 'web') {
      // For web, we'll use the HTML input click
      const dateInput = document.getElementById('date-picker-input');
      if (dateInput) {
        dateInput.showPicker?.();
      }
    } else {
      setShowDatePicker(true);
    }
  };

  const groupOrdersByBill = (ordersData) => {
    const billMap = {};
    
    ordersData.forEach(order => {
      const billNumber = order.billnumberinput2 || 'Unknown';
      
      if (!billMap[billNumber]) {
        billMap[billNumber] = {
          billNumber,
          customerName: order.customer_name || order.bills?.customer_name || 'Unknown',
          mobile: order.customer_mobile || order.bills?.mobile_number || 'N/A',
          orderDate: order.order_date || order.bills?.order_date,
          dueDate: order.due_date || order.bills?.due_date,
          status: order.status || 'pending',
          paymentStatus: order.payment_status || 'pending',
          totalAmount: parseFloat(order.total_amt || order.bills?.total_amt || 0),
          advanceAmount: parseFloat(order.payment_amount || order.bills?.payment_amount || 0),
          pants: 0,
          shirts: 0,
          suits: 0,
          safari: 0,
          sadri: 0,
          orders: []
        };
      }
      
      // Count garments
      const garmentType = (order.garment_type || '').toLowerCase();
      if (garmentType.includes('pant')) {
        billMap[billNumber].pants += 1;
      } else if (garmentType.includes('shirt')) {
        billMap[billNumber].shirts += 1;
      } else if (garmentType.includes('suit')) {
        billMap[billNumber].suits += 1;
      } else if (garmentType.includes('safari') || garmentType.includes('jacket')) {
        billMap[billNumber].safari += 1;
      } else if (garmentType.includes('sadri')) {
        billMap[billNumber].sadri += 1;
      }
      
      billMap[billNumber].orders.push(order);
    });
    
    // Convert to array and sort by bill number descending
    return Object.values(billMap).sort((a, b) => {
      const billA = Number(a.billNumber) || 0;
      const billB = Number(b.billNumber) || 0;
      return billB - billA;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'completed') return '#27ae60';
    if (statusLower === 'in progress') return '#f39c12';
    if (statusLower === 'pending') return '#e74c3c';
    return '#95a5a6';
  };

  const getPaymentStatusColor = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'paid') return '#27ae60';
    if (statusLower === 'partial') return '#f39c12';
    if (statusLower === 'pending') return '#e74c3c';
    return '#95a5a6';
  };

  const renderOrderCard = (billData) => {
    const remainingAmount = billData.totalAmount - billData.advanceAmount;
    
    return (
      <View key={billData.billNumber} style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.billNumberContainer}>
            <Text style={styles.billNumberLabel}>Bill #</Text>
            <Text style={styles.billNumber}>{billData.billNumber}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(billData.status) }]}>
              <Text style={styles.statusText}>{billData.status || 'Pending'}</Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerSection}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={14} color="#34495e" />
            <Text style={styles.customerName}>{billData.customerName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={14} color="#34495e" />
            <Text style={styles.customerMobile}>{billData.mobile}</Text>
          </View>
        </View>

        {/* Garment Counts */}
        <View style={styles.garmentSection}>
          <Text style={styles.sectionTitle}>Garments</Text>
          <View style={styles.garmentGrid}>
            {billData.pants > 0 && (
              <View style={styles.garmentItem}>
                <View style={[styles.garmentIcon, { backgroundColor: '#3498db' }]}>
                  <Ionicons name="shirt" size={16} color="#fff" />
                </View>
                <Text style={styles.garmentCount}>{billData.pants}</Text>
                <Text style={styles.garmentLabel}>Pants</Text>
              </View>
            )}
            {billData.shirts > 0 && (
              <View style={styles.garmentItem}>
                <View style={[styles.garmentIcon, { backgroundColor: '#e74c3c' }]}>
                  <Ionicons name="shirt-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.garmentCount}>{billData.shirts}</Text>
                <Text style={styles.garmentLabel}>Shirts</Text>
              </View>
            )}
            {billData.suits > 0 && (
              <View style={styles.garmentItem}>
                <View style={[styles.garmentIcon, { backgroundColor: '#9b59b6' }]}>
                  <Ionicons name="business" size={16} color="#fff" />
                </View>
                <Text style={styles.garmentCount}>{billData.suits}</Text>
                <Text style={styles.garmentLabel}>Suits</Text>
              </View>
            )}
            {billData.safari > 0 && (
              <View style={styles.garmentItem}>
                <View style={[styles.garmentIcon, { backgroundColor: '#f39c12' }]}>
                  <Ionicons name="briefcase" size={16} color="#fff" />
                </View>
                <Text style={styles.garmentCount}>{billData.safari}</Text>
                <Text style={styles.garmentLabel}>Safari</Text>
              </View>
            )}
            {billData.sadri > 0 && (
              <View style={styles.garmentItem}>
                <View style={[styles.garmentIcon, { backgroundColor: '#16a085' }]}>
                  <Ionicons name="vest" size={16} color="#fff" />
                </View>
                <Text style={styles.garmentCount}>{billData.sadri}</Text>
                <Text style={styles.garmentLabel}>Sadri</Text>
              </View>
            )}
          </View>
        </View>

        {/* Dates */}
        <View style={styles.datesSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Order Date</Text>
            <Text style={styles.dateValue}>{formatDate(billData.orderDate)}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(billData.dueDate)}</Text>
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Total Amount:</Text>
            <Text style={styles.paymentValue}>₹{billData.totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Advance:</Text>
            <Text style={styles.paymentValue}>₹{billData.advanceAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.paymentRow, styles.remainingRow]}>
            <Text style={styles.remainingLabel}>Remaining:</Text>
            <Text style={styles.remainingValue}>₹{remainingAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(billData.paymentStatus) }]}>
            <Text style={styles.paymentStatusText}>{billData.paymentStatus || 'Pending'}</Text>
          </View>
        </View>
      </View>
    );
  };

  const ScrollComponent = Platform.OS === 'web' ? WebScrollView : ScrollView;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Total Orders</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Total Orders</Text>
          <Text style={styles.headerSubtitle}>
            {groupedOrders.reduce((sum, bill) => sum + bill.pants, 0)} Pants • {groupedOrders.reduce((sum, bill) => sum + bill.shirts, 0)} Shirts
          </Text>
        </View>
        <TouchableOpacity onPress={() => loadOrders(selectedDate)} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{groupedOrders.length}</Text>
          <Text style={styles.statLabel}>Total Bills</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {groupedOrders.reduce((sum, bill) => sum + bill.pants, 0)}
          </Text>
          <Text style={styles.statLabel}>Pants</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {groupedOrders.reduce((sum, bill) => sum + bill.shirts, 0)}
          </Text>
          <Text style={styles.statLabel}>Shirts</Text>
        </View>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TouchableOpacity onPress={openDatePicker} style={styles.dateSelectorButton}>
          <Ionicons name="calendar" size={20} color="#2c3e50" />
          <Text style={styles.dateSelectorText}>
            {selectedDate.toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#7f8c8d" />
          
          {/* HTML input overlay for web */}
          {Platform.OS === 'web' && (
            <input
              id="date-picker-input"
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              min="2020-01-01"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setSelectedDate(new Date())} 
          style={styles.todayButton}
        >
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* DateTimePicker for mobile */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date(2020, 0, 1)}
        />
      )}

      <ScrollComponent style={styles.scrollView}>
        <View style={styles.cardsContainer}>
          {groupedOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
              <Text style={styles.emptyText}>No deliveries scheduled for this date</Text>
              <Text style={styles.emptySubtext}>
                Orders with due date {selectedDate.toLocaleDateString('en-GB')} will appear here
              </Text>
            </View>
          ) : (
            groupedOrders.map(renderOrderCard)
          )}
        </View>
      </ScrollComponent>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
  },
  header: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#ecf0f1',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 34,
  },
  refreshButton: {
    padding: 5,
  },
  statsBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  dateSelector: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  dateSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginRight: 10,
  },
  dateSelectorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
  },
  todayButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  scrollView: {
    flex: 1,
  },
  cardsContainer: {
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  billNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billNumberLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 4,
  },
  billNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  customerSection: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 6,
  },
  customerMobile: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 6,
  },
  garmentSection: {
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  garmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  garmentItem: {
    alignItems: 'center',
    minWidth: 55,
  },
  garmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  garmentCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  garmentLabel: {
    fontSize: 10,
    color: '#7f8c8d',
  },
  datesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  paymentSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  paymentValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
  },
  remainingRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  remainingLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  remainingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  paymentStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  paymentStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 8,
    textAlign: 'center',
  },
});
