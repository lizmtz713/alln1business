import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useAuth } from '../src/providers/AuthProvider';
import { supabase, hasSupabaseConfig } from '../src/services/supabase';

type CheckResult = { ok: boolean; message?: string };

export default function StatusScreen() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const [checks, setChecks] = useState<Record<string, CheckResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function runChecks() {
      const results: Record<string, CheckResult> = {};

      const redirectTo = AuthSession.makeRedirectUri({
        path: 'google-auth',
        scheme: 'alln1business',
      });

      results.supabase_env = hasSupabaseConfig ? { ok: true } : { ok: false, message: 'Missing EXPO_PUBLIC_SUPABASE_* in .env.local' };
      results.google_redirect = { ok: true, message: redirectTo };
      results.session = session ? { ok: true } : { ok: false, message: 'Not signed in' };
      results.profile = profile ? { ok: true } : { ok: false, message: session ? 'Profile missing — run docs/supabase-profiles-schema.sql' : 'N/A' };

      if (hasSupabaseConfig && session?.user?.id) {
        const tables = ['profiles', 'transactions', 'invoices', 'bills', 'documents'] as const;
        for (const t of tables) {
          try {
            const { error } = await supabase.from(t).select('id').limit(1);
            results[t] = error ? { ok: false, message: error.message } : { ok: true };
          } catch (e) {
            results[t] = { ok: false, message: (e as Error).message };
          }
          if (cancelled) return;
        }

        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          const hasReceipts = buckets?.some((b) => b.name === 'receipts');
          const hasDocuments = buckets?.some((b) => b.name === 'documents');
          results.buckets = hasReceipts && hasDocuments
            ? { ok: true }
            : { ok: false, message: `Missing buckets. Need: receipts, documents. Run docs/supabase-storage-receipts.sql and docs/supabase-storage-documents.sql` };
        } catch (e) {
          results.buckets = { ok: false, message: (e as Error).message };
        }
      } else {
        results.transactions = { ok: false, message: 'Sign in to check' };
        results.invoices = { ok: false, message: 'Sign in to check' };
        results.bills = { ok: false, message: 'Sign in to check' };
        results.documents = { ok: false, message: 'Sign in to check' };
        results.buckets = { ok: false, message: 'Sign in to check' };
      }

      if (!cancelled) setChecks(results);
      setLoading(false);
    }

    runChecks();
    return () => { cancelled = true; };
  }, [hasSupabaseConfig, session?.user?.id, profile]);

  const allOk = Object.values(checks).every((c) => c.ok);
  const missing = Object.entries(checks).filter(([, c]) => !c.ok);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0F172A' }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
        <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>System Status</Text>
      <Text style={{ color: '#94A3B8', marginBottom: 24 }}>Diagnostics for app setup</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
      ) : (
        <>
          {Object.entries(checks).map(([key, r]) => (
            key === 'google_redirect' ? (
              <View
                key={key}
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: '#1E293B',
                  borderRadius: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: '#F8FAFC', fontWeight: '500', marginBottom: 4 }}>Google OAuth redirectTo</Text>
                <Text style={{ color: '#94A3B8', fontSize: 11 }} numberOfLines={2} selectable>
                  {(r as CheckResult).message ?? '-'}
                </Text>
              </View>
            ) : (
            <View
              key={key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: r.ok ? '#1E293B' : '#431a1a',
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontWeight: '500' }}>{key.replace(/_/g, ' ')}</Text>
              <View style={{ flex: 1, marginLeft: 16 }}>
                {r.ok ? (
                  <Text style={{ color: '#10B981', fontSize: 14 }}>✓ OK</Text>
                ) : (
                  <Text style={{ color: '#F87171', fontSize: 12 }} numberOfLines={2}>{r.message ?? 'Failed'}</Text>
                )}
              </View>
            </View>
            )
          ))}

          {!allOk && missing.length > 0 && (
            <View style={{ marginTop: 24, padding: 16, backgroundColor: '#334155', borderRadius: 12 }}>
              <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>Setup Checklist</Text>
              {!checks.supabase_env?.ok && (
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>• Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env.local</Text>
              )}
              {checks.profile?.ok === false && session && (
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>• Run docs/supabase-profiles-schema.sql in Supabase SQL Editor</Text>
              )}
              {checks.transactions?.ok === false && session && (
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>• Run docs/supabase-transactions-schema.sql</Text>
              )}
              {checks.invoices?.ok === false && session && (
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>• Run docs/supabase-invoices-schema.sql</Text>
              )}
              {checks.bills?.ok === false && session && (
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>• Run docs/supabase-bills-schema.sql</Text>
              )}
              {checks.documents?.ok === false && session && (
                <Text style={{ color: '#94A3B8', fontSize: 14, marginBottom: 8 }}>• Run docs/supabase-documents-schema.sql</Text>
              )}
              {checks.buckets?.ok === false && session && (
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>• Run docs/supabase-storage-receipts.sql and docs/supabase-storage-documents.sql</Text>
              )}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
