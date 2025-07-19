import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SupabaseAPI } from './supabase';

const NAV_ITEMS = [
  { label: 'New Bill', desc: 'Create and manage new customer bills', screen: 'NewBill', available: true },
  { label: 'Customer Information', desc: 'View and manage customer details', screen: 'CustomerInfo', available: true },
  { label: 'Orders Overview', desc: 'Track and manage all orders', screen: 'OrdersOverview', available: true },
  { label: 'Shop Expenses', desc: 'Manage shop expenses and costs', screen: 'ShopExpense', available: true },
  { label: 'Worker Expenses', desc: 'Track worker payments and expenses', screen: 'WorkerExpense', available: true },
  { label: 'Weekly Pay Calculation', desc: 'Calculate worker weekly payments', screen: 'WeeklyPay', available: true },
  { label: 'Worker Detailed Overview', desc: 'View detailed worker performance', screen: 'WorkerDetail', available: true },
  { label: 'Daily Profit', desc: 'Track daily and monthly profits', screen: 'DailyProfit', available: true },
  { label: 'Workers', desc: 'Add and manage workers', screen: 'Workers', available: true },
];

export default function DashboardScreen({ navigation }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNavigation = async (screenName, available) => {
    if (!available) {
      Alert.alert('Coming Soon', `${screenName} screen is under development and will be available soon!`);
      return;
    }

    if (!navigation?.navigate) {
      Alert.alert('Navigation Error', 'Navigation is not available');
      return;
    }

    try {
      setLoading(true);
      
      // You can add any pre-navigation logic here
      // For example, checking if data exists or validating user permissions
      
      navigation.navigate(screenName);
    } catch (error) {
      Alert.alert('Error', `Failed to navigate to ${screenName}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    // You can implement admin login logic here
    Alert.alert('Admin Login', 'Admin login functionality will be implemented here');
    setDropdownVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <Text style={styles.companyName}>Starset Consultancy Services</Text>
        </View>
        <View style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setDropdownVisible(!dropdownVisible)}
            activeOpacity={0.7}
            disabled={loading}
          >
            {/* SVG replaced with View for simplicity */}
            <View style={styles.profileIcon} />
            <Text style={styles.profileText}>Select Role</Text>
          </TouchableOpacity>
          {dropdownVisible && (
            <View style={styles.dropdownContent}>
              <TouchableOpacity onPress={handleAdminLogin}>
                <Text style={styles.dropdownItem}>Admin</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      {Platform.OS === 'web' ? (
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <ScrollView
            style={{ overflow: 'visible' }}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <View style={styles.navigationGrid}>
              {NAV_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.navCard, 
                    loading && styles.navCardDisabled,
                    !item.available && styles.navCardComingSoon
                  ]}
                  onPress={() => handleNavigation(item.screen, item.available)}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={[
                    styles.navCardTitle,
                    !item.available && styles.navCardTitleComingSoon
                  ]}>
                    {item.label}
                    {!item.available && ' (Coming Soon)'}
                  </Text>
                  <Text style={styles.navCardDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
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
            <Text style={styles.dashboardTitle}>Dashboard</Text>
            <View style={styles.navigationGrid}>
              {NAV_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.navCard, 
                    loading && styles.navCardDisabled,
                    !item.available && styles.navCardComingSoon
                  ]}
                  onPress={() => handleNavigation(item.screen, item.available)}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={[
                    styles.navCardTitle,
                    !item.available && styles.navCardTitleComingSoon
                  ]}>
                    {item.label}
                    {!item.available && ' (Coming Soon)'}
                  </Text>
                  <Text style={styles.navCardDesc}>{item.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 60, height: 60, marginRight: 12, resizeMode: 'contain' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#34495e' },
  profileContainer: { position: 'relative' },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  profileIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#34495e',
    marginRight: 8,
  },
  profileText: { fontSize: 16, color: '#34495e' },
  dropdownContent: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    padding: 8,
    zIndex: 10,
    minWidth: 100,
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#34495e',
  },
  main: { padding: 20 },
  dashboardTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
  navigationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  navCardDisabled: {
    opacity: 0.6,
  },
  navCardComingSoon: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  navCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2980b9', marginBottom: 6 },
  navCardTitleComingSoon: { 
    color: '#6c757d',
    fontSize: 16,
  },
  navCardDesc: { fontSize: 14, color: '#7f8c8d' },
}); 