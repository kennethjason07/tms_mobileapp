import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  ScrollView,
  Platform,
  Image,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';
import WebScrollView from './components/WebScrollView';

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

export default function WorkerDetailScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [workerOrders, setWorkerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorkerId) {
      loadOrdersForWorker(selectedWorkerId);
    } else {
      setWorkerOrders([]);
    }
  }, [selectedWorkerId]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      Alert.alert('Error', `Failed to load workers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdersForWorker = async (workerId) => {
    try {
      setOrdersLoading(true);
      const orders = await SupabaseAPI.getOrdersForWorker(workerId);
      // Expand orders by garment type and quantity
      const expandedOrders = expandOrdersByGarmentAndQuantity(orders);
      setWorkerOrders(expandedOrders);
    } catch (error) {
      console.error('Error fetching orders for worker:', error);
      setWorkerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Helper to format date as dd-mm-yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const renderOrderItem = ({ item }) => {
    const displayGarmentType = item.expanded_garment_type || item.garment_type || 'N/A';
    // Add garment count indicator if garment_index is a valid number (including 0)
    const hasValidIndex = typeof item.garment_index === 'number' && item.garment_index >= 0;
    const garmentDisplay = hasValidIndex ? displayGarmentType + ' (' + (item.garment_index + 1) + ')' : displayGarmentType;
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Bill Number:</Text>
          <Text style={styles.orderValue}>{item.billnumberinput2 || 'N/A'}</Text>
          </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Garment Type:</Text>
          <Text style={styles.orderValue}>{garmentDisplay}</Text>
            </View>

      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Order Date:</Text>
        <Text style={styles.orderValue}>{formatDate(item.order_date)}</Text>
          </View>

        <View style={styles.orderRow}>
          <Text style={styles.orderLabel}>Status:</Text>
          <Text style={[styles.orderValue, { color: getStatusColor(item.status) }]}>
            {item.status || 'N/A'}
              </Text>
            </View>
          </View>
    );
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

  const getSelectedWorkerName = () => {
    const worker = workers.find(w => w.id.toString() === selectedWorkerId);
    return worker ? worker.name : '';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading workers...</Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      Platform.OS === 'web' && {
        height: '100vh',
        width: '100vw',
        overflow: 'hidden'
      }
    ]}>
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Worker Overview</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <WebScrollView
          style={{
            flex: 1,
            height: 'calc(100vh - 120px)',
            width: '100vw'
          }}
          contentContainerStyle={{
            paddingBottom: 100,
            minHeight: 'max-content'
          }}
          showsVerticalScrollIndicator={true}
        >
            {/* Worker Selection Section */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Worker:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedWorkerId}
                  onValueChange={(itemValue) => setSelectedWorkerId(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a Worker" value="" />
                  {workers.map((worker) => (
                    <Picker.Item
                      key={worker.id}
                      label={`${worker.id} - ${worker.name}`}
                      value={worker.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Orders Section */}
            <View style={styles.ordersSection}>
              <Text style={styles.sectionTitle}>
                Orders for {getSelectedWorkerName()} ({workerOrders.length})
              </Text>
              {ordersLoading ? (
                <View style={styles.loadingOrdersContainer}>
                  <ActivityIndicator size="small" color="#2980b9" />
                  <Text style={styles.loadingOrdersText}>Loading orders...</Text>
                </View>
              ) : workerOrders.length > 0 ? (
                <FlatList
                  data={workerOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.noOrdersContainer}>
                  <Text style={styles.noOrdersText}>No orders found for this worker.</Text>
                </View>
              )}
            </View>
        </WebScrollView>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Worker Selection Section */}
          <View style={styles.selectionSection}>
            <Text style={styles.sectionTitle}>Select Worker:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedWorkerId}
                onValueChange={(itemValue) => setSelectedWorkerId(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select a Worker" value="" />
                {workers.map((worker) => (
                  <Picker.Item
                    key={worker.id}
                    label={`${worker.id} - ${worker.name}`}
                    value={worker.id.toString()}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Orders Section */}
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>
              Orders for {getSelectedWorkerName()} ({workerOrders.length})
            </Text>
            {ordersLoading ? (
              <View style={styles.loadingOrdersContainer}>
                <ActivityIndicator size="small" color="#2980b9" />
                <Text style={styles.loadingOrdersText}>Loading orders...</Text>
              </View>
            ) : workerOrders.length > 0 ? (
              <FlatList
                data={workerOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noOrdersContainer}>
                <Text style={styles.noOrdersText}>No orders found for this worker.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <View style={{
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        right: 24,
        bottom: Platform.OS === 'web' ? 24 : 64,
        alignItems: 'flex-end',
        zIndex: Platform.OS === 'web' ? 9999 : 100,
        ...(Platform.OS === 'web' && {
          position: 'fixed',
          right: '24px',
          bottom: '24px',
        })
      }}>
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
            ...(Platform.OS === 'web' && {
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            })
          }}
          onPress={() => navigation.navigate('NewBill')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    marginLeft: 16,
  },
  scrollView: {
    flex: 1,
  },
  selectionSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    width: '100%',
    height: 50,
  },
  ordersSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  orderCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
    flex: 1,
  },
  orderValue: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  loadingOrdersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingOrdersText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#7f8c8d',
  },
  noOrdersContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noOrdersText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
}); 