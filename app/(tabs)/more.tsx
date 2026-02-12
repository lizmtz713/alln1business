import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../../src/providers/AuthProvider';
import { useBankAccounts } from '../../src/hooks/useBankAccounts';
import { hasSupabaseEnv } from '../../src/services/env';
import { router } from 'expo-router';

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const { data: bankAccounts = [] } = useBankAccounts();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0F172A' }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' }}>More</Text>

      {hasSupabaseEnv && user && (
        <>
          <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 24, marginBottom: 12 }}>
            Account
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/change-password' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Change Password
            </Text>
          </TouchableOpacity>
        </>
      )}

      {hasSupabaseEnv && (
        <>
          <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 24, marginBottom: 12 }}>
            Contacts
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/customers' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Customers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/vendors' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Vendors
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#94A3B8', fontSize: 16, marginBottom: 12 }}>
            Bank Accounts
          </Text>
          {bankAccounts.map((a) => (
            <View
              key={a.id}
              style={{
                backgroundColor: '#1E293B',
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{a.account_name}</Text>
              {a.bank_name && (
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>{a.bank_name}</Text>
              )}
              {a.last_four && (
                <Text style={{ color: '#64748B', fontSize: 12 }}>••••{a.last_four}</Text>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => router.push('/(modals)/add-bank-account' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#3B82F6', textAlign: 'center', fontWeight: '500' }}>
              Add Bank Account
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#94A3B8', fontSize: 16, marginBottom: 12 }}>
            Reports
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/taxes' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Tax Prep
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/year-end' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Year-End Package
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/estimates' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Quarterly Estimates
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/compliance' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Compliance Calendar
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#94A3B8', fontSize: 16, marginBottom: 12 }}>
            Documents
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/templates' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Templates
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#94A3B8', fontSize: 16, marginBottom: 12 }}>
            Reconciliation
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/reconciliation' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Bank Reconciliation
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#94A3B8', fontSize: 16, marginTop: 24, marginBottom: 12 }}>
            AI & Automation
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/rules' as never)}
            style={{
              backgroundColor: '#334155',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <Text style={{ color: '#F8FAFC', textAlign: 'center', fontWeight: '500' }}>
              Categorization Rules
            </Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        onPress={() => router.push('/status' as never)}
        style={{
          backgroundColor: '#334155',
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
        }}
      >
        <Text style={{ color: '#94A3B8', textAlign: 'center', fontWeight: '500' }}>
          System Status
        </Text>
      </TouchableOpacity>

      {user && (
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
          }}
        >
          <Text style={{ color: '#EF4444', textAlign: 'center', fontWeight: '500' }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
