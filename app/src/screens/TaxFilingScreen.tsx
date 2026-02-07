import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Alert, Share
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { generateTaxSummary } from '../services/openaiService';
import { calculateTaxReadiness } from '../services/aiService';

interface TaxData {
  totalRevenue: number;
  totalExpenses: number;
  totalDeductions: number;
  estimatedTax: number;
  receiptsCount: number;
  categorizedCount: number;
  readinessScore: number;
  byCategory: Record<string, number>;
}

export function TaxFilingScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [taxData, setTaxData] = useState<TaxData | null>(null);
  const [taxSummary, setTaxSummary] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchTaxData();
  }, [user]);

  const fetchTaxData = async () => {
    if (!user) return;
    
    try {
      // Fetch receipts
      const receiptsQuery = query(
        collection(db, 'receipts'),
        where('userId', '==', user.id)
      );
      const receiptsSnap = await getDocs(receiptsQuery);
      const receipts = receiptsSnap.docs.map(d => d.data());
      
      // Fetch documents
      const docsQuery = query(
        collection(db, 'documents'),
        where('userId', '==', user.id)
      );
      const docsSnap = await getDocs(docsQuery);
      const documents = docsSnap.docs.map(d => d.data());
      
      // Calculate totals
      const totalExpenses = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
      const deductible = receipts.filter(r => r.taxDeductible);
      const totalDeductions = deductible.reduce((sum, r) => sum + (r.amount || 0), 0);
      const categorized = receipts.filter(r => r.category && r.category !== 'other');
      
      // Group by category
      const byCategory = receipts.reduce((acc, r) => {
        const cat = r.category || 'other';
        acc[cat] = (acc[cat] || 0) + (r.amount || 0);
        return acc;
      }, {} as Record<string, number>);
      
      // Estimate tax (simplified - 25% of profit)
      const estimatedRevenue = 100000; // Would come from user input
      const estimatedTax = Math.max(0, (estimatedRevenue - totalDeductions) * 0.25);
      
      // Calculate readiness
      const hasW9 = documents.some(d => d.type === 'w9');
      const hasInsurance = documents.some(d => d.type === 'insurance');
      const readiness = calculateTaxReadiness(
        documents.length,
        receipts.length,
        categorized.length,
        6,
        hasW9,
        hasInsurance,
        totalDeductions
      );
      
      setTaxData({
        totalRevenue: estimatedRevenue,
        totalExpenses,
        totalDeductions,
        estimatedTax,
        receiptsCount: receipts.length,
        categorizedCount: categorized.length,
        readinessScore: readiness.score,
        byCategory,
      });
    } catch (error) {
      console.error('Error fetching tax data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!user || !taxData) return;
    
    setGenerating(true);
    try {
      // Fetch receipts again for summary
      const receiptsQuery = query(
        collection(db, 'receipts'),
        where('userId', '==', user.id)
      );
      const receiptsSnap = await getDocs(receiptsQuery);
      const receipts = receiptsSnap.docs.map(d => d.data());
      
      const billsQuery = query(
        collection(db, 'bills'),
        where('userId', '==', user.id)
      );
      const billsSnap = await getDocs(billsQuery);
      const bills = billsSnap.docs.map(d => d.data());
      
      const summary = await generateTaxSummary(
        receipts,
        bills,
        { businessName: user.businessName, businessType: 'sole_proprietor' }
      );
      
      setTaxSummary(summary);
      setStep(3);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate tax summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const shareSummary = async () => {
    if (!taxSummary) return;
    
    try {
      await Share.share({
        message: taxSummary,
        title: `Tax Summary ${new Date().getFullYear()}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const exportToAccountant = () => {
    Alert.alert(
      'Send to Accountant',
      'This will email your tax summary, receipts, and documents to your accountant.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Enter Email', 
          onPress: () => {
            // In production, show email input modal
            Alert.alert('Coming Soon', 'Email export will be available in the next update!');
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Calculating your taxes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>One-Button Taxes</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Step Indicator */}
        <View style={styles.steps}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepContainer}>
              <View style={[
                styles.stepCircle,
                step >= s && styles.stepCircleActive
              ]}>
                {step > s ? (
                  <Ionicons name="checkmark" size={16} color="#FFF" />
                ) : (
                  <Text style={[styles.stepNumber, step >= s && styles.stepNumberActive]}>
                    {s}
                  </Text>
                )}
              </View>
              <Text style={[styles.stepLabel, step >= s && styles.stepLabelActive]}>
                {s === 1 ? 'Review' : s === 2 ? 'Generate' : 'File'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Review */}
        {step === 1 && taxData && (
          <View style={styles.content}>
            <Text style={styles.sectionTitle}>📊 Your Tax Summary</Text>
            
            {/* Readiness Score */}
            <View style={styles.readinessCard}>
              <View style={styles.readinessCircle}>
                <Text style={styles.readinessScore}>{taxData.readinessScore}%</Text>
              </View>
              <View style={styles.readinessInfo}>
                <Text style={styles.readinessLabel}>Tax Readiness</Text>
                <Text style={styles.readinessHint}>
                  {taxData.readinessScore >= 80 
                    ? "You're ready to file!" 
                    : "Add more receipts to maximize deductions"}
                </Text>
              </View>
            </View>

            {/* Key Numbers */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Total Expenses</Text>
                <Text style={styles.statValue}>
                  ${taxData.totalExpenses.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Deductions</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  ${taxData.totalDeductions.toLocaleString()}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Est. Tax Savings</Text>
                <Text style={[styles.statValue, { color: '#10B981' }]}>
                  ${(taxData.totalDeductions * 0.25).toLocaleString()}
                </Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Receipts</Text>
                <Text style={styles.statValue}>{taxData.receiptsCount}</Text>
              </View>
            </View>

            {/* Category Breakdown */}
            <Text style={styles.sectionTitle}>📁 By Category</Text>
            <View style={styles.categoryList}>
              {Object.entries(taxData.byCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, amount]) => (
                  <View key={cat} style={styles.categoryItem}>
                    <Text style={styles.categoryName}>
                      {cat.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.categoryAmount}>
                      ${amount.toLocaleString()}
                    </Text>
                  </View>
                ))}
            </View>

            {/* Continue Button */}
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setStep(2)}
            >
              <Text style={styles.primaryButtonText}>Looks Good — Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Receipts')}
            >
              <Text style={styles.secondaryButtonText}>Add More Receipts First</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Generate */}
        {step === 2 && (
          <View style={styles.content}>
            <View style={styles.generateCard}>
              <Text style={styles.generateEmoji}>🤖</Text>
              <Text style={styles.generateTitle}>Generate Tax Package</Text>
              <Text style={styles.generateDescription}>
                Our AI will create a professional tax summary document with all your expenses organized by category, ready to share with your accountant or use for filing.
              </Text>
              
              <View style={styles.includesList}>
                <Text style={styles.includesTitle}>Package includes:</Text>
                <IncludeItem text="Executive summary" />
                <IncludeItem text="Expense breakdown by category" />
                <IncludeItem text="Deduction recommendations" />
                <IncludeItem text="All receipts organized" />
                <IncludeItem text="Tax filing checklist" />
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, generating && styles.buttonDisabled]}
                onPress={generateSummary}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.primaryButtonText}>Generating...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#FFF" />
                    <Text style={styles.primaryButtonText}>Generate Tax Package</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: File/Share */}
        {step === 3 && taxSummary && (
          <View style={styles.content}>
            <View style={styles.successCard}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Tax Package Ready!</Text>
              <Text style={styles.successDescription}>
                Your tax summary has been generated. You can share it with your accountant or use it for self-filing.
              </Text>
            </View>

            {/* Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview</Text>
              <ScrollView style={styles.previewScroll} nestedScrollEnabled>
                <Text style={styles.previewText}>{taxSummary}</Text>
              </ScrollView>
            </View>

            {/* Actions */}
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={shareSummary}
            >
              <Ionicons name="share-outline" size={20} color="#FFF" />
              <Text style={styles.primaryButtonText}>Share Summary</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={exportToAccountant}
            >
              <Ionicons name="mail-outline" size={20} color="#3B82F6" />
              <Text style={styles.outlineButtonText}>Email to Accountant</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => {
                // Open IRS Direct Pay or state tax site
                Alert.alert(
                  'File Your Taxes',
                  'Ready to file? You can file directly with the IRS or use your preferred tax software.',
                  [
                    { text: 'IRS Free File', onPress: () => {} },
                    { text: 'TurboTax', onPress: () => {} },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Text style={styles.secondaryButtonText}>Ready to File →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function IncludeItem({ text }: { text: string }) {
  return (
    <View style={styles.includeItem}>
      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
      <Text style={styles.includeText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#64748B', marginTop: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 40,
  },
  stepContainer: { alignItems: 'center' },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: { backgroundColor: '#3B82F6' },
  stepNumber: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  stepNumberActive: { color: '#FFF' },
  stepLabel: { fontSize: 12, color: '#64748B', marginTop: 6 },
  stepLabelActive: { color: '#3B82F6', fontWeight: '600' },
  content: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 16, marginTop: 8 },
  readinessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  readinessCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  readinessScore: { fontSize: 24, fontWeight: '700', color: '#3B82F6' },
  readinessInfo: { flex: 1, marginLeft: 16 },
  readinessLabel: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  readinessHint: { fontSize: 14, color: '#64748B', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: { fontSize: 13, color: '#64748B' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1E293B', marginTop: 4 },
  categoryList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  categoryName: { fontSize: 15, color: '#374151', textTransform: 'capitalize' },
  categoryAmount: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  primaryButtonText: { fontSize: 17, fontWeight: '600', color: '#FFF' },
  secondaryButton: { alignItems: 'center', padding: 12 },
  secondaryButtonText: { fontSize: 15, color: '#3B82F6' },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  outlineButtonText: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
  generateCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },
  generateEmoji: { fontSize: 48, marginBottom: 16 },
  generateTitle: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  generateDescription: { 
    fontSize: 15, 
    color: '#64748B', 
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  includesList: { width: '100%', marginTop: 24, marginBottom: 24 },
  includesTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  includeItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  includeText: { fontSize: 15, color: '#374151' },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  successEmoji: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#065F46' },
  successDescription: { 
    fontSize: 15, 
    color: '#047857', 
    textAlign: 'center',
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    maxHeight: 300,
  },
  previewTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  previewScroll: { maxHeight: 240 },
  previewText: { fontSize: 13, color: '#374151', fontFamily: 'monospace', lineHeight: 20 },
});
