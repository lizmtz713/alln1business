import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateBankAccount } from '../../src/hooks/useBankAccounts';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';

const ACCOUNT_TYPES = [
  { id: 'checking', label: 'Checking' },
  { id: 'savings', label: 'Savings' },
  { id: 'credit', label: 'Credit' },
];

export default function AddBankAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createAccount = useCreateBankAccount();
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const canSave = hasSupabaseEnv && user && accountName.trim();

  const handleSave = async () => {
    if (!canSave) return;

    try {
      await createAccount.mutateAsync({
        account_name: accountName.trim(),
        account_type: accountType ?? null,
        bank_name: bankName.trim() || null,
        last_four: lastFour.trim() || null,
        is_primary: isPrimary,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to add bank accounts.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Add Bank Account
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Account Name *</Text>
        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={accountName}
          onChangeText={setAccountName}
          placeholder="e.g. Chase Business Checking"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Account Type</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {ACCOUNT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setAccountType(t.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: accountType === t.id ? '#3B82F6' : '#1E293B',
              }}
            >
              <Text style={{ color: '#F8FAFC' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Bank Name</Text>
        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={bankName}
          onChangeText={setBankName}
          placeholder="e.g. Chase"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Last 4 Digits</Text>
        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={lastFour}
          onChangeText={setLastFour}
          placeholder="1234"
          placeholderTextColor="#64748B"
          keyboardType="number-pad"
          maxLength={4}
        />

        <TouchableOpacity
          onPress={() => setIsPrimary(!isPrimary)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: isPrimary ? '#3B82F6' : '#64748B',
              backgroundColor: isPrimary ? '#3B82F6' : 'transparent',
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isPrimary && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>Primary account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || createAccount.isPending}
          style={{
            backgroundColor: canSave ? '#3B82F6' : '#334155',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          {createAccount.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
