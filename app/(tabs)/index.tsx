import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { format } from 'date-fns';

export default function DashboardScreen() {
  const { profile, user } = useAuth();
  const name = profile?.full_name || profile?.business_name || user?.email?.split('@')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

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
