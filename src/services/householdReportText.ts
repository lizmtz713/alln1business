/**
 * Generate AI-powered monthly household report text from aggregated data.
 */
import type { HouseholdReportData } from './householdReport';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';

function buildReportPrompt(data: HouseholdReportData): string {
  const lines: string[] = [
    `You are a friendly household assistant. Generate a SHORT monthly household report for ${data.monthName} ${data.year}.`,
    'Use the exact structure below. Use emoji only where shown. Be concise (one line per section when possible).',
    '',
    'Structure:',
    '1. SPENDING: One line about bills (total spent this month, and if we have last month data say "up X%" or "down X%" from LastMonth).',
    '2. FAMILY: Birthdays coming up (e.g. "Jake\'s birthday in 2 weeks!") and growth/shoes (e.g. "Emma needs new shoes (grew 0.5 size)"). Skip if no data.',
    '3. VEHICLES: Oil change due (miles or date) and registration status (e.g. "registration good until August"). Skip if no vehicles.',
    '4. PETS: Vaccination reminders (e.g. "Max is due for annual vaccines next month"). Skip if no pets or no due dates.',
    '5. UPCOMING: Count of appointments and bills due (e.g. "4 appointments scheduled, 6 bills due").',
    '',
    'Data:',
  ];

  if (data.spending) {
    lines.push(`SPENDING: This month $${data.spending.thisMonthTotal.toFixed(0)} on ${data.spending.thisMonthCount} bills. Last month: $${data.spending.lastMonthTotal.toFixed(0)}. Percent change: ${data.spending.percentChange ?? 'n/a'}.`);
  }
  if (data.family.length > 0) {
    lines.push('FAMILY: ' + data.family.map((f) => `${f.name}${f.birthdayLabel ? ` birthday ${f.birthdayLabel}` : ''}`).filter(Boolean).join('; '));
  }
  if (data.growth.length > 0) {
    lines.push('GROWTH: ' + data.growth.map((g) => `${g.name} next shoe size ${g.nextShoeSize ?? '?'} in ~${g.monthsUntilNextSize ?? '?'} months`).join('; '));
  }
  if (data.vehicles.length > 0) {
    lines.push('VEHICLES: ' + data.vehicles.map((v) => `${v.label}: ${v.oilChangeMessage ?? '—'} ${v.registrationLabel ?? ''}`).join(' | '));
  }
  if (data.pets.length > 0) {
    lines.push('PETS: ' + data.pets.map((p) => `${p.name}${p.vaccinationDueLabel ? ` ${p.vaccinationDueLabel}` : ''}`).filter(Boolean).join('; '));
  }
  lines.push(`UPCOMING: ${data.upcoming.appointmentsCount} appointments, ${data.upcoming.billsDueCount} bills due.`);
  lines.push('');
  lines.push('Return ONLY the report text. Start with "Your [Month] Household Report:" then the 5 sections with emoji headers. No extra commentary.');

  return lines.join('\n');
}

function fallbackReportText(data: HouseholdReportData): string {
  const parts: string[] = [`Your ${data.monthName} Household Report:`];

  if (data.spending && (data.spending.thisMonthTotal > 0 || data.spending.thisMonthCount > 0)) {
    const change = data.spending.percentChange != null
      ? (data.spending.percentChange > 0 ? ` up ${data.spending.percentChange}%` : ` down ${Math.abs(data.spending.percentChange)}%`) + ` from ${data.spending.lastMonthName}`
      : '';
    parts.push(`\n📊 SPENDING: $${data.spending.thisMonthTotal.toFixed(0)} on bills (${data.spending.thisMonthCount} bills)${change}`);
  } else {
    parts.push('\n📊 SPENDING: No bill payments recorded this month.');
  }

  const familyLines: string[] = [];
  data.family.forEach((f) => {
    if (f.birthdayLabel) familyLines.push(`${f.name}'s birthday ${f.birthdayLabel}!`);
  });
  data.growth.forEach((g) => {
    familyLines.push(`${g.name} needs new shoes (size ${g.nextShoeSize ?? '?'} in ~${g.monthsUntilNextSize ?? '?'} months)`);
  });
  if (familyLines.length > 0) {
    parts.push('\n👨‍👩‍👧‍👦 FAMILY: ' + familyLines.join(' '));
  } else {
    parts.push('\n👨‍👩‍👧‍👦 FAMILY: No birthdays or growth updates this month.');
  }

  if (data.vehicles.length > 0) {
    const vLines = data.vehicles.map((v) => {
      const o = v.oilChangeMessage ?? 'No oil change due';
      const r = v.registrationLabel ?? '';
      return `${v.label}: ${o}${r ? ', ' + r : ''}`;
    });
    parts.push('\n🚗 VEHICLES: ' + vLines.join(' | '));
  } else {
    parts.push('\n🚗 VEHICLES: No vehicles on file.');
  }

  if (data.pets.length > 0) {
    const pLines = data.pets.map((p) => p.vaccinationDueLabel ? `${p.name} is ${p.vaccinationDueLabel}` : `${p.name} — no vaccine due soon`).join('; ');
    parts.push('\n🐕 PETS: ' + pLines);
  } else {
    parts.push('\n🐕 PETS: No pets on file.');
  }

  parts.push(`\n📅 UPCOMING: ${data.upcoming.appointmentsCount} appointments scheduled, ${data.upcoming.billsDueCount} bills due.`);

  return parts.join('');
}

export async function generateHouseholdReportText(data: HouseholdReportData): Promise<string> {
  if (!OPENAI_API_KEY) return fallbackReportText(data);

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
          { role: 'system', content: 'You generate concise monthly household reports. Use the exact section headers and emoji requested. Output only the report, no preamble.' },
          { role: 'user', content: buildReportPrompt(data) },
        ],
        max_tokens: 600,
      }),
    });

    if (!res.ok) return fallbackReportText(data);

    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content?.trim();
    if (text) return text;
  } catch {
    /* ignore */
  }

  return fallbackReportText(data);
}
