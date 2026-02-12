import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Animated, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { parseNaturalLanguageExpense } from '../services/aiService';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ExpenseCategory } from '../types';

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  office_supplies: 'Office Supplies',
  equipment: 'Equipment',
  travel: 'Travel',
  meals: 'Meals',
  utilities: 'Utilities',
  rent: 'Rent',
  marketing: 'Marketing',
  professional_services: 'Professional Services',
  insurance: 'Insurance',
  taxes: 'Taxes',
  inventory: 'Inventory',
  shipping: 'Shipping',
  software: 'Software',
  other: 'Other',
};

const EXAMPLES = [
  "$47 at Staples on printer ink",
  "Uber to client meeting $23",
  "$150 Adobe subscription",
  "Lunch with client at Chipotle $32",
  "$89 Zoom annual plan",
];

export function QuickAddScreen({ navigation }: any) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseNaturalLanguageExpense> | null>(null);
  const [saving, setSaving] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the microphone
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleInputChange = (text: string) => {
    setInput(text);
    if (text.length > 5) {
      const result = parseNaturalLanguageExpense(text);
      setParsed(result);
    } else {
      setParsed(null);
    }
  };

  const handleSave = async () => {
    if (!parsed || !parsed.amount || !user) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'receipts'), {
        userId: user.id,
        vendor: parsed.vendor || 'Unknown',
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description || input,
        date: parsed.date,
        taxDeductible: true, // Default to true for business expenses
        ocrProcessed: false,
        createdAt: new Date(),
      });

      Alert.alert(
        'Expense Added! ✅',
        `$${parsed.amount.toFixed(2)} ${parsed.vendor ? `at ${parsed.vendor}` : ''} saved to ${CATEGORY_LABELS[parsed.category]}.`,
        [
          { text: 'Add Another', onPress: () => { setInput(''); setParsed(null); } },
          { text: 'Done', onPress: () => navigation.goBack() },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save expense. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleExample = (example: string) => {
    setInput(example);
    const result = parseNaturalLanguageExpense(example);
    setParsed(result);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quick Add</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.content}>
          {/* Voice Input Placeholder */}
          <TouchableOpacity style={styles.voiceButton}>
            <Animated.View style={[styles.voiceCircle, { transform: [{ scale: pulseAnim }] }]}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.voiceGradient}
              >
                <Ionicons name="mic" size={32} color="#FFF" />
              </LinearGradient>
            </Animated.View>
            <Text style={styles.voiceHint}>Tap to speak (coming soon)</Text>
          </TouchableOpacity>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="create-outline" size={22} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="Type your expense..."
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={handleInputChange}
              autoFocus
              multiline
            />
          </View>

          {/* Examples */}
          {!input && (
            <View style={styles.examples}>
              <Text style={styles.examplesTitle}>Try saying:</Text>
              {EXAMPLES.map((example, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.exampleChip}
                  onPress={() => handleExample(example)}
                >
                  <Text style={styles.exampleText}>"{example}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Parsed Preview */}
          {parsed && parsed.amount && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>I understood:</Text>
              
              <View style={styles.previewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Amount</Text>
                  <Text style={styles.previewValue}>${parsed.amount.toFixed(2)}</Text>
                </View>
                
                {parsed.vendor && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Vendor</Text>
                    <Text style={styles.previewValue}>{parsed.vendor}</Text>
                  </View>
                )}
                
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Category</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {CATEGORY_LABELS[parsed.category]}
                    </Text>
                  </View>
                </View>

                {parsed.description && (
                  <View style={styles.previewRow}>
                    <Text style={styles.previewLabel}>Description</Text>
                    <Text style={styles.previewValue}>{parsed.description}</Text>
                  </View>
                )}

                <View style={styles.deductibleRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={styles.deductibleText}>Tax deductible</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <LinearGradient
                  colors={saving ? ['#94A3B8', '#94A3B8'] : ['#10B981', '#059669']}
                  style={styles.saveGradient}
                >
                  <Ionicons name="checkmark" size={22} color="#FFF" />
                  <Text style={styles.saveText}>
                    {saving ? 'Saving...' : 'Save Expense'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editText}>Edit details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  content: { flex: 1, padding: 20 },
  voiceButton: { alignItems: 'center', marginBottom: 32 },
  voiceCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  voiceGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceHint: { fontSize: 13, color: '#64748B', marginTop: 12 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#1E293B',
    marginLeft: 12,
    minHeight: 48,
  },
  examples: { marginBottom: 24 },
  examplesTitle: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  exampleChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  exampleText: { fontSize: 15, color: '#6366F1', fontStyle: 'italic' },
  preview: {},
  previewTitle: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  previewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  previewLabel: { fontSize: 14, color: '#64748B' },
  previewValue: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  deductibleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  deductibleText: { fontSize: 14, color: '#10B981', fontWeight: '500' },
  saveButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  saveButtonDisabled: { opacity: 0.7 },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  editButton: { alignItems: 'center', padding: 12 },
  editText: { fontSize: 15, color: '#3B82F6' },
});
