import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCreateTransaction } from '../../src/hooks/useTransactions';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { uploadReceipt } from '../../src/services/storage';
import { EXPENSE_CATEGORIES, getCategoryName } from '../../src/lib/categories';
import { applyCategoryRules } from '../../src/services/rules';
import { buildSuggestedRuleFromEdit } from '../../src/services/rules';
import { useActiveCategoryRules, useCreateCategoryRule } from '../../src/hooks/useCategoryRules';
import { LearnCategoryPrompt } from '../../src/components/LearnCategoryPrompt';
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
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [showLearnPrompt, setShowLearnPrompt] = useState(false);
  const [categoryFromRule, setCategoryFromRule] = useState(false);

  const { data: rules = [] } = useActiveCategoryRules();
  const createRule = useCreateCategoryRule();

  useEffect(() => {
    if ((vendor.trim() || description.trim()) && rules.length > 0) {
      const match = applyCategoryRules(
        { vendor: vendor || null, description: description || null, type: 'expense' },
        rules
      );
      if (match.category) {
        setCategory(match.category);
        setCategoryFromRule(true);
      } else {
        setCategoryFromRule(false);
      }
    } else {
      setCategoryFromRule(false);
    }
  }, [vendor, description, rules]);

  const canSave = hasSupabaseEnv && user && amount && parseFloat(amount) > 0;

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera roll access is needed to attach receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setReceiptUri(uri);
    setUploadingReceipt(true);
    try {
      const url = await uploadReceipt(user!.id, uri);
      setReceiptUrl(url);
    } catch {
      setReceiptUri(null);
    } finally {
      setUploadingReceipt(false);
    }
  };

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
        receipt_url: receiptUrl || null,
      });
      router.back();
    } catch {
      // Toast shown by mutation onError
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#F8FAFC' }}>{getCategoryName(category)}</Text>
            {categoryFromRule && (
              <View style={{ backgroundColor: '#10B98133', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: '#10B981', fontSize: 10 }}>Learned</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {showCategoryPicker && (
          <View style={{ marginBottom: 16 }}>
            {EXPENSE_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => {
                  const oldCat = category;
                  setCategory(c.id);
                  setCategoryFromRule(false);
                  setShowCategoryPicker(false);
                  if (oldCat !== c.id && (vendor.trim() || description.trim())) {
                    setShowLearnPrompt(true);
                  }
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

        {showLearnPrompt && (vendor.trim() || description.trim()) && (
          <LearnCategoryPrompt
            onYes={async () => {
              const rule = buildSuggestedRuleFromEdit({
                newCategory: category,
                vendor: vendor || null,
                description: description || null,
                type: 'expense',
              });
              if (rule) {
                try {
                  await createRule.mutateAsync(rule);
                  setShowLearnPrompt(false);
                } catch {
                  /* ignore */
                }
              }
            }}
            onNo={() => setShowLearnPrompt(false)}
            isPending={createRule.isPending}
          />
        )}

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Description (optional)</Text>
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
          value={description}
          onChangeText={setDescription}
          placeholder="Notes"
          placeholderTextColor="#64748B"
          multiline
        />

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Receipt (optional)</Text>
        {receiptUri ? (
          <TouchableOpacity
            style={{
              width: 80,
              height: 80,
              backgroundColor: '#1E293B',
              borderRadius: 8,
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: receiptUri }}
              style={{ width: 80, height: 80 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={pickReceipt}
            disabled={uploadingReceipt}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#334155',
              borderStyle: 'dashed',
            }}
          >
            {uploadingReceipt ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <Text style={{ color: '#3B82F6', textAlign: 'center' }}>Add Receipt</Text>
            )}
          </TouchableOpacity>
        )}

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
