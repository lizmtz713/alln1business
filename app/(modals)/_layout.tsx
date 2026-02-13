import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/providers/AuthProvider';

export default function ModalsLayout() {
  const router = useRouter();
  const { session, loading, hasSupabaseConfig } = useAuth();

  useEffect(() => {
    if (loading || !hasSupabaseConfig) return;
    if (!session) {
      router.replace('/');
    }
  }, [loading, session, hasSupabaseConfig, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="add-income" />
      <Stack.Screen name="add-bill" />
      <Stack.Screen name="edit-bill/[id]" />
      <Stack.Screen name="upload-document" />
      <Stack.Screen name="edit-document/[id]" />
      <Stack.Screen name="scan-receipt" />
      <Stack.Screen name="scan-bill" />
      <Stack.Screen name="receipt-history" />
      <Stack.Screen name="household-report" />
      <Stack.Screen name="inventory-walkthrough" />
      <Stack.Screen name="transaction/[id]" />
      <Stack.Screen name="add-vehicle" />
      <Stack.Screen name="edit-vehicle/[id]" />
      <Stack.Screen name="add-pet" />
      <Stack.Screen name="edit-pet/[id]" />
      <Stack.Screen name="add-insurance" />
      <Stack.Screen name="edit-insurance/[id]" />
      <Stack.Screen name="add-medical" />
      <Stack.Screen name="edit-medical/[id]" />
      <Stack.Screen name="add-home-service" />
      <Stack.Screen name="edit-home-service/[id]" />
      <Stack.Screen name="add-appointment" />
      <Stack.Screen name="edit-appointment/[id]" />
    </Stack>
  );
}
