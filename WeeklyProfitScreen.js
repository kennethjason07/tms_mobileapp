import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Pressable,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { supabase } from './supabase';
import { Ionicons } from '@expo/vector-icons';
import WebScrollView from './components/WebScrollView';

export default function WeeklyProfitScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weeklyData, setWeeklyData] = useState({
    weekStart: '',
    weekEnd: '',
    weekLabel: '',
    totalRevenue: 0,
    totalAdvancePayments: 0,
    totalRemainingPayments: 0,
    totalShopExpenses: 0,
    totalWorkerExpenses: 0,
    totalExpenses: 0,
    netProfit: 0,
    dailyBreakdown: [], // Array of 7 days (Sunday to Saturday)
  });

  useEffect(() => {
    // Initialize with current week
    const now = new Date();
    const currentWeekData = calculateWeekBounds(now);
    setCurrentWeek(currentWeekData);
    loadWeeklyProfitData(currentWeekData);
  }, []);

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

  const getResponsivePadding = () => {
    if (isSmallScreen) return 16;
    if (isMediumScreen) return 24;
    if (isLargeScreen) return 32;
    return 16;
  };

  const responsivePadding = getResponsivePadding();

  // Calculate week bounds (Sunday to Saturday)
  const calculateWeekBounds = (date) => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + IST_OFFSET_MS);
    
    // Get current day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
    const currentDay = istDate.getDay();
    
    // Calculate Sunday of this week
    const weekStart = new Date(istDate);
    weekStart.setDate(istDate.getDate() - currentDay);
    weekStart.setHours(0, 0, 0, 0);
    
    // Calculate Saturday of this week
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    // Format for display and API calls
    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const weekStartStr = formatDate(weekStart);
    const weekEndStr = formatDate(weekEnd);
    
    // Create readable week label
    const formatDisplayDate = (date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    };

    const weekLabel = `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}, ${weekStart.getFullYear()}`;

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      weekLabel: weekLabel,
      weekStartDate: weekStart,
      weekEndDate: weekEnd
    };
  };

  const formatISTDate = (date) => {
    if (!date) return '';
    
    try {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      
      let dateObj;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        console.warn('Invalid date format:', date, typeof date);
        return '';
      }
      
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value:', date);
        return '';
      }
      
      const istDate = new Date(dateObj.getTime() + IST_OFFSET_MS);
      
      const yyyy = istDate.getFullYear();
      const mm = String(istDate.getMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getDate()).padStart(2, '0');
      
      return `${yyyy}-${mm}-${dd}`;
    } catch (error) {
      console.error('Error in formatISTDate:', error, 'Date:', date);
      return '';
    }
  };

  const loadWeeklyProfitData = async (weekData) => {
    try {
      setLoading(true);
      
      console.log('📅 WeeklyProfitScreen: Loading data for week:', weekData.weekLabel);
      console.log('   Week Start:', weekData.weekStart);
      console.log('   Week End:', weekData.weekEnd);
      
      // Initialize daily breakdown structure (Sunday to Saturday)
      const dailyBreakdown = [];
      const startDate = new Date(weekData.weekStartDate);
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + i);
        const dayDateStr = formatISTDate(dayDate);
        
        dailyBreakdown.push({
          date: dayDateStr,
          dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
          advancePayments: 0,
          remainingPayments: 0,
          shopExpenses: 0,
          workerExpenses: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          advanceDetails: [],
          remainingDetails: [],
          shopExpenseDetails: [],
          workerExpenseDetails: [],
        });
      }

      // Fetch data for each day of the week
      const weekPromises = dailyBreakdown.map(async (day) => {
        const [advanceData, remainingData, shopExpenseData, workerExpenseData] = await Promise.all([
          fetchAdvancePayments(day.date),
          fetchRemainingPayments(day.date),
          fetchShopExpenses(day.date),
          fetchWorkerExpenses(day.date)
        ]);

        // Calculate daily totals
        const totalAdvance = advanceData.reduce((sum, item) => sum + item.amount, 0);
        const totalRemaining = remainingData.reduce((sum, item) => sum + item.amount, 0);
        const totalShopExpenses = shopExpenseData.reduce((sum, item) => sum + item.amount, 0);
        const totalWorkerExpenses = workerExpenseData.reduce((sum, item) => sum + item.amount, 0);
        const totalRevenue = totalAdvance + totalRemaining;
        const totalExpenses = totalShopExpenses + totalWorkerExpenses;
        const netProfit = totalRevenue - totalExpenses;

        // Update the day object
        return {
          ...day,
          advancePayments: totalAdvance,
          remainingPayments: totalRemaining,
          shopExpenses: totalShopExpenses,
          workerExpenses: totalWorkerExpenses,
          totalRevenue,
          totalExpenses,
          netProfit,
          advanceDetails: advanceData,
          remainingDetails: remainingData,
          shopExpenseDetails: shopExpenseData,
          workerExpenseDetails: workerExpenseData,
        };
      });

      const updatedDailyBreakdown = await Promise.all(weekPromises);

      // Calculate weekly totals
      const weekTotals = updatedDailyBreakdown.reduce(
        (totals, day) => ({
          totalAdvancePayments: totals.totalAdvancePayments + day.advancePayments,
          totalRemainingPayments: totals.totalRemainingPayments + day.remainingPayments,
          totalShopExpenses: totals.totalShopExpenses + day.shopExpenses,
          totalWorkerExpenses: totals.totalWorkerExpenses + day.workerExpenses,
          totalRevenue: totals.totalRevenue + day.totalRevenue,
          totalExpenses: totals.totalExpenses + day.totalExpenses,
          netProfit: totals.netProfit + day.netProfit,
        }),
        {
          totalAdvancePayments: 0,
          totalRemainingPayments: 0,
          totalShopExpenses: 0,
          totalWorkerExpenses: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
        }
      );

      setWeeklyData({
        weekStart: weekData.weekStart,
        weekEnd: weekData.weekEnd,
        weekLabel: weekData.weekLabel,
        ...weekTotals,
        dailyBreakdown: updatedDailyBreakdown,
      });

      console.log('📊 Weekly Profit Summary:', {
        week: weekData.weekLabel,
        totalRevenue: weekTotals.totalRevenue,
        totalExpenses: weekTotals.totalExpenses,
        netProfit: weekTotals.netProfit,
      });

    } catch (error) {
      console.error('Error loading weekly profit data:', error);
      Alert.alert('Error', `Failed to load weekly profit data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reuse the same fetch functions from TodayProfitScreen
  const fetchAdvancePayments = async (date) => {
    try {
      console.log('💵 Fetching advance payments from orders table for date:', date);
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          bill_id,
          payment_amount,
          total_amt,
          updated_at,
          order_date,
          garment_type,
          status,
          bills!inner (
            customer_name,
            mobile_number
          )
        `)
        .gt('payment_amount', 0);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return [];
      }

      const todayOrders = orders?.filter(order => {
        let orderDates = [];
        
        if (order.updated_at) {
          orderDates.push({ field: 'updated_at', value: order.updated_at, ist: formatISTDate(order.updated_at) });
        }
        if (order.order_date) {
          orderDates.push({ field: 'order_date', value: order.order_date, ist: formatISTDate(order.order_date) });
        }
        
        const hasAdvancePayment = parseFloat(order.payment_amount || 0) > 0;
        const isTargetDate = orderDates.some(dateInfo => dateInfo.ist === date);
        
        return isTargetDate && hasAdvancePayment;
      }) || [];

      return todayOrders.map(order => {
        const primaryDate = order.updated_at || order.order_date;
        
        return {
          id: order.id,
          type: 'advance',
          billId: order.bill_id,
          orderNumber: order.id,
          customerName: order.bills?.customer_name || 'Unknown Customer',
          mobile: order.bills?.mobile_number || 'Unknown Mobile',
          amount: parseFloat(order.payment_amount || 0),
          totalAmount: parseFloat(order.total_amt || 0),
          date: primaryDate,
          description: `Advance payment for Order #${order.id}`,
        };
      });

    } catch (error) {
      console.error('Error fetching advance payments from orders:', error);
      return [];
    }
  };

  const fetchRemainingPayments = async (date) => {
    try {
      console.log('💰 Fetching remaining payments for orders paid on date:', date);
      
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          bill_id,
          payment_amount,
          total_amt,
          payment_status,
          updated_at,
          order_date,
          bills!inner (
            customer_name,
            mobile_number
          )
        `)
        .ilike('payment_status', 'paid');

      if (ordersError) {
        console.error('Error fetching paid orders:', ordersError);
        return [];
      }

      const todayPaidOrders = orders?.filter(order => {
        const updateDate = formatISTDate(order.updated_at);
        return updateDate === date;
      }) || [];

      return todayPaidOrders.map(order => {
        const totalAmount = parseFloat(order.total_amt || 0);
        const advanceAmount = parseFloat(order.payment_amount || 0);
        const remainingAmount = totalAmount - advanceAmount;

        return {
          id: order.id,
          type: 'remaining',
          billId: order.bill_id,
          customerName: order.bills?.customer_name || 'Unknown Customer',
          mobile: order.bills?.mobile_number || 'Unknown Mobile',
          amount: remainingAmount > 0 ? remainingAmount : 0,
          totalAmount: totalAmount,
          advanceAmount: advanceAmount,
          date: order.updated_at,
          description: `Remaining payment for Order #${order.id}`
        };
      });

    } catch (error) {
      console.error('Error fetching remaining payments:', error);
      return [];
    }
  };

  const fetchShopExpenses = async (date) => {
    try {
      console.log('🏢 Fetching shop expenses for date:', date);
      
      let expenses = [];

      try {
        const { data: expensesData, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('date', date);

        if (!expError && expensesData) {
          console.log('🏢 Using expenses table');
          expenses = expensesData.map(expense => ({
            id: expense.id,
            type: 'shop_expense',
            amount: parseFloat(expense.amount || 0),
            date: expense.date,
            description: expense.description || 'Shop Expense',
            details: expense
          }));
        } else {
          throw new Error('expenses table not available');
        }
      } catch (error) {
        console.log('🏢 Falling back to Daily_Expenses table');
        const { data: dailyExpensesData, error: dailyError } = await supabase
          .from('Daily_Expenses')
          .select('*')
          .eq('Date', date);

        if (!dailyError && dailyExpensesData) {
          expenses = dailyExpensesData.map(expense => {
            const materialCost = parseFloat(expense.material_cost || 0);
            const miscCost = parseFloat(expense.miscellaneous_Cost || 0);
            const chaiCost = parseFloat(expense.chai_pani_cost || 0);
            const totalAmount = materialCost + miscCost + chaiCost;

            return {
              id: expense.id,
              type: 'shop_expense',
              amount: totalAmount,
              date: expense.Date,
              description: expense.material_type || 'Shop Expense',
              details: {
                material_cost: materialCost,
                miscellaneous_cost: miscCost,
                chai_pani_cost: chaiCost
              }
            };
          });
        }
      }

      return expenses;

    } catch (error) {
      console.error('Error fetching shop expenses:', error);
      return [];
    }
  };

  const fetchWorkerExpenses = async (date) => {
    try {
      console.log('👷 Fetching worker expenses for date:', date);
      
      const { data: workerExpenses, error: workerExpensesError } = await supabase
        .from('Worker_Expense')
        .select('*')
        .eq('date', date);

      if (workerExpensesError) {
        console.error('Error fetching worker expenses:', workerExpensesError);
        return [];
      }

      const expenses = workerExpenses?.map(expense => ({
        id: expense.id,
        type: 'worker_expense',
        workerName: expense.name,
        workerId: expense.worker_id,
        amount: parseFloat(expense.Amt_Paid || 0),
        date: expense.date,
        description: `Payment to ${expense.name}`,
        details: expense
      })) || [];

      return expenses;

    } catch (error) {
      console.error('Error fetching worker expenses:', error);
      return [];
    }
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek.weekStartDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    
    const newWeekData = calculateWeekBounds(newDate);
    setCurrentWeek(newWeekData);
    loadWeeklyProfitData(newWeekData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWeeklyProfitData(currentWeek);
    setRefreshing(false);
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return '#27ae60';
    if (profit < 0) return '#e74c3c';
    return '#7f8c8d';
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const getDayStatusColor = (day) => {
    if (day.totalRevenue > 0 || day.totalExpenses > 0) {
      return day.netProfit > 0 ? '#e8f5e8' : '#ffe8e8';
    }
    return '#f8f9fa';
  };

  const renderDayCard = (day, index) => (
    <View key={index} style={[styles.dayCard, { backgroundColor: getDayStatusColor(day) }]}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayName}>{day.dayName}</Text>
        <Text style={styles.dayDate}>{day.date}</Text>
      </View>
      
      <View style={styles.dayContent}>
        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>Revenue:</Text>
          <Text style={[styles.dayValue, { color: '#27ae60' }]}>
            {formatCurrency(day.totalRevenue)}
          </Text>
        </View>
        
        <View style={styles.dayRow}>
          <Text style={styles.dayLabel}>Expenses:</Text>
          <Text style={[styles.dayValue, { color: '#e74c3c' }]}>
            {formatCurrency(day.totalExpenses)}
          </Text>
        </View>
        
        <View style={[styles.dayRow, styles.dayProfitRow]}>
          <Text style={[styles.dayLabel, { fontWeight: 'bold' }]}>Profit:</Text>
          <Text style={[styles.dayValue, { 
            fontWeight: 'bold', 
            color: getProfitColor(day.netProfit) 
          }]}>
            {formatCurrency(day.netProfit)}
          </Text>
        </View>
        
        {(day.totalRevenue > 0 || day.totalExpenses > 0) && (
          <View style={styles.dayDetails}>
            <Text style={styles.dayDetailsText}>
              A: {formatCurrency(day.advancePayments)} • 
              R: {formatCurrency(day.remainingPayments)} • 
              S: {formatCurrency(day.shopExpenses)} • 
              W: {formatCurrency(day.workerExpenses)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContent = () => (
    <>
      {/* Week Navigation */}
      <View style={[styles.weekNavigation, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek(-1)}
        >
          <Ionicons name="chevron-back" size={24} color="#2980b9" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <View style={styles.weekLabel}>
          <Text style={styles.weekLabelText}>{weeklyData.weekLabel}</Text>
          <Text style={styles.weekDates}>
            {weeklyData.weekStart} to {weeklyData.weekEnd}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateWeek(1)}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color="#2980b9" />
        </TouchableOpacity>
      </View>

      {/* Weekly Summary */}
      <View style={[styles.summaryContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.cardTitle}>Weekly Revenue</Text>
          <Text style={styles.revenueAmount}>
            {formatCurrency(weeklyData.totalRevenue)}
          </Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Advance Payments:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(weeklyData.totalAdvancePayments)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Remaining Payments:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(weeklyData.totalRemainingPayments)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expenses Card */}
        <View style={styles.expenseCard}>
          <Text style={styles.cardTitle}>Weekly Expenses</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(weeklyData.totalExpenses)}
          </Text>
          <View style={styles.expenseBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Shop Expenses:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(weeklyData.totalShopExpenses)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Worker Expenses:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(weeklyData.totalWorkerExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Profit Card */}
        <View style={[styles.profitCard, { borderColor: getProfitColor(weeklyData.netProfit) }]}>
          <Text style={styles.cardTitle}>Weekly Net Profit</Text>
          <Text style={[styles.profitAmount, { color: getProfitColor(weeklyData.netProfit) }]}>
            {formatCurrency(weeklyData.netProfit)}
          </Text>
          <Text style={styles.profitFormula}>
            Revenue - Expenses
          </Text>
        </View>
      </View>

      {/* Daily Breakdown */}
      <View style={[styles.dailyContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        <Text style={styles.sectionTitle}>Daily Breakdown</Text>
        <View style={styles.dailyGrid}>
          {weeklyData.dailyBreakdown.map((day, index) => renderDayCard(day, index))}
        </View>
      </View>

      {/* Legend */}
      <View style={[styles.legendContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        <Text style={styles.legendTitle}>💡 Legend</Text>
        <Text style={styles.legendText}>
          • <Text style={styles.legendBold}>A:</Text> Advance Payments
        </Text>
        <Text style={styles.legendText}>
          • <Text style={styles.legendBold}>R:</Text> Remaining Payments
        </Text>
        <Text style={styles.legendText}>
          • <Text style={styles.legendBold}>S:</Text> Shop Expenses
        </Text>
        <Text style={styles.legendText}>
          • <Text style={styles.legendBold}>W:</Text> Worker Expenses
        </Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading weekly profit...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? 'rgba(255,255,255,0.18)' : 'transparent' }
          ]}
        >
          <Ionicons name="chevron-back-circle" size={40} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Weekly Profit</Text>
        </View>
        <Image 
          source={require('./assets/logo.jpg')} 
          style={styles.logo} 
        />
      </View>

      {Platform.OS === 'web' ? (
        <WebScrollView 
          style={{ 
            flex: 1,
            height: 'calc(100vh - 120px)',
            width: '100vw'
          }} 
          contentContainerStyle={{ 
            paddingBottom: isSmallScreen ? 100 : 120,
            minHeight: 'max-content',
            paddingHorizontal: responsivePadding
          }} 
          showsVerticalScrollIndicator={true}
        >
          {renderContent()}
        </WebScrollView>
      ) : (
        <WebScrollView 
          style={styles.scrollView} 
          contentContainerStyle={{
            paddingHorizontal: responsivePadding,
            paddingBottom: isSmallScreen ? 100 : 120
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </WebScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={onRefresh}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
  },
  header: {
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
  },
  backButton: {
    borderRadius: 26,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonText: {
    fontSize: 16,
    color: '#2980b9',
    fontWeight: '600',
    marginHorizontal: 4,
  },
  weekLabel: {
    alignItems: 'center',
    flex: 1,
  },
  weekLabelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  weekDates: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  summaryContainer: {
    marginTop: 16,
  },
  revenueCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
    borderLeftStyle: 'solid',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  expenseCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
    borderLeftStyle: 'solid',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  profitCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
  },
  expenseAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 12,
  },
  profitAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  profitFormula: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  revenueBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  expenseBreakdown: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  dailyContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  dailyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dayHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 8,
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  dayDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  dayContent: {
    flex: 1,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayProfitRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 4,
    marginTop: 4,
  },
  dayLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  dayValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  dayDetailsText: {
    fontSize: 10,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 14,
  },
  legendContainer: {
    backgroundColor: '#e8f4fd',
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
    borderLeftStyle: 'solid',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    marginBottom: 4,
  },
  legendBold: {
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2980b9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
