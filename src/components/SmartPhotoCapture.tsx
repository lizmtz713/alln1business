import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { scanDocument, hasScanApi, type ScanDocumentResult } from '../services/scanDocument';
import { uploadDocument } from '../services/storage';
import { useToast } from './ui';
import { hapticLight } from '../lib/haptics';

export type SmartPhotoCaptureResult = ScanDocumentResult & {
  imageUri: string;
  storageUrl: string | null;
};

export type SmartPhotoCaptureProps = {
  visible: boolean;
  onClose: () => void;
  onExtracted: (result: SmartPhotoCaptureResult) => void;
  /** Optional hint for which form we're filling (e.g. "bill", "pet") to show relevant message */
  expectedType?: string;
};

const DOC_TYPE_LABELS: Record<string, string> = {
  bill: 'Bill',
  id_document: 'ID / Passport',
  insurance_card: 'Insurance card',
  receipt: 'Receipt',
  vet_record: 'Vet record',
  report_card: 'Report card',
  other: 'Other document',
};

export function SmartPhotoCapture({
  visible,
  onClose,
  onExtracted,
  expectedType,
}: SmartPhotoCaptureProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [step, setStep] = useState<'pick' | 'uploading' | 'scanning' | 'review'>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [storageUrl, setStorageUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanDocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('pick');
    setImageUri(null);
    setStorageUrl(null);
    setScanResult(null);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async (useCamera: boolean) => {
    hapticLight();
    setError(null);
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          toast.show('Camera access is needed to scan documents.');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.85,
        });
        if (result.canceled) return;
        setImageUri(result.assets[0].uri);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          toast.show('Photo library access is needed to select an image.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          quality: 0.85,
        });
        if (result.canceled) return;
        setImageUri(result.assets[0].uri);
      }
      processImage(result.assets[0].uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to pick image');
    }
  };

  const processImage = async (uri: string) => {
    if (!user?.id) {
      setError('Sign in to scan documents.');
      return;
    }
    setStep('uploading');
    setError(null);

    let url: string | null = null;
    try {
      url = await uploadDocument(user.id, uri, { suffix: '.jpg' });
      setStorageUrl(url);
    } catch {
      // Continue without backup URL
    }

    setStep('scanning');
    try {
      const result = await scanDocument(uri);
      setScanResult(result);
      setStep('review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setStep('pick');
    }
  };

  const handleUseThis = () => {
    if (!scanResult || !imageUri) return;
    hapticLight();
    onExtracted({
      ...scanResult,
      imageUri,
      storageUrl,
    });
    handleClose();
  };

  if (!hasScanApi) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan document</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Ionicons name="close" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {step === 'pick' && (
            <>
              <Text style={styles.hint}>
                Take or choose a photo of a bill, ID, insurance card, receipt, vet record, or report card. We'll extract the data and pre-fill the form.
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => pickImage(true)} style={styles.primaryBtn}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.primaryBtnText}>Take photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => pickImage(false)} style={styles.secondaryBtn}>
                  <Ionicons name="images" size={24} color="#3B82F6" />
                  <Text style={styles.secondaryBtnText}>Choose from library</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {(step === 'uploading' || step === 'scanning') && (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>
                {step === 'uploading' ? 'Saving image…' : 'Extracting data…'}
              </Text>
            </View>
          )}

          {step === 'review' && scanResult && imageUri && (
            <>
              <View style={styles.previewRow}>
                <Image source={{ uri: imageUri }} style={styles.thumb} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {DOC_TYPE_LABELS[scanResult.documentType] ?? scanResult.documentType}
                  </Text>
                </View>
              </View>
              <ScrollView style={styles.fieldsScroll}>
                {Object.entries(scanResult.fields).map(([key, value]) => {
                  if (value == null || value === '') return null;
                  return (
                    <View key={key} style={styles.fieldRow}>
                      <Text style={styles.fieldKey}>{key}</Text>
                      <Text style={styles.fieldValue} numberOfLines={2}>
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => { reset(); setStep('pick'); }} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Scan another</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleUseThis} style={styles.primaryBtn}>
                  <Text style={styles.primaryBtnText}>Use this</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 20,
  },
  error: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
  },
  buttonRow: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  secondaryBtnText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 16,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 16,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  badge: {
    marginLeft: 12,
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  fieldsScroll: {
    maxHeight: 220,
    marginBottom: 24,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  fieldKey: {
    color: '#94A3B8',
    fontSize: 13,
    marginRight: 12,
  },
  fieldValue: {
    color: '#F8FAFC',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
});
