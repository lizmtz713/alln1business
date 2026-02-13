import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { scanBill, hasScanBillApi, type ScanBillResult } from '../services/scanBill';
import { useToast } from './ui';
import { hapticLight } from '../lib/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_WIDTH = SCREEN_WIDTH * 0.88;
const FRAME_HEIGHT = SCREEN_HEIGHT * 0.38;

export type BillScannerResult = ScanBillResult & { imageUri: string };

export type BillScannerProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (result: BillScannerResult) => void;
};

export function BillScanner({ visible, onClose, onScanned }: BillScannerProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const openCamera = async () => {
    hapticLight();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Camera access is needed to scan bills and receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (result.canceled) return;
    processImage(result.assets[0].uri);
  };

  const openLibrary = async () => {
    hapticLight();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.show('Photo library access is needed to select a bill or receipt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.9,
    });
    if (result.canceled) return;
    processImage(result.assets[0].uri);
  };

  const processImage = async (uri: string) => {
    if (!hasScanBillApi) {
      toast.show('Add EXPO_PUBLIC_OPENAI_API_KEY or scan-bill API to use bill scanning.');
      return;
    }
    setLoading(true);
    try {
      const scanResult = await scanBill(uri);
      onScanned({ ...scanResult, imageUri: uri });
      onClose();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  if (!hasScanBillApi) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan bill or receipt</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={28} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Extracting data…</Text>
              <Text style={styles.loadingSubtext}>Provider, amount, due date, line items</Text>
            </View>
          ) : (
            <>
              <View style={styles.guideContainer}>
                <View style={styles.frameOutline}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <Text style={styles.guideText}>Align bill or receipt within the frame</Text>
                <Text style={styles.guideSubtext}>Take a clear photo for best results</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity onPress={openCamera} style={styles.primaryButton}>
                  <Ionicons name="camera" size={26} color="#fff" />
                  <Text style={styles.primaryButtonText}>Take photo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openLibrary} style={styles.secondaryButton}>
                  <Ionicons name="images" size={24} color="#3B82F6" />
                  <Text style={styles.secondaryButtonText}>Choose from library</Text>
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
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
  },
  guideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameOutline: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.6)',
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#3B82F6',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  guideText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
  },
  guideSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
  actions: {
    paddingBottom: 40,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#3B82F6',
    fontWeight: '500',
    fontSize: 16,
  },
  loadingBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#F8FAFC',
    fontSize: 18,
    marginTop: 20,
  },
  loadingSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
});
