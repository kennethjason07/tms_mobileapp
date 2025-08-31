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
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerInfoScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a mobile number');
      return;
    }

    try {
      setLoading(true);
      const customerData = await SupabaseAPI.getCustomerInfo(searchQuery);
      
      if (customerData && customerData.order_history && customerData.order_history.length > 0) {
        setCustomerOrders(customerData.order_history);
        setCustomerFound(true);
      } else {
        Alert.alert('Not Found', 'No orders found for this customer.');
        setCustomerOrders([]);
        setCustomerFound(false);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      Alert.alert('Error', 'No orders found for this customer.');
      setCustomerOrders([]);
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

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Order ID:</Text>
        <Text style={styles.orderValue}>{item.id}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Bill Number:</Text>
        <Text style={styles.orderValue}>{item.billnumberinput2 || 'N/A'}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Garment Type:</Text>
        <Text style={styles.orderValue}>{item.garment_type || 'N/A'}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Status:</Text>
        <Text style={styles.orderValue}>{item.status || 'N/A'}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Order Date:</Text>
        <Text style={styles.orderValue}>{formatDateTime(item.order_date)}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Due Date:</Text>
        <Text style={styles.orderValue}>{formatDateTime(item.due_date)}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Payment Mode:</Text>
        <Text style={styles.orderValue}>{item.payment_mode || 'N/A'}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Payment Status:</Text>
        <Text style={styles.orderValue}>{item.payment_status || 'N/A'}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Advance Amount:</Text>
        <Text style={styles.orderValue}>₹{item.payment_amount || 0}</Text>
      </View>
      
      <View style={styles.orderRow}>
        <Text style={styles.orderLabel}>Total Amount:</Text>
        <Text style={styles.orderValue}>₹{item.total_amt || 0}</Text>
      </View>
    </View>
  );

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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Customer's Information</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <View style={{ flex: 1, overflow: 'auto' }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
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
                  <Text style={styles.sectionTitle}>Customer Orders ({customerOrders.length})</Text>
                  <FlatList
                    data={customerOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}

              {customerFound && customerOrders.length === 0 && (
                <View style={styles.noOrdersContainer}>
                  <Text style={styles.noOrdersText}>No orders found for this customer.</Text>
                </View>
              )}
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
                  <Text style={styles.sectionTitle}>Customer Orders ({customerOrders.length})</Text>
                  <FlatList
                    data={customerOrders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
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
  orderCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
}); 