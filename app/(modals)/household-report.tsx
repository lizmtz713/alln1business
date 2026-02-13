import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHouseholdReport } from '../../src/hooks/useHouseholdReport';
import { useMonthlyReport } from '../../src/hooks/useMonthlyReport';
import { Ionicons } from '@expo/vector-icons';

export default function HouseholdReportModal() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useHouseholdReport();
  const {
    report: monthlyReport,
    reportText: monthlyReportText,
    isLoading: monthlyLoading,
    ensureCurrentMonth,
    generateNow,
    refetch: refetchMonthly,
  } = useMonthlyReport();
  const [copySuccess, setCopySuccess] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    ensureCurrentMonth();
  }, [ensureCurrentMonth]);

  const handleShare = async () => {
    const text = monthlyReportText || data?.text || '';
    if (!text.trim()) return;
    try {
      await Share.share({
        message: text,
        title: 'Household Report',
      });
    } catch (_) {}
  };

  const handleCopy = async () => {
    const text = monthlyReportText || data?.text || '';
    if (!text.trim()) return;
    try {
      const Clipboard = await import('expo-clipboard');
      await Clipboard.setStringAsync(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (_) {}
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const ok = await generateNow();
      if (ok) refetchMonthly();
    } finally {
      setGenerating(false);
    }
  };

  const loading = isLoading || monthlyLoading;
  const hasMonthlyReport = Boolean(monthlyReport);

  if (loading && !data) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.loadingText}>Generating your report…</Text>
      </View>
    );
  }

  if (isError && !data) {
    return (
      <View style={styles.screen}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>Could not load report.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const highlights = (monthlyReport?.highlights as string[] | undefined) ?? [];
  const suggestions = (monthlyReport?.suggestions as string[] | undefined) ?? [];

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Monthly report block: AI summary, highlights, suggestions */}
        {hasMonthlyReport ? (
          <View style={styles.monthlyBlock}>
            <Text style={styles.monthlyTitle}>{monthlyReport!.summary_text}</Text>
            {highlights.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>📌 Important upcoming</Text>
                {highlights.map((h, i) => (
                  <Text key={i} style={styles.bullet}>• {h}</Text>
                ))}
              </>
            )}
            {suggestions.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>💡 Suggestions</Text>
                {suggestions.map((s, i) => (
                  <Text key={i} style={styles.suggestion}>• {s}</Text>
                ))}
              </>
            )}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
                <Ionicons name="share-outline" size={18} color="#3B82F6" />
                <Text style={styles.actionBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCopy} style={styles.actionBtn}>
                <Ionicons name="copy-outline" size={18} color="#3B82F6" />
                <Text style={styles.actionBtnText}>{copySuccess ? 'Copied!' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleGenerateReport}
                disabled={generating}
                style={styles.actionBtn}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Ionicons name="refresh-outline" size={18} color="#64748B" />
                )}
                <Text style={[styles.actionBtnText, styles.actionBtnMuted]}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.monthlyBlock}>
            <Text style={styles.sectionLabel}>Monthly report</Text>
            <Text style={styles.mutedText}>
              Get an AI summary, cost trends, and personalized suggestions (e.g. “Consider bundling streaming?”).
            </Text>
            <TouchableOpacity
              onPress={handleGenerateReport}
              disabled={generating}
              style={styles.generateBtn}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <Text style={styles.generateBtnText}>Generate this month’s report</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Full household snapshot */}
        {data?.text && (
          <>
            <Text style={styles.dividerTitle}>Full household snapshot</Text>
            {data.text.split('\n').filter((l) => l.trim()).map((line, i) => {
              const trimmed = line.trim();
              const isSection = /^[📊👨‍👩‍👧‍👦🚗🐕📅]|^Your\s+\w+\s+Household/.test(trimmed);
              return (
                <Text key={i} style={[styles.line, isSection && styles.sectionLine]}>
                  {trimmed}
                </Text>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', padding: 24 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#3B82F6', fontSize: 16 },
  loadingText: { color: '#94A3B8', fontSize: 16 },
  errorText: { color: '#94A3B8', marginBottom: 12 },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  retryBtnText: { color: '#3B82F6', fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  monthlyBlock: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthlyTitle: { color: '#E2E8F0', fontSize: 16, lineHeight: 24, marginBottom: 12 },
  sectionLabel: {
    color: '#F8FAFC',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 15,
  },
  bullet: { color: '#E2E8F0', fontSize: 15, lineHeight: 22, marginBottom: 4 },
  suggestion: { color: '#A5B4FC', fontSize: 15, lineHeight: 22, marginBottom: 4 },
  actionsRow: { flexDirection: 'row', gap: 16, marginTop: 16, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionBtnText: { color: '#3B82F6', fontWeight: '600', fontSize: 14 },
  actionBtnMuted: { color: '#64748B', fontWeight: '500' },
  generateBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  generateBtnText: { color: '#0F172A', fontWeight: '600', fontSize: 15 },
  mutedText: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
  dividerTitle: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 12,
  },
  line: { color: '#E2E8F0', fontSize: 16, lineHeight: 24, marginBottom: 8 },
  sectionLine: { color: '#F8FAFC', fontWeight: '700', marginTop: 12, fontSize: 17 },
});
