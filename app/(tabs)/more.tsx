import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { router } from 'expo-router';
import { hapticLight } from '../../src/lib/haptics';
import { MIN_TOUCH_TARGET } from '../../src/lib/constants';

export default function MoreScreen() {
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    hapticLight();
    await signOut();
    router.replace('/');
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      contentContainerStyle={{ padding: 24 }}
    >
      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>More</Text>

      {hasSupabaseEnv && user && (
        <>
          {!profile?.onboarding_completed && (
            <TouchableOpacity
              onPress={() => {
                hapticLight();
                router.push('/(auth)/voice-onboarding' as never);
              }}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                marginBottom: 8,
                minHeight: MIN_TOUCH_TARGET,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: '600' }}>
                Finish household setup
              </Text>
            </TouchableOpacity>
          )}
          <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 24, marginBottom: 12 }}>
            Household
          </Text>
          {[
            { label: 'Family', path: '/family' as const },
            { label: 'Vehicles', path: '/vehicles' as const },
            { label: 'Pets', path: '/pets' as const },
            { label: 'Insurance', path: '/insurance' as const },
            { label: 'Medical', path: '/medical' as const },
            { label: 'Home Services', path: '/home-services' as const },
            { label: 'Appointments', path: '/appointments' as const },
            { label: 'Receipt history', path: '/(modals)/receipt-history' as const },
            { label: 'Voice inventory (insurance)', path: '/(modals)/inventory-walkthrough' as const },
          ].map((item) => (
            <TouchableOpacity
              key={item.path}
              onPress={() => { hapticLight(); router.push(item.path as never); }}
              style={{
                backgroundColor: '#334155',
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                minHeight: MIN_TOUCH_TARGET,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 24, marginBottom: 12 }}>
            Account
          </Text>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.push('/settings' as never);
            }}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
              minHeight: MIN_TOUCH_TARGET,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Settings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              hapticLight();
              router.push('/change-password' as never);
            }}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              minHeight: MIN_TOUCH_TARGET,
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Change Password
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={() => { hapticLight(); router.push('/status' as never); }}
        style={{ backgroundColor: '#334155', borderRadius: 12, padding: 16, marginTop: 24, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
      >
        <Text style={{ color: '#94A3B8', textAlign: 'center', fontWeight: '500' }}>System Status</Text>
      </TouchableOpacity>

      {user && (
        <TouchableOpacity
          onPress={handleSignOut}
          style={{ backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginTop: 16, minHeight: MIN_TOUCH_TARGET, justifyContent: 'center' }}
        >
          <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: '500' }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
