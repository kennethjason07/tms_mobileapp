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
import WebScrollView from './components/WebScrollView';
import { SupabaseAPI } from './supabase';
import { Ionicons } from '@expo/vector-icons';

export default function WorkersScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [newWorker, setNewWorker] = useState({
    name: '',
    number: '',
    Rate: '',
    Suit: '',
    Jacket: '',
    Sadri: '',
    Others: '',
  });

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const data = await SupabaseAPI.getWorkers();
      setWorkers(data);
    } catch (error) {
      Alert.alert('Error', `Failed to load workers: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async () => {
    if (!newWorker.name || !newWorker.number) {
      Alert.alert('Error', 'Name and number are required');
      return;
    }

    try {
      setLoading(true);
      const workerData = {
        name: newWorker.name,
        number: newWorker.number,
        Rate: parseFloat(newWorker.Rate) || null,
        Suit: parseFloat(newWorker.Suit) || null,
        Jacket: parseFloat(newWorker.Jacket) || null,
        Sadri: parseFloat(newWorker.Sadri) || null,
        Others: parseFloat(newWorker.Others) || null,
      };

      await SupabaseAPI.addWorkers([workerData]);
      setModalVisible(false);
      setNewWorker({ name: '', number: '', Rate: '', Suit: '', Jacket: '', Sadri: '', Others: '' });
      loadWorkers(); // Reload the list
      Alert.alert('Success', 'Worker added successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to add worker: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorker = (worker) => {
    setEditingWorker({
      id: worker.id,
      name: worker.name || '',
      number: worker.number || '',
      Rate: worker.Rate ? worker.Rate.toString() : '',
      Suit: worker.Suit ? worker.Suit.toString() : '',
      Jacket: worker.Jacket ? worker.Jacket.toString() : '',
      Sadri: worker.Sadri ? worker.Sadri.toString() : '',
      Others: worker.Others ? worker.Others.toString() : '',
    });
    setEditModalVisible(true);
  };

  const handleUpdateWorker = async () => {
    if (!editingWorker.name || !editingWorker.number) {
      Alert.alert('Error', 'Name and number are required');
      return;
    }

    try {
      setLoading(true);
      const workerData = {
        name: editingWorker.name,
        number: editingWorker.number,
        Rate: parseFloat(editingWorker.Rate) || null,
        Suit: parseFloat(editingWorker.Suit) || null,
        Jacket: parseFloat(editingWorker.Jacket) || null,
        Sadri: parseFloat(editingWorker.Sadri) || null,
        Others: parseFloat(editingWorker.Others) || null,
      };

      await SupabaseAPI.updateWorker(editingWorker.id, workerData);
      setEditModalVisible(false);
      setEditingWorker(null);
      loadWorkers(); // Reload the list
      Alert.alert('Success', 'Worker updated successfully');
    } catch (error) {
      Alert.alert('Error', `Failed to update worker: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${workerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await SupabaseAPI.deleteWorker(workerId);
              loadWorkers(); // Reload the list
              Alert.alert('Success', 'Worker deleted successfully');
            } catch (error) {
              Alert.alert('Error', `Failed to delete worker: ${error.message}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderWorker = ({ item }) => {
    const safe = v => (v !== null && v !== undefined && (typeof v === 'string' || typeof v === 'number')) ? v : '';
    return (
      <View style={styles.workerCard}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{safe(item.name)}</Text>
          <Text style={styles.workerNumber}>{safe(item.number)}</Text>
          <View style={styles.ratesContainer}>
            {item.Rate !== null && item.Rate !== undefined && (
              <Text style={styles.rate}>Rate: ₹{safe(item.Rate)}</Text>
            )}
            {item.Suit !== null && item.Suit !== undefined && (
              <Text style={styles.rate}>Suit: ₹{safe(item.Suit)}</Text>
            )}
            {item.Jacket !== null && item.Jacket !== undefined && (
              <Text style={styles.rate}>Jacket: ₹{safe(item.Jacket)}</Text>
            )}
            {item.Sadri !== null && item.Sadri !== undefined && (
              <Text style={styles.rate}>Sadri: ₹{safe(item.Sadri)}</Text>
            )}
            {item.Others !== null && item.Others !== undefined && (
              <Text style={styles.rate}>Others: ₹{safe(item.Others)}</Text>
            )}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditWorker(item)}
            disabled={loading}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteWorker(item.id, item.name)}
            disabled={loading}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && workers.length === 0) {
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
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 }}>Workers</Text>
        </View>
        <Image source={require('./assets/logo.jpg')} style={{ width: 50, height: 50, borderRadius: 25, marginLeft: 12, backgroundColor: '#fff' }} />
      </View>

      {/* Floating Action Buttons */}
      <View style={{ position: 'absolute', right: 24, bottom: 96, alignItems: 'flex-end', zIndex: 100 }}>
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
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
      <SafeAreaView style={{ height: 32 }} />

      {Platform.OS === 'web' ? (
        <WebScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
        >
          {workers.map((item, index) => (
            <React.Fragment key={item?.id || `no-id-${index}`}>
              {renderWorker({ item })}
            </React.Fragment>
          ))}
        </WebScrollView>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={workers}
            renderItem={renderWorker}
            keyExtractor={(item, index) => `${item?.id || 'no-id'}-${index}`}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={loadWorkers}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      )}

      {/* Add Worker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Worker</Text>
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={newWorker.name}
                onChangeText={(text) => setNewWorker({ ...newWorker, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={newWorker.number}
                onChangeText={(text) => setNewWorker({ ...newWorker, number: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Rate"
                value={newWorker.Rate}
                onChangeText={(text) => setNewWorker({ ...newWorker, Rate: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Suit Rate"
                value={newWorker.Suit}
                onChangeText={(text) => setNewWorker({ ...newWorker, Suit: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Jacket Rate"
                value={newWorker.Jacket}
                onChangeText={(text) => setNewWorker({ ...newWorker, Jacket: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Sadri Rate"
                value={newWorker.Sadri}
                onChangeText={(text) => setNewWorker({ ...newWorker, Sadri: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Others Rate"
                value={newWorker.Others}
                onChangeText={(text) => setNewWorker({ ...newWorker, Others: text })}
                keyboardType="numeric"
              />
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
                onPress={handleAddWorker}
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

      {/* Edit Worker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Worker</Text>
            <ScrollView style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={editingWorker?.name}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={editingWorker?.number}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, number: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Rate"
                value={editingWorker?.Rate}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, Rate: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Suit Rate"
                value={editingWorker?.Suit}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, Suit: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Jacket Rate"
                value={editingWorker?.Jacket}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, Jacket: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Sadri Rate"
                value={editingWorker?.Sadri}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, Sadri: text })}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Others Rate"
                value={editingWorker?.Others}
                onChangeText={(text) => setEditingWorker({ ...editingWorker, Others: text })}
                keyboardType="numeric"
              />
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateWorker}
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
  listContainer: {
    padding: 16,
  },
  workerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  workerNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  ratesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  rate: {
    fontSize: 12,
    color: '#2980b9',
    marginRight: 8,
    marginBottom: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2980b9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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