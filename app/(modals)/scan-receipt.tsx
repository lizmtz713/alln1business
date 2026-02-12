import { useState } from 'react';
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
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useCreateTransaction } from '../../src/hooks/useTransactions';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { uploadReceipt } from '../../src/services/storage';
import { processReceiptImage, hasOpenAIKey } from '../../src/services/openai';
import { supabase } from '../../src/services/supabase';
import { applyCategoryRules } from '../../src/services/rules';
import { buildSuggestedRuleFromEdit } from '../../src/services/rules';
import { useActiveCategoryRules, useCreateCategoryRule } from '../../src/hooks/useCategoryRules';
import { LearnCategoryPrompt } from '../../src/components/LearnCategoryPrompt';
import { EXPENSE_CATEGORIES, getCategoryName } from '../../src/lib/categories';
import { format } from 'date-fns';

type Step = 'pick' | 'processing' | 'review';

function inferMimeType(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export default function ScanReceiptScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createTx = useCreateTransaction();

  const [step, setStep] = useState<Step>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [taxDeductible, setTaxDeductible] = useState(true);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [showLearnPrompt, setShowLearnPrompt] = useState(false);
  const [categoryFromRule, setCategoryFromRule] = useState(false);

  const { data: rules = [] } = useActiveCategoryRules();
  const createRule = useCreateCategoryRule();

  const canSave =
    hasSupabaseEnv &&
    user &&
    receiptUrl &&
    amount &&
    parseFloat(amount) > 0;

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera roll access is needed to select receipts.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });
    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
    setUploadError(null);
    setProcessingError(null);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Camera access is needed to photograph receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });
    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
    setUploadError(null);
    setProcessingError(null);
  };

  const continueToProcess = () => {
    if (!imageUri || !user) return;
    setStep('processing');
    setUploadError(null);
    setProcessingError(null);

    (async () => {
      if (!hasSupabaseEnv) {
        setStep('review');
        setProcessingError('Connect Supabase to upload and process receipts.');
        return;
      }

      const url = await uploadReceipt(user.id, imageUri);
      if (!url) {
        setUploadError('Upload failed. Check that the receipts bucket exists and policies are set.');
        setStep('pick');
        return;
      }
      setReceiptUrl(url);

      if (hasOpenAIKey) {
        try {
          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: 'base64',
          });
          const mime = inferMimeType(imageUri);
          const parsed = await processReceiptImage({ imageBase64: base64, mimeType: mime });
          const vendorVal = parsed.vendor ?? '';
          const notesVal = parsed.notes ?? '';
          setVendor(vendorVal);
          setDate(parsed.date ?? format(new Date(), 'yyyy-MM-dd'));
          setAmount(parsed.amount != null ? String(parsed.amount) : '');
          setNotes(notesVal);
          setItems(parsed.items ?? []);
          setAiConfidence(0.9);
          const ruleMatch = rules.length > 0
            ? applyCategoryRules(
                { vendor: vendorVal || null, description: notesVal || null, type: 'expense' },
                rules
              )
            : { category: null };
          setCategory(ruleMatch.category ?? parsed.category ?? 'other');
          setCategoryFromRule(Boolean(ruleMatch.category));
        } catch {
          setProcessingError('AI processing failed. You can still fill in the fields manually.');
        }
      } else {
        setDate(format(new Date(), 'yyyy-MM-dd'));
      }
      setStep('review');
    })();
  };

  const handleSave = async () => {
    if (!canSave) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;

    try {
      const tx = await createTx.mutateAsync({
        date,
        amount: -Math.abs(amt),
        type: 'expense',
        vendor: vendor || null,
        category: category || null,
        description: notes || null,
        receipt_url: receiptUrl,
        tax_deductible: taxDeductible,
        ai_categorized: hasOpenAIKey && items.length > 0,
        ai_confidence: aiConfidence,
      });

      if (hasSupabaseEnv && receiptUrl) {
        try {
          await supabase.from('receipts').insert({
            user_id: user!.id,
            image_url: receiptUrl,
            vendor: vendor || null,
            amount: amt,
            date: date || null,
            category: category || null,
            ocr_text: items.length > 0 ? items.join('\n') : null,
            transaction_id: tx.id,
          });
        } catch {
          // Receipts table may not exist; skip gracefully
        }
      }

      router.replace(`/(modals)/transaction/${tx.id}` as never);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  };

  const retryPick = () => {
    setImageUri(null);
    setStep('pick');
    setUploadError(null);
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8', fontSize: 16 }}>
          Connect Supabase to scan and save receipts.
        </Text>
      </View>
    );
  }

  if (step === 'pick') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
          </TouchableOpacity>

          <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
            Scan Receipt
          </Text>
          <Text style={{ color: '#94A3B8', marginBottom: 24 }}>
            Take a photo or choose from your library. AI will extract the details.
          </Text>

          {uploadError && (
            <View
              style={{
                backgroundColor: '#7F1D1D',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#FCA5A5' }}>{uploadError}</Text>
              <TouchableOpacity onPress={retryPick} style={{ marginTop: 8 }}>
                <Text style={{ color: '#3B82F6' }}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={takePhoto}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 20,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Text style={{ color: '#F8FAFC', fontSize: 18, textAlign: 'center' }}>📷 Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pickFromLibrary}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Text style={{ color: '#F8FAFC', fontSize: 18, textAlign: 'center' }}>
              🖼 Choose From Library
            </Text>
          </TouchableOpacity>

          {imageUri && (
            <>
              <View
                style={{
                  width: 120,
                  height: 120,
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 16,
                }}
              >
                <Image source={{ uri: imageUri }} style={{ width: 120, height: 120 }} resizeMode="cover" />
              </View>
              <TouchableOpacity
                onPress={continueToProcess}
                style={{
                  backgroundColor: '#3B82F6',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  if (step === 'processing') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 48, left: 24 }}
        >
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#F8FAFC', marginTop: 16, fontSize: 16 }}>
          Uploading and processing receipt…
        </Text>
        <Text style={{ color: '#94A3B8', marginTop: 8, textAlign: 'center' }}>
          {hasOpenAIKey ? 'AI is extracting vendor, date, and amount.' : 'Saving your receipt.'}
        </Text>
      </View>
    );
  }

  // Step: Review & Save
  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity
          onPress={() => setStep('pick')}
          style={{ marginBottom: 24 }}
        >
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Change photo</Text>
        </TouchableOpacity>

        {processingError && (
          <View
            style={{
              backgroundColor: '#78350F',
              borderRadius: 12,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#FDE68A' }}>{processingError}</Text>
          </View>
        )}

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Review & Save
        </Text>

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
            {aiConfidence != null && !categoryFromRule && (
              <View style={{ backgroundColor: '#3B82F633', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: '#3B82F6', fontSize: 10 }}>AI</Text>
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
                  if (oldCat !== c.id && (vendor.trim() || notes.trim())) {
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

        {showLearnPrompt && (vendor.trim() || notes.trim()) && (
          <LearnCategoryPrompt
            onYes={async () => {
              const rule = buildSuggestedRuleFromEdit({
                newCategory: category,
                vendor: vendor || null,
                description: notes || null,
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

        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Notes (optional)</Text>
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
          value={notes}
          onChangeText={setNotes}
          placeholder="Notes"
          placeholderTextColor="#64748B"
          multiline
        />

        {items.length > 0 && (
          <>
            <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Extracted items</Text>
            <View
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              {items.map((item, i) => (
                <Text key={i} style={{ color: '#94A3B8', fontSize: 14, marginBottom: 4 }}>
                  • {item}
                </Text>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          onPress={() => setTaxDeductible(!taxDeductible)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              backgroundColor: taxDeductible ? '#3B82F6' : '#334155',
              marginRight: 12,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {taxDeductible && <Text style={{ color: '#fff', fontSize: 14 }}>✓</Text>}
          </View>
          <Text style={{ color: '#F8FAFC' }}>Tax deductible</Text>
        </TouchableOpacity>

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
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>Save as Expense</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
