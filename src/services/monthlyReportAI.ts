/**
 * AI-generated monthly report: summary, highlights, cost analysis, personalized suggestions.
 * E.g. "Your Netflix and Hulu cost $30/month - consider bundling?"
 */
import { format, parseISO } from 'date-fns';
import type { MonthlyReportData } from './monthlyReport';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

export type MonthlyReportOutput = {
  summary: string;
  highlights: string[];
  suggestions: string[];
};

function buildPrompt(data: MonthlyReportData): string {
  const parts: string[] = [
    'You are a friendly household assistant. Generate a monthly report with:',
    '1. A short 2-3 sentence SUMMARY of the household this month (spending, family, any notable items).',
    '2. HIGHLIGHTS: 3-5 bullet points of the most important upcoming items (bills due, appointments, birthdays, registration, pet vaccines). Be specific with names and dates.',
    '3. SUGGESTIONS: 1-3 personalized tips. Examples:',
    '   - If they have multiple streaming bills (Netflix, Hulu, etc.): "Your Netflix and Hulu cost $X/month - consider bundling?"',
    '   - If spending is up: "Bills were X% higher than last month - check for any one-time charges."',
    '   - If registration or vaccine due: "Car registration due in August - add a reminder?"',
    '   - If multiple similar utilities: "You have 3 utility bills this month - consider autopay to avoid late fees."',
    'Return ONLY valid JSON: { "summary": "...", "highlights": ["...", "..."], "suggestions": ["..."] }',
    '',
    'Data:',
  ];

  if (data.spending) {
    parts.push(`SPENDING: This month $${data.spending.thisMonthTotal.toFixed(0)} (${data.spending.thisMonthCount} bills). Last month: $${data.spending.lastMonthTotal.toFixed(0)}. Change: ${data.spending.percentChange ?? 0}%.`);
  }
  parts.push(`COST GROUPS: ${JSON.stringify(data.costGroups.map((g) => ({ label: g.label, total: g.total, bills: g.bills.map((b) => b.bill_name || b.provider_name) })))}`);
  parts.push(`TRENDS (last 3 months): ${JSON.stringify(data.trends)}`);
  parts.push(`UPCOMING HIGHLIGHTS: ${JSON.stringify(data.upcomingHighlights)}`);
  parts.push(`FAMILY: ${data.family.map((f) => `${f.name}${f.birthdayLabel ? ` birthday ${f.birthdayLabel}` : ''}`).join('; ')}`);
  parts.push(`UPCOMING: ${data.upcoming.appointmentsCount} appointments, ${data.upcoming.billsDueCount} bills due.`);

  return parts.join('\n');
}

function fallbackOutput(data: MonthlyReportData): MonthlyReportOutput {
  const summaryParts: string[] = [];
  if (data.spending && data.spending.thisMonthTotal > 0) {
    const change = data.spending.percentChange != null
      ? (data.spending.percentChange > 0 ? ` up ${data.spending.percentChange}%` : ` down ${Math.abs(data.spending.percentChange)}%`) + ` from ${data.spending.lastMonthName}`
      : '';
    summaryParts.push(`You spent $${data.spending.thisMonthTotal.toFixed(0)} on bills this month (${data.spending.thisMonthCount} bills)${change}.`);
  }
  summaryParts.push(`${data.upcoming.appointmentsCount} appointments and ${data.upcoming.billsDueCount} bills coming up.`);
  if (data.family.some((f) => f.birthdayLabel)) {
    summaryParts.push(data.family.filter((f) => f.birthdayLabel).map((f) => `${f.name}'s birthday ${f.birthdayLabel}`).join(', ') + '.');
  }

  const highlights = data.upcomingHighlights.slice(0, 5).map((h) => {
    if (h.date && h.detail) return `${h.label} — ${h.detail} (${formatHighlightDate(h.date)})`;
    return h.detail ? `${h.label}: ${h.detail}` : h.label;
  });

  const suggestions: string[] = [];
  const streaming = data.costGroups.find((g) => g.label.toLowerCase().includes('streaming'));
  if (streaming && streaming.bills.length >= 2) {
    suggestions.push(`Your ${streaming.bills.map((b) => b.bill_name || b.provider_name).join(' and ')} cost $${streaming.total.toFixed(0)}/month — consider bundling?`);
  }
  if (data.spending?.percentChange != null && data.spending.percentChange > 15) {
    suggestions.push(`Bills were ${data.spending.percentChange}% higher than last month — check for one-time charges.`);
  }

  return {
    summary: summaryParts.join(' ') || 'Your monthly household snapshot is ready.',
    highlights,
    suggestions,
  };
}

function formatHighlightDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'MMM d');
  } catch {
    return dateStr;
  }
}

export async function generateMonthlyReportAI(data: MonthlyReportData): Promise<MonthlyReportOutput> {
  if (!OPENAI_API_KEY) return fallbackOutput(data);

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
          { role: 'system', content: 'You generate monthly household reports. Output only valid JSON with keys summary, highlights (array of strings), suggestions (array of strings).' },
          { role: 'user', content: buildPrompt(data) },
        ],
        max_tokens: 800,
      }),
    });
    if (!res.ok) return fallbackOutput(data);
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content?.trim();
    if (!raw) return fallbackOutput(data);
    const parsed = JSON.parse(raw) as MonthlyReportOutput;
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : fallbackOutput(data).summary,
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return fallbackOutput(data);
  }
}

/** Full report text for display and share (summary + highlights + suggestions) */
export function formatMonthlyReportText(
  monthName: string,
  year: number,
  output: MonthlyReportOutput
): string {
  const lines: string[] = [
    `Your ${monthName} ${year} Household Report`,
    '',
    output.summary,
    '',
    '📌 Important upcoming',
    ...output.highlights.map((h) => `• ${h}`),
    '',
    '💡 Suggestions',
    ...output.suggestions.map((s) => `• ${s}`),
  ];
  return lines.join('\n');
}
