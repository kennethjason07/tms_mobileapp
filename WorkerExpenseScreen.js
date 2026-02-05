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
  Button,
  Image,
  Pressable,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';
import WebScrollView from './components/WebScrollView';

export default function WorkerExpenseScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    worker_id: '',
    date: '',
    name: '',
    Amt_Paid: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editExpenseModalVisible, setEditExpenseModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expandedWorkers, setExpandedWorkers] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [searchQuery, expenses]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, workersData] = await Promise.all([
        SupabaseAPI.getWorkerExpenses(),
        SupabaseAPI.getWorkers()
      ]);
      
      setExpenses(expensesData);
      setWorkers(workersData);
    } catch (error) {
      Alert.alert('Error', `Failed to load data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const groupExpensesByWorker = (expenseList) => {
    const grouped = {};
    expenseList.forEach(expense => {
      const workerId = expense.worker_id;
      if (!grouped[workerId]) {
        grouped[workerId] = {
          workerId: workerId,
          workerName: getWorkerName(workerId),
          totalAmount: 0,
          expenseRecords: [],
        };
      }
      grouped[workerId].totalAmount += parseFloat(expense.Amt_Paid) || 0;
      grouped[workerId].expenseRecords.push(expense);
    });
    
    // Sort groups by worker name
    const sortedGroups = Object.values(grouped).sort((a, b) => 
      a.workerName.localeCompare(b.workerName)
    );

    // Sort records within each worker group by date (newest first)
    sortedGroups.forEach(group => {
      group.expenseRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    return sortedGroups;
  };

  const filterExpenses = () => {
    let baseFiltered = expenses;
    if (searchQuery.trim()) {
      baseFiltered = expenses.filter(expense => {
        const worker = workers.find(w => w.id === expense.worker_id);
        return (
          expense.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          worker?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          expense.date?.includes(searchQuery)
        );
      });
    }
    
    const grouped = groupExpensesByWorker(baseFiltered);
    setFilteredExpenses(grouped);
  };

  const toggleWorkerExpansion = (workerId) => {
    setExpandedWorkers(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  const handleAddExpense = async () => {
    if (!newExpense.worker_id || !newExpense.date || !newExpense.name || !newExpense.Amt_Paid) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      setLoading(true);
      const expenseData = {
        worker_id: parseInt(newExpense.worker_id),
        date: newExpense.date,
        name: newExpense.name,
        Amt_Paid: parseFloat(newExpense.Amt_Paid),
      };
      // Remove id if present to avoid duplicate key errors
      delete expenseData.id;

      await SupabaseAPI.addWorkerExpense(expenseData);
      setModalVisible(false);
      setNewExpense({
        worker_id: '',
        date: '',
        name: '',
        Amt_Paid: '',
      });
      loadData(); // Reload the list
      Alert.alert('Success', 'Worker expense added successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to add expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense({ ...expense });
    setEditExpenseModalVisible(true);
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense.worker_id || !editingExpense.date || !editingExpense.name || !editingExpense.Amt_Paid) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    try {
      setLoading(true);
      const expenseData = {
        worker_id: parseInt(editingExpense.worker_id),
        date: editingExpense.date,
        name: editingExpense.name,
        Amt_Paid: parseFloat(editingExpense.Amt_Paid),
      };
      // Remove id if present
      delete expenseData.id;
      await SupabaseAPI.updateWorkerExpense(editingExpense.id, expenseData);
      setEditExpenseModalVisible(false);
      setEditingExpense(null);
      loadData();
      Alert.alert('Success', 'Worker expense updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const getWorkerName = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.name : 'Unknown Worker';
  };

  const getTodayDate = () => {
    // Use IST timezone for consistency with bill dates
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const now = new Date();
    const istDate = new Date(now.getTime() + IST_OFFSET_MS);
    
    const yyyy = istDate.getFullYear();
    const mm = String(istDate.getMonth() + 1).padStart(2, '0');
    const dd = String(istDate.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to format date as dd-mm-yyyy with UTC to IST conversion
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Convert UTC date to IST for display consistency
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const utcDate = new Date(dateString);
      
      if (isNaN(utcDate.getTime())) {
        return dateString; // Return original if invalid
      }
      
      const istDate = new Date(utcDate.getTime() + IST_OFFSET_MS);
      const year = istDate.getFullYear();
      const month = String(istDate.getMonth() + 1).padStart(2, '0');
      const day = String(istDate.getDate()).padStart(2, '0');
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateString || 'N/A';
    }
  };

  const renderExpense = ({ item }) => {
    const isExpanded = expandedWorkers[item.workerId];
    
    return (
      <View style={styles.workerCard}>
        <TouchableOpacity 
          style={styles.workerCardHeader}
          onPress={() => toggleWorkerExpansion(item.workerId)}
          activeOpacity={0.7}
        >
          <View style={styles.workerInfoMain}>
            <View style={styles.workerAvatar}>
              <Text style={styles.avatarText}>{item.workerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.workerCardName}>{item.workerName}</Text>
              <Text style={styles.workerCardId}>ID: #{item.workerId}</Text>
            </View>
          </View>
          <View style={styles.workerAmountContainer}>
            <Text style={styles.totalAmountLabel}>Total Paid</Text>
            <Text style={styles.totalAmountValue}>₹{item.totalAmount.toLocaleString()}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color="#7f8c8d" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Payment History</Text>
            {item.expenseRecords.map((record, index) => (
              <View key={record.id || index} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <Text style={styles.historyDate}>{formatDate(record.date)}</Text>
                  <Text style={styles.historyName}>{record.name}</Text>
                </View>
                <View style={styles.historyItemRight}>
                  <Text style={styles.historyAmount}>₹{record.Amt_Paid}</Text>
                  <TouchableOpacity
                    style={styles.miniEditButton}
                    onPress={() => handleEditExpense(record)}
                  >
                    <Ionicons name="create-outline" size={18} color="#2980b9" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading worker expenses...</Text>
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
      <View style={{
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Worker Expenses</Text>
        </View>
        {/* Temporary test button */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#27ae60',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>+ Add</Text>
          </TouchableOpacity>
        )}
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by worker name, description, or date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {Platform.OS === 'web' ? (
        <WebScrollView
          style={{
            flex: 1,
            height: 'calc(100vh - 220px)',
            width: '100vw'
          }}
          contentContainerStyle={{
            paddingBottom: 200,
            minHeight: 'max-content',
            paddingHorizontal: 16
          }}
          showsVerticalScrollIndicator={true}
        >
          <FlatList
            data={filteredExpenses}
            renderItem={renderExpense}
            keyExtractor={(item) => `worker-${item.workerId}`}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={loadData}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </WebScrollView>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpense}
          keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadData}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Buttons */}
      <View style={{
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        right: 24,
        bottom: Platform.OS === 'web' ? 24 : 96,
        alignItems: 'flex-end',
        zIndex: Platform.OS === 'web' ? 9999 : 100,
        ...(Platform.OS === 'web' && {
          position: 'fixed',
          right: '24px',
          bottom: '24px',
        })
      }}>
        {/* Uncomment and implement reset if needed */}
        {/* <TouchableOpacity
          style={{
            backgroundColor: '#e74c3c',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
            elevation: 8,
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
          onPress={resetForm}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh" size={36} color="#fff" />
        </TouchableOpacity> */}
        <TouchableOpacity
          style={{
            backgroundColor: '#e74c3c',
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
            ...(Platform.OS === 'web' && {
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              cursor: 'pointer'
            })
          }}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{ height: 32 }} />

      {/* Add Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Worker Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Select Worker:</Text>
              {Platform.OS === 'web' ? (
                <select
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    marginBottom: 16,
                    fontSize: 16,
                    width: '100%',
                    backgroundColor: 'white',
                    color: '#2c3e50'
                  }}
                  value={newExpense.worker_id}
                  onChange={(e) => setNewExpense({ ...newExpense, worker_id: e.target.value })}
                >
                  <option value="">-- Select a Worker --</option>
                  {workers.map((worker) => (
                    <option key={worker?.id || Math.random()} value={worker?.id?.toString()}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              ) : (
                <ScrollView style={styles.workerSelector} horizontal showsHorizontalScrollIndicator={false}>
                  {workers.map((worker) => (
                    <TouchableOpacity
                      key={worker?.id || Math.random()}
                      style={[
                        styles.workerOption,
                        newExpense.worker_id === worker?.id?.toString() && styles.workerOptionSelected
                      ]}
                      onPress={() => setNewExpense({ ...newExpense, worker_id: worker?.id?.toString() })}
                    >
                      <Text style={[
                        styles.workerOptionText,
                        newExpense.worker_id === worker?.id?.toString() && styles.workerOptionTextSelected
                      ]}>
                        {worker.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date:</Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    className="rn-web-date-input"
                    style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, width: '100%' }}
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                    min={getTodayDate()}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.input, { justifyContent: 'center' }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={{ fontSize: 16, color: newExpense.date ? '#2c3e50' : '#aaa' }}>
                        {newExpense.date ? newExpense.date : 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={newExpense.date ? new Date(newExpense.date) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            // Format date using IST timezone for consistency
                            const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
                            const istDate = new Date(selectedDate.getTime() + IST_OFFSET_MS);
                            const yyyy = istDate.getFullYear();
                            const mm = String(istDate.getMonth() + 1).padStart(2, '0');
                            const dd = String(istDate.getDate()).padStart(2, '0');
                            const formatted = `${yyyy}-${mm}-${dd}`;
                            setNewExpense({ ...newExpense, date: formatted });
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    )}
                  </>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter description (e.g., Advance, Bonus, etc.)"
                  value={newExpense.name}
                  onChangeText={(text) => setNewExpense({ ...newExpense, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount Paid:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter amount paid"
                  value={newExpense.Amt_Paid}
                  onChangeText={(text) => setNewExpense({ ...newExpense, Amt_Paid: text })}
                  keyboardType="numeric"
                />
              </View>

              {newExpense.worker_id && (
                <View style={styles.workerInfo}>
                  <Text style={styles.workerInfoTitle}>Selected Worker:</Text>
                  <Text style={styles.workerInfoText}>
                    {getWorkerName(parseInt(newExpense.worker_id))}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddExpense}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Edit Expense Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editExpenseModalVisible}
        onRequestClose={() => setEditExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Worker Expense</Text>
              <TouchableOpacity onPress={() => setEditExpenseModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {editingExpense && (
              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Select Worker:</Text>
                {Platform.OS === 'web' ? (
                  <select
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      marginBottom: 16,
                      fontSize: 16,
                      width: '100%',
                      backgroundColor: 'white',
                      color: '#2c3e50'
                    }}
                    value={editingExpense.worker_id?.toString()}
                    onChange={(e) => setEditingExpense({ ...editingExpense, worker_id: parseInt(e.target.value) })}
                  >
                    <option value="">-- Select a Worker --</option>
                    {workers.map((worker) => (
                      <option key={worker?.id || Math.random()} value={worker?.id?.toString()}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <ScrollView style={styles.workerSelector} horizontal showsHorizontalScrollIndicator={false}>
                    {workers.map((worker) => (
                      <TouchableOpacity
                        key={worker?.id || Math.random()}
                        style={[
                          styles.workerOption,
                          editingExpense.worker_id === worker?.id && styles.workerOptionSelected
                        ]}
                        onPress={() => setEditingExpense({ ...editingExpense, worker_id: worker?.id })}
                      >
                        <Text style={[
                          styles.workerOptionText,
                          editingExpense.worker_id === worker?.id && styles.workerOptionTextSelected
                        ]}>
                          {worker.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Date:</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      className="rn-web-date-input"
                      style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, width: '100%' }}
                      value={editingExpense.date}
                      onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })}
                      min={getTodayDate()}
                    />
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="Date (YYYY-MM-DD)"
                      value={editingExpense.date}
                      onChangeText={(text) => setEditingExpense({ ...editingExpense, date: text })}
                    />
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter description (e.g., Advance, Bonus, etc.)"
                    value={editingExpense.name}
                    onChangeText={(text) => setEditingExpense({ ...editingExpense, name: text })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount Paid:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount paid"
                    value={editingExpense.Amt_Paid?.toString()}
                    onChangeText={(text) => setEditingExpense({ ...editingExpense, Amt_Paid: text })}
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditExpenseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateExpense}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
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
  addButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
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
  listContainer: {
    padding: 16,
  },
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  expenseDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseDetails: {
    marginBottom: 8,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  expenseLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  expenseValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  workerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  workerInfoMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  workerCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  workerCardId: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  workerAmountContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  totalAmountLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  historyContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyItemLeft: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  historyName: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginRight: 12,
  },
  miniEditButton: {
    padding: 4,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  workerSelector: {
    marginBottom: 16,
  },
  workerOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  workerOptionSelected: {
    backgroundColor: '#2980b9',
    borderColor: '#2980b9',
  },
  workerOptionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  workerOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#2c3e50',
    minHeight: 50,
  },
  workerInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  workerInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workerInfoText: {
    fontSize: 14,
    color: '#2980b9',
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
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  saveButton: {
    backgroundColor: '#27ae60',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 