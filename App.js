import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StatusBar, ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import web styles for responsive design
if (Platform.OS === 'web') {
  require('./web-styles.css');
}

// Suppress specific React Native Web deprecation warnings
if (Platform.OS === 'web') {
  // Suppress shadow* deprecation warnings
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('shadow*') || 
       args[0].includes('pointerEvents is deprecated') ||
       args[0].includes('resizeMode is deprecated') ||
       args[0].includes('textShadow*'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
import LoginScreen from './LoginScreen';
import DashboardScreen from './DashboardScreen';
import WorkersScreen from './WorkersScreen';
import OrdersOverviewScreen from './OrdersOverviewScreen';
import ShopExpenseScreen from './ShopExpenseScreen';
import WorkerExpenseScreen from './WorkerExpenseScreen';
import CustomerInfoScreen from './CustomerInfoScreen';
import WeeklyPayScreen from './WeeklyPayScreen';
import NewBillScreen from './NewBillScreen';
import WorkerDetailScreen from './WorkerDetailScreen';
import TodayProfitScreen from './TodayProfitScreen';
import WeeklyProfitScreen from './WeeklyProfitScreen';
import MonthlyProfitScreen from './MonthlyProfitScreen';
import WhatsAppConfigScreen from './WhatsAppConfigScreen';
import GenerateBillScreen from './GenerateBillScreen';
import TodaysOrdersScreen from './TodaysOrdersScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing login session on app mount
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const loginStatus = await AsyncStorage.getItem('isLoggedIn');
      if (loginStatus === 'true') {
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Error saving login status:', error);
      setIsLoggedIn(true); // Still log in even if storage fails
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error removing login status:', error);
      setIsLoggedIn(false); // Still log out even if storage fails
    }
  };

  // Show loading screen while checking login status
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2c3e50' }}>
          <ActivityIndicator size="large" color="#db9b68" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaProvider>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
          backgroundColor={Platform.OS === 'android' ? '#2c3e50' : undefined}
        />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={Platform.OS === 'android' ? '#2980b9' : undefined}
      />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Dashboard"
          screenOptions={{
            headerShown: false,
            ...(Platform.OS === 'ios' && {
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }),
          }}
        >
          <Stack.Screen name="Dashboard">
            {(props) => <DashboardScreen {...props} onLogout={handleLogout} />}
          </Stack.Screen>
          <Stack.Screen name="Workers" component={WorkersScreen} />
          <Stack.Screen name="OrdersOverview" component={OrdersOverviewScreen} />
          <Stack.Screen name="ShopExpense" component={ShopExpenseScreen} />
          <Stack.Screen name="WorkerExpense" component={WorkerExpenseScreen} />
          <Stack.Screen name="CustomerInfo" component={CustomerInfoScreen} />
          <Stack.Screen name="WeeklyPay" component={WeeklyPayScreen} />
          <Stack.Screen name="NewBill" component={NewBillScreen} />
          <Stack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
          <Stack.Screen name="TodayProfit" component={TodayProfitScreen} />
          <Stack.Screen name="WeeklyProfit" component={WeeklyProfitScreen} />
          <Stack.Screen name="MonthlyProfit" component={MonthlyProfitScreen} />
          <Stack.Screen name="WhatsAppConfig" component={WhatsAppConfigScreen} />
          <Stack.Screen name="GenerateBill" component={GenerateBillScreen} />
          <Stack.Screen name="TodaysOrders" component={TodaysOrdersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
