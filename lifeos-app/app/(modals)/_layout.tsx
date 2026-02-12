import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, presentation: 'modal' }}>
      <Stack.Screen name="add-bill" options={{ title: 'Add Bill' }} />
      <Stack.Screen name="add-document" options={{ title: 'Add Document' }} />
      <Stack.Screen name="add-person" options={{ title: 'Add Person' }} />
      <Stack.Screen name="add-pet" options={{ title: 'Add Pet' }} />
      <Stack.Screen name="add-vehicle" options={{ title: 'Add Vehicle' }} />
      <Stack.Screen name="add-appointment" options={{ title: 'Add Appointment' }} />
    </Stack>
  );
}
