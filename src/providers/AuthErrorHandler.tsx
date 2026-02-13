import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useAuth } from './AuthProvider';

function isAuthError(error: unknown): boolean {
  const msg = String(error instanceof Error ? error.message : error);
  return /jwt|session|token|401|403|expired|unauthorized|forbidden/i.test(msg);
}

export function AuthErrorHandler() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { signOut, hasSupabaseConfig } = useAuth();

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    const unsubMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type !== 'updated') return;
      const mutation = event.mutation;
      const error = mutation.state.error;
      if (error && isAuthError(error)) {
        signOut();
        router.replace('/');
      }
    });

    const unsubQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated') return;
      const query = event.query;
      const error = query.state.error;
      if (error && isAuthError(error)) {
        signOut();
        router.replace('/');
      }
    });

    return () => {
      unsubMutations();
      unsubQueries();
    };
  }, [queryClient, router, signOut, hasSupabaseConfig]);

  return null;
}
