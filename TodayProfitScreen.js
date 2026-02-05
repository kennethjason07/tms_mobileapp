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
  Modal,
  TextInput,
} from 'react-native';
import { supabase } from './supabase';
import { Ionicons } from '@expo/vector-icons';
import WebScrollView from './components/WebScrollView';

export default function TodayProfitScreen({ navigation }) {
  // Get today's date in IST timezone (matching the existing DailyProfitScreen logic)
  const getTodayIST = () => {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const now = new Date();
    const istDate = new Date(now.getTime() + IST_OFFSET_MS);

    const yyyy = istDate.getFullYear();
    const mm = String(istDate.getMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getDate()).padStart(2, '0');

    const todayIST = `${yyyy}-${mm}-${dd}`;

    // Debug logging
    console.log('🇮🇳 getTodayIST():');
    console.log(`   UTC now: ${now.toISOString()}`);
    console.log(`   IST date object: ${istDate.toISOString()}`);
    console.log(`   Today IST string: ${todayIST}`);

    return todayIST;
  };

  const formatISTDate = (date) => {
    if (!date) return '';

    try {
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30

      // Handle different date formats
      let dateObj;
      if (date instanceof Date) {
        dateObj = date;
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        console.warn('Invalid date format:', date, typeof date);
        return '';
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date value:', date);
        return '';
      }

      // Convert UTC to IST
      const istDate = new Date(dateObj.getTime() + IST_OFFSET_MS);

      const yyyy = istDate.getFullYear();
      const mm = String(istDate.getMonth() + 1).padStart(2, '0');
      const dd = String(istDate.getDate()).padStart(2, '0');

      const formattedDate = `${yyyy}-${mm}-${dd}`;

      // Debug logging for timezone conversion
      if (date && typeof date === 'string' && date.includes('2025-09-11')) {
        console.log(`🇮🇳 IST Conversion: UTC '${date}' -> IST '${formattedDate}'`);
        console.log(`   UTC timestamp: ${dateObj.getTime()}, IST timestamp: ${istDate.getTime()}`);
      }

      return formattedDate;
    } catch (error) {
      console.error('Error in formatISTDate:', error, 'Date:', date);
      return '';
    }
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [todayData, setTodayData] = useState({
    date: '',
    advancePayments: 0,
    remainingPayments: 0,
    totalRevenue: 0,
    shopExpenses: 0,
    workerExpenses: 0,
    totalExpenses: 0,
    netProfit: 0,
    advanceCount: 0,
    remainingCount: 0,
    expenseCount: 0,
    workerExpenseCount: 0,
    advanceDetails: [],
    remainingDetails: [],
    expenseDetails: [],
    workerExpenseDetails: [],
  });
  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [endDate, setEndDate] = useState(null); // If null, it's a single day view
  const [viewTitle, setViewTitle] = useState('Today');
  const [datePickerModalVisible, setDatePickerModalVisible] = useState(false);
  const [manualDate, setManualDate] = useState('');

  useEffect(() => {
    loadTodayProfitData(selectedDate, endDate);
  }, [selectedDate, endDate]);

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

  // Dynamic padding based on screen size
  const getResponsivePadding = () => {
    if (isSmallScreen) return 16;
    if (isMediumScreen) return 24;
    if (isLargeScreen) return 32;
    return 16; // fallback
  };

  const responsivePadding = getResponsivePadding();



  const loadTodayProfitData = async (targetDate, targetEndDate) => {
    try {
      setLoading(true);
      const isRange = !!targetEndDate;
      const start = targetDate || getTodayIST();
      const end = targetEndDate || start;

      console.log(`🎯 TodayProfitScreen: Loading data for ${isRange ? 'range' : 'date'}: ${start} ${isRange ? 'to ' + end : ''}`);

      const dateList = [];
      if (isRange) {
        const d = new Date(start);
        const e = new Date(end);
        while (d <= e) {
          dateList.push(formatISTDate(new Date(d)));
          d.setDate(d.getDate() + 1);
        }
      } else {
        dateList.push(start);
      }

      // Fetch all data for the date list
      const advancePromises = dateList.map(d => fetchAdvancePayments(d));
      const remainingPromises = dateList.map(d => fetchRemainingPayments(d));
      const expensePromises = dateList.map(d => fetchShopExpenses(d));
      const workerExpensePromises = dateList.map(d => fetchWorkerExpenses(d));

      const [allAdvances, allRemainings, allExpenses, allWorkerExpenses] = await Promise.all([
        Promise.all(advancePromises).then(results => results.flat()),
        Promise.all(remainingPromises).then(results => results.flat()),
        Promise.all(expensePromises).then(results => results.flat()),
        Promise.all(workerExpensePromises).then(results => results.flat())
      ]);

      // Calculate totals
      const totalAdvance = allAdvances.reduce((sum, item) => sum + item.amount, 0);
      const totalRemaining = allRemainings.reduce((sum, item) => sum + item.amount, 0);
      const totalShopExpenses = allExpenses.reduce((sum, item) => sum + item.amount, 0);
      const totalWorkerExpenses = allWorkerExpenses.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = totalShopExpenses + totalWorkerExpenses;
      const totalRevenue = totalAdvance + totalRemaining;
      const netProfit = totalRevenue - totalExpenses;

      setTodayData({
        date: isRange ? `${start} to ${end}` : start,
        advancePayments: totalAdvance,
        remainingPayments: totalRemaining,
        totalRevenue,
        shopExpenses: totalShopExpenses,
        workerExpenses: totalWorkerExpenses,
        totalExpenses,
        netProfit,
        advanceCount: allAdvances.length,
        remainingCount: allRemainings.length,
        expenseCount: allExpenses.length,
        workerExpenseCount: allWorkerExpenses.length,
        advanceDetails: allAdvances,
        remainingDetails: allRemainings,
        expenseDetails: allExpenses,
        workerExpenseDetails: allWorkerExpenses,
      });

      console.log('📊 Today\'s Profit Summary (Bills-based):', {
        date: today,
        advancePayments: totalAdvance + ' (from bills.payment_amount)',
        remainingPayments: totalRemaining + ' (from paid orders)',
        totalRevenue,
        shopExpenses: totalExpenses,
        netProfit
      });

      console.log('💵 ADVANCE PAYMENTS DETAIL:');
      console.log('   - Data source: orders table payment_amount field');
      console.log('   - Count:', advanceData.length);
      console.log('   - Total amount:', totalAdvance);
      console.log('   - Orders found:', advanceData.map(a => `Order ${a.orderNumber}: ₹${a.amount}`).join(', '));

      console.log('💰 REMAINING PAYMENTS DETAIL:');
      console.log('   - Data source: orders with payment_status="paid" updated today');
      console.log('   - Count:', remainingData.length);
      console.log('   - Total amount:', totalRemaining);

      console.log('🏢 SHOP EXPENSES DETAIL:');
      console.log('   - Count:', expenseData.length);
      console.log('   - Total amount:', totalShopExpenses);

      console.log('👷 WORKER EXPENSES DETAIL:');
      console.log('   - Data source: Worker_Expense table');
      console.log('   - Count:', workerExpenseData.length);
      console.log('   - Total amount:', totalWorkerExpenses);
      console.log('   - Workers paid:', workerExpenseData.map(w => `${w.workerName}: ₹${w.amount}`).join(', '));

      console.log('💰 TOTAL EXPENSES BREAKDOWN:');
      console.log('   - Shop expenses: ₹' + totalShopExpenses);
      console.log('   - Worker expenses: ₹' + totalWorkerExpenses);
      console.log('   - Total expenses: ₹' + totalExpenses);

    } catch (error) {
      console.error('Error loading today\'s profit data:', error);
      Alert.alert('Error', `Failed to load today's profit data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvancePayments = async (today) => {
    try {
      console.log('💵 Fetching advance payments from orders table for today:', today);

      // Get all orders that have advance payments (payment_amount > 0)
      // Note: orders table doesn't have customer_name, need to join with bills
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
        .gt('payment_amount', 0); // Only orders with advance payments > 0

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return [];
      }

      console.log(`💵 Found ${orders?.length || 0} orders with advance payments in database`);

      // Log some sample orders for debugging
      if (orders && orders.length > 0) {
        console.log('💵 Sample orders with advance payments:');
        orders.slice(0, 3).forEach((order, index) => {
          const customerName = order.bills?.customer_name || 'Unknown';
          const mobile = order.bills?.mobile_number || 'Unknown';
          console.log(`  Order ${index + 1}: ID ${order.id}, Customer: ${customerName}, Payment: ₹${order.payment_amount}, updated_at: ${order.updated_at}, order_date: ${order.order_date}`);
        });
      }

      // Filter orders with advance payments updated today (using updated_at field)
      const todayOrders = orders?.filter(order => {
        // Check updated_at, order_date, or created_at to find orders from today
        // Convert each date field to IST before comparison
        let orderDates = [];

        // Try all available date fields
        if (order.updated_at) {
          orderDates.push({ field: 'updated_at', value: order.updated_at, ist: formatISTDate(order.updated_at) });
        }
        if (order.order_date) {
          orderDates.push({ field: 'order_date', value: order.order_date, ist: formatISTDate(order.order_date) });
        }
        if (order.created_at) {
          orderDates.push({ field: 'created_at', value: order.created_at, ist: formatISTDate(order.created_at) });
        }

        const hasAdvancePayment = parseFloat(order.payment_amount || 0) > 0;
        const isToday = orderDates.some(dateInfo => dateInfo.ist === today);

        // Debug logging for date comparison
        console.log(`🔍 Order ${order.id} (Bill ID: ${order.bill_id}):`);
        console.log(`   Payment amount: ₹${order.payment_amount}`);
        console.log(`   Available dates:`, orderDates);
        console.log(`   Looking for: ${today}`);
        console.log(`   Match found: ${isToday}, Has advance: ${hasAdvancePayment}`);
        console.log(`   Will include: ${isToday && hasAdvancePayment}`);

        return isToday && hasAdvancePayment;
      }) || [];

      console.log(`💵 Found ${todayOrders.length} orders with advance payments updated today`);

      // Debug: Show sample orders with advance payments
      if (todayOrders.length > 0) {
        console.log('💵 Sample advance payment orders for today:');
        todayOrders.slice(0, 3).forEach((order, index) => {
          const customerName = order.bills?.customer_name || 'Unknown Customer';
          console.log(`  Order ${index + 1}: ID ${order.id}, Bill ID: ${order.bill_id}, Customer: ${customerName}, Amount: ₹${order.payment_amount}, Updated: ${order.updated_at}`);
        });
      } else {
        console.log('⚠️ No orders with advance payments found for today:', today);
        console.log('   - Make sure orders have payment_amount > 0');
        console.log('   - Check if updated_at, order_date, or created_at matches today\'s IST date');

        // DEBUG: Show all orders with advance payments (regardless of date) to help troubleshooting
        console.log('💵 DEBUG: All orders with advance payments (any date):');
        orders?.slice(0, 5).forEach((order, index) => {
          const orderDates = [];
          if (order.updated_at) orderDates.push(`updated_at: ${order.updated_at} -> ${formatISTDate(order.updated_at)}`);
          if (order.order_date) orderDates.push(`order_date: ${order.order_date} -> ${formatISTDate(order.order_date)}`);
          if (order.created_at) orderDates.push(`created_at: ${order.created_at} -> ${formatISTDate(order.created_at)}`);

          console.log(`  Order ${index + 1}: ID ${order.id}, Bill ID: ${order.bill_id}, Payment: ₹${order.payment_amount}`);
          console.log(`    Dates: ${orderDates.join(', ')}`);
        });
      }

      return todayOrders.map(order => {
        // Get the primary date field for this order
        const primaryDate = order.updated_at || order.order_date || order.created_at;

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
          debug: {
            updatedAt: order.updated_at,
            orderDate: order.order_date,
            primaryDate: primaryDate,
            istDate: formatISTDate(primaryDate)
          }
        };
      });

    } catch (error) {
      console.error('Error fetching advance payments from bills:', error);
      return [];
    }
  };

  const fetchRemainingPayments = async (today) => {
    try {
      console.log('💰 Fetching remaining payments for orders paid today:', today);

      // Get orders that were marked as paid today (using updated_at field)
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

      // Filter orders that were updated (paid) today
      const todayPaidOrders = orders?.filter(order => {
        const updateDate = formatISTDate(order.updated_at);
        return updateDate === today;
      }) || [];

      console.log(`💰 Found ${todayPaidOrders.length} orders paid today`);

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

  const fetchShopExpenses = async (today) => {
    try {
      console.log('🏢 Fetching shop expenses for today:', today);

      let expenses = [];

      // Try expenses table first
      try {
        const { data: expensesData, error: expError } = await supabase
          .from('expenses')
          .select('*')
          .eq('date', today);

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
        // Fallback to Daily_Expenses table
        console.log('🏢 Falling back to Daily_Expenses table');
        const { data: dailyExpensesData, error: dailyError } = await supabase
          .from('Daily_Expenses')
          .select('*')
          .eq('Date', today);

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

      console.log(`🏢 Found ${expenses.length} shop expenses today`);
      return expenses;

    } catch (error) {
      console.error('Error fetching shop expenses:', error);
      return [];
    }
  };

  const fetchWorkerExpenses = async (today) => {
    try {
      console.log('👷 Fetching worker expenses for today:', today);

      const { data: workerExpenses, error: workerExpensesError } = await supabase
        .from('Worker_Expense')
        .select('*')
        .eq('date', today);

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

      console.log(`👷 Found ${expenses.length} worker expenses today`);
      if (expenses.length > 0) {
        console.log('👷 Worker expenses:', expenses.map(e => `${e.workerName}: ₹${e.amount}`).join(', '));
      }

      return expenses;

    } catch (error) {
      console.error('Error fetching worker expenses:', error);
      return [];
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTodayProfitData(selectedDate);
    setRefreshing(false);
  };

  const jumpToToday = () => {
    setSelectedDate(getTodayIST());
    setEndDate(null);
    setViewTitle('Today');
  };

  const jumpToWeekRange = (start, end, label) => {
    setSelectedDate(start);
    setEndDate(end);
    setViewTitle(label);
  };

  const navigateDay = (direction) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(formatISTDate(d));
    setEndDate(null);
    setViewTitle(direction === -1 ? 'Previous Day' : 'Next Day');
  };

  const navigateWeek = (direction) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (direction * 7));

    // Calculate week bounds roughly starting from Sunday
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    setSelectedDate(formatISTDate(start));
    setEndDate(formatISTDate(end));
    setViewTitle('Selected Week');
  };

  const handleCustomDate = () => {
    if (!manualDate) {
      Alert.alert('Error', 'Please enter a valid date');
      return;
    }

    // Basic regex for YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(manualDate)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    setSelectedDate(manualDate);
    setEndDate(null);
    setViewTitle('Custom Date');
    setDatePickerModalVisible(false);
    setManualDate('');
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return '#27ae60';
    if (profit < 0) return '#e74c3c';
    return '#7f8c8d';
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatDisplayDate = (dateString, endStr) => {
    if (endStr) {
      const [sy, sm, sd] = dateString.split('-').map(Number);
      const [ey, em, ed] = endStr.split('-').map(Number);
      const start = new Date(sy, sm - 1, sd);
      const end = new Date(ey, em - 1, ed);

      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) + (dateString === getTodayIST() && !endStr ? ' (Today)' : '');
  };

  const renderContent = () => (
    <>
      {/* Date Navigation */}
      <View style={[styles.weekNavigation, { marginHorizontal: isSmallScreen ? 16 : 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateDay(-1)}
        >
          <Ionicons name="chevron-back" size={28} color="#2980b9" />
          <Text style={styles.navButtonText}>Prev</Text>
        </TouchableOpacity>

        <View style={styles.weekLabel}>
          <TouchableOpacity
            style={styles.dateSelectorBtn}
            onPress={() => setDatePickerModalVisible(true)}
          >
            <Text style={styles.weekLabelText}>
              {formatDisplayDate(selectedDate, endDate)}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#2980b9" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          {(selectedDate !== getTodayIST() || endDate) && (
            <TouchableOpacity onPress={jumpToToday}>
              <Text style={styles.jumpTodayText}>Back to Today</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigateDay(1)}
        >
          <Text style={styles.navButtonText}>Next</Text>
          <Ionicons name="chevron-forward" size={28} color="#2980b9" />
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={datePickerModalVisible}
        onRequestClose={() => setDatePickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDatePickerModalVisible(false)}
        >
          <View style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>Go to Date</Text>
            <Text style={styles.modalSubtitle}>Format: YYYY-MM-DD (e.g., 2026-01-15)</Text>

            <TextInput
              style={styles.dateInput}
              value={manualDate}
              onChangeText={setManualDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#95a5a6"
              autoFocus={true}
              maxLength={10}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setDatePickerModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.submitBtn]}
                onPress={handleCustomDate}
              >
                <Text style={styles.submitBtnText}>Go</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Summary Cards */}
      <View style={[styles.summaryContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <Text style={styles.cardTitle}>Total Revenue</Text>
          <Text style={styles.revenueAmount}>
            {formatCurrency(todayData.totalRevenue)}
          </Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Advance Payments:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(todayData.advancePayments)} ({todayData.advanceCount})
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Remaining Payments:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(todayData.remainingPayments)} ({todayData.remainingCount})
              </Text>
            </View>
          </View>
        </View>

        {/* Expenses Card */}
        <View style={styles.expenseCard}>
          <Text style={styles.cardTitle}>Total Expenses</Text>
          <Text style={styles.expenseAmount}>
            {formatCurrency(todayData.totalExpenses)}
          </Text>
          <View style={styles.expenseBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Shop Expenses:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(todayData.shopExpenses)} ({todayData.expenseCount})
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Worker Expenses:</Text>
              <Text style={styles.breakdownValue}>
                {formatCurrency(todayData.workerExpenses)} ({todayData.workerExpenseCount})
              </Text>
            </View>
          </View>
        </View>

        {/* Profit Card */}
        <View style={[styles.profitCard, { borderColor: getProfitColor(todayData.netProfit) }]}>
          <Text style={styles.cardTitle}>Net Profit</Text>
          <Text style={[styles.profitAmount, { color: getProfitColor(todayData.netProfit) }]}>
            {formatCurrency(todayData.netProfit)}
          </Text>
          <Text style={styles.profitFormula}>
            Revenue - Expenses
          </Text>
        </View>
      </View>

      {/* Detailed Breakdown */}
      <View style={[styles.detailsContainer, { marginHorizontal: isSmallScreen ? 16 : 0 }]}>
        {/* Advance Payments Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            Advance Payments ({todayData.advanceCount})
          </Text>
          {todayData.advanceDetails.length > 0 ? (
            todayData.advanceDetails.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    Order #{item.orderNumber} - {item.customerName}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {item.mobile} • {item.description}
                  </Text>
                </View>
                <Text style={styles.itemAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No advance payments today</Text>
          )}
        </View>

        {/* Remaining Payments Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            Remaining Payments ({todayData.remainingCount})
          </Text>
          {todayData.remainingDetails.length > 0 ? (
            todayData.remainingDetails.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    Order #{item.id} - {item.customerName}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {item.mobile} • Total: {formatCurrency(item.totalAmount)} - Advance: {formatCurrency(item.advanceAmount)}
                  </Text>
                </View>
                <Text style={styles.itemAmount}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No remaining payments received today</Text>
          )}
        </View>

        {/* Shop Expenses Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            Shop Expenses ({todayData.expenseCount})
          </Text>
          {todayData.expenseDetails.length > 0 ? (
            todayData.expenseDetails.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    {item.description}
                  </Text>
                  {item.details?.material_cost && (
                    <Text style={styles.itemSubtitle}>
                      Materials: {formatCurrency(item.details.material_cost)} •
                      Misc: {formatCurrency(item.details.miscellaneous_cost || 0)} •
                      Tea/Snacks: {formatCurrency(item.details.chai_pani_cost || 0)}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemAmount, { color: '#e74c3c' }]}>
                  -{formatCurrency(item.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No shop expenses today</Text>
          )}
        </View>

        {/* Worker Expenses Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionTitle}>
            Worker Expenses ({todayData.workerExpenseCount})
          </Text>
          {todayData.workerExpenseDetails.length > 0 ? (
            todayData.workerExpenseDetails.map((item, index) => (
              <View key={index} style={styles.detailItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    {item.workerName}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    Worker ID: {item.workerId} • {item.description}
                  </Text>
                </View>
                <Text style={[styles.itemAmount, { color: '#e74c3c' }]}>
                  -{formatCurrency(item.amount)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No worker expenses today</Text>
          )}
        </View>
      </View>

    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading today's profit...</Text>
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
          <Text style={styles.headerTitle}>Today's Profit</Text>
        </View>
        <Image
          source={require('./assets/logo.jpg')}
          style={styles.logo}
        />
      </View>

      {Platform.OS === 'web' ? (
        // Web Layout with full scrolling
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
        // Mobile Layout with SafeAreaView and ScrollView
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
  dateContainer: {
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
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  weekNavigation: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  navButtonText: {
    color: '#2980b9',
    fontWeight: '600',
    fontSize: 12,
    marginHorizontal: 2,
  },
  weekLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  submitBtn: {
    backgroundColor: '#2980b9',
  },
  cancelBtnText: {
    color: '#7f8c8d',
    fontWeight: '600',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  jumpTodayText: {
    color: '#2980b9',
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  viewSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  selectorBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2980b9',
  },
  selectorBtnActive: {
    backgroundColor: '#2980b9',
  },
  selectorBtnText: {
    color: '#2980b9',
    fontSize: 14,
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    color: '#fff',
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
    marginBottom: 8,
  },
  expenseCount: {
    fontSize: 14,
    color: '#7f8c8d',
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
  detailsContainer: {
    marginTop: 16,
  },
  detailSection: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#7f8c8d',
    lineHeight: 18,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  noDataText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noteContainer: {
    backgroundColor: '#e8f4fd',
    marginTop: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2980b9',
    borderLeftStyle: 'solid',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    marginBottom: 6,
  },
  noteBold: {
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
