import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { SupabaseAPI, supabase } from './supabase';
import { Ionicons } from '@expo/vector-icons';

export default function DailyProfitScreenTwoStage({ navigation }) {
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  useEffect(() => {
    loadProfitData();
  }, [dateFilter]);

  const loadProfitData = async () => {
    try {
      setLoading(true);
      console.log('🧪 === LOADING PROFIT DATA USING TWO-STAGE REVENUE SYSTEM ===');
      console.log('🔄 Date filter:', dateFilter);
      
      // Determine date parameter based on filter
      let dateParam = null;
      if (dateFilter === 'today') {
        const today = new Date();
        dateParam = today.toISOString().split('T')[0];
      }
      
      console.log('📅 Date parameter:', dateParam);
      
      // Call the two-stage revenue system
      const result = await SupabaseAPI.calculateProfit(dateParam);
      console.log('📊 Result from SupabaseAPI.calculateProfit:', result);
      
      if (result) {
        console.log('✅ Profit data loaded successfully!');
        console.log('💰 Method used:', result.method || 'unknown');
        console.log('💵 Total revenue:', result.total_revenue);
        console.log('📈 Net profit:', result.net_profit);
        
        if (result.revenue_breakdown) {
          console.log('💳 Revenue breakdown:');
          console.log('  - Advance payments:', result.revenue_breakdown.advance_payments);
          console.log('  - Final payments:', result.revenue_breakdown.final_payments);
        }
        
        // Check if using two-stage system
        if (result.method === 'two_stage') {
          console.log('🎉 SUCCESS: Two-stage revenue system is ACTIVE!');
          console.log('✅ Your revenue_tracking table is working correctly');
          console.log('✅ Final payments from marking orders "paid" will show up here');
        } else if (result.method === 'legacy') {
          console.log('⚠️ WARNING: System is using legacy method');
          console.log('💡 This means revenue_tracking table is not accessible');
          console.log('❌ Final payments from marking orders "paid" will NOT be tracked correctly');
        }
        
        setProfitData(result);
      } else {
        console.log('❌ No data received from calculateProfit');
        setProfitData(null);
      }
      
    } catch (error) {
      console.error('❌ Error loading profit data:', error);
      Alert.alert('Error', `Failed to load profit data: ${error.message}`);
      setProfitData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${(amount || 0).toFixed(2)}`;
  };

  const getProfitColor = (profit) => {
    if (profit > 0) return '#27ae60';
    if (profit < 0) return '#e74c3c';
    return '#7f8c8d';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading profit data...</Text>
        <Text style={styles.loadingSubText}>Using two-stage revenue system</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back-circle" size={40} color="#fff" />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Daily Profit</Text>
          <Text style={styles.headerSubtitle}>Two-Stage Revenue System</Text>
        </View>
        <Image 
          source={require('./assets/logo.jpg')} 
          style={styles.logo} 
        />
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadProfitData}
        disabled={loading}
      >
        <Ionicons name="refresh" size={24} color="#fff" />
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>

      <ScrollView style={styles.content}>
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
        </View>

        {/* System Status */}
        {profitData && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>System Status</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Revenue Method:</Text>
              <Text style={[
                styles.statusValue,
                { color: profitData.method === 'two_stage' ? '#27ae60' : '#e74c3c' }
              ]}>
                {profitData.method === 'two_stage' ? 'Two-Stage ✅' : 'Legacy ⚠️'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Date Range:</Text>
              <Text style={styles.statusValue}>
                {profitData.date || (dateFilter === 'all' ? 'All Time' : 'Today')}
              </Text>
            </View>
          </View>
        )}

        {/* Main Profit Cards */}
        {profitData && (
          <>
            {/* Revenue Card */}
            <View style={styles.profitCard}>
              <Text style={styles.cardTitle}>💰 Revenue</Text>
              <Text style={styles.cardAmount}>
                {formatCurrency(profitData.total_revenue)}
              </Text>
              
              {profitData.revenue_breakdown && (
                <View style={styles.breakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Advance Payments:</Text>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(profitData.revenue_breakdown.advance_payments)}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Final Payments:</Text>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(profitData.revenue_breakdown.final_payments)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Expenses Card */}
            <View style={styles.profitCard}>
              <Text style={styles.cardTitle}>💸 Expenses</Text>
              <Text style={styles.cardAmount}>
                {formatCurrency((profitData.daily_expenses || 0) + (profitData.worker_expenses || 0))}
              </Text>
              
              <View style={styles.breakdown}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Daily Expenses:</Text>
                  <Text style={styles.breakdownValue}>
                    {formatCurrency(profitData.daily_expenses)}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Worker Expenses:</Text>
                  <Text style={styles.breakdownValue}>
                    {formatCurrency(profitData.worker_expenses)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Net Profit Card */}
            <View style={[styles.profitCard, styles.profitCardFinal]}>
              <Text style={styles.cardTitle}>📈 Net Profit</Text>
              <Text style={[
                styles.cardAmount,
                styles.profitAmount,
                { color: getProfitColor(profitData.net_profit) }
              ]}>
                {formatCurrency(profitData.net_profit)}
              </Text>
            </View>

            {/* Instructions Card */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>
                {profitData.method === 'two_stage' ? '🎉 Two-Stage System Active!' : '⚠️ Legacy Mode'}
              </Text>
              
              {profitData.method === 'two_stage' ? (
                <View>
                  <Text style={styles.instructionsText}>
                    ✅ Your revenue tracking system is working correctly!
                  </Text>
                  <Text style={styles.instructionsText}>
                    💰 When you mark orders as "paid" in Orders Overview:
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Pending amounts will be added to today's revenue
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Final payments will show up in the breakdown above
                  </Text>
                  <Text style={styles.instructionsText}>
                    • Daily profit will update immediately
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.instructionsText}>
                    ❌ Revenue tracking table not accessible
                  </Text>
                  <Text style={styles.instructionsText}>
                    💡 Payment completion amounts won't be recorded correctly
                  </Text>
                  <Text style={styles.instructionsText}>
                    🔧 Check table permissions in Supabase dashboard
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {!profitData && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptyText}>Unable to load profit data</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfitData}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    marginTop: 16,
    fontSize: 16,
    color: '#2980b9',
    fontWeight: '600',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 26,
    marginRight: 8,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
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
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 12,
    backgroundColor: '#fff',
  },
  refreshButton: {
    position: 'absolute',
    right: 20,
    top: 120,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 100,
  },
  refreshText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2980b9',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  profitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  profitCardFinal: {
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 16,
  },
  profitAmount: {
    fontSize: 36,
  },
  breakdown: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
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
  instructionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#5d6d7e',
    lineHeight: 20,
    marginBottom: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
