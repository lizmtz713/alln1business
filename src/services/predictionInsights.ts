/**
 * Turns raw predictions into friendly AI-generated insight text for the dashboard.
 */
import { hasOpenAIKey } from './openai';
import type { RawPredictions } from './predictions';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export type PredictionInsight = {
  id: string;
  category: 'spending' | 'growth' | 'maintenance' | 'health';
  title: string;
  body: string;
  priority: number; // 1 = high (e.g. overdue), 2 = medium, 3 = low
  ctaRoute?: string | null;
};

function buildPrompt(raw: RawPredictions): string {
  const parts: string[] = [
    'You are a household assistant. Below are raw predictions computed from the user\'s data. Generate 1-2 short, friendly insight sentences per category that has data. Be specific (use numbers and names). No bullet points in the body—use one flowing sentence. Return JSON only, no markdown.',
    '',
    'Categories to include:',
  ];
  if (raw.spending && (raw.spending.nextMonthBillsTotal > 0 || raw.spending.last3MonthsAvgExpenses > 0)) {
    parts.push(`SPENDING: Next month bills total $${raw.spending.nextMonthBillsTotal.toFixed(0)} (${raw.spending.nextMonthBillsCount} bills). Last 3 months avg expenses $${raw.spending.last3MonthsAvgExpenses.toFixed(0)}. ${raw.spending.utilitiesSummerVsWinter ? `Utilities trend: summer vs winter ratio ${raw.spending.utilitiesSummerVsWinter.toFixed(2)}.` : ''}`);
  }
  if (raw.growth.length > 0) {
    parts.push('GROWTH: ' + raw.growth.map((g) => `${g.name}: next shoe size ${g.nextShoeSize} in ~${g.monthsUntilNextSize} months. ${g.growthNote ?? ''}`).join(' | '));
  }
  if (raw.maintenance.length > 0) {
    parts.push('MAINTENANCE: ' + raw.maintenance.map((m) => `${m.vehicleLabel}: ${m.message}`).join(' | '));
  }
  if (raw.health.length > 0) {
    parts.push('HEALTH: ' + raw.health.map((h) => h.message).join(' | '));
  }
  parts.push('');
  parts.push('Return a JSON object with key "items" and value an array of objects: [{ "category": "spending"|"growth"|"maintenance"|"health", "title": "Short title", "body": "One friendly sentence.", "priority": 1|2|3 }]. Max 6 items. priority 1 = urgent (overdue/soon), 2 = soon, 3 = informational.');
  return parts.join('\n');
}

export async function generatePredictionInsights(raw: RawPredictions): Promise<PredictionInsight[]> {
  const hasAny =
    (raw.spending && (raw.spending.nextMonthBillsTotal > 0 || raw.spending.last3MonthsAvgExpenses > 0)) ||
    raw.growth.length > 0 ||
    raw.maintenance.length > 0 ||
    raw.health.length > 0;
  if (!hasAny) return [];

  // Without OpenAI, return simple text from raw data
  if (!hasOpenAIKey || !OPENAI_API_KEY) {
    const fallback: PredictionInsight[] = [];
    if (raw.spending && raw.spending.nextMonthBillsTotal > 0) {
      fallback.push({
        id: 'spend-1',
        category: 'spending',
        title: 'Bills next month',
        body: `Your bills next month will be about $${raw.spending.nextMonthBillsTotal.toFixed(0)} (${raw.spending.nextMonthBillsCount} bills).`,
        priority: 2,
        ctaRoute: '/(tabs)/documents',
      });
    }
    if (raw.spending?.utilitiesSummerVsWinter && raw.spending.utilitiesSummerVsWinter > 1.1) {
      fallback.push({
        id: 'spend-2',
        category: 'spending',
        title: 'Seasonal spending',
        body: 'You usually spend more on utilities in summer—consider budgeting extra.',
        priority: 3,
      });
    }
    raw.maintenance.forEach((m, i) => {
      fallback.push({
        id: `maint-${i}`,
        category: 'maintenance',
        title: m.vehicleLabel,
        body: m.message,
        priority: m.milesUntilOilChange != null && m.milesUntilOilChange <= 500 ? 1 : 2,
        ctaRoute: '/(tabs)/household',
      });
    });
    raw.health.forEach((h, i) => {
      fallback.push({
        id: `health-${i}`,
        category: 'health',
        title: h.type === 'dental' ? 'Dental checkup' : 'Annual physical',
        body: h.message,
        priority: h.monthsSince >= 12 ? 1 : 2,
        ctaRoute: '/(tabs)/calendar',
      });
    });
    raw.growth.forEach((g, i) => {
      const body = g.nextShoeSize
        ? `Based on growth, ${g.name} may need size ${g.nextShoeSize} shoes in ~${g.monthsUntilNextSize ?? '?'} months.`
        : (g.growthNote ?? `Growth record for ${g.name}.`);
      fallback.push({
        id: `growth-${i}`,
        category: 'growth',
        title: g.name,
        body,
        priority: 3,
        ctaRoute: null,
      });
    });
    return fallback.slice(0, 6);
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You output only valid JSON arrays. No markdown, no explanation.' },
          { role: 'user', content: buildPrompt(raw) },
        ],
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) return [];
    const parsed = JSON.parse(text);
    const arr = Array.isArray(parsed) ? parsed : parsed.items ?? parsed.insights ?? [];
    return arr.slice(0, 6).map((item: Record<string, unknown>, i: number) => ({
      id: `ai-${i}-${item.category ?? 'misc'}`,
      category: (item.category as PredictionInsight['category']) ?? 'spending',
      title: String(item.title ?? 'Insight'),
      body: String(item.body ?? ''),
      priority: typeof item.priority === 'number' ? item.priority : 2,
      ctaRoute: item.cta_route != null ? String(item.cta_route) : null,
    }));
  } catch {
    return [];
  }
}
