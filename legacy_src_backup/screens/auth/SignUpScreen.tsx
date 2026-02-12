import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export function SignUpScreen({ navigation }: any) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name, businessName || undefined);
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6', '#60A5FA']} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start organizing your business today</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="John Smith"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Smith Consulting LLC"
                placeholderTextColor="#94A3B8"
                value={businessName}
                onChangeText={setBusinessName}
                autoCapitalize="words"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="you@business.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonLoading]}
              onPress={handleSignUp}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient 
                colors={loading ? ['#93C5FD', '#93C5FD'] : ['#1E3A8A', '#3B82F6']} 
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Get Started'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.terms}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 0,
    padding: 8,
  },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 40 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 8 },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  button: { marginTop: 8, borderRadius: 14, overflow: 'hidden' },
  buttonLoading: { opacity: 0.7 },
  buttonGradient: { paddingVertical: 18, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  terms: { 
    fontSize: 12, 
    color: '#94A3B8', 
    textAlign: 'center', 
    marginTop: 20,
    lineHeight: 18,
  },
});
