import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';

export default function WeeklyPayScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [weeklyPayData, setWeeklyPayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    if (selectedWorkerId) {
      calculateWeeklyPay(selectedWorkerId);
    } else {
      setWeeklyPayData(null);
    }
  }, [selectedWorkerId]);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getWorkers();
      // Sort workers by ID
      const sortedWorkers = data.sort((a, b) => a.id - b.id);
      setWorkers(sortedWorkers);
      
      // Set first worker as default if available
      if (sortedWorkers.length > 0) {
        setSelectedWorkerId(sortedWorkers[0].id.toString());
      }
    } catch (error) {
      Alert.alert('Error', `Failed to load workers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyPay = async (workerId) => {
    try {
      setCalculating(true);
      const data = await SupabaseAPI.getWorkerWeeklyPay(workerId);
      setWeeklyPayData(data);
    } catch (error) {
      Alert.alert('Error', `Failed to calculate weekly pay: ${error.message}`);
      setWeeklyPayData(null);
    } finally {
      setCalculating(false);
    }
  };

  const getSelectedWorkerName = () => {
    const worker = workers.find(w => w.id.toString() === selectedWorkerId);
    return worker ? worker.name : 'Unknown Worker';
  };

  const formatWeekPeriod = (weekPeriod) => {
    if (!weekPeriod) return '';
    
    // Split the "start_date to end_date" format
    const parts = weekPeriod.split(' to ');
    if (parts.length === 2) {
      const startDate = new Date(parts[0]);
      const endDate = new Date(parts[1]);
      
      // Format dates as DD/MM/YYYY
      const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };
      
      return `${formatDate(startDate)}\n${formatDate(endDate)}`;
    }
    
    return weekPeriod;
  };

  const renderWeeklyRow = ({ item }) => (
    <View style={styles.weeklyRow}>
      <View style={[styles.weeklyCell, styles.weekPeriodCell]}>
        <Text style={styles.weeklyCellText}>{formatWeekPeriod(item.week_period)}</Text>
      </View>
      <View style={[styles.weeklyCell, styles.numberCell]}>
        <Text style={styles.weeklyCellText}>{item.order_count || 0}</Text>
      </View>
      <View style={[styles.weeklyCell, styles.amountCell]}>
        <Text style={styles.weeklyCellText}>₹{(item.total_work_pay || 0).toFixed(2)}</Text>
      </View>
      <View style={[styles.weeklyCell, styles.amountCell]}>
        <Text style={styles.weeklyCellText}>₹{(item.total_paid || 0).toFixed(2)}</Text>
      </View>
      <View style={[styles.weeklyCell, styles.amountCell]}>
        <Text style={styles.weeklyCellText}>₹{(item.remaining || 0).toFixed(2)}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading workers...</Text>
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Weekly Pay Calculation</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {Platform.OS === 'web' ? (
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <ScrollView style={{ overflow: 'visible' }} showsVerticalScrollIndicator={true}>
            {/* Worker Selection Section */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Worker:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedWorkerId}
                  onValueChange={(itemValue) => {
                    setSelectedWorkerId(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Worker --" value="" />
                  {workers.map((worker) => (
                    <Picker.Item
                      key={worker?.id || 'unknown'}
                      label={`${worker?.name || 'Unknown'} (ID: ${worker?.id || 'N/A'})`}
                      value={(worker?.id || '').toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Weekly Pay Results */}
            {selectedWorkerId && weeklyPayData && (
              <View style={styles.resultsSection}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    Payment Summary for {getSelectedWorkerName() || 'Unknown Worker'}
                  </Text>
                  <View style={styles.totalSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Orders:</Text>
                      <Text style={styles.summaryValue}>
                        {weeklyPayData.total_summary?.total_orders || 0}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Work Pay:</Text>
                      <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
                        ₹{(parseFloat(weeklyPayData.total_summary?.total_work_pay) || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Amount Paid:</Text>
                      <Text style={[styles.summaryValue, { color: '#3498db' }]}>
                        ₹{(parseFloat(weeklyPayData.total_summary?.total_paid) || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e9ecef', paddingTop: 8, marginTop: 8 }]}>
                      <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Total Remaining:</Text>
                      <Text style={[styles.summaryValue, { 
                        color: (parseFloat(weeklyPayData.total_summary?.total_remaining) || 0) >= 0 ? '#e74c3c' : '#27ae60',
                        fontWeight: 'bold',
                        fontSize: 18
                      }]}>
                        ₹{(parseFloat(weeklyPayData.total_summary?.total_remaining) || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Weekly Breakdown */}
                <View style={styles.weeklySummary}>
                  <Text style={styles.weeklyTitle}>Weekly Breakdown</Text>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={[styles.headerCell, styles.weekPeriodCell]}>
                      <Text style={styles.headerText}>Week Period</Text>
                    </View>
                    <View style={[styles.headerCell, styles.numberCell]}>
                      <Text style={styles.headerText}>Orders</Text>
                    </View>
                    <View style={[styles.headerCell, styles.amountCell]}>
                      <Text style={styles.headerText}>Work Pay</Text>
                    </View>
                    <View style={[styles.headerCell, styles.amountCell]}>
                      <Text style={styles.headerText}>Amount Paid</Text>
                    </View>
                    <View style={[styles.headerCell, styles.amountCell]}>
                      <Text style={styles.headerText}>Remaining</Text>
                    </View>
                  </View>

                  {/* Table Body */}
                  {calculating ? (
                    <View style={styles.calculatingContainer}>
                      <ActivityIndicator size="small" color="#2980b9" />
                      <Text style={styles.calculatingText}>Calculating weekly pay...</Text>
                    </View>
                  ) : weeklyPayData.weekly_data && weeklyPayData.weekly_data.length > 0 ? (
                    <FlatList
                      data={weeklyPayData.weekly_data}
                      renderItem={renderWeeklyRow}
                      keyExtractor={(item, index) => `week-${index}-${item?.week_period || 'unknown'}`}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No weekly data available</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {selectedWorkerId && !weeklyPayData && !calculating && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No weekly pay data found for this worker.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Worker Selection Section */}
            <View style={styles.selectionSection}>
              <Text style={styles.sectionTitle}>Select Worker:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedWorkerId}
                  onValueChange={(itemValue) => {
                    setSelectedWorkerId(itemValue);
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Worker --" value="" />
                  {workers.map((worker) => (
                    <Picker.Item
                      key={worker?.id || 'unknown'}
                      label={`${worker?.name || 'Unknown'} (ID: ${worker?.id || 'N/A'})`}
                      value={(worker?.id || '').toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Weekly Pay Results */}
            {selectedWorkerId && weeklyPayData && (
              <View style={styles.resultsSection}>
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>
                    Payment Summary for {getSelectedWorkerName() || 'Unknown Worker'}
                  </Text>
                  <View style={styles.totalSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Orders:</Text>
                      <Text style={styles.summaryValue}>
                        {weeklyPayData.total_summary?.total_orders || 0}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Work Pay:</Text>
                      <Text style={[styles.summaryValue, { color: '#27ae60' }]}>
                        ₹{(parseFloat(weeklyPayData.total_summary?.total_work_pay) || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total Amount Paid:</Text>
                      <Text style={[styles.summaryValue, { color: '#3498db' }]}>
                        ₹{(parseFloat(weeklyPayData.total_summary?.total_paid) || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e9ecef', paddingTop: 8, marginTop: 8 }]}>
                      <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Total Remaining:</Text>
                      <Text style={[styles.summaryValue, { 
                        color: (parseFloat(weeklyPayData.total_summary?.total_remaining) || 0) >= 0 ? '#e74c3c' : '#27ae60',
                        fontWeight: 'bold',
                        fontSize: 18
                      }]}>
                        ₹{(parseFloat(weeklyPayData.total_summary?.total_remaining) || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Weekly Breakdown */}
                <View style={styles.weeklySummary}>
                  <Text style={styles.weeklyTitle}>Weekly Breakdown</Text>
                  
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <View style={[styles.headerCell, styles.weekPeriodCell]}>
                      <Text style={styles.headerText}>Week Period</Text>
                    </View>
                    <View style={[styles.headerCell, styles.numberCell]}>
                      <Text style={styles.headerText}>Orders</Text>
                    </View>
                    <View style={[styles.headerCell, styles.amountCell]}>
                      <Text style={styles.headerText}>Work Pay</Text>
                    </View>
                    <View style={[styles.headerCell, styles.amountCell]}>
                      <Text style={styles.headerText}>Amount Paid</Text>
                    </View>
                    <View style={[styles.headerCell, styles.amountCell]}>
                      <Text style={styles.headerText}>Remaining</Text>
                    </View>
                  </View>

                  {/* Table Body */}
                  {calculating ? (
                    <View style={styles.calculatingContainer}>
                      <ActivityIndicator size="small" color="#2980b9" />
                      <Text style={styles.calculatingText}>Calculating weekly pay...</Text>
                    </View>
                  ) : weeklyPayData.weekly_data && weeklyPayData.weekly_data.length > 0 ? (
                    <FlatList
                      data={weeklyPayData.weekly_data}
                      renderItem={renderWeeklyRow}
                      keyExtractor={(item, index) => `week-${index}-${item?.week_period || 'unknown'}`}
                      scrollEnabled={false}
                      showsVerticalScrollIndicator={false}
                    />
                  ) : (
                    <View style={styles.noDataContainer}>
                      <Text style={styles.noDataText}>No weekly data available</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {selectedWorkerId && !weeklyPayData && !calculating && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No weekly pay data found for this worker.</Text>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
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
  scrollView: {
    padding: 16,
  },
  selectionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  resultsSection: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
    paddingBottom: 10,
  },
  totalSummary: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  weeklySummary: {
    marginBottom: 20,
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2980b9',
  },
  headerCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weeklyRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 6,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  weeklyCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  weeklyCellText: {
    fontSize: 13,
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 18,
  },
  calculatingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  calculatingText: {
    fontSize: 14,
    color: '#2980b9',
    marginLeft: 8,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#2980b9',
    marginTop: 16,
  },
  weekPeriodCell: {
    flex: 2,
  },
  numberCell: {
    flex: 1,
  },
  amountCell: {
    flex: 1,
  },
}); 