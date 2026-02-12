import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useYearEndPackage, type PackageFile } from '../src/hooks/useYearEndPackage';
import { hasSupabaseEnv } from '../src/services/env';

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
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  buttonSecondary: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
};

export default function YearEndScreen() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [packageFiles, setPackageFiles] = useState<PackageFile[] | null>(null);

  const {
    summary,
    transactions,
    docs,
    isLoading,
    error,
    createPackageFiles,
    sharePackage,
  } = useYearEndPackage({ year });

  const handleGenerate = async () => {
    if (!summary) {
      Alert.alert('No Data', 'Generate tax exports first, or upload transactions to get started.');
      return;
    }
    createPackageFiles.mutate(undefined, {
      onSuccess: (files) => {
        setPackageFiles(files);
      },
      onError: (e) => {
        Alert.alert('Generation Failed', (e as Error).message);
      },
    });
  };

  const handleShare = async () => {
    if (!packageFiles || packageFiles.length === 0) {
      Alert.alert('Generate First', 'Tap "Generate Package" to create the export files, then share.');
      return;
    }
    sharePackage.mutate(packageFiles, {
      onError: (e) => {
        Alert.alert('Share Failed', (e as Error).message);
      },
    });
  };

  const handlePreviewPdf = () => {
    const pdfFile = packageFiles?.find((f) => f.filename.endsWith('.pdf'));
    if (pdfFile?.uri) {
      Linking.openURL(pdfFile.uri).catch(() => {
        Alert.alert('Cannot Open', 'Unable to open PDF. Try sharing and opening from there.');
      });
    } else {
      Alert.alert('Generate First', 'Tap "Generate Package" to create the PDF.');
    }
  };

  const isGenerating =
    createPackageFiles.isPending ||
    (createPackageFiles.isSuccess && !packageFiles);

  if (!hasSupabaseEnv) {
    return (
      <View style={[shared.screen, shared.padding]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#94A3B8' }}>Connect Supabase to use Year-End Package.</Text>
      </View>
    );
  }

  return (
    <View style={[shared.screen]}>
      <ScrollView contentContainerStyle={[shared.padding, { paddingBottom: 180 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={shared.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={shared.title}>Year-End Package</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
            <TouchableOpacity
              key={y}
              onPress={() => {
                setYear(y);
                setPackageFiles(null);
              }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: year === y ? '#3B82F6' : '#1E293B',
                marginRight: 8,
              }}
            >
              <Text style={{ color: year === y ? '#fff' : '#94A3B8', fontWeight: '500' }}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#3B82F6" style={{ marginTop: 24 }} />
        ) : error ? (
          <View style={shared.card}>
            <Text style={{ color: '#EF4444' }}>{(error as Error).message}</Text>
          </View>
        ) : transactions.length === 0 ? (
          <View style={shared.card}>
            <Text style={{ color: '#94A3B8', marginBottom: 16 }}>
              No transactions in {year}. Upload your bank statement to get started.
            </Text>
            <TouchableOpacity
              style={shared.button}
              onPress={() => router.push('/(modals)/upload-statement' as never)}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Upload Statement</Text>
            </TouchableOpacity>
            <Text style={{ color: '#64748B', fontSize: 12, marginTop: 12 }}>
              You can still generate Tax Summary PDF and Documents Index (if you have documents).
            </Text>
          </View>
        ) : (
          <>
            <View style={[shared.card, { marginBottom: 20 }]}>
              <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>
                Tax Summary {year}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Income</Text>
                  <Text style={{ color: '#10B981', fontWeight: '600' }}>
                    ${(summary?.totalIncome ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Expenses</Text>
                  <Text style={{ color: '#EF4444', fontWeight: '600' }}>
                    ${(summary?.totalExpenses ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>Deductible</Text>
                  <Text style={{ color: '#3B82F6', fontWeight: '600' }}>
                    ${(summary?.totalDeductible ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={[shared.card, { marginBottom: 20 }]}>
              <Text style={{ color: '#F8FAFC', fontWeight: '600', marginBottom: 12 }}>
                Exports Included
              </Text>
              <Text style={{ color: '#10B981', fontSize: 14, marginBottom: 4 }}>
                ✓ Tax Transactions CSV
              </Text>
              <Text style={{ color: '#10B981', fontSize: 14, marginBottom: 4 }}>
                ✓ Tax Summary PDF
              </Text>
              <Text style={{ color: '#10B981', fontSize: 14 }}>
                ✓ Documents Index CSV
              </Text>
            </View>

            {docs.length === 0 && (
              <View style={[shared.card, { backgroundColor: '#334155', marginBottom: 20 }]}>
                <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                  No documents in {year}. Tax exports will still be generated. Add documents for a
                  complete package.
                </Text>
              </View>
            )}
          </>
        )}

        {summary && (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[shared.button, { marginBottom: 8 }]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>
                    Generating CSV, PDF, Documents Index…
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600' }}>Generate Package</Text>
              )}
            </TouchableOpacity>

            {createPackageFiles.isSuccess && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#10B981', fontSize: 14, marginBottom: 8 }}>
                  Package generated successfully.
                </Text>
                <TouchableOpacity
                  style={shared.buttonSecondary}
                  onPress={handlePreviewPdf}
                >
                  <Text style={{ color: '#F8FAFC' }}>Preview Tax Summary PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: 40,
          backgroundColor: '#0F172A',
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
        }}
      >
        <TouchableOpacity
          style={shared.button}
          onPress={handleShare}
          disabled={!packageFiles?.length || sharePackage.isPending}
        >
          {sharePackage.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>Share Package</Text>
          )}
        </TouchableOpacity>
        <Text style={{ color: '#64748B', fontSize: 12, textAlign: 'center' }}>
          Share with CPA: PDF first, then CSVs
        </Text>
      </View>
    </View>
  );
}
