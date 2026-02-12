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
import { useVendors } from '../src/hooks/useVendors';
import { hasSupabaseEnv } from '../src/services/env';
import type { Vendor } from '../src/types/contacts';

const VENDOR_TYPE_LABELS: Record<string, string> = {
  supplier: 'Supplier',
  contractor: 'Contractor',
  service: 'Service',
  other: 'Other',
};

function W9Badge({ vendor }: { vendor: Vendor }) {
  if (vendor.w9_received) {
    return (
      <View style={{ backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500' }}>W-9 Received</Text>
      </View>
    );
  }
  if (vendor.w9_requested) {
    return (
      <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500' }}>W-9 Requested</Text>
      </View>
    );
  }
  return (
    <View style={{ backgroundColor: '#64748B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '500' }}>W-9 Not</Text>
    </View>
  );
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const typeLabel = vendor.vendor_type ? VENDOR_TYPE_LABELS[vendor.vendor_type] : null;

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ color: '#F8FAFC', fontWeight: '600', fontSize: 16, flex: 1 }}>
          {vendor.company_name}
        </Text>
        <W9Badge vendor={vendor} />
      </View>
      {vendor.contact_name && (
        <Text style={{ color: '#94A3B8', fontSize: 14, marginTop: 4 }}>{vendor.contact_name}</Text>
      )}
      {typeLabel && (
        <Text style={{ color: '#3B82F6', fontSize: 12, marginTop: 4 }}>{typeLabel}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function VendorsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: allVendors = [], isLoading } = useVendors();
  const vendors = useMemo(() => {
    if (!search.trim()) return allVendors;
    const term = search.trim().toLowerCase();
    return allVendors.filter(
      (v) =>
        v.company_name?.toLowerCase().includes(term) ||
        v.contact_name?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term)
    );
  }, [allVendors, search]);

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for vendors.</Text>
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
          Vendors
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
          placeholder="Search vendors..."
          placeholderTextColor="#64748B"
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 24 }} />
        ) : vendors.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>No vendors yet</Text>
            <TouchableOpacity
              onPress={() => router.push('/(modals)/add-vendor' as never)}
              style={{
                backgroundColor: '#3B82F6',
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Add Vendor</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {vendors.map((v) => (
              <VendorCard
                key={v.id}
                vendor={v}
                onPress={() => router.push(`/(modals)/edit-vendor/${v.id}` as never)}
              />
            ))}
            <TouchableOpacity
              onPress={() => router.push('/(modals)/add-vendor' as never)}
              style={{
                backgroundColor: '#334155',
                borderRadius: 12,
                padding: 16,
                marginTop: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Add Vendor</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
