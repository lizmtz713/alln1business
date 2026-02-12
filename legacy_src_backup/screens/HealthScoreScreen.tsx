import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFeatureGate } from '../hooks/useFeatureGate';
import { 
  calculateBusinessHealth, 
  forecastCashFlow,
  suggestMoneyMoves,
  BusinessHealthScore,
  CashFlowForecast,
  MoneyMove
} from '../services/cfoService';

const { width } = Dimensions.get('window');

export function HealthScoreScreen({ navigation }: any) {
  const { canUseAICFO, canUseTaxInsights } = useFeatureGate();
  const [health, setHealth] = useState<BusinessHealthScore | null>(null);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [moneyMoves, setMoneyMoves] = useState<MoneyMove[]>([]);

  useEffect(() => {
    // In production, fetch real data
    // For now, simulate with sample data
    const sampleHealth = calculateBusinessHealth(
      8500,   // monthly revenue
      5200,   // monthly expenses
      24000,  // cash on hand
      47,     // receipts
      8,      // documents
      85000,  // previous year revenue
      3200,   // taxes paid this year
      12000   // estimated tax liability
    );
    setHealth(sampleHealth);

    const sampleForecast = forecastCashFlow(
      24000,  // current cash
      8500,   // avg monthly revenue
      5200,   // avg monthly expenses
      [],     // upcoming bills
      6       // months to forecast
    );
    setForecast(sampleForecast);

    const moves = suggestMoneyMoves(
      102000, // annual revenue
      62400,  // annual expenses
      false,  // no retirement account
      true,   // has health insurance
      false,  // no home office deduction
      false   // no vehicle deduction
    );
    setMoneyMoves(moves);
  }, []);

  if (!health) return null;

  const gradeColors: Record<string, [string, string]> = {
    'A+': ['#059669', '#10B981'],
    'A': ['#059669', '#10B981'],
    'A-': ['#059669', '#10B981'],
    'B+': ['#0D9488', '#14B8A6'],
    'B': ['#0D9488', '#14B8A6'],
    'B-': ['#0D9488', '#14B8A6'],
    'C+': ['#D97706', '#F59E0B'],
    'C': ['#D97706', '#F59E0B'],
    'C-': ['#D97706', '#F59E0B'],
    'D': ['#DC2626', '#EF4444'],
    'F': ['#DC2626', '#EF4444'],
  };

  const riskColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
    critical: '#DC2626',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Business Health</Text>
          <TouchableOpacity>
            <Ionicons name="share-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>

        {/* Main Score Card */}
        <LinearGradient
          colors={gradeColors[health.grade]}
          style={styles.scoreCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.scoreMain}>
            <Text style={styles.scoreGrade}>{health.grade}</Text>
            <View style={styles.scoreDetails}>
              <Text style={styles.scoreNumber}>{health.overall}</Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </View>
          <Text style={styles.scoreSubtitle}>
            {health.overall >= 80 ? "You're crushing it! 🔥" :
             health.overall >= 60 ? "Good foundation, room to grow 📈" :
             health.overall >= 40 ? "Let's work on this together 💪" :
             "Time for a financial checkup 🩺"}
          </Text>
          
          {/* Risk Badge */}
          <View style={[styles.riskBadge, { backgroundColor: riskColors[health.riskLevel] }]}>
            <Ionicons 
              name={health.riskLevel === 'low' ? 'shield-checkmark' : 'warning'} 
              size={16} 
              color="#FFF" 
            />
            <Text style={styles.riskText}>
              {health.riskLevel.charAt(0).toUpperCase() + health.riskLevel.slice(1)} Risk
            </Text>
          </View>
        </LinearGradient>

        {/* Component Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          
          <ComponentScore 
            icon="trending-up"
            label="Profitability"
            score={health.components.profitability.score}
            maxScore={25}
            detail={health.components.profitability.details}
            color="#10B981"
          />
          
          <ComponentScore 
            icon="wallet"
            label="Cash Flow"
            score={health.components.cashFlow.score}
            maxScore={25}
            detail={health.components.cashFlow.details}
            color="#3B82F6"
          />
          
          <ComponentScore 
            icon="receipt"
            label="Tax Readiness"
            score={health.components.taxReadiness.score}
            maxScore={20}
            detail={health.components.taxReadiness.details}
            color="#8B5CF6"
          />
          
          <ComponentScore 
            icon="folder"
            label="Organization"
            score={health.components.organization.score}
            maxScore={15}
            detail={health.components.organization.details}
            color="#F59E0B"
          />
          
          <ComponentScore 
            icon="rocket"
            label="Growth"
            score={health.components.growth.score}
            maxScore={15}
            detail={health.components.growth.details}
            color="#EC4899"
          />
        </View>

        {/* Pro Feature Gate - Show upgrade prompt for free users */}
        {!canUseAICFO && (
          <TouchableOpacity 
            style={styles.upgradeCard}
            onPress={() => navigation.navigate('Paywall', { source: 'feature_gate' })}
          >
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.upgradeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.upgradeContent}>
                <View style={styles.upgradeBadge}>
                  <Ionicons name="lock-closed" size={16} color="#FFF" />
                  <Text style={styles.upgradeBadgeText}>PRO</Text>
                </View>
                <Text style={styles.upgradeTitle}>Unlock Full AI CFO Insights</Text>
                <Text style={styles.upgradeText}>
                  Get cash flow forecasts, smart money moves, detailed risk analysis, and personalized tax savings tips.
                </Text>
                <View style={styles.upgradeButton}>
                  <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                  <Ionicons name="arrow-forward" size={18} color="#3B82F6" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Cash Flow Forecast - Pro only */}
        {forecast && canUseAICFO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cash Flow Forecast</Text>
            <View style={styles.forecastCard}>
              <View style={styles.forecastChart}>
                {forecast.projections.map((proj, i) => (
                  <View key={i} style={styles.forecastBar}>
                    <View 
                      style={[
                        styles.forecastBarFill,
                        { 
                          height: `${Math.max(10, (proj.amount / forecast.current) * 50)}%`,
                          backgroundColor: proj.status === 'safe' ? '#10B981' 
                            : proj.status === 'warning' ? '#F59E0B' 
                            : '#EF4444'
                        }
                      ]} 
                    />
                    <Text style={styles.forecastMonth}>{proj.month}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.forecastInfo}>
                <Text style={styles.forecastRecommendation}>
                  {forecast.recommendation}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Risk Factors - Pro only */}
        {health.riskFactors.length > 0 && canUseAICFO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Risk Factors</Text>
            {health.riskFactors.map((risk, i) => (
              <View key={i} style={styles.riskItem}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.riskItemText}>{risk}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Opportunities - Pro only */}
        {health.opportunities.length > 0 && canUseTaxInsights && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Opportunities</Text>
            {health.opportunities.map((opp, i) => (
              <View key={i} style={styles.opportunityItem}>
                <Ionicons name="bulb" size={20} color="#F59E0B" />
                <Text style={styles.opportunityText}>{opp}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Money Moves - Pro only */}
        {moneyMoves.length > 0 && canUseAICFO && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Smart Money Moves</Text>
            {moneyMoves.slice(0, 3).map((move) => (
              <TouchableOpacity key={move.id} style={styles.moveCard}>
                <View style={styles.moveHeader}>
                  <Text style={styles.moveTitle}>{move.title}</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>
                      Save ${move.potentialSavings.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.moveDescription}>{move.description}</Text>
                <View style={styles.moveMeta}>
                  <View style={styles.moveTag}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.moveTagText}>{move.timeRequired}</Text>
                  </View>
                  <View style={[
                    styles.moveTag,
                    { backgroundColor: move.difficulty === 'easy' ? '#D1FAE5' 
                      : move.difficulty === 'medium' ? '#FEF3C7' 
                      : '#FEE2E2' }
                  ]}>
                    <Text style={[
                      styles.moveTagText,
                      { color: move.difficulty === 'easy' ? '#059669' 
                        : move.difficulty === 'medium' ? '#D97706' 
                        : '#DC2626' }
                    ]}>
                      {move.difficulty.charAt(0).toUpperCase() + move.difficulty.slice(1)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA */}
        <TouchableOpacity style={styles.ctaCard}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="chatbubbles" size={28} color="#FFF" />
            <View style={styles.ctaText}>
              <Text style={styles.ctaTitle}>Questions about your score?</Text>
              <Text style={styles.ctaSubtitle}>Ask your AI CFO anything</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ComponentScore({ 
  icon, label, score, maxScore, detail, color 
}: { 
  icon: string; 
  label: string; 
  score: number; 
  maxScore: number;
  detail: string;
  color: string;
}) {
  const percentage = (score / maxScore) * 100;
  
  return (
    <View style={styles.componentCard}>
      <View style={styles.componentHeader}>
        <View style={[styles.componentIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.componentInfo}>
          <Text style={styles.componentLabel}>{label}</Text>
          <Text style={styles.componentDetail}>{detail}</Text>
        </View>
        <Text style={styles.componentScore}>{score}/{maxScore}</Text>
      </View>
      <View style={styles.componentBar}>
        <View 
          style={[
            styles.componentBarFill, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
    </View>
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
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  scoreCard: {
    margin: 20,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  scoreMain: { flexDirection: 'row', alignItems: 'flex-end' },
  scoreGrade: { fontSize: 72, fontWeight: '800', color: '#FFF' },
  scoreDetails: { marginLeft: 12, marginBottom: 12 },
  scoreNumber: { fontSize: 32, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  scoreLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)' },
  scoreSubtitle: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    marginTop: 8,
    textAlign: 'center'
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  riskText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginBottom: 14 },
  componentCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  componentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  componentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  componentInfo: { flex: 1, marginLeft: 12 },
  componentLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  componentDetail: { fontSize: 13, color: '#64748B', marginTop: 2 },
  componentScore: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  componentBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
  },
  componentBarFill: {
    height: 6,
    borderRadius: 3,
  },
  forecastCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  forecastChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: 16,
  },
  forecastBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  forecastBarFill: {
    width: 24,
    borderRadius: 4,
    minHeight: 10,
  },
  forecastMonth: { fontSize: 12, color: '#64748B', marginTop: 8 },
  forecastInfo: {},
  forecastRecommendation: { fontSize: 14, color: '#374151', lineHeight: 20 },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  riskItemText: { flex: 1, fontSize: 14, color: '#991B1B', lineHeight: 20 },
  opportunityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    gap: 12,
  },
  opportunityText: { flex: 1, fontSize: 14, color: '#92400E', lineHeight: 20 },
  moveCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  moveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moveTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  savingsBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  moveDescription: { fontSize: 14, color: '#64748B', lineHeight: 20 },
  moveMeta: { flexDirection: 'row', marginTop: 12, gap: 8 },
  moveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  moveTagText: { fontSize: 12, color: '#64748B' },
  ctaCard: { marginHorizontal: 20, borderRadius: 16, overflow: 'hidden' },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  ctaText: { flex: 1 },
  ctaTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  ctaSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  upgradeCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  upgradeGradient: {
    padding: 24,
  },
  upgradeContent: {
    alignItems: 'center',
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  upgradeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  upgradeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
