import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/AuthProvider';
import { transcribeWithWhisper } from '../../src/services/voiceToData';
import { parseInventoryTranscript } from '../../src/services/inventoryVoice';
import { uploadInventoryPhoto } from '../../src/services/storage';
import {
  useInventoryItems,
  useCreateWalkthrough,
  useBulkAddInventoryItems,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
} from '../../src/hooks/useInventory';
import { useToast } from '../../src/components/ui';
import type { InventoryItem } from '../../src/types/inventory';

const ROOMS = [
  'Living room',
  'Kitchen',
  'Bedroom',
  'Master bedroom',
  'Bathroom',
  'Office',
  'Dining room',
  'Garage',
  'Other',
];

function formatExportCsv(items: InventoryItem[]): string {
  const headers = 'Room,Item,Brand,Year,Value,Category';
  const rows = items.map(
    (i) =>
      `"${(i.room ?? '').replace(/"/g, '""')}","${(i.item_name ?? '').replace(/"/g, '""')}","${(i.brand ?? '').replace(/"/g, '""')}",${i.purchase_year ?? ''},${i.value},${(i.category ?? '').replace(/"/g, '""')}`
  );
  return [headers, ...rows].join('\n');
}

export default function InventoryWalkthroughModal() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const [walkthroughId, setWalkthroughId] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState<import('expo-av').Recording | null>(null);
  const [processing, setProcessing] = useState(false);
  const [currentRoomOverride, setCurrentRoomOverride] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryItem>>({});

  const createWalkthrough = useCreateWalkthrough();
  const { data: items = [], refetch } = useInventoryItems(walkthroughId);
  const bulkAdd = useBulkAddInventoryItems(walkthroughId);
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();

  const totalValue = items.reduce((sum, i) => sum + Number(i.value), 0);

  const startWalkthrough = useCallback(async () => {
    try {
      const w = await createWalkthrough.mutateAsync(undefined);
      setWalkthroughId(w.id);
      toast.show('Walkthrough started. Tap the mic and say items room by room.');
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Could not start');
    }
  }, [createWalkthrough, toast]);

  const startRecording = useCallback(async () => {
    try {
      const { Audio } = await import('expo-av');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Microphone permission required.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setListening(true);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Could not start recording');
    }
  }, [toast]);

  const stopAndParse = useCallback(async () => {
    if (!recording) return;
    setProcessing(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setListening(false);
      if (!uri) {
        toast.show('No recording saved.');
        setProcessing(false);
        return;
      }
      const transcript = await transcribeWithWhisper(uri);
      if (!transcript || transcript === 'No speech detected.') {
        toast.show('No speech detected. Try again.');
        setProcessing(false);
        return;
      }
      let parsed = await parseInventoryTranscript(transcript);
      if (currentRoomOverride && parsed.length > 0) {
        parsed = parsed.map((p) => ({ ...p, room: currentRoomOverride }));
      }
      if (parsed.length === 0) {
        toast.show('No items parsed. Say e.g. "Living room: Samsung TV 2022 $800, couch $1500"');
        setProcessing(false);
        return;
      }
      let wid = walkthroughId;
      if (!wid) {
        const w = await createWalkthrough.mutateAsync(undefined);
        wid = w.id;
        setWalkthroughId(wid);
      }
      await bulkAdd.mutateAsync({
        items: parsed.map((p) => ({
          room: p.room,
          item_name: p.item_name,
          brand: p.brand,
          purchase_year: p.purchase_year,
          value: p.value,
          category: p.category,
        })),
        walkthroughId: wid,
      });
      refetch();
      toast.show(`Added ${parsed.length} item(s).`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Parse failed');
    } finally {
      setProcessing(false);
    }
  }, [
    recording,
    currentRoomOverride,
    walkthroughId,
    createWalkthrough,
    bulkAdd,
    refetch,
    toast,
  ]);

  const handleExport = useCallback(() => {
    const csv = formatExportCsv(items);
    const text = `Home Inventory - ${new Date().toLocaleDateString()}\nTotal value: $${totalValue.toLocaleString()}\n\n${csv}`;
    Share.share({
      message: text,
      title: 'Home inventory for insurance',
    }).catch(() => {});
    toast.show('Share sheet opened. Save or send as file.');
  }, [items, totalValue, toast]);

  const handleDelete = useCallback(
    (item: InventoryItem) => {
      Alert.alert('Remove item', `Delete "${item.item_name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteItem.mutate(
              { id: item.id, walkthroughId },
              { onSuccess: () => toast.show('Removed.'), onError: (e) => toast.show(e.message) }
            ),
        },
      ]);
    },
    [deleteItem, walkthroughId, toast]
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingId || !walkthroughId) return;
    updateItem.mutate(
      { id: editingId, walkthroughId, update: editForm },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditForm({});
          toast.show('Saved.');
        },
        onError: (e) => toast.show(e.message),
      }
    );
  }, [editingId, walkthroughId, editForm, updateItem, toast]);

  const handleAddPhoto = useCallback(
    async (item: InventoryItem) => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Photo library permission required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]?.uri || !user?.id) return;
      const url = await uploadInventoryPhoto(user.id, result.assets[0].uri, item.id);
      if (url)
        updateItem.mutate(
          { id: item.id, walkthroughId, update: { photo_url: url } },
          { onSuccess: () => toast.show('Photo added.') }
        );
      else toast.show('Upload failed.');
    },
    [user?.id, updateItem, walkthroughId, toast]
  );

  return (
    <View style={styles.screen}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Voice inventory</Text>
      <Text style={styles.subtitle}>Walk through your home and say items room by room for insurance.</Text>

      {!walkthroughId ? (
        <TouchableOpacity onPress={startWalkthrough} style={styles.primaryBtn}>
          <Ionicons name="mic" size={24} color="#0F172A" />
          <Text style={styles.primaryBtnText}>Start walkthrough</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.roomRow}>
            <Text style={styles.roomLabel}>Current room (optional):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomChips}>
              {ROOMS.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setCurrentRoomOverride(currentRoomOverride === r ? null : r)}
                  style={[styles.chip, currentRoomOverride === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, currentRoomOverride === r && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {!listening ? (
            <TouchableOpacity onPress={startRecording} style={styles.recordBtn}>
              <Ionicons name="mic" size={32} color="#F8FAFC" />
              <Text style={styles.recordBtnText}>Tap to record</Text>
              <Text style={styles.recordHint}>e.g. "65 inch Samsung TV 2022 $800, leather couch $1500"</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={stopAndParse}
              disabled={processing}
              style={[styles.recordBtn, styles.recordBtnActive]}
            >
              {processing ? (
                <ActivityIndicator size="large" color="#F8FAFC" />
              ) : (
                <>
                  <Ionicons name="stop" size={32} color="#F8FAFC" />
                  <Text style={styles.recordBtnText}>Tap to stop & parse</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total value</Text>
            <Text style={styles.totalValue}>${totalValue.toLocaleString()}</Text>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {editingId === item.id ? (
                  <View style={styles.editForm}>
                    <TextInput
                      style={styles.input}
                      value={editForm.room ?? item.room}
                      onChangeText={(t) => setEditForm((f) => ({ ...f, room: t }))}
                      placeholder="Room"
                    />
                    <TextInput
                      style={styles.input}
                      value={editForm.item_name ?? item.item_name}
                      onChangeText={(t) => setEditForm((f) => ({ ...f, item_name: t }))}
                      placeholder="Item name"
                    />
                    <TextInput
                      style={styles.input}
                      value={editForm.brand ?? item.brand ?? ''}
                      onChangeText={(t) => setEditForm((f) => ({ ...f, brand: t || null }))}
                      placeholder="Brand"
                    />
                    <TextInput
                      style={styles.input}
                      value={editForm.value != null ? String(editForm.value) : String(item.value)}
                      onChangeText={(t) => setEditForm((f) => ({ ...f, value: parseFloat(t) || 0 }))}
                      placeholder="Value"
                      keyboardType="decimal-pad"
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity onPress={() => setEditingId(null)} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleSaveEdit} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.itemRow}>
                      {item.photo_url ? (
                        <Image source={{ uri: item.photo_url }} style={styles.thumb} />
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleAddPhoto(item)}
                          style={styles.thumbPlaceholder}
                        >
                          <Ionicons name="camera" size={24} color="#64748B" />
                        </TouchableOpacity>
                      )}
                      <View style={styles.itemBody}>
                        <Text style={styles.itemName}>{item.item_name}</Text>
                        <Text style={styles.itemMeta}>
                          {item.room}
                          {item.brand ? ` · ${item.brand}` : ''}
                          {item.purchase_year ? ` · ${item.purchase_year}` : ''}
                        </Text>
                        <Text style={styles.itemValue}>${Number(item.value).toLocaleString()}</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={12}>
                        <Ionicons name="trash-outline" size={20} color="#94A3B8" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(item.id);
                          setEditForm({
                            room: item.room,
                            item_name: item.item_name,
                            brand: item.brand,
                            value: item.value,
                          });
                        }}
                        hitSlop={12}
                      >
                        <Ionicons name="pencil" size={20} color="#3B82F6" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity onPress={handleExport} style={styles.exportBtn}>
            <Ionicons name="document-text-outline" size={20} color="#0F172A" />
            <Text style={styles.exportBtnText}>Export for insurance</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F172A', padding: 24 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#3B82F6', fontSize: 16 },
  title: { color: '#F8FAFC', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94A3B8', fontSize: 14, marginBottom: 24 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  primaryBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  roomRow: { marginBottom: 16 },
  roomLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 8 },
  roomChips: { flexDirection: 'row', marginHorizontal: -24, paddingHorizontal: 24 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#3B82F6' },
  chipText: { color: '#E2E8F0', fontSize: 14 },
  chipTextActive: { color: '#0F172A', fontWeight: '600' },
  recordBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    paddingVertical: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  recordBtnActive: { backgroundColor: '#DC2626' },
  recordBtnText: { color: '#F8FAFC', fontWeight: '600', fontSize: 16, marginTop: 8 },
  recordHint: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
  },
  totalLabel: { color: '#94A3B8', fontSize: 14 },
  totalValue: { color: '#F8FAFC', fontSize: 20, fontWeight: '700' },
  list: { flex: 1, marginBottom: 16 },
  listContent: { paddingBottom: 24 },
  itemCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1 },
  itemName: { color: '#F8FAFC', fontWeight: '600', fontSize: 15 },
  itemMeta: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  itemValue: { color: '#3B82F6', fontWeight: '600', marginTop: 2 },
  editForm: { gap: 8 },
  input: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 15,
  },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  cancelBtnText: { color: '#94A3B8' },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#3B82F6', borderRadius: 8 },
  saveBtnText: { color: '#0F172A', fontWeight: '600' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  exportBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 15 },
});
