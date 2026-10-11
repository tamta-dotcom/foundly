import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { loginUser, registerUser } from '../services/auth';
import LoadingView from '../components/LoadingView';

export default function LoginScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingView />;
  if (user) return <Redirect href="/(tabs)" />;

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    if (registering && !name.trim()) {
      Alert.alert('Missing name', 'Enter your name to register.');
      return;
    }

    if (registering && password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }

    try {
      setBusy(true);

      if (registering) {
        await registerUser(name, email, password);
      } else {
        await loginUser(email, password);
      }

      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Authentication failed', error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>Foundly</Text>
        <Text style={styles.subtitle}>
          Lost and found, together.
        </Text>

        {registering && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            style={styles.input}
          />
        )}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (minimum 6 characters)"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, busy && styles.disabled]}
          onPress={submit}
          disabled={busy}
        >
          <Text style={styles.buttonText}>
            {busy
              ? 'Please wait...'
              : registering
              ? 'Create account'
              : 'Sign in'}
          </Text>
        </TouchableOpacity>

        <Text
          style={styles.switch}
          onPress={() => setRegistering(!registering)}
        >
          {registering
            ? 'Already registered? Sign in'
            : "New to Foundly? Create an account"}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    padding: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
  },
  logo: {
    color: '#2563EB',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: '#64748B',
    marginBottom: 26,
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  switch: {
    color: '#2563EB',
    textAlign: 'center',
    marginTop: 22,
    fontWeight: '700',
  },
});