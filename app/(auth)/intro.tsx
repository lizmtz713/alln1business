import { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INTRO_SEEN_KEY = 'alln1_intro_seen';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'All your business in one place',
    body: 'Track income, expenses, invoices, and receipts in a single app. Stay on top of cash flow without the spreadsheets.',
  },
  {
    title: 'Smart categorization & compliance',
    body: 'Automatically categorize transactions, run bank reconciliation, and keep tax-ready records. Quarterly estimates and year-end made simple.',
  },
  {
    title: 'Documents & receipts, organized',
    body: 'Upload and scan receipts, store documents by type, and generate professional invoices. Everything backed up and easy to find.',
  },
];

export default function IntroScreen() {
  const [page, setPage] = useState(0);
  const router = useRouter();

  const handleNext = async () => {
    if (page < SLIDES.length - 1) {
      setPage((p) => p + 1);
      return;
    }
    await AsyncStorage.setItem(INTRO_SEEN_KEY, 'true');
    router.replace('/(auth)/login' as never);
  };

  const slide = SLIDES[page];
  const isLast = page === SLIDES.length - 1;

  return (
    <View className="flex-1 bg-slate-900">
      <View className="flex-1 justify-center px-10" style={{ width }}>
        <Text className="mb-4 text-3xl font-bold text-white">{slide.title}</Text>
        <Text className="text-lg leading-7 text-slate-300">{slide.body}</Text>
      </View>
      <View className="pb-12 px-10">
        <View className="mb-6 flex-row justify-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`h-2 rounded-full ${i === page ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600'}`}
            />
          ))}
        </View>
        <Pressable
          onPress={handleNext}
          className="rounded-xl bg-blue-600 py-4 active:opacity-80"
        >
          <Text className="text-center text-base font-semibold text-white">
            {isLast ? 'Get started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
