import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useToast } from '../../src/components/ui';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDocument, useDeleteDocument, useUpdateDocument } from '../../src/hooks/useDocuments';
import { useAuth } from '../../src/providers/AuthProvider';
import { hasSupabaseEnv } from '../../src/services/env';
import { createTextDocumentPdf } from '../../src/services/pdf';
import { uploadPdfToDocumentsBucket } from '../../src/services/storage';
import { format, parseISO } from 'date-fns';

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const toast = useToast();
  const { data: doc, isLoading } = useDocument(id);
  const deleteDoc = useDeleteDocument();
  const updateDoc = useUpdateDocument();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  /** Open file_url/pdf_url/txt_file_url with guards and toast on failure. */
  const handleOpen = async () => {
    const url = doc?.pdf_url || doc?.file_url;
    if (!url) {
      toast.show('No file or PDF available to open.', 'error');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) await Linking.openURL(url);
      else toast.show('Cannot open this file. Try Share instead.', 'error');
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Failed to open file.', 'error');
    }
  };

  const handleOpenTxt = async () => {
    const txtUrl = (doc as { txt_file_url?: string | null })?.txt_file_url;
    if (!txtUrl) {
      toast.show('No text file available.', 'error');
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(txtUrl);
      if (canOpen) await Linking.openURL(txtUrl);
      else toast.show('Cannot open text file.', 'error');
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Failed to open file.', 'error');
    }
  };

  const handleShare = async () => {
    const url = doc?.pdf_url || doc?.file_url;
    if (!url) {
      toast.show('No file to share. Generate PDF first.', 'error');
      return;
    }
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Linking.openURL(url);
        return;
      }
      const filename = `${doc?.name ?? 'document'}.pdf`;
      const localPath = `${FileSystem.cacheDirectory}${Date.now()}-${filename}`;
      await FileSystem.downloadAsync(url, localPath);
      await Sharing.shareAsync(localPath, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${doc?.name ?? 'Document'}`,
      });
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Share failed. Try opening the file.', 'error');
    }
  };

  const handleGeneratePdf = async () => {
    if (!id || !user?.id || !doc?.content_text) return;
    setGeneratingPdf(true);
    try {
      const { localPath, filename } = await createTextDocumentPdf({
        title: doc.name,
        contentText: doc.content_text,
        meta: { doc_type: doc.doc_type, category: doc.category ?? undefined },
        businessName: profile?.business_name || profile?.full_name || undefined,
      });
      const pdfUrl = await uploadPdfToDocumentsBucket({
        userId: user.id,
        filename,
        localPath,
      });
      if (pdfUrl) {
        await updateDoc.mutateAsync({
          id,
          updates: {
            pdf_url: pdfUrl,
            file_url: pdfUrl,
            txt_file_url: doc.file_type === 'txt' ? doc.file_url : null,
          },
        });
        try {
          await Linking.openURL(pdfUrl);
        } catch {
          toast.show('PDF generated. Use Share to open.', 'success');
        }
      } else {
        toast.show('Failed to upload PDF. Run docs/supabase-storage-documents.sql.', 'error');
      }
    } catch (e) {
      toast.show((e as Error)?.message ?? 'Failed to generate PDF.', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Document',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await deleteDoc.mutateAsync(id);
              router.back();
            } catch (e) {
              toast.show((e as Error)?.message ?? 'Delete failed.', 'error');
            }
          },
        },
      ]
    );
  };

  if (!hasSupabaseEnv) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text style={{ color: '#3B82F6' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase for documents.</Text>
      </View>
    );
  }

  if (isLoading || !doc) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', padding: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          {!isLoading && !doc && <Text style={{ color: '#94A3B8', marginTop: 12 }}>Document not found</Text>}
        </View>
      </View>
    );
  }

  const customer = doc.customers;
  const vendor = doc.vendors;
  const linkedName = customer?.company_name || customer?.contact_name || vendor?.company_name || vendor?.contact_name || null;

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#3B82F6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#F8FAFC', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
          {doc.name}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <View style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'capitalize' }}>
              {doc.doc_type.replace('_', ' ')}
            </Text>
          </View>
          {doc.category && (
            <View style={{ backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'capitalize' }}>
                {doc.category}
              </Text>
            </View>
          )}
        </View>

        {linkedName && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Linked to</Text>
            <Text style={{ color: '#F8FAFC', fontSize: 16 }}>{linkedName}</Text>
          </View>
        )}

        <View style={{ marginBottom: 24 }}>
          <TouchableOpacity
            onPress={handleOpen}
            style={{
              backgroundColor: '#3B82F6',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              {doc.pdf_url || doc.file_url ? 'Open PDF / File' : 'Generate PDF first'}
            </Text>
          </TouchableOpacity>
          {(doc.pdf_url || doc.file_url) && (
            <TouchableOpacity
              onPress={handleShare}
              style={{
                backgroundColor: '#334155',
                borderRadius: 12,
                padding: 14,
                alignItems: 'center',
                marginBottom: (doc as { txt_file_url?: string }).txt_file_url ? 8 : 0,
              }}
            >
              <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Share PDF</Text>
            </TouchableOpacity>
          )}
          {doc.pdf_url && (doc as { txt_file_url?: string | null }).txt_file_url && (
            <TouchableOpacity
              onPress={handleOpenTxt}
              style={{
                backgroundColor: '#334155',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#94A3B8', fontWeight: '500' }}>Open TXT</Text>
            </TouchableOpacity>
          )}
          {doc.content_text && !doc.pdf_url && (
            <TouchableOpacity
              onPress={handleGeneratePdf}
              disabled={generatingPdf}
              style={{
                backgroundColor: '#334155',
                borderRadius: 12,
                padding: 12,
                alignItems: 'center',
                marginTop: 8,
              }}
            >
              {generatingPdf ? (
                <ActivityIndicator color="#3B82F6" size="small" />
              ) : (
                <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Generate PDF</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {(doc.is_signed || doc.expiration_date) && (
          <View style={{ marginBottom: 24 }}>
            {doc.is_signed && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Signed</Text>
                <Text style={{ color: '#F8FAFC' }}>
                  {doc.signed_date ? format(parseISO(doc.signed_date), 'MMM d, yyyy') : 'Yes'}
                  {doc.signed_by && ` by ${doc.signed_by}`}
                </Text>
              </View>
            )}
            {doc.expiration_date && (
              <View>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Expires</Text>
                <Text style={{ color: '#F8FAFC' }}>{format(parseISO(doc.expiration_date), 'MMM d, yyyy')}</Text>
              </View>
            )}
          </View>
        )}

        {(doc.tags ?? []).length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 8 }}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(doc.tags ?? []).map((tag) => (
                <View
                  key={tag}
                  style={{ backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                >
                  <Text style={{ color: '#94A3B8', fontSize: 14 }}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {doc.description && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Description</Text>
            <Text style={{ color: '#F8FAFC' }}>{doc.description}</Text>
          </View>
        )}

        <Text style={{ color: '#64748B', fontSize: 12 }}>
          Added {format(parseISO(doc.created_at), 'MMM d, yyyy')}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 32 }}>
          <TouchableOpacity
            onPress={() => router.push(`/(modals)/edit-document/${id}` as never)}
            style={{ flex: 1, backgroundColor: '#334155', borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#F8FAFC', fontWeight: '600' }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            style={{ flex: 1, backgroundColor: '#7F1D1D', borderRadius: 12, padding: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#FCA5A5', fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
