import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import WebScrollView from './components/WebScrollView';
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';
import { createShadowStyle, shadowPresets } from './utils/shadowUtils';

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
            expanded_id: firstOrder.order_id + '_' + type + '_' + i,
            original_id: firstOrder.order_id, // Keep reference to original order
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

export default function CustomerInfoScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerMetadata, setCustomerMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  // Transform old data format to new format
  const transformCustomerData = (rawData) => {
    if (!rawData) return null;

    // Check if data is already in new format
    if (rawData.customer_orders) {
      return rawData;
    }

    // Transform old format to new format
    const orderHistory = rawData.order_history || [];
    
    // Transform each order to match new field names
    const transformedOrders = orderHistory.map(order => ({
      order_id: order.id,
      bill_number: order.billnumberinput2,
      garment_type: order.garment_type,
      status: order.status,
      order_date: order.order_date,
      due_date: order.due_date,
      payment_mode: order.payment_mode,
      payment_status: order.payment_status,
      advance_amount: order.payment_amount || 0,
      total_amount: order.total_amt || 0
    }));

    // Calculate metadata
    const totalAmount = transformedOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const uniqueBillNumbers = [...new Set(transformedOrders.map(order => order.bill_number).filter(Boolean))];
    
    return {
      customer_orders: transformedOrders,
      metadata: {
        total_orders: transformedOrders.length,
        total_bills: uniqueBillNumbers.length,
        total_amount: totalAmount,
        last_updated: new Date().toISOString()
      }
    };
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a mobile number');
      return;
    }

    try {
      setLoading(true);
      const rawCustomerData = await SupabaseAPI.getCustomerInfo(searchQuery);
      
      // Transform the data to new format
      const customerData = transformCustomerData(rawCustomerData);
      
      if (customerData && customerData.customer_orders && customerData.customer_orders.length > 0) {
        // Expand orders by garment type and quantity
        const expandedOrders = expandOrdersByGarmentAndQuantity(customerData.customer_orders);
        setCustomerOrders(expandedOrders);
        setCustomerMetadata(customerData.metadata || null);
        setCustomerFound(true);
      } else {
        Alert.alert('Not Found', 'No orders found for this customer.');
        setCustomerOrders([]);
        setCustomerMetadata(null);
        setCustomerFound(false);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      Alert.alert('Error', 'No orders found for this customer.');
      setCustomerOrders([]);
      setCustomerMetadata(null);
      setCustomerFound(false);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const renderSummaryCard = () => {
    if (!customerMetadata) return null;
    
    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Orders Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Orders:</Text>
          <Text style={styles.summaryValue}>{customerMetadata.total_orders || customerOrders.length}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Bills:</Text>
          <Text style={styles.summaryValue}>{customerMetadata.total_bills || 'N/A'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Amount:</Text>
          <Text style={styles.summaryValue}>₹{customerMetadata.total_amount || 0}</Text>
        </View>
        {customerMetadata.last_updated && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Last Updated:</Text>
            <Text style={styles.summaryValue}>{formatDateTime(customerMetadata.last_updated)}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, styles.orderIdColumn]}>Order ID</Text>
      <Text style={[styles.tableHeaderText, styles.billNumberColumn]}>Bill Number</Text>
      <Text style={[styles.tableHeaderText, styles.garmentTypeColumn]}>Garment Type</Text>
      <Text style={[styles.tableHeaderText, styles.statusColumn]}>Status</Text>
      <Text style={[styles.tableHeaderText, styles.dateColumn]}>Order Date</Text>
      <Text style={[styles.tableHeaderText, styles.dateColumn]}>Due Date</Text>
      <Text style={[styles.tableHeaderText, styles.paymentColumn]}>Payment Mode</Text>
      <Text style={[styles.tableHeaderText, styles.paymentColumn]}>Payment Status</Text>
      <Text style={[styles.tableHeaderText, styles.amountColumn]}>Advance Amount</Text>
      <Text style={[styles.tableHeaderText, styles.amountColumn]}>Total Amount</Text>
    </View>
  );

  const renderOrderItem = ({ item }) => {
    const displayGarmentType = item.expanded_garment_type || item.garment_type || 'N/A';
    // Add garment count indicator if garment_index is a valid number (including 0)
    const hasValidIndex = typeof item.garment_index === 'number' && item.garment_index >= 0;
    const garmentDisplay = hasValidIndex ? displayGarmentType + ' (' + (item.garment_index + 1) + ')' : displayGarmentType;
    
    return (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCellText, styles.orderIdColumn]}>{item.order_id}</Text>
        <Text style={[styles.tableCellText, styles.billNumberColumn]}>{item.bill_number || 'N/A'}</Text>
        <Text style={[styles.tableCellText, styles.garmentTypeColumn]}>{garmentDisplay}</Text>
      <Text style={[styles.tableCellText, styles.statusColumn]}>{item.status || 'N/A'}</Text>
      <Text style={[styles.tableCellText, styles.dateColumn]}>{formatDateTime(item.order_date)}</Text>
      <Text style={[styles.tableCellText, styles.dateColumn]}>{formatDateTime(item.due_date)}</Text>
      <Text style={[styles.tableCellText, styles.paymentColumn]}>{item.payment_mode || 'N/A'}</Text>
      <Text style={[styles.tableCellText, styles.paymentColumn]}>{item.payment_status || 'N/A'}</Text>
      <Text style={[styles.tableCellText, styles.amountColumn]}>₹{item.advance_amount || 0}</Text>
      <Text style={[styles.tableCellText, styles.amountColumn]}>₹{item.total_amount || 0}</Text>
      </View>
    );
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
        ...createShadowStyle(shadowPresets.large),
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Customer's Information</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <WebScrollView style={{ overflow: 'visible' }} showsVerticalScrollIndicator={true}>
            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Customer's Information</Text>
              <View style={styles.searchContainer}>
                <Text style={styles.searchLabel}>Mobile Number:</Text>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter mobile number"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.searchButtonText}>Search</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Orders Section */}
              {customerFound && (
                <View style={styles.ordersSection}>
                  {renderSummaryCard()}
                  <Text style={styles.sectionTitle}>Customer Orders ({customerOrders.length})</Text>
                  <View style={styles.tableContainer}>
                    {renderTableHeader()}
                    <FlatList
                      data={customerOrders}
                      renderItem={renderOrderItem}
                      keyExtractor={(item, index) => `${item?.order_id || 'no-id'}-${index}`}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                </View>
              )}

              {customerFound && customerOrders.length === 0 && (
                <View style={styles.noOrdersContainer}>
                  <Text style={styles.noOrdersText}>No orders found for this customer.</Text>
                </View>
              )}
            </View>
          </WebScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>Customer's Information</Text>
              <View style={styles.searchContainer}>
                <Text style={styles.searchLabel}>Mobile Number:</Text>
                <View style={styles.searchInputContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Enter mobile number"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity
                    style={styles.searchButton}
                    onPress={handleSearch}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.searchButtonText}>Search</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Orders Section */}
              {customerFound && (
                <View style={styles.ordersSection}>
                  {renderSummaryCard()}
                  <Text style={styles.sectionTitle}>Customer Orders ({customerOrders.length})</Text>
                  <View style={styles.tableContainer}>
                    {renderTableHeader()}
                    <FlatList
                      data={customerOrders}
                      renderItem={renderOrderItem}
                      keyExtractor={(item, index) => `${item?.order_id || 'no-id'}-${index}`}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  </View>
                </View>
              )}

              {customerFound && customerOrders.length === 0 && (
                <View style={styles.noOrdersContainer}>
                  <Text style={styles.noOrdersText}>No orders found for this customer.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingTop: Platform.OS === 'ios' ? 0 : 32, // iOS safe area handled by SafeAreaView
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2980b9',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
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
  searchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  ordersSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#dee2e6',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  tableCellText: {
    fontSize: 13,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '500',
  },
  orderIdColumn: {
    flex: 1,
  },
  billNumberColumn: {
    flex: 1.2,
  },
  garmentTypeColumn: {
    flex: 1.2,
  },
  statusColumn: {
    flex: 1,
  },
  dateColumn: {
    flex: 1.4,
  },
  paymentColumn: {
    flex: 1.2,
  },
  amountColumn: {
    flex: 1.4,
  },
  noOrdersContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  noOrdersText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: 'bold',
  },
});
