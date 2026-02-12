import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BusinessDocument, DocumentType } from '../types';
import * as Sharing from 'expo-sharing';

const DOCUMENT_TYPES: { type: DocumentType; label: string; icon: string; color: string }[] = [
  { type: 'w9', label: 'W-9', icon: 'document-text', color: '#3B82F6' },
  { type: 'insurance', label: 'Insurance', icon: 'shield-checkmark', color: '#10B981' },
  { type: 'sos_status', label: 'SOS Status', icon: 'business', color: '#F59E0B' },
  { type: 'tax_exemption', label: 'Tax Exemption', icon: 'receipt', color: '#8B5CF6' },
  { type: 'business_license', label: 'Business License', icon: 'ribbon', color: '#EC4899' },
  { type: 'contract', label: 'Contracts', icon: 'create', color: '#6366F1' },
  { type: 'other', label: 'Other', icon: 'folder', color: '#64748B' },
];

export function DocumentsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'documents'),
        where('userId', '==', user.id),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      setDocuments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BusinessDocument)));
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentsByType = (type: DocumentType) => {
    return documents.filter(d => d.type === type);
  };

  const handleShare = async (doc: BusinessDocument) => {
    if (doc.fileUrl && await Sharing.isAvailableAsync()) {
      // In real app, download file first then share
      Alert.alert('Share', `Sharing ${doc.name}...`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDocument')}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>
          Store and share your business documents securely
        </Text>

        {DOCUMENT_TYPES.map((docType) => {
          const typeDocs = getDocumentsByType(docType.type);
          return (
            <TouchableOpacity 
              key={docType.type}
              style={styles.typeCard}
              onPress={() => navigation.navigate('DocumentList', { type: docType.type })}
            >
              <View style={[styles.typeIcon, { backgroundColor: docType.color }]}>
                <Ionicons name={docType.icon as any} size={24} color="#FFF" />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{docType.label}</Text>
                <Text style={styles.typeCount}>
                  {typeDocs.length} document{typeDocs.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          );
        })}

        {/* Quick Share Section */}
        <Text style={styles.sectionTitle}>Quick Share</Text>
        <Text style={styles.sectionSubtitle}>
          Tap a document to share instantly with clients or vendors
        </Text>

        {documents.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No documents yet</Text>
            <Text style={styles.emptySubtext}>Add your first document to get started</Text>
          </View>
        ) : (
          <View style={styles.quickShareGrid}>
            {documents.slice(0, 4).map((doc) => (
              <TouchableOpacity 
                key={doc.id}
                style={styles.quickShareCard}
                onPress={() => handleShare(doc)}
              >
                <Ionicons name="share-outline" size={20} color="#3B82F6" />
                <Text style={styles.quickShareName} numberOfLines={1}>{doc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  addButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 20 },
  subtitle: { fontSize: 15, color: '#64748B', marginBottom: 24 },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: { flex: 1, marginLeft: 16 },
  typeLabel: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  typeCount: { fontSize: 13, color: '#64748B', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B', marginTop: 24, marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
    borderRadius: 16,
  },
  emptyText: { fontSize: 17, fontWeight: '600', color: '#64748B', marginTop: 12 },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  quickShareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickShareCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickShareName: { flex: 1, fontSize: 14, color: '#1E293B' },
});
