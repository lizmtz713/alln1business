import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { upsertInsightsForToday, dismissInsight } from '../services/insights';

const QUERY_KEY = 'insights';

export function useDashboardInsights() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useQuery({
    queryKey: [QUERY_KEY, 'today', userId],
    queryFn: async () => {
      try {
        return await upsertInsightsForToday(userId);
      } catch {
        return [];
      }
    },
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';

  return useMutation({
    mutationFn: (id: string) => dismissInsight(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, 'today', userId] });
    },
  });
}
