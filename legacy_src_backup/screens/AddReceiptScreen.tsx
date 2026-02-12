import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { analyzeReceipt } from '../services/aiService';
import { ExpenseCategory } from '../types';

const CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: 'office_supplies', label: 'Office Supplies', icon: 'pencil' },
  { value: 'equipment', label: 'Equipment', icon: 'desktop' },
  { value: 'travel', label: 'Travel', icon: 'airplane' },
  { value: 'meals', label: 'Meals', icon: 'restaurant' },
  { value: 'utilities', label: 'Utilities', icon: 'flash' },
  { value: 'software', label: 'Software', icon: 'code' },
  { value: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { value: 'professional_services', label: 'Services', icon: 'briefcase' },
  { value: 'shipping', label: 'Shipping', icon: 'cube' },
  { value: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function AddReceiptScreen({ navigation }: any) {
  const { user } = useAuth();
  const { checkReceiptLimit, incrementReceiptCount } = useFeatureGate();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check limit on mount - redirect if already at limit
  useEffect(() => {
    const verifyLimit = async () => {
      const allowed = await checkReceiptLimit();
      if (!allowed) {
        navigation.replace('Paywall', { source: 'receipt_limit' });
      }
    };
    verifyLimit();
  }, []);
  
  // Form fields
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('other');
  const [description, setDescription] = useState('');
  const [taxDeductible, setTaxDeductible] = useState(true);
  const [deductionReason, setDeductionReason] = useState('');
  const [aiConfidence, setAiConfidence] = useState(0);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to scan receipts.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleImageSelected(result.assets[0].uri);
    }
  };

  const handleImageSelected = async (uri: string) => {
    setImage(uri);
    setAnalyzing(true);

    // Simulate OCR delay
    setTimeout(() => {
      // In production, send image to OCR API
      // For now, simulate with random vendor detection
      const mockText = "STAPLES $47.50 01/15/2024 printer ink office supplies";
      const analysis = analyzeReceipt(mockText);
      
      if (analysis.vendor) setVendor(analysis.vendor);
      if (analysis.amount) setAmount(analysis.amount.toFixed(2));
      setCategory(analysis.suggestedCategory);
      setTaxDeductible(analysis.taxDeductible);
      if (analysis.deductionReason) setDeductionReason(analysis.deductionReason);
      setAiConfidence(analysis.confidence);
      
      setAnalyzing(false);
    }, 1500);
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!amount) {
      Alert.alert('Required', 'Please enter an amount.');
      return;
    }

    // Double-check limit before saving (in case user sat on screen)
    const allowed = await checkReceiptLimit();
    if (!allowed) {
      navigation.navigate('Paywall', { source: 'receipt_limit' });
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'receipts'), {
        userId: user.id,
        imageUrl: image,
        vendor: vendor || 'Unknown',
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(),
        taxDeductible,
        ocrProcessed: true,
        createdAt: new Date(),
      });

      // Increment the receipt count for free tier tracking
      await incrementReceiptCount();

      Alert.alert(
        'Receipt Saved! ✅',
        taxDeductible 
          ? `$${amount} added to your deductions.`
          : 'Receipt saved for your records.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Receipt</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving || !amount}
        >
          <Text style={[styles.saveButton, (!amount || saving) && styles.saveButtonDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Capture */}
        {!image ? (
          <View style={styles.captureSection}>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.captureGradient}
              >
                <Ionicons name="camera" size={48} color="#FFF" />
                <Text style={styles.captureText}>Take Photo</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={22} color="#3B82F6" />
              <Text style={styles.galleryText}>Choose from gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => setImage('manual')}
            >
              <Ionicons name="create-outline" size={22} color="#64748B" />
              <Text style={styles.manualText}>Enter manually</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Image Preview */}
            {image !== 'manual' && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.retakeButton}
                  onPress={() => setImage(null)}
                >
                  <Ionicons name="camera-reverse" size={20} color="#FFF" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* AI Analysis Status */}
            {analyzing ? (
              <View style={styles.analyzingCard}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.analyzingText}>
                  🤖 Analyzing receipt...
                </Text>
              </View>
            ) : aiConfidence > 0 && (
              <View style={styles.aiCard}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                <Text style={styles.aiText}>
                  AI detected • {Math.round(aiConfidence * 100)}% confident
                </Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.form}>
              {/* Vendor */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Vendor</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Staples, Amazon"
                  placeholderTextColor="#94A3B8"
                  value={vendor}
                  onChangeText={setVendor}
                />
              </View>

              {/* Amount */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Amount *</Text>
                <View style={styles.amountInput}>
                  <Text style={styles.dollarSign}>$</Text>
                  <TextInput
                    style={styles.amountField}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              {/* Category */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryChip,
                        category === cat.value && styles.categoryChipActive
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Ionicons 
                        name={cat.icon as any} 
                        size={16} 
                        color={category === cat.value ? '#FFF' : '#64748B'} 
                      />
                      <Text style={[
                        styles.categoryChipText,
                        category === cat.value && styles.categoryChipTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="What was this for?"
                  placeholderTextColor="#94A3B8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Tax Deductible Toggle */}
              <TouchableOpacity 
                style={styles.deductibleToggle}
                onPress={() => setTaxDeductible(!taxDeductible)}
              >
                <View style={styles.deductibleLeft}>
                  <Ionicons 
                    name={taxDeductible ? 'checkbox' : 'square-outline'} 
                    size={24} 
                    color={taxDeductible ? '#10B981' : '#94A3B8'} 
                  />
                  <View style={styles.deductibleText}>
                    <Text style={styles.deductibleLabel}>Tax Deductible</Text>
                    {deductionReason && taxDeductible && (
                      <Text style={styles.deductibleReason}>{deductionReason}</Text>
                    )}
                  </View>
                </View>
                {taxDeductible && (
                  <View style={styles.deductibleBadge}>
                    <Text style={styles.deductibleBadgeText}>💰 Saves $</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
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
  saveButton: { fontSize: 17, fontWeight: '600', color: '#10B981' },
  saveButtonDisabled: { color: '#94A3B8' },
  content: { flex: 1 },
  captureSection: { padding: 20, alignItems: 'center' },
  captureButton: { 
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  captureGradient: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  captureText: { fontSize: 18, fontWeight: '600', color: '#FFF', marginTop: 12 },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 12,
  },
  galleryText: { fontSize: 16, color: '#3B82F6', fontWeight: '500' },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  manualText: { fontSize: 15, color: '#64748B' },
  imagePreview: { position: 'relative', marginHorizontal: 20, marginTop: 20 },
  previewImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retakeText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  analyzingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  analyzingText: { fontSize: 14, color: '#3B82F6' },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  aiText: { fontSize: 13, color: '#7C3AED' },
  form: { padding: 20 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  dollarSign: { fontSize: 22, fontWeight: '600', color: '#64748B' },
  amountField: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 8,
    fontSize: 22,
    fontWeight: '600',
    color: '#1E293B',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  categoryScroll: { marginHorizontal: -4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
    gap: 6,
  },
  categoryChipActive: { backgroundColor: '#3B82F6' },
  categoryChipText: { fontSize: 14, color: '#64748B' },
  categoryChipTextActive: { color: '#FFF' },
  deductibleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
  },
  deductibleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deductibleText: {},
  deductibleLabel: { fontSize: 16, fontWeight: '500', color: '#1E293B' },
  deductibleReason: { fontSize: 13, color: '#64748B', marginTop: 2 },
  deductibleBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deductibleBadgeText: { fontSize: 12, color: '#059669', fontWeight: '500' },
});
