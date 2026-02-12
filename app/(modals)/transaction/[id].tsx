import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../../../src/hooks/useTransactions';
import { useAuth } from '../../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../../src/services/env';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoryName,
  type CategoryItem,
} from '../../../src/lib/categories';
import { format } from 'date-fns';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: tx, isLoading } = useTransaction(id);
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const categories =
    tx?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  useEffect(() => {
    if (tx) {
      setDate(tx.date?.split('T')[0] ?? format(new Date(), 'yyyy-MM-dd'));
      setAmount(String(Math.abs(tx.amount)));
      setVendor(tx.vendor ?? '');
      setCategory(tx.category ?? 'other');
      setDescription(tx.description ?? '');
    }
  }, [tx]);

  const canSave =
    hasSupabaseEnv &&
    user &&
    tx &&
    amount &&
    parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!canSave || !tx) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    const finalAmount =
      tx.type === 'expense' ? -Math.abs(amt) : Math.abs(amt);

    try {
      await updateTx.mutateAsync({
        id: tx.id,
        updates: {
          date,
          amount: finalAmount,
          vendor: vendor || null,
          category: category || null,
          description: description || null,
        },
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const handleDelete = () => {
    if (!tx) return;
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTx.mutateAsync(tx.id);
              router.back();
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ]
    );
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>
          Connect Supabase in .env.local to view transactions.
        </Text>
      </View>
    );
  }

  if (isLoading || !tx) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0F172A',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color="#3B82F6" />
        <Text style={{ color: '#94A3B8', marginTop: 16 }}>
          {isLoading ? 'Loading...' : 'Transaction not found'}
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
          Edit Transaction
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
            {categories.map((c: CategoryItem) => (
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

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Description</Text>
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
          disabled={!canSave || updateTx.isPending}
          style={{
            backgroundColor: canSave ? '#3B82F6' : '#334155',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          {updateTx.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={deleteTx.isPending}
          style={{
            backgroundColor: '#7F1D1D',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#FCA5A5', fontWeight: '600', fontSize: 16 }}>
            Delete
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
