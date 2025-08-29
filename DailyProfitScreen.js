import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { SupabaseAPI, supabase } from './supabase';
import { Ionicons } from '@expo/vector-icons';

export default function DailyProfitScreen({ navigation }) {
  const [profitData, setProfitData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [summaryStats, setSummaryStats] = useState({});
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  useEffect(() => {
    filterData();
  }, [searchQuery, profitData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getProfitData();
      setProfitData(data);
      setFilteredData(data);
      
      // Calculate summary statistics
      const summary = calculateSummaryStats(data);
      setSummaryStats(summary);
    } catch (error) {
      console.error('Daily profit loading error:', error);
      Alert.alert('Error', `Failed to load profit data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getProfitData = async () => {
    try {
      // Get all orders
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      // Get all shop expenses
      const { data: shopExpenses } = await supabase
        .from('Shop_Expense')
        .select('*')
        .order('date', { ascending: false });

      // Get all worker expenses
      const { data: workerExpenses } = await supabase
        .from('Worker_Expense')
        .select('*')
        .order('date', { ascending: false });

      // Get all bills for revenue calculation
      const { data: bills } = await supabase
        .from('bills')
        .select('*')
        .order('bill_date', { ascending: false });

      // Process data by date
      const profitByDate = {};
      
      // Process orders and calculate work pay
      orders?.forEach(order => {
        const date = order.order_date;
        if (!profitByDate[date]) {
          profitByDate[date] = {
            date,
            revenue: 0,
            workPay: 0,
            shopExpenses: 0,
            workerExpenses: 0,
            netProfit: 0,
            orderCount: 0,
            orders: [],
            expenses: []
          };
        }
        profitByDate[date].workPay += order.Work_pay || 0;
        profitByDate[date].orderCount += 1;
        profitByDate[date].orders.push(order);
      });

      // Process shop expenses
      shopExpenses?.forEach(expense => {
        const date = expense.date;
        if (!profitByDate[date]) {
          profitByDate[date] = {
            date,
            revenue: 0,
            workPay: 0,
            shopExpenses: 0,
            workerExpenses: 0,
            netProfit: 0,
            orderCount: 0,
            orders: [],
            expenses: []
          };
        }
        profitByDate[date].shopExpenses += expense.Amt_Paid || 0;
        profitByDate[date].expenses.push({ ...expense, type: 'shop' });
      });

      // Process worker expenses
      workerExpenses?.forEach(expense => {
        const date = expense.date;
        if (!profitByDate[date]) {
          profitByDate[date] = {
            date,
            revenue: 0,
            workPay: 0,
            shopExpenses: 0,
            workerExpenses: 0,
            netProfit: 0,
            orderCount: 0,
            orders: [],
            expenses: []
          };
        }
        profitByDate[date].workerExpenses += expense.Amt_Paid || 0;
        profitByDate[date].expenses.push({ ...expense, type: 'worker' });
      });

      // Process bills for revenue
      bills?.forEach(bill => {
        const date = bill.bill_date;
        if (!profitByDate[date]) {
          profitByDate[date] = {
            date,
            revenue: 0,
            workPay: 0,
            shopExpenses: 0,
            workerExpenses: 0,
            netProfit: 0,
            orderCount: 0,
            orders: [],
            expenses: []
          };
        }
        profitByDate[date].revenue += bill.total_amount || 0;
      });

      // Calculate net profit for each date
      Object.values(profitByDate).forEach(dayData => {
        dayData.netProfit = dayData.revenue - dayData.workPay - dayData.shopExpenses - dayData.workerExpenses;
      });

      // Convert to array and sort by date
      let result = Object.values(profitByDate).sort((a, b) => new Date(b.date) - new Date(a.date));

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (dateFilter) {
          case 'today':
            result = result.filter(item => {
              const itemDate = new Date(item.date);
              return itemDate.getTime() === today.getTime();
            });
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            result = result.filter(item => {
              const itemDate = new Date(item.date);
              return itemDate >= weekAgo;
            });
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            result = result.filter(item => {
              const itemDate = new Date(item.date);
              return itemDate >= monthAgo;
            });
            break;
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting profit data:', error);
      return [];
    }
  };

  const calculateSummaryStats = (data) => {
    if (!data || data.length === 0) {
      return {
        totalRevenue: 0,
        totalWorkPay: 0,
        totalShopExpenses: 0,
        totalWorkerExpenses: 0,
        totalNetProfit: 0,
        totalOrders: 0,
        averageDailyProfit: 0,
        profitMargin: 0,
        bestDay: null,
        worstDay: null
      };
    }

    const totalRevenue = data.reduce((sum, day) => sum + day.revenue, 0);
    const totalWorkPay = data.reduce((sum, day) => sum + day.workPay, 0);
    const totalShopExpenses = data.reduce((sum, day) => sum + day.shopExpenses, 0);
    const totalWorkerExpenses = data.reduce((sum, day) => sum + day.workerExpenses, 0);
    const totalNetProfit = data.reduce((sum, day) => sum + day.netProfit, 0);
    const totalOrders = data.reduce((sum, day) => sum + day.orderCount, 0);
    const averageDailyProfit = totalNetProfit / data.length;
    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

    // Find best and worst days
    const bestDay = data.reduce((best, current) => 
      current.netProfit > best.netProfit ? current : best, data[0]);
    const worstDay = data.reduce((worst, current) => 
      current.netProfit < worst.netProfit ? current : worst, data[0]);

    return {
      totalRevenue,
      totalWorkPay,
      totalShopExpenses,
      totalWorkerExpenses,
      totalNetProfit,
      totalOrders,
      averageDailyProfit,
      profitMargin,
      bestDay,
      worstDay
    };
  };

  const filterData = () => {
    if (!searchQuery.trim()) {
      setFilteredData(profitData);
      return;
    }

    const filtered = profitData.filter(day => {
      return (
        day.date.includes(searchQuery) ||
        day.orderCount?.toString().includes(searchQuery) ||
        day.revenue?.toString().includes(searchQuery) ||
        day.netProfit?.toString().includes(searchQuery)
      );
    });
    setFilteredData(filtered);
  };

  const showDateDetail = (dayData) => {
    setSelectedDate(dayData);
    setDetailModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return '#27ae60';
    if (profit < 0) return '#e74c3c';
    return '#7f8c8d';
  };

  const getProfitIcon = (profit) => {
    if (profit > 0) return '📈';
    if (profit < 0) return '📉';
    return '➖';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading profit data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{
        backgroundColor: '#2980b9',
        paddingTop: 32,
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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Daily Profit</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {/* Floating Reload Button */}
      <View style={{ position: 'absolute', right: 24, bottom: 32, alignItems: 'flex-end', zIndex: 100 }}>
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
          }}
          onPress={loadData}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-circle" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{ height: 32 }} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by date, orders, or amount..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Date Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setDateFilter('all')}
        >
          <Text style={[styles.filterButtonText, dateFilter === 'all' && styles.filterButtonTextActive]}>
            All Time
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'today' && styles.filterButtonActive]}
          onPress={() => setDateFilter('today')}
        >
          <Text style={[styles.filterButtonText, dateFilter === 'today' && styles.filterButtonTextActive]}>
            Today
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'week' && styles.filterButtonActive]}
          onPress={() => setDateFilter('week')}
        >
          <Text style={[styles.filterButtonText, dateFilter === 'week' && styles.filterButtonTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, dateFilter === 'month' && styles.filterButtonActive]}
          onPress={() => setDateFilter('month')}
        >
          <Text style={[styles.filterButtonText, dateFilter === 'month' && styles.filterButtonTextActive]}>
            This Month
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Statistics */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₹{summaryStats.totalRevenue?.toFixed(2) || '0.00'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Profit</Text>
            <Text style={[styles.summaryValue, { color: getProfitColor(summaryStats.totalNetProfit) }]}>
              ₹{summaryStats.totalNetProfit?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{summaryStats.totalOrders || 0}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Profit Margin</Text>
            <Text style={[styles.summaryValue, { color: getProfitColor(summaryStats.profitMargin) }]}>
              {summaryStats.profitMargin?.toFixed(1) || '0.0'}%
            </Text>
          </View>
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <ScrollView style={{ overflow: 'visible' }} showsVerticalScrollIndicator={true}>
            {filteredData.map((item, index) => (
              <TouchableOpacity
                key={`${item.date}-${index}`}
                style={styles.profitCard}
                onPress={() => showDateDetail(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  <Text style={styles.profitIcon}>{getProfitIcon(item.netProfit)}</Text>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Revenue:</Text>
                    <Text style={styles.statValue}>₹{item.revenue.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Work Pay:</Text>
                    <Text style={styles.statValue}>₹{item.workPay.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Expenses:</Text>
                    <Text style={styles.statValue}>₹{(item.shopExpenses + item.workerExpenses).toFixed(2)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Orders:</Text>
                    <Text style={styles.statValue}>{item.orderCount}</Text>
                  </View>
                </View>

                <View style={styles.profitSection}>
                  <Text style={styles.profitLabel}>Net Profit:</Text>
                  <Text style={[styles.profitAmount, { color: getProfitColor(item.netProfit) }]}>₹{item.netProfit.toFixed(2)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.tapToView}>Tap to view detailed breakdown</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={filteredData}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.profitCard}
                onPress={() => showDateDetail(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  <Text style={styles.profitIcon}>{getProfitIcon(item.netProfit)}</Text>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Revenue:</Text>
                    <Text style={styles.statValue}>₹{item.revenue.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Work Pay:</Text>
                    <Text style={styles.statValue}>₹{item.workPay.toFixed(2)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Expenses:</Text>
                    <Text style={styles.statValue}>₹{(item.shopExpenses + item.workerExpenses).toFixed(2)}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Orders:</Text>
                    <Text style={styles.statValue}>{item.orderCount}</Text>
                  </View>
                </View>

                <View style={styles.profitSection}>
                  <Text style={styles.profitLabel}>Net Profit:</Text>
                  <Text style={[styles.profitAmount, { color: getProfitColor(item.netProfit) }]}>₹{item.netProfit.toFixed(2)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.tapToView}>Tap to view detailed breakdown</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => `${item.date}-${index}`}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={loadData}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      )}

      {/* Date Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Daily Breakdown</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedDate && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Date: {formatDate(selectedDate.date)}</Text>
                  <View style={styles.dateSummary}>
                    <Text style={styles.dateSummaryText}>
                      {selectedDate.orderCount} orders • ₹{selectedDate.revenue.toFixed(2)} revenue
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Financial Summary</Text>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Revenue:</Text>
                    <Text style={styles.financialValue}>₹{selectedDate.revenue.toFixed(2)}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Work Pay:</Text>
                    <Text style={styles.financialValue}>₹{selectedDate.workPay.toFixed(2)}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Shop Expenses:</Text>
                    <Text style={styles.financialValue}>₹{selectedDate.shopExpenses.toFixed(2)}</Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Worker Expenses:</Text>
                    <Text style={styles.financialValue}>₹{selectedDate.workerExpenses.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.financialRow, styles.netProfitRow]}>
                    <Text style={styles.financialLabel}>Net Profit:</Text>
                    <Text style={[styles.financialValue, { color: getProfitColor(selectedDate.netProfit) }]}>
                      ₹{selectedDate.netProfit.toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Orders ({selectedDate.orders.length})</Text>
                  {selectedDate.orders.length > 0 ? (
                    selectedDate.orders.map((order, index) => (
                      <View key={index} style={styles.orderItem}>
                        <Text style={styles.orderText}>Order #{order.id}</Text>
                        <Text style={styles.orderAmount}>₹{order.Work_pay || 0}</Text>
                        <Text style={styles.orderDate}>
                          {new Date(order.order_date).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No orders for this date</Text>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Expenses ({selectedDate.expenses.length})</Text>
                  {selectedDate.expenses.length > 0 ? (
                    selectedDate.expenses.map((expense, index) => (
                      <View key={index} style={styles.expenseItem}>
                        <Text style={styles.expenseText}>
                          {expense.name || expense.expense_name} ({expense.type})
                        </Text>
                        <Text style={styles.expenseAmount}>₹{expense.Amt_Paid || 0}</Text>
                        <Text style={styles.expenseDate}>
                          {new Date(expense.date).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No expenses for this date</Text>
                  )}
                </View>
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeDetailButton]}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeDetailButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2980b9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  refreshButton: {
    backgroundColor: '#2980b9',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonActive: {
    backgroundColor: '#2980b9',
    borderColor: '#2980b9',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  listContainer: {
    padding: 16,
  },
  profitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profitIcon: {
    fontSize: 20,
  },
  cardStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profitSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginBottom: 8,
  },
  profitLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  profitAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardFooter: {
    alignItems: 'center',
  },
  tapToView: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  closeButton: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  dateSummary: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  dateSummaryText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  financialValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  netProfitRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 4,
  },
  orderText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2980b9',
    marginRight: 8,
  },
  orderDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 6,
    marginBottom: 4,
  },
  expenseText: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginRight: 8,
  },
  expenseDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noDataText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  closeDetailButton: {
    backgroundColor: '#2980b9',
  },
  closeDetailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 