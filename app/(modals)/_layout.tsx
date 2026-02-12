import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="add-income" />
      <Stack.Screen name="add-bank-account" />
      <Stack.Screen name="upload-statement" />
      <Stack.Screen name="transaction/[id]" />
    </Stack>
  );
}
