import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useDashboardInsights, useDismissInsight } from '../../src/hooks/useInsights';
import { hasSupabaseEnv } from '../../src/services/env';
import type { DashboardInsight } from '../../src/services/insights';

const INSIGHT_ICONS: Record<string, 'trophy' | 'warning' | 'bulb-outline' | 'flash' | 'information-circle'> = {
  win: 'trophy',
  warning: 'warning',
  tip: 'bulb-outline',
  action: 'flash',
  default: 'information-circle',
};

function InsightCard({
  insight,
  onDismiss,
  onCta,
}: {
  insight: DashboardInsight;
  onDismiss: () => void;
  onCta?: () => void;
}) {
  const icon = INSIGHT_ICONS[insight.insight_type] ?? INSIGHT_ICONS.default;
  const colors: Record<string, string> = {
    win: '#10B981',
    warning: '#F59E0B',
    tip: '#3B82F6',
    action: '#8B5CF6',
  };
  const color = colors[insight.insight_type] ?? '#94A3B8';

  return (
    <View className="mb-3 rounded-xl bg-slate-800 p-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-1">
          <View className="mr-3 mt-0.5" style={{ width: 24 }}>
            <Ionicons name={icon} size={22} color={color} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-white">{insight.title}</Text>
            <Text className="mt-1 text-sm text-slate-400">{insight.body}</Text>
            {insight.cta_label && insight.cta_route && (
              <TouchableOpacity
                onPress={onCta}
                className="mt-3 self-start rounded-lg px-3 py-1.5"
                style={{ backgroundColor: color + '33' }}
              >
                <Text style={{ color, fontWeight: '600', fontSize: 13 }}>{insight.cta_label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} className="p-1">
          <Ionicons name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const name = profile?.full_name || profile?.business_name || user?.email?.split('@')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const { data: insights = [], isLoading: insightsLoading } = useDashboardInsights();
  const dismissMutation = useDismissInsight();

  const stats = [
    { label: 'This Month Income', value: '$0', color: 'text-green-500' },
    { label: 'This Month Expenses', value: '$0', color: 'text-red-400' },
    { label: 'Profit', value: '$0', color: 'text-slate-300' },
    { label: 'Pending Invoices', value: '0', color: 'text-amber-400' },
    { label: 'Upcoming Bills', value: '0', color: 'text-blue-400' },
  ];

  const quickActions = [
    { label: 'Add Expense', icon: '−' },
    { label: 'Add Income', icon: '+' },
    { label: 'Scan Receipt', icon: '📷' },
    { label: 'Create Invoice', icon: '📄' },
    { label: 'Upload Statement', icon: '📤' },
    { label: 'Add Bill', icon: '📋' },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-white">
          {greeting}, {name}
        </Text>
        <Text className="mt-1 text-slate-400">{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>

        {hasSupabaseEnv && (
          <View className="mt-6">
            <Text className="mb-3 text-lg font-semibold text-white">AI Insights</Text>
            {insightsLoading ? (
              <View className="rounded-xl bg-slate-800 p-6">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="mt-2 text-center text-sm text-slate-400">Loading insights…</Text>
              </View>
            ) : insights.length > 0 ? (
              insights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onDismiss={() => dismissMutation.mutate(insight.id)}
                  onCta={
                    insight.cta_route
                      ? () => router.push(insight.cta_route as never)
                      : undefined
                  }
                />
              ))
            ) : (
              <View className="rounded-xl bg-slate-800 p-4">
                <Text className="text-sm text-slate-400">No insights for today. Check back later.</Text>
              </View>
            )}
          </View>
        )}

        {!hasSupabaseEnv && (
          <View className="mt-6 rounded-xl bg-slate-800 p-4">
            <Text className="text-sm text-slate-400">Connect Supabase to see daily insights.</Text>
          </View>
        )}

        <View className="mt-6">
          <Text className="mb-3 text-lg font-semibold text-white">Quick Stats</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {stats.map((s, i) => (
              <View
                key={i}
                className="mr-3 w-36 rounded-xl bg-slate-800 p-4"
              >
                <Text className="text-xs text-slate-400">{s.label}</Text>
                <Text className={`mt-1 text-lg font-bold ${s.color}`}>{s.value}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

          <View className="mt-8">
          <Text className="mb-3 text-lg font-semibold text-white">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            {quickActions.map((a, i) => (
              <TouchableOpacity
                key={i}
                className="w-[31%] rounded-xl bg-slate-800 p-4"
                onPress={() => {
                  if (a.label === 'Scan Receipt') router.push('/(modals)/scan-receipt' as never);
                  else if (a.label === 'Add Expense') router.push('/(modals)/add-expense' as never);
                  else if (a.label === 'Add Income') router.push('/(modals)/add-income' as never);
                  else if (a.label === 'Create Invoice') router.push('/(modals)/create-invoice' as never);
                  else if (a.label === 'Upload Statement') router.push('/(modals)/upload-statement' as never);
                  else if (a.label === 'Add Bill') router.push('/(modals)/add-bill' as never);
                }}
              >
                <Text className="text-2xl">{a.icon}</Text>
                <Text className="mt-2 text-sm text-white">{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
