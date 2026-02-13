import '../global.css';

import { Stack } from 'expo-router';
import 'react-native-reanimated';
import { QueryProvider } from '../src/providers/QueryProvider';
import { AuthProvider } from '../src/providers/AuthProvider';
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { AuthErrorHandler } from '../src/providers/AuthErrorHandler';
import { ToastProvider } from '../src/components/ui';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { UniversalVoiceInput } from '../src/components/UniversalVoiceInput';

export { ErrorBoundary } from 'expo-router';

function RootNavigator() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(modals)" options={{ headerShown: false }} />
      <Stack.Screen name="bill/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="document/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="status" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <AuthErrorHandler />
          <ToastProvider>
          <AppErrorBoundary>
            <RootNavigator />
            <UniversalVoiceInput />
          </AppErrorBoundary>
        </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
