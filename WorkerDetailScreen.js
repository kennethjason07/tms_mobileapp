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
      setWorkerOrders(orders);
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

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Bill Number:</Text>
        <Text style={styles.orderValue}>{item.billnumberinput2 || 'N/A'}</Text>
        </View>

      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Garment Type:</Text>
        <Text style={styles.orderValue}>{item.garment_type || 'N/A'}</Text>
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
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <ScrollView style={{ overflow: 'visible' }} showsVerticalScrollIndicator={true}>
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
        </View>
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