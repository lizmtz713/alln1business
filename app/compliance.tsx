import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useComplianceItems, useCreateComplianceItem, useUpdateComplianceItem } from '../src/hooks/useCompliance';
import { hasSupabaseEnv } from '../src/services/env';
import { format, parseISO } from 'date-fns';
import { Button, EmptyState, Input } from '../src/components/ui';
import type { ComplianceItem } from '../src/hooks/useCompliance';

const shared = {
  screen: { flex: 1, backgroundColor: '#0F172A' as const },
  padding: { padding: 24 },
  back: { color: '#3B82F6' as const, fontSize: 16, marginBottom: 24 },
  title: { color: '#F8FAFC' as const, fontSize: 24, fontWeight: 'bold' as const, marginBottom: 24 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
};

export default function ComplianceScreen() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const { data: items = [], isLoading } = useComplianceItems();
  const createItem = useCreateComplianceItem();
  const updateItem = useUpdateComplianceItem();

  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const futureStr = in30Days.toISOString().split('T')[0];
  const upcoming = items.filter((i) => i.due_date && i.due_date >= today && i.due_date <= futureStr);
  const rest = items.filter((i) => !i.due_date || i.due_date < today || i.due_date > futureStr);

  const handleAdd = () => {
    if (!newName.trim()) return;
    createItem.mutate(
      {
        name: newName.trim(),
        due_date: newDueDate || null,
        category: newCategory || null,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewDueDate('');
          setNewCategory('');
          setShowAddModal(false);
        },
      }
    );
  };

  const handleTap = (item: ComplianceItem) => {
    if (item.related_estimate_id && item.category === 'tax') {
      const dueYear = item.due_date ? new Date(item.due_date).getFullYear() : new Date().getFullYear();
      const qMatch = item.name?.match(/Q(\d)/);
      const quarter = qMatch ? qMatch[1] : null;
      if (quarter) {
        router.push(`/estimates?year=${dueYear}&quarter=${quarter}` as never);
      }
    }
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={[shared.screen, shared.padding]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for compliance calendar.</Text>
      </View>
    );
  }

  return (
    <View style={[shared.screen]}>
      <ScrollView contentContainerStyle={[shared.padding, { paddingBottom: 100 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={shared.title}>Compliance Calendar</Text>

        {isLoading ? (
          <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No compliance items"
            body="Add reminders for tax due dates, license renewals, and more."
            icon="calendar-outline"
            ctaLabel="Add Item"
            onPress={() => setShowAddModal(true)}
          />
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={{ color: '#F59E0B', fontWeight: '600', marginBottom: 12 }}>
                  Next 30 Days
                </Text>
                {upcoming.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[shared.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => handleTap(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{item.name}</Text>
                      {item.due_date && (
                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                          Due {format(parseISO(item.due_date), 'MMM d, yyyy')}
                        </Text>
                      )}
                      {item.source === 'system' && (
                        <Text style={{ color: '#3B82F6', fontSize: 11, marginTop: 4 }}>System</Text>
                      )}
                    </View>
                    <View
                      style={{
                        backgroundColor: item.status === 'completed' ? '#10B981' : '#F59E0B',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 11 }}>
                        {item.status === 'completed' ? 'Done' : 'Pending'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {rest.length > 0 && (
              <>
                <Text style={{ color: '#94A3B8', fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
                  All Items
                </Text>
                {rest.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[shared.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                    onPress={() => handleTap(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>{item.name}</Text>
                      {item.due_date && (
                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                          Due {format(parseISO(item.due_date), 'MMM d, yyyy')}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        updateItem.mutate({
                          id: item.id,
                          updates: {
                            status: item.status === 'completed' ? 'pending' : 'completed',
                            completed_date: item.status === 'completed' ? null : new Date().toISOString().split('T')[0],
                          },
                        });
                      }}
                      style={{
                        backgroundColor: item.status === 'completed' ? '#334155' : '#10B981',
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: '#fff', fontSize: 12 }}>
                        {item.status === 'completed' ? 'Undo' : 'Complete'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Button
              title="Add Item"
              variant="secondary"
              onPress={() => setShowAddModal(true)}
              style={{ marginTop: 24 }}
            />
          </>
        )}
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="fade">
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={{ backgroundColor: '#1E293B', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ color: '#F8FAFC', fontSize: 18, fontWeight: '600', marginBottom: 16 }}>
              Add Compliance Item
            </Text>
            <Input label="Name" value={newName} onChangeText={setNewName} placeholder="e.g. Quarterly Tax Q1" />
            <Input label="Due Date" value={newDueDate} onChangeText={setNewDueDate} placeholder="yyyy-mm-dd" />
            <Input label="Category" value={newCategory} onChangeText={setNewCategory} placeholder="tax, license, etc." />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} />
              <Button title="Add" onPress={handleAdd} loading={createItem.isPending} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
