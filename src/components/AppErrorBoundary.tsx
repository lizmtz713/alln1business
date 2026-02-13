import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { useRouter } from 'expo-router';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

function Fallback({ error, onRetry, onSignOut }: { error: Error; onRetry: () => void; onSignOut: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A', padding: 24 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#F8FAFC', marginBottom: 8, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24 }}>
        {error?.message ?? 'An unexpected error occurred.'}
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={{ backgroundColor: '#3B82F6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, marginBottom: 12 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Try again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSignOut}
        style={{ paddingVertical: 12, paddingHorizontal: 24 }}
      >
        <Text style={{ color: '#94A3B8' }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

class ErrorBoundaryClass extends Component<
  Props & { onRetry: () => void; onSignOut: () => void },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.warn('[AppErrorBoundary]', error?.message ?? error, errorInfo?.componentStack);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <Fallback
          error={this.state.error}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            this.props.onRetry();
          }}
          onSignOut={this.props.onSignOut}
        />
      );
    }
    return this.props.children;
  }
}

export function AppErrorBoundary({ children }: Props) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.replace('/');
  };

  return (
    <ErrorBoundaryClass onRetry={() => {}} onSignOut={handleSignOut}>
      {children}
    </ErrorBoundaryClass>
  );
}
