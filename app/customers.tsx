import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomers } from '../src/hooks/useCustomers';
import { hasSupabaseEnv } from '../src/services/env';
import type { Customer } from '../src/types/contacts';

const PAYMENT_TERMS_LABELS: Record<string, string> = {
  due_on_receipt: 'Due on receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
};

function CustomerCard({
  customer,
  onPress,
}: {
  customer: Customer;
  onPress: () => void;
}) {
  const display = customer.company_name || customer.contact_name;
  const sub = customer.company_name ? customer.contact_name : null;
  const terms = customer.payment_terms ? PAYMENT_TERMS_LABELS[customer.payment_terms] : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#1E293B',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16 }}>{display}</Text>
      {sub && <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>{sub}</Text>}
      {(customer.email || customer.phone) && (
        <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
          {[customer.email, customer.phone].filter(Boolean).join(' • ')}
        </Text>
      )}
      {terms && (
        <Text style={{ color: '#3B82F6', fontSize: 12, marginTop: 4 }}>{terms}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function CustomersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: allCustomers = [], isLoading } = useCustomers();
  const customers = useMemo(() => {
    if (!search.trim()) return allCustomers;
    const term = search.trim().toLowerCase();
    return allCustomers.filter(
      (c) =>
        c.company_name?.toLowerCase().includes(term) ||
        c.contact_name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term)
    );
  }, [allCustomers, search]);

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for customers.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
          Customers
        </Text>

        <TextInput
          style={{
            backgroundColor: '#1E293B',
            borderRadius: 12,
            padding: 12,
            color: '#F8FAFC',
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#334155',
          }}
          value={search}
          onChangeText={setSearch}
          placeholder="Search customers..."
          placeholderTextColor="#64748B"
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
        ) : customers.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No customers yet</Text>
            <TouchableOpacity
              onPress={() => router.push('/(modals)/add-customer' as never)}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Customer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {customers.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                onPress={() => router.push(`/(modals)/edit-customer/${c.id}` as never)}
              />
            ))}
            <TouchableOpacity
              onPress={() => router.push('/(modals)/add-customer' as never)}
              style={{
                backgroundColor: '#334155',
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Add Customer</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
