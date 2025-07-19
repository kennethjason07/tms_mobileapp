import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SupabaseAPI } from './supabase';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

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
    <View style={{ flex: 1, backgroundColor: '#f5f7fa' }}>
      {/* Solid Color Header */}
      <View style={{
        backgroundColor: '#2980b9',
        paddingTop: 32,
        paddingBottom: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}>
        <Image source={require('./assets/logo.jpg')} style={{ width: 80, height: 80, marginTop: 24, marginBottom: 8, resizeMode: 'contain', alignSelf: 'center', transform: [{ scale: 1.25 }], borderRadius: 40 }} />
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 1, marginBottom: 4, textAlign: 'center', alignSelf: 'center' }}>Maximus Consultancy Service</Text>
        <Text style={{ fontSize: 16, color: '#e0e0e0', marginBottom: 8, textAlign: 'center', alignSelf: 'center' }}>Welcome! Manage your tailoring business with ease.</Text>
      </View>
      {/* Main Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#34495e', marginBottom: 18, marginLeft: 4 }}>Dashboard</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* Navigation Cards in the specified order */}
          <DashboardCard
            icon={<MaterialCommunityIcons name="calendar-plus" size={32} color="#c0392b" />}
            label="New Bill"
            desc="Create and manage new customer bills"
            onPress={() => navigation.navigate('NewBill')}
          />
          <DashboardCard
            icon={<Ionicons name="person-circle-outline" size={32} color="#16a085" />}
            label="Customer Information"
            desc="View and manage customer details"
            onPress={() => navigation.navigate('CustomerInfo')}
          />
          <DashboardCard
            icon={<MaterialCommunityIcons name="clipboard-list-outline" size={32} color="#27ae60" />}
            label="Orders Overview"
            desc="Track and manage all orders"
            onPress={() => navigation.navigate('OrdersOverview')}
          />
          <DashboardCard
            icon={<FontAwesome5 name="money-bill-wave" size={32} color="#e67e22" />}
            label="Shop Expenses"
            desc="Manage shop expenses and costs"
            onPress={() => navigation.navigate('ShopExpense')}
          />
          <DashboardCard
            icon={<FontAwesome5 name="user-tie" size={32} color="#8e44ad" />}
            label="Worker Expenses"
            desc="Track worker payments and expenses"
            onPress={() => navigation.navigate('WorkerExpense')}
          />
          <DashboardCard
            icon={<FontAwesome5 name="calendar-week" size={32} color="#2980b9" />}
            label="Weekly Pay Calculation"
            desc="Calculate worker weekly payments"
            onPress={() => navigation.navigate('WeeklyPay')}
          />
          <DashboardCard
            icon={<Ionicons name="people" size={32} color="#2980b9" />}
            label="Worker Detailed Overview"
            desc="View detailed worker performance"
            onPress={() => navigation.navigate('Workers')}
          />
          <DashboardCard
            icon={<MaterialCommunityIcons name="chart-bar" size={32} color="#e67e22" />}
            label="Daily Profit"
            desc="Track daily and monthly profits"
            onPress={() => navigation.navigate('DailyProfit')}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function DashboardCard({ icon, label, desc, onPress }) {
  return (
    <TouchableOpacity
      style={{
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginBottom: 18,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.1s',
      }}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={{ marginBottom: 12 }}>{icon}</View>
      <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#34495e', marginBottom: 6, textAlign: 'center', alignSelf: 'center' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: '#7f8c8d', textAlign: 'center', alignSelf: 'center', lineHeight: 18 }}>{desc}</Text>
    </TouchableOpacity>
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
    marginTop: 32, // bring header down
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