import '../global.css';

import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { QueryProvider } from '../src/providers/QueryProvider';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ToastProvider } from '../src/components/ui';

export { ErrorBoundary } from 'expo-router';

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)" options={{ headerShown: false }} />
      <Stack.Screen name="reconciliation" options={{ headerShown: false }} />
      <Stack.Screen name="customers" options={{ headerShown: false }} />
      <Stack.Screen name="vendors" options={{ headerShown: false }} />
      <Stack.Screen name="invoice/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="bill/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="document/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="templates" options={{ headerShown: false }} />
      <Stack.Screen name="rules" options={{ headerShown: false }} />
      <Stack.Screen name="taxes" options={{ headerShown: false }} />
      <Stack.Screen name="year-end" options={{ headerShown: false }} />
      <Stack.Screen name="estimates" options={{ headerShown: false }} />
      <Stack.Screen name="compliance" options={{ headerShown: false }} />
      <Stack.Screen name="status" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <RootNavigator />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
