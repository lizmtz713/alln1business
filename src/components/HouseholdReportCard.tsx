import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useHouseholdReport } from '../hooks/useHouseholdReport';

/**
 * Renders the AI-powered monthly household report (spending, family, vehicles, pets, upcoming).
 * Each line starting with an emoji or "Your" is treated as a section.
 */
export function HouseholdReportCard() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useHouseholdReport();

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly household report</Text>
        </View>
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingText}>Generating your report…</Text>
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>Monthly household report</Text>
        </View>
        <Text style={styles.errorText}>Could not load report.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lines = data.text.split('\n').filter((l) => l.trim());

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Monthly household report</Text>
        <TouchableOpacity onPress={() => refetch()} hitSlop={12}>
          <Ionicons name="refresh" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        {lines.map((line, i) => {
          const trimmed = line.trim();
          const isSection = /^[📊👨‍👩‍👧‍👦🚗🐕📅]|^Your\s+\w+\s+Household/.test(trimmed);
          return (
            <Text
              key={i}
              style={[styles.line, isSection && styles.sectionLine]}
              numberOfLines={isSection ? undefined : 3}
            >
              {trimmed}
            </Text>
          );
        })}
      </View>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push('/(modals)/household-report' as never)}
      >
        <Text style={styles.ctaText}>View full report</Text>
        <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 14,
  },
  body: {
    marginBottom: 16,
  },
  line: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
  sectionLine: {
    color: '#F8FAFC',
    fontWeight: '600',
    marginTop: 4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  ctaText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
});
