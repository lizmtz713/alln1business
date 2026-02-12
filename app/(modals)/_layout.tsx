import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add-expense" />
      <Stack.Screen name="add-income" />
      <Stack.Screen name="add-bank-account" />
      <Stack.Screen name="add-customer" />
      <Stack.Screen name="edit-customer/[id]" />
      <Stack.Screen name="create-invoice" />
      <Stack.Screen name="edit-invoice/[id]" />
      <Stack.Screen name="add-bill" />
      <Stack.Screen name="edit-bill/[id]" />
      <Stack.Screen name="add-vendor" />
      <Stack.Screen name="edit-vendor/[id]" />
      <Stack.Screen name="upload-statement" />
      <Stack.Screen name="upload-document" />
      <Stack.Screen name="edit-document/[id]" />
      <Stack.Screen name="transaction/[id]" />
    </Stack>
  );
}
