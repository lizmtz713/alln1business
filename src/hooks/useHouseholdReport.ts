import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { fetchHouseholdReportData } from '../services/householdReport';
import { generateHouseholdReportText } from '../services/householdReportText';

const QUERY_KEY = 'householdReport';

export type HouseholdReportResult = {
  data: Awaited<ReturnType<typeof fetchHouseholdReportData>>;
  text: string;
};

export function useHouseholdReport() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: async (): Promise<HouseholdReportResult> => {
      if (!userId) throw new Error('Not signed in');
      const data = await fetchHouseholdReportData(userId);
      const text = await generateHouseholdReportText(data);
      return { data, text };
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
