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

export default function MonthlyProfitScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [currentMonth, setCurrentMonth] = useState(null);
  const [monthlyData, setMonthlyData] = useState({
    monthStart: '',
    monthEnd: '',
    monthLabel: '',
    totalRevenue: 0,
    totalAdvancePayments: 0,
    totalRemainingPayments: 0,
    totalShopExpenses: 0,
    totalWorkerExpenses: 0,
    totalExpenses: 0,
    netProfit: 0,
    weeklyBreakdown: [], // Array of weeks within the month
  });

  useEffect(() => {
    // Initialize with current month
    const now = new Date();
    const currentMonthData = calculateMonthBounds(now);
    setCurrentMonth(currentMonthData);
    loadMonthlyProfitData(currentMonthData);
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

  // Calculate month bounds (1st to last day of month)
  const calculateMonthBounds = (date) => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + IST_OFFSET_MS);
    
    // Get first day of month
    const monthStart = new Date(istDate.getFullYear(), istDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    // Get last day of month
    const monthEnd = new Date(istDate.getFullYear(), istDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);
    
    // Format for display and API calls
    const formatDate = (date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const monthStartStr = formatDate(monthStart);
    const monthEndStr = formatDate(monthEnd);
    
    // Create readable month label
    const monthLabel = monthStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    return {
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
      monthLabel: monthLabel,
      monthStartDate: monthStart,
      monthEndDate: monthEnd,
      year: monthStart.getFullYear(),
      month: monthStart.getMonth()
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

  // Calculate weeks within the month (Sunday-to-Saturday)
  const calculateWeeksInMonth = (monthData) => {
    const weeks = [];
    const startDate = new Date(monthData.monthStartDate);
    const endDate = new Date(monthData.monthEndDate);
    
    // Find first Sunday of the month or before
    let weekStart = new Date(startDate);
    const startDay = startDate.getDay(); // 0=Sunday, 1=Monday, etc.
    weekStart.setDate(startDate.getDate() - startDay);
    
    let weekNumber = 1;
    
    while (weekStart <= endDate) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Only include weeks that have at least one day in the current month
      const weekEndInMonth = weekEnd <= endDate ? weekEnd : new Date(endDate);
      const weekStartInMonth = weekStart >= startDate ? weekStart : new Date(startDate);
      
      if (weekStartInMonth <= endDate) {
        weeks.push({
          weekNumber: weekNumber,
          weekStart: formatISTDate(weekStartInMonth),
          weekEnd: formatISTDate(weekEndInMonth),
          weekStartDate: new Date(weekStartInMonth),
          weekEndDate: new Date(weekEndInMonth),
          weekLabel: `Week ${weekNumber}`,
          dateRange: `${formatDisplayDate(weekStartInMonth)} - ${formatDisplayDate(weekEndInMonth)}`,
          advancePayments: 0,
          remainingPayments: 0,
          shopExpenses: 0,
          workerExpenses: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          netProfit: 0,
          dailyData: []
        });
        weekNumber++;
      }
      
      // Move to next week
      weekStart.setDate(weekStart.getDate() + 7);
    }
    
    return weeks;
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const loadMonthlyProfitData = async (monthData) => {
    try {
      setLoading(true);
      
      console.log('📅 MonthlyProfitScreen: Loading data for month:', monthData.monthLabel);
      console.log('   Month Start:', monthData.monthStart);
      console.log('   Month End:', monthData.monthEnd);
      
      // Calculate weeks within the month
      const weeksInMonth = calculateWeeksInMonth(monthData);
      
      // Fetch data for each week
      const weekPromises = weeksInMonth.map(async (week) => {
        // For each week, fetch data for all days in that week (but only within the month)
        const daysInWeek = [];
        const weekStartDate = new Date(week.weekStartDate);
        const weekEndDate = new Date(week.weekEndDate);
        
        // Collect all days in the week that fall within the current month
        let currentDay = new Date(weekStartDate);
        while (currentDay <= weekEndDate) {
          const dayStr = formatISTDate(currentDay);
          if (dayStr >= monthData.monthStart && dayStr <= monthData.monthEnd) {
            daysInWeek.push(dayStr);
          }
          currentDay.setDate(currentDay.getDate() + 1);
        }
        
        // Fetch data for all days in this week
        const dayPromises = daysInWeek.map(async (dayStr) => {
          const [advanceData, remainingData, shopExpenseData, workerExpenseData] = await Promise.all([
            fetchAdvancePayments(dayStr),
            fetchRemainingPayments(dayStr),
            fetchShopExpenses(dayStr),
            fetchWorkerExpenses(dayStr)
          ]);

          return {
            date: dayStr,
            advancePayments: advanceData.reduce((sum, item) => sum + item.amount, 0),
            remainingPayments: remainingData.reduce((sum, item) => sum + item.amount, 0),
            shopExpenses: shopExpenseData.reduce((sum, item) => sum + item.amount, 0),
            workerExpenses: workerExpenseData.reduce((sum, item) => sum + item.amount, 0),
          };
        });

        const dailyResults = await Promise.all(dayPromises);
        
        // Calculate week totals
        const weekTotals = dailyResults.reduce(
          (totals, day) => ({
            advancePayments: totals.advancePayments + day.advancePayments,
            remainingPayments: totals.remainingPayments + day.remainingPayments,
            shopExpenses: totals.shopExpenses + day.shopExpenses,
            workerExpenses: totals.workerExpenses + day.workerExpenses,
          }),
          { advancePayments: 0, remainingPayments: 0, shopExpenses: 0, workerExpenses: 0 }
        );

        const totalRevenue = weekTotals.advancePayments + weekTotals.remainingPayments;
        const totalExpenses = weekTotals.shopExpenses + weekTotals.workerExpenses;
        const netProfit = totalRevenue - totalExpenses;

        return {
          ...week,
          ...weekTotals,
          totalRevenue,
          totalExpenses,
          netProfit,
          dailyData: dailyResults
        };
      });

      const updatedWeeksData = await Promise.all(weekPromises);

      // Calculate monthly totals
      const monthTotals = updatedWeeksData.reduce(
        (totals, week) => ({
          totalAdvancePayments: totals.totalAdvancePayments + week.advancePayments,
          totalRemainingPayments: totals.totalRemainingPayments + week.remainingPayments,
          totalShopExpenses: totals.totalShopExpenses + week.shopExpenses,
          totalWorkerExpenses: totals.totalWorkerExpenses + week.workerExpenses,
          totalRevenue: totals.totalRevenue + week.totalRevenue,
          totalExpenses: totals.totalExpenses + week.totalExpenses,
          netProfit: totals.netProfit + week.netProfit,
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

      setMonthlyData({
        monthStart: monthData.monthStart,
        monthEnd: monthData.monthEnd,
        monthLabel: monthData.monthLabel,
        ...monthTotals,
        weeklyBreakdown: updatedWeeksData,
      });

      console.log('📊 Monthly Profit Summary:', {
        month: monthData.monthLabel,
        totalRevenue: monthTotals.totalRevenue,
        totalExpenses: monthTotals.totalExpenses,
        netProfit: monthTotals.netProfit,
        weeks: updatedWeeksData.length
      });

    } catch (error) {
      console.error('Error loading monthly profit data:', error);
      Alert.alert('Error', `Failed to load monthly profit data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reuse the same fetch functions from WeeklyProfitScreen
  const fetchAdvancePayments = async (date) => {
    try {
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

      return todayOrders.map(order => ({
        id: order.id,
        type: 'advance',
        amount: parseFloat(order.payment_amount || 0),
        date: order.updated_at || order.order_date,
      }));

    } catch (error) {
      console.error('Error fetching advance payments:', error);
      return [];
    }
  };

  const fetchRemainingPayments = async (date) => {
    try {
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
          amount: remainingAmount > 0 ? remainingAmount : 0,
          date: order.updated_at,
        };
      });

    } catch (error) {
      console.error('Error fetching remaining payments:', error);
      return [];
    }
  };

  const fetchShopExpenses = async (date) => {
    try {
      let expenses = [];

      try {
        const { data: expensesData, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('date', date);

        if (!expError && expensesData) {
          expenses = expensesData.map(expense => ({
            id: expense.id,
            type: 'shop_expense',
            amount: parseFloat(expense.amount || 0),
            date: expense.date,
          }));
        } else {
          throw new Error('expenses table not available');
        }
      } catch (error) {
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
        amount: parseFloat(expense.Amt_Paid || 0),
        date: expense.date,
      })) || [];

      return expenses;

    } catch (error) {
      console.error('Error fetching worker expenses:', error);
      return [];
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth.year, currentMonth.month + direction, 1);
    const newMonthData = calculateMonthBounds(newDate);
    setCurrentMonth(newMonthData);
    loadMonthlyProfitData(newMonthData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonthlyProfitData(currentMonth);
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

  const getWeekStatusColor = (week) => {
    if (week.totalRevenue > 0 || week.totalExpenses > 0) {
      return week.netProfit > 0 ? '#e8f5e8' : '#ffe8e8';
    }
    return '#f8f9fa';
  };

  const renderWeekCard = (week, index) => (
    <View key={index} style={[styles.weekCard, { backgroundColor: getWeekStatusColor(week) }]}>
      <View style={styles.weekHeader}>
        <Text style={styles.weekLabel}>{week.weekLabel}</Text>
        <Text style={styles.weekDates}>{week.dateRange}</Text>
      </View>
      
      <View style={styles.weekContent}>
        <View style={styles.weekRow}>
          <Text style={styles.weekRowLabel}>Revenue:</Text>
          <Text style={[styles.weekRowValue, { color: '#27ae60' }]}>
            {formatCurrency(week.totalRevenue)}
          </Text>
        </View>
        
        <View style={styles.weekRow}>
          <Text style={styles.weekRowLabel}>Expenses:</Text>
          <Text style={[styles.weekRowValue, { color: '#e74c3c' }]}>
            {formatCurrency(week.totalExpenses)}
          </Text>
        </View>
        
        <View style={[styles.weekRow, styles.weekProfitRow]}>
          <Text style={[styles.weekRowLabel, { fontWeight: 'bold' }]}>Profit:</Text>
          <Text style={[styles.weekRowValue, { 
            fontWeight: 'bold', 
            color: getProfitColor(week.netProfit) 
          }]}>
            {formatCurrency(week.netProfit)}
          </Text>
        </View>
        
        {(week.totalRevenue > 0 || week.totalExpenses > 0) && (
          <View style={styles.weekDetails}>
            <Text style={styles.weekDetailsText}>
              A: {formatCurrency(week.advancePayments)} • 
              R: {formatCurrency(week.remainingPayments)} • 
              S: {formatCurrency(week.shopExpenses)} • 
              W: {formatCurrency(week.workerExpenses)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderContent = () => (
    <>
      {/* Month Navigation */}
      <View style={[styles.monthNavigation, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth(-1)}
        >
          <Ionicons name="chevron-back" size={24} color="#2980b9" />
          <Text style={styles.navButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <View style={styles.monthLabel}>
          <Text style={styles.monthLabelText}>{monthlyData.monthLabel}</Text>
          <Text style={styles.monthDates}>
            {monthlyData.monthStart} to {monthlyData.monthEnd}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => navigateMonth(1)}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={24} color="#2980b9" />
        </TouchableOpacity>
      </View>

      {/* Monthly Summary */}
      <View style={[styles.summaryContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.cardTitle}>Monthly Revenue</Text>
          <Text style={styles.revenueAmount}>
            {formatCurrency(monthlyData.totalRevenue)}
          </Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Advance Payments:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(monthlyData.totalAdvancePayments)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Remaining Payments:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(monthlyData.totalRemainingPayments)}
              </Text>
            </View>
          </View>
        </View>

        {/* Expenses Card */}
        <View style={styles.expenseCard}>
          <Text style={styles.cardTitle}>Monthly Expenses</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(monthlyData.totalExpenses)}
          </Text>
          <View style={styles.expenseBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Shop Expenses:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(monthlyData.totalShopExpenses)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Worker Expenses:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(monthlyData.totalWorkerExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Profit Card */}
        <View style={[styles.profitCard, { borderColor: getProfitColor(monthlyData.netProfit) }]}>
          <Text style={styles.cardTitle}>Monthly Net Profit</Text>
          <Text style={[styles.profitAmount, { color: getProfitColor(monthlyData.netProfit) }]}>
            {formatCurrency(monthlyData.netProfit)}
          </Text>
          <Text style={styles.profitFormula}>
            Revenue - Expenses
          </Text>
        </View>
      </View>

      {/* Weekly Breakdown */}
      <View style={[styles.weeklyContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        <Text style={styles.sectionTitle}>Weekly Breakdown</Text>
        <View style={styles.weeklyGrid}>
          {monthlyData.weeklyBreakdown.map((week, index) => renderWeekCard(week, index))}
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
        <Text style={styles.loadingText}>Loading monthly profit...</Text>
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
          <Text style={styles.headerTitle}>Monthly Profit</Text>
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
  monthNavigation: {
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
  monthLabel: {
    alignItems: 'center',
    flex: 1,
  },
  monthLabelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  monthDates: {
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
  weeklyContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  weeklyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weekCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  weekHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 8,
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  weekDates: {
    fontSize: 11,
    color: '#7f8c8d',
    marginTop: 2,
    textAlign: 'center',
  },
  weekContent: {
    flex: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  weekProfitRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 4,
    marginTop: 4,
  },
  weekRowLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  weekRowValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  weekDetailsText: {
    fontSize: 9,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 12,
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
