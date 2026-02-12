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
import { useCreateTransaction } from '../../src/hooks/useTransactions';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { EXPENSE_CATEGORIES, getCategoryName } from '../../src/lib/categories';
import { format } from 'date-fns';

export default function AddExpenseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createTx = useCreateTransaction();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const canSave = hasSupabaseEnv && user && amount && parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!canSave) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      await createTx.mutateAsync({
        date,
        amount: -Math.abs(amt),
        type: 'expense',
        vendor: vendor || null,
        category: category || null,
        description: description || null,
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
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>
          Connect Supabase in .env.local to add transactions.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Add Expense
        </Text>

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Date</Text>
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
          value={date}
          onChangeText={setDate}
          placeholder="yyyy-mm-dd"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Amount *</Text>
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
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor="#64748B"
          keyboardType="decimal-pad"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Vendor</Text>
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
          value={vendor}
          onChangeText={setVendor}
          placeholder="Vendor name"
          placeholderTextColor="#64748B"
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Category</Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
        >
          <Text style={{ color: '#F8FAFC' }}>{getCategoryName(category)}</Text>
        </TouchableOpacity>

        {showCategoryPicker && (
          <View style={{ marginBottom: 16 }}>
            {EXPENSE_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  setCategory(c.id);
                  setShowCategoryPicker(false);
                }}
                style={{
                  padding: 12,
                  backgroundColor: category === c.id ? '#334155' : '#1E293B',
                  borderRadius: 8,
                  marginBottom: 4,
                }}
              >
                <Text style={{ color: '#F8FAFC' }}>{c.icon} {c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Description (optional)</Text>
        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 24,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={description}
          onChangeText={setDescription}
          placeholder="Notes"
          placeholderTextColor="#64748B"
          multiline
        />

        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave || createTx.isPending}
          style={{
            backgroundColor: canSave ? '#3B82F6' : '#334155',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          {createTx.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
