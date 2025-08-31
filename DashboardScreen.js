import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, Platform, KeyboardAvoidingView, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import WebScrollView from './components/WebScrollView';
import { SupabaseAPI } from './supabase';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { createShadowStyle, shadowPresets } from './utils/shadowUtils';

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
  const [screenData, setScreenData] = useState(Dimensions.get('window'));

  useEffect(() => {
    const onChange = (result) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // Responsive layout calculations
  const isSmallScreen = screenData.width < 768;
  const isMediumScreen = screenData.width >= 768 && screenData.width < 1024;
  const isLargeScreen = screenData.width >= 1024;
  const isExtraLargeScreen = screenData.width >= 1440;

  // Dynamic card width based on screen size
  const getCardWidth = () => {
    if (isSmallScreen) return '47%'; // 2 columns on small screens
    if (isMediumScreen) return '30%'; // 3 columns on medium screens
    if (isLargeScreen) return '23%'; // 4 columns on large screens
    if (isExtraLargeScreen) return '18%'; // 5 columns on extra large screens
    return '47%'; // fallback
  };

  // Dynamic padding based on screen size
  const getResponsivePadding = () => {
    if (isSmallScreen) return 15;
    if (isMediumScreen) return 25;
    if (isLargeScreen) return 35;
    return 20; // fallback
  };

  // Dynamic font sizes
  const getFontSizes = () => {
    if (isSmallScreen) return { title: 20, cardTitle: 16, cardDesc: 12 };
    if (isMediumScreen) return { title: 24, cardTitle: 17, cardDesc: 13 };
    if (isLargeScreen) return { title: 26, cardTitle: 18, cardDesc: 14 };
    return { title: 22, cardTitle: 17, cardDesc: 13 }; // fallback
  };

  const fontSizes = getFontSizes();
  const responsivePadding = getResponsivePadding();
  const cardWidth = getCardWidth();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f7fa', ...(Platform.OS === 'web' && { height: '100vh' }) }}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'} backgroundColor="#2980b9" />
      <View style={{
        backgroundColor: '#2980b9',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 32,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      }}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}>
          <View style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#fff',
            padding: 4,
            marginBottom: 20,
            elevation: 4,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 3 },
          }}>
            <Image 
              source={require('./assets/logo.jpg')} 
              style={{ 
                width: '100%', 
                height: '100%', 
                borderRadius: 46,
                resizeMode: 'cover'
              }} 
            />
          </View>
          <Text style={{ 
            fontSize: 28, 
            fontWeight: 'bold', 
            color: '#fff', 
            textAlign: 'center', 
            letterSpacing: 1.2, 
            marginBottom: 8,
            textShadowColor: 'rgba(0, 0, 0, 0.3)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
          }}>Maximus Consultancy Service</Text>
          <Text style={{ 
            fontSize: 18, 
            color: '#ecf0f1', 
            textAlign: 'center', 
            opacity: 0.95,
            fontWeight: '500',
            letterSpacing: 0.5,
          }}>Welcome! Manage your tailoring business with ease.</Text>
        </View>
      </View>
      {/* Main Content */}
      <WebScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: responsivePadding, paddingRight: responsivePadding, paddingTop: 24, paddingBottom: isSmallScreen ? 60 : 80 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: fontSizes.title, fontWeight: 'bold', color: '#34495e', marginBottom: 18, marginLeft: 4 }}>Dashboard</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: isLargeScreen ? 'flex-start' : 'space-between', marginBottom: 20, gap: isLargeScreen ? 10 : 0 }}>
          {/* Navigation Cards in the specified order */}
          <DashboardCard
            icon={<MaterialCommunityIcons name="calendar-plus" size={32} color="#c0392b" />}
            label="New Bill"
            desc="Create and manage new customer bills"
            onPress={() => navigation.navigate('NewBill')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<Ionicons name="person-circle-outline" size={32} color="#16a085" />}
            label="Customer Information"
            desc="View and manage customer details"
            onPress={() => navigation.navigate('CustomerInfo')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<MaterialCommunityIcons name="clipboard-list-outline" size={32} color="#27ae60" />}
            label="Orders Overview"
            desc="Track and manage all orders"
            onPress={() => navigation.navigate('OrdersOverview')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<FontAwesome5 name="money-bill-wave" size={32} color="#e67e22" />}
            label="Shop Expenses"
            desc="Manage shop expenses and costs"
            onPress={() => navigation.navigate('ShopExpense')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<FontAwesome5 name="user-tie" size={32} color="#8e44ad" />}
            label="Worker Expenses"
            desc="Track worker payments and expenses"
            onPress={() => navigation.navigate('WorkerExpense')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<FontAwesome5 name="calendar-week" size={32} color="#2980b9" />}
            label="Weekly Pay Calculation"
            desc="Calculate worker weekly payments"
            onPress={() => navigation.navigate('WeeklyPay')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<Ionicons name="people" size={32} color="#2980b9" />}
            label="Worker Detailed Overview"
            desc="View detailed worker performance"
            onPress={() => navigation.navigate('Workers')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
          <DashboardCard
            icon={<MaterialCommunityIcons name="chart-bar" size={32} color="#e67e22" />}
            label="Daily Profit"
            desc="Track daily and monthly profits"
            onPress={() => navigation.navigate('DailyProfit')}
            width={cardWidth}
            fontSizes={fontSizes}
            isSmallScreen={isSmallScreen}
          />
        </View>
      </WebScrollView>
    </View>
  );
}

function DashboardCard({ icon, label, desc, onPress, width = '47%', fontSizes = {}, isSmallScreen = false }) {
  const cardPadding = isSmallScreen ? 14 : 18;
  const iconMargin = isSmallScreen ? 8 : 12;
  const cardMarginBottom = isSmallScreen ? 12 : 18;
  
  return (
    <TouchableOpacity
      style={{
        width: width,
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: cardPadding,
        marginBottom: cardMarginBottom,
        ...createShadowStyle(shadowPresets.card),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: isSmallScreen ? 120 : 140,
        transition: 'transform 0.1s',
        ...(Platform.OS === 'web' && {
          cursor: 'pointer',
          ':hover': {
            transform: 'scale(1.02)',
            ...createShadowStyle({ 
              elevation: shadowPresets.card.elevation + 1,
              shadowColor: shadowPresets.card.shadowColor,
              shadowOpacity: 0.12,
              shadowRadius: shadowPresets.card.shadowRadius + 1,
              shadowOffset: shadowPresets.card.shadowOffset
            }),
          },
        }),
      }}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={{ marginBottom: iconMargin }}>{icon}</View>
      <Text 
        style={{ 
          fontSize: fontSizes.cardTitle || 17, 
          fontWeight: 'bold', 
          color: '#34495e', 
          marginBottom: 6, 
          textAlign: 'center', 
          alignSelf: 'center',
          numberOfLines: 2,
          ellipsizeMode: 'tail',
        }}
      >
        {label}
      </Text>
      <Text 
        style={{ 
          fontSize: fontSizes.cardDesc || 13, 
          color: '#7f8c8d', 
          textAlign: 'center', 
          alignSelf: 'center', 
          lineHeight: isSmallScreen ? 16 : 18,
          numberOfLines: 3,
          ellipsizeMode: 'tail',
        }}
      >
        {desc}
      </Text>
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
    ...createShadowStyle(shadowPresets.medium),
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
    ...createShadowStyle(shadowPresets.medium),
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
    ...createShadowStyle(shadowPresets.small),
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