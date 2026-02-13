/**
 * Orchestrates monthly report: generate data + AI + save + push notification.
 * Call ensureMonthlyReportForCurrentMonth() on app load / dashboard focus to "run on 1st".
 */
import { format } from 'date-fns';
import { generateMonthlyReportData, getMonthlyReport, saveMonthlyReport, shouldRunMonthlyReportToday } from './monthlyReport';
import { generateMonthlyReportAI } from './monthlyReportAI';
import { scheduleInsightNotification } from './notificationSchedule';

/** Generate report for a given month (yyyy-MM-01), save to DB, and optionally send push. */
export async function generateAndSaveMonthlyReport(
  userId: string,
  reportMonth: string,
  options: { sendPush?: boolean } = {}
): Promise<{ saved: boolean; summary?: string }> {
  const data = await generateMonthlyReportData(userId);
  const ai = await generateMonthlyReportAI(data);
  const monthDate = reportMonth.slice(0, 7); // yyyy-MM
  const [y, m] = monthDate.split('-').map(Number);
  const monthName = format(new Date(y, m - 1, 1), 'MMMM');

  const saved = await saveMonthlyReport(userId, reportMonth, {
    summary: ai.summary,
    highlights: ai.highlights,
    suggestions: ai.suggestions,
    costAnalysis: {
      costGroups: data.costGroups,
      trends: data.trends,
    },
  });

  if (saved && options.sendPush !== false) {
    await scheduleInsightNotification(
      `Your ${monthName} Household Report is ready`,
      'Tap to view summary, highlights, and personalized suggestions.'
    );
  }

  return { saved: !!saved, summary: ai.summary };
}

/**
 * If today is the 1st of the month and there's no report for current month, generate and save.
 * Call from app root or dashboard when user is signed in.
 */
export async function ensureMonthlyReportForCurrentMonth(userId: string): Promise<void> {
  if (!shouldRunMonthlyReportToday()) return;
  const now = new Date();
  const reportMonth = format(now, 'yyyy-MM-01');
  const existing = await getMonthlyReport(userId, reportMonth);
  if (existing) return;
  await generateAndSaveMonthlyReport(userId, reportMonth, { sendPush: true });
}
