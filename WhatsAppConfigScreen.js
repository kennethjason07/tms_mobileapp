import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { WhatsAppConfig } from './whatsappService';
import { Ionicons } from '@expo/vector-icons';

export default function WhatsAppConfigScreen({ navigation }) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    if (!phoneNumberId.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both Phone Number ID and Token');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      // Set the credentials
      WhatsAppConfig.setCredentials(phoneNumberId, token);

      // Test the connection
      const result = await WhatsAppConfig.testConnection();
      setTestResult(result);

      if (result.success) {
        Alert.alert('Success', 'WhatsApp API connection successful!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      });
      Alert.alert('Error', `Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCredentials = () => {
    if (!phoneNumberId.trim() || !token.trim()) {
      Alert.alert('Error', 'Please enter both Phone Number ID and Token');
      return;
    }

    // In a real app, you would save these securely (e.g., using AsyncStorage with encryption)
    // For now, we'll just set them in the WhatsAppConfig
    WhatsAppConfig.setCredentials(phoneNumberId, token);
    Alert.alert('Success', 'Credentials saved successfully!');
  };

  const renderSetupInstructions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📱 Meta AI WhatsApp API Setup</Text>
      
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Step 1: Create Meta Developer Account</Text>
        <Text style={styles.instructionText}>
          • Go to developers.facebook.com{'\n'}
          • Create a new app or use existing one{'\n'}
          • Add WhatsApp product to your app
        </Text>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Step 2: Get Phone Number ID</Text>
        <Text style={styles.instructionText}>
          • In your Meta app dashboard{'\n'}
          • Go to WhatsApp {'>'} Getting Started{'\n'}
          • Note down your Phone Number ID
        </Text>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Step 3: Generate Access Token</Text>
        <Text style={styles.instructionText}>
          • Go to System Users in your app{'\n'}
          • Create a system user with admin role{'\n'}
          • Generate a token with WhatsApp permissions{'\n'}
          • Copy the generated token
        </Text>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Step 4: Configure Webhook (Optional)</Text>
        <Text style={styles.instructionText}>
          • Set up webhook URL for message delivery{'\n'}
          • Verify webhook with Meta{'\n'}
          • This enables two-way messaging
        </Text>
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionTitle}>Step 5: Test Connection</Text>
        <Text style={styles.instructionText}>
          • Enter your credentials below{'\n'}
          • Click "Test Connection"{'\n'}
          • If successful, notifications will be sent automatically
        </Text>
      </View>
    </View>
  );

  const renderCredentialsForm = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🔑 API Credentials</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Phone Number ID:</Text>
        <TextInput
          style={styles.input}
          value={phoneNumberId}
          onChangeText={setPhoneNumberId}
          placeholder="Enter your Phone Number ID"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Access Token:</Text>
        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="Enter your Access Token"
          secureTextEntry
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveCredentials}
        >
          <Text style={styles.saveButtonText}>Save Credentials</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, testing && styles.testButtonDisabled]}
          onPress={handleTestConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.testButtonText}>Test Connection</Text>
          )}
        </TouchableOpacity>
      </View>

      {testResult && (
        <View style={[
          styles.resultContainer,
          testResult.success ? styles.successResult : styles.errorResult
        ]}>
          <Text style={styles.resultText}>
            {testResult.success ? '✅ ' : '❌ '}
            {testResult.message}
          </Text>
        </View>
      )}
    </View>
  );

  const renderNotificationPreview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📨 Notification Preview</Text>
      
      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Sample WhatsApp Message:</Text>
        <Text style={styles.previewText}>
          🎉 Order Completed!{'\n\n'}
          Dear John Doe,{'\n\n'}
          Your order (Bill #12345) has been completed and is ready for delivery!{'\n\n'}
          Order Details:{'\n'}
          • Suit: 1 piece(s){'\n'}
          • Shirt: 2 piece(s){'\n\n'}
          Please visit our shop to collect your order.{'\n\n'}
          Thank you for choosing our services!{'\n\n'}
          Best regards,{'\n'}
          Your Tailor Shop
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2980b9" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WhatsApp Configuration</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderSetupInstructions()}
          {renderCredentialsForm()}
          {renderNotificationPreview()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2980b9',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 16,
  },
  instructionContainer: {
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  testButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  successResult: {
    backgroundColor: '#d5f4e6',
    borderColor: '#27ae60',
    borderWidth: 1,
  },
  errorResult: {
    backgroundColor: '#fadbd8',
    borderColor: '#e74c3c',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
}); 