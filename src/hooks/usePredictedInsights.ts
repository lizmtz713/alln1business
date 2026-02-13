import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { computeRawPredictions } from '../services/predictions';
import { generatePredictionInsights } from '../services/predictionInsights';
import type { PredictionInsight } from '../services/predictionInsights';

const QUERY_KEY = 'predictedInsights';
const STALE_MS = 5 * 60 * 1000;

export function usePredictedInsights() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async (): Promise<PredictionInsight[]> => {
      const raw = await computeRawPredictions(userId);
      return generatePredictionInsights(raw);
    },
    enabled: Boolean(userId),
    staleTime: STALE_MS,
  });
}
