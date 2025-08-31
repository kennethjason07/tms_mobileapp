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

export default function ShopExpenseScreen({ navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    Date: '',
    material_cost: '',
    material_type: '',
    miscellaneous_Cost: '',
    miscellaneous_item: '',
    chai_pani_cost: '',
    Total_Pay: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editExpenseModalVisible, setEditExpenseModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [searchQuery, expenses]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getDailyExpenses();
      setExpenses(data);
      setFilteredExpenses(data);
    } catch (error) {
      Alert.alert('Error', `Failed to load expenses: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    if (!searchQuery.trim()) {
      setFilteredExpenses(expenses);
      return;
    }

    const filtered = expenses.filter(expense => 
      expense.material_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.miscellaneous_item?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.Date?.includes(searchQuery)
    );
    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async () => {
    if (!newExpense.Date) {
      Alert.alert('Error', 'Date is required field');
      return;
    }

    try {
      setLoading(true);
      const calculatedTotalPay =
        (parseFloat(newExpense.material_cost) || 0) +
        (parseFloat(newExpense.miscellaneous_Cost) || 0) +
        (parseFloat(newExpense.chai_pani_cost) || 0);
      const expenseData = {
        Date: newExpense.Date,
        material_cost: parseFloat(newExpense.material_cost) || 0,
        material_type: newExpense.material_type || '',
        miscellaneous_Cost: parseFloat(newExpense.miscellaneous_Cost) || 0,
        miscellaneous_item: newExpense.miscellaneous_item || '',
        chai_pani_cost: parseFloat(newExpense.chai_pani_cost) || 0,
        Total_Pay: calculatedTotalPay,
      };
      // Remove id if present to avoid duplicate key errors
      delete expenseData.id;

      await SupabaseAPI.addDailyExpense(expenseData);
      setModalVisible(false);
      setNewExpense({
        Date: '',
        material_cost: '',
        material_type: '',
        miscellaneous_Cost: '',
        miscellaneous_item: '',
        chai_pani_cost: '',
        Total_Pay: '',
      });
      loadExpenses(); // Reload the list
      Alert.alert('Success', 'Expense added successfully');
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
    if (!editingExpense.Date) {
      Alert.alert('Error', 'Date is required field');
      return;
    }
    try {
      setLoading(true);
      const calculatedTotalPay =
        (parseFloat(editingExpense.material_cost) || 0) +
        (parseFloat(editingExpense.miscellaneous_Cost) || 0) +
        (parseFloat(editingExpense.chai_pani_cost) || 0);
      const expenseData = {
        Date: editingExpense.Date,
        material_cost: parseFloat(editingExpense.material_cost) || 0,
        material_type: editingExpense.material_type || '',
        miscellaneous_Cost: parseFloat(editingExpense.miscellaneous_Cost) || 0,
        miscellaneous_item: editingExpense.miscellaneous_item || '',
        chai_pani_cost: parseFloat(editingExpense.chai_pani_cost) || 0,
        Total_Pay: calculatedTotalPay,
      };
      // Remove id if present
      delete expenseData.id;
      await SupabaseAPI.updateDailyExpense(editingExpense.id, expenseData);
      setEditExpenseModalVisible(false);
      setEditingExpense(null);
      loadExpenses();
      Alert.alert('Success', 'Expense updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update expense: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => {
      return total + (parseFloat(expense.Total_Pay) || 0);
    }, 0);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Helper to format date as dd-mm-yyyy
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${month}-${year}`;
  };

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseDate}>
          {formatDate(item.Date)}
        </Text>
        <Text style={styles.expenseTotal}>₹{item.Total_Pay}</Text>
        <TouchableOpacity
          style={{ marginLeft: 8, backgroundColor: '#2980b9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}
          onPress={() => handleEditExpense(item)}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.expenseDetails}>
        {item.material_type && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Material:</Text>
            <Text style={styles.expenseValue}>
              {item.material_type} - ₹{item.material_cost || 0}
            </Text>
          </View>
        )}

        {item.miscellaneous_item && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Miscellaneous:</Text>
            <Text style={styles.expenseValue}>
              {item.miscellaneous_item} - ₹{item.miscellaneous_Cost || 0}
            </Text>
          </View>
        )}

        {item.chai_pani_cost > 0 && (
          <View style={styles.expenseRow}>
            <Text style={styles.expenseLabel}>Chai/Pani:</Text>
            <Text style={styles.expenseValue}>₹{item.chai_pani_cost}</Text>
          </View>
        )}
      </View>

      <View style={styles.expenseBreakdown}>
        <Text style={styles.breakdownText}>
          Breakdown: Material ₹{item.material_cost || 0} + 
          Misc ₹{item.miscellaneous_Cost || 0} + 
          Chai/Pani ₹{item.chai_pani_cost || 0} = 
          Total ₹{item.Total_Pay}
        </Text>
      </View>
    </View>
  );

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2980b9" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Shop Expenses</Text>
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
          placeholder="Search by material type, item, or date..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredExpenses.length}</Text>
          <Text style={styles.statLabel}>Total Entries</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>₹{calculateTotalExpenses().toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Expenses</Text>
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <View style={{ height: '100vh', width: '100vw', overflow: 'auto' }}>
          <ScrollView style={{ overflow: 'visible' }} showsVerticalScrollIndicator={true}>
            <FlatList
              data={filteredExpenses}
              renderItem={renderExpense}
              keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
              contentContainerStyle={styles.listContainer}
              refreshing={loading}
              onRefresh={loadExpenses}
              showsVerticalScrollIndicator={false}
            />
          </ScrollView>
        </View>
      ) : (
        <FlatList
          data={filteredExpenses}
          renderItem={renderExpense}
          keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadExpenses}
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
              <Text style={styles.modalTitle}>Add Daily Expense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalBody}
            >
              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={{ fontSize: 16, color: newExpense.Date ? '#2c3e50' : '#aaa' }}>
                  {newExpense.Date ? newExpense.Date : 'Select Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={newExpense.Date ? new Date(newExpense.Date) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      const formatted = selectedDate.toISOString().split('T')[0];
                      setNewExpense({ ...newExpense, Date: formatted });
                    }
                  }}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Material Type (optional)"
                value={newExpense.material_type}
                onChangeText={(text) => setNewExpense({ ...newExpense, material_type: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Material Cost"
                value={newExpense.material_cost}
                onChangeText={(text) => setNewExpense({ ...newExpense, material_cost: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Miscellaneous Item (optional)"
                value={newExpense.miscellaneous_item}
                onChangeText={(text) => setNewExpense({ ...newExpense, miscellaneous_item: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Miscellaneous Cost"
                value={newExpense.miscellaneous_Cost}
                onChangeText={(text) => setNewExpense({ ...newExpense, miscellaneous_Cost: text })}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Chai/Pani Cost"
                value={newExpense.chai_pani_cost}
                onChangeText={(text) => setNewExpense({ ...newExpense, chai_pani_cost: text })}
                keyboardType="numeric"
              />

              {/* Total Pay is now calculated, not entered */}
              <View style={styles.input}>
                <Text style={{ fontSize: 16, color: '#2c3e50' }}>
                  Total Pay: ₹{(
                    (parseFloat(newExpense.material_cost) || 0) +
                    (parseFloat(newExpense.miscellaneous_Cost) || 0) +
                    (parseFloat(newExpense.chai_pani_cost) || 0)
                  ).toFixed(2)}
                </Text>
              </View>

              <View style={styles.calculationPreview}>
                <Text style={styles.calculationText}>
                  Preview: Material ₹{parseFloat(newExpense.material_cost) || 0} + 
                  Misc ₹{parseFloat(newExpense.miscellaneous_Cost) || 0} + 
                  Chai/Pani ₹{parseFloat(newExpense.chai_pani_cost) || 0} = 
                  ₹{(parseFloat(newExpense.material_cost) || 0) + 
                    (parseFloat(newExpense.miscellaneous_Cost) || 0) + 
                    (parseFloat(newExpense.chai_pani_cost) || 0)}
                </Text>
              </View>
            </KeyboardAvoidingView>

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
              <Text style={styles.modalTitle}>Edit Expense</Text>
              <TouchableOpacity onPress={() => setEditExpenseModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {editingExpense && (
              <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalBody}
            >
                <TouchableOpacity
                  style={[styles.input, { justifyContent: 'center' }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ fontSize: 16, color: editingExpense.Date ? '#2c3e50' : '#aaa' }}>
                    {editingExpense.Date ? editingExpense.Date : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={editingExpense.Date ? new Date(editingExpense.Date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) {
                        const formatted = selectedDate.toISOString().split('T')[0];
                        setEditingExpense({ ...editingExpense, Date: formatted });
                      }
                    }}
                  />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Material Type (optional)"
                  value={editingExpense.material_type}
                  onChangeText={(text) => setEditingExpense({ ...editingExpense, material_type: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Material Cost"
                  value={editingExpense.material_cost?.toString()}
                  onChangeText={(text) => setEditingExpense({ ...editingExpense, material_cost: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Miscellaneous Item (optional)"
                  value={editingExpense.miscellaneous_item}
                  onChangeText={(text) => setEditingExpense({ ...editingExpense, miscellaneous_item: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Miscellaneous Cost"
                  value={editingExpense.miscellaneous_Cost?.toString()}
                  onChangeText={(text) => setEditingExpense({ ...editingExpense, miscellaneous_Cost: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Chai/Pani Cost"
                  value={editingExpense.chai_pani_cost?.toString()}
                  onChangeText={(text) => setEditingExpense({ ...editingExpense, chai_pani_cost: text })}
                  keyboardType="numeric"
                />
                {/* Total Pay is now calculated, not entered */}
                <View style={styles.input}>
                  <Text style={{ fontSize: 16, color: '#2c3e50' }}>
                    Total Pay: ₹{(
                      (parseFloat(editingExpense.material_cost) || 0) +
                      (parseFloat(editingExpense.miscellaneous_Cost) || 0) +
                      (parseFloat(editingExpense.chai_pani_cost) || 0)
                    ).toFixed(2)}
                  </Text>
                </View>
              </KeyboardAvoidingView>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
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
  expenseTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseDetails: {
    marginBottom: 12,
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
  expenseBreakdown: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  breakdownText: {
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
    width: Platform.OS === 'web' ? '50%' : '90%',
    maxHeight: '90%',
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  calculationPreview: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  calculationText: {
    fontSize: 14,
    color: '#2c3e50',
    fontStyle: 'italic',
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    backgroundColor: '#2980b9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
}); 