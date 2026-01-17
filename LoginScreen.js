import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;

const LoginScreen = ({ navigation, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (username.trim() === 'admin' && password === 'yaks') {
      setErrorMessage('');
      await onLogin();
    } else {
      setErrorMessage('Incorrect username or password entered');
      setPassword('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.loginBox}>
        <View style={styles.header}>
          <Image
            source={require('./assets/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Yak's Men's Wear</Text>
          <Text style={styles.subtitle}>Tailor Management System</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setErrorMessage('');
              }}
              placeholder="Enter username"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrorMessage('');
              }}
              placeholder="Enter password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isSmallScreen ? 15 : 20,
  },
  loginBox: {
    width: isSmallScreen ? '100%' : '90%',
    maxWidth: isSmallScreen ? '100%' : 400,
    backgroundColor: '#fff',
    borderRadius: isSmallScreen ? 8 : 10,
    padding: isSmallScreen ? 20 : 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: isSmallScreen ? 20 : 30,
  },
  logo: {
    width: '100%',
    height: isSmallScreen ? 80 : 120,
    marginBottom: isSmallScreen ? 15 : 20,
  },
  title: {
    fontSize: isSmallScreen ? 22 : 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isSmallScreen ? 14 : 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: isSmallScreen ? 15 : 20,
  },
  label: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: isSmallScreen ? 6 : 8,
  },
  input: {
    width: '100%',
    height: isSmallScreen ? 45 : 50,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 5,
    paddingHorizontal: isSmallScreen ? 12 : 15,
    fontSize: isSmallScreen ? 14 : 16,
    backgroundColor: '#fff',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: '#ffebee',
    borderRadius: 5,
    padding: isSmallScreen ? 10 : 12,
    marginTop: isSmallScreen ? 8 : 10,
    borderWidth: 1,
    borderColor: '#ef5350',
  },
  errorText: {
    color: '#c62828',
    fontSize: isSmallScreen ? 13 : 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    height: isSmallScreen ? 45 : 50,
    backgroundColor: '#db9b68',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isSmallScreen ? 8 : 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
