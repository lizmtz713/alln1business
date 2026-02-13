import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePredictedInsights } from '../hooks/usePredictedInsights';
import { hapticLight } from '../lib/haptics';
import { MIN_TOUCH_TARGET } from '../lib/constants';
import { requestNotificationPermissions, scheduleInsightNotification } from '../services/notificationSchedule';
import type { PredictionInsight } from '../services/predictionInsights';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  spending: 'wallet',
  growth: 'resize',
  maintenance: 'car',
  health: 'medkit',
};

const PRIORITY_COLORS: Record<number, string> = {
  1: '#F59E0B',
  2: '#3B82F6',
  3: '#64748B',
};

export function PredictiveInsights() {
  const router = useRouter();
  const { data: insights = [], isLoading, isError, refetch } = usePredictedInsights();

  useEffect(() => {
    if (insights.length === 0) return;
    const urgent = insights.find((i) => i.priority === 1);
    if (urgent) {
      requestNotificationPermissions()
        .then((ok) => { if (ok) return scheduleInsightNotification(urgent.title, urgent.body); })
        .catch(() => {});
    }
  }, [insights]);

  if (isLoading) {
    return (
      <View className="rounded-xl bg-slate-800 p-6">
        <View className="flex-row items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="ml-3 text-slate-400 text-sm">Loading predictions...</Text>
        </View>
      </View>
    );
  }

  if (isError || insights.length === 0) {
    return null;
  }

  return (
    <View className="mt-4">
      <Text className="mb-3 text-lg font-semibold text-white">AI Predictions & Alerts</Text>
      <View className="rounded-xl bg-slate-800 overflow-hidden">
        {insights.slice(0, 5).map((insight) => {
          const icon = CATEGORY_ICONS[insight.category] ?? 'bulb-outline';
          const color = PRIORITY_COLORS[insight.priority] ?? '#94A3B8';
          return (
            <TouchableOpacity
              key={insight.id}
              onPress={() => {
                hapticLight();
                if (insight.ctaRoute) router.push(insight.ctaRoute as never);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#334155',
                minHeight: MIN_TOUCH_TARGET,
              }}
              disabled={!insight.ctaRoute}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name={icon} size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 15 }}>{insight.title}</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2, lineHeight: 18 }}>{insight.body}</Text>
              </View>
              {insight.ctaRoute && <Ionicons name="chevron-forward" size={20} color="#64748B" />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
