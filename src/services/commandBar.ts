/**
 * Universal command bar: parse natural language and execute actions.
 * Intents: bills_due_week, shoe_size, add_reminder, spending_summary, registration_due, call_contact, pay_bill, search
 */

import { addDays, format, subMonths, parseISO } from 'date-fns';
import type { Bill, BillWithVendor } from '../types/bills';
import type { GrowthRecord } from '../types/growthRecords';
import type { Vehicle } from '../types/vehicles';
import type { HomeServiceContact } from '../types/homeServices';
import type { Appointment } from '../types/appointments';

export type CommandIntent =
  | 'bills_due_week'
  | 'shoe_size'
  | 'add_reminder'
  | 'spending_summary'
  | 'registration_due'
  | 'call_contact'
  | 'pay_bill'
  | 'mark_bill_paid'
  | 'search';

export type CommandParseResult = {
  intent: CommandIntent;
  entities: {
    personName?: string;
    category?: string;
    period?: string; // 'last_month' | 'this_week' | 'tomorrow'
    contactType?: string; // dentist, plumber, etc.
    billName?: string;
    reminderTitle?: string;
    reminderWhen?: string;
  };
};

export type CommandAction = {
  label: string;
  type: 'navigate' | 'open_url' | 'call' | 'create_reminder' | 'mark_bill_paid';
  payload: string | { route: string; params?: Record<string, string> };
};

export type CommandResult = {
  answer: string;
  actions: CommandAction[];
  /** For search intent: raw result counts per type */
  searchSummary?: Record<string, number>;
};

export type CommandData = {
  bills: BillWithVendor[] | Bill[];
  growthRecords: GrowthRecord[];
  vehicles: Vehicle[];
  homeServiceContacts: HomeServiceContact[];
  appointments: Appointment[];
  /** Spending by category for period (e.g. last month) */
  spendingByCategory?: Record<string, number>;
  spendingTotal?: number;
};

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Rule-based parser. Returns intent + extracted entities.
 */
export function parseCommand(query: string): CommandParseResult {
  const q = normalizeQuery(query);
  const entities: CommandParseResult['entities'] = {};

  // Bills due this week
  if (/\b(bills?|payments?)\s+due\s+(this\s+)?week\b|\ball\s+bills?\s+due\s+this\s+week\b|show\s+me\s+.*bills?\s+due/i.test(q)) {
    return { intent: 'bills_due_week', entities: { period: 'this_week' } };
  }

  // Shoe size
  const shoeMatch = q.match(/(?:what'?s?|what is|jake'?s?|emma'?s?|(\w+)'?s?)\s+(?:shoe\s+size|shoes?)\b/i) ?? q.match(/\b(?:shoe\s+size|shoes?)\s+(?:for\s+)?(\w+)\b/i);
  if (shoeMatch || /\bshoe\s+size\b/i.test(q)) {
    const name = shoeMatch?.[1] ?? q.split(/\s+/).find((w) => w.length > 2 && !/what|shoe|size|is|the|for/.test(w));
    return { intent: 'shoe_size', entities: { personName: name ?? undefined } };
  }

  // Add reminder
  if (/\b(?:add|create|set|remind me to)\s+reminder\b|\breminder\s+to\s+(\w+)/i.test(q) || /\b(?:call|phone)\s+(\w+)\s+(?:tomorrow|next week)\b/i.test(q)) {
    let reminderTitle = '';
    if (/reminder\s+to\s+(.+?)(?:\s+tomorrow|\s+next|\s+on|$)/i.test(q)) {
      const m = q.match(/reminder\s+to\s+(.+?)(?:\s+tomorrow|\s+next|$)/i);
      reminderTitle = (m?.[1] ?? q).trim();
    } else if (/call\s+(.+?)\s+tomorrow/i.test(q)) {
      reminderTitle = 'Call ' + (q.match(/call\s+(.+?)\s+tomorrow/i)?.[1] ?? 'someone').trim();
    } else {
      reminderTitle = q.replace(/^(add|create|set)\s+reminder\s+to\s+/i, '').replace(/\s+(tomorrow|next week|on\s+\w+).*$/i, '').trim() || 'Reminder';
    }
    let reminderWhen = 'tomorrow';
    if (/next\s+week/i.test(q)) reminderWhen = 'next_week';
    else if (/tomorrow/i.test(q)) reminderWhen = 'tomorrow';
    return { intent: 'add_reminder', entities: { reminderTitle, reminderWhen } };
  }

  // Spending summary
  if (/\bhow\s+much\s+(?:did\s+we\s+)?spend/i.test(q) || /\bspent\s+on\s+(\w+)/i.test(q) || /\bspending\s+(?:on\s+)?(\w+)/i.test(q)) {
    const catMatch = q.match(/(?:on|for)\s+(\w+)(?:\s+last\s+month)?/i) ?? q.match(/spend\s+.*\s+(\w+)/i);
    const category = catMatch?.[1];
    const period = /last\s+month/i.test(q) ? 'last_month' : 'this_month';
    return { intent: 'spending_summary', entities: { category, period } };
  }

  // Car registration
  if (/\b(?:when\s+is\s+)?(?:the\s+)?(?:car\s+)?registration\s+due\b|\bregistration\s+(?:expir|due)/i.test(q)) {
    return { intent: 'registration_due', entities: {} };
  }

  // Call contact (dentist, plumber)
  if (/\bcall\s+(?:the\s+)?(\w+)\b/i.test(q) && !/tomorrow|next week/i.test(q)) {
    const m = q.match(/call\s+(?:the\s+)?(\w+)/i);
    return { intent: 'call_contact', entities: { contactType: m?.[1] ?? undefined } };
  }

  // Pay bill
  if (/\bpay\s+(?:the\s+)?(.+?)\s+bill\b|\bpay\s+(.+?)\s+bill\b|(?:electric|internet|txu|at&t)\s+bill\s+pay/i.test(q)) {
    const m = q.match(/pay\s+(?:the\s+)?(.+?)\s+bill\b/i) ?? q.match(/pay\s+(.+?)(?:\s+bill)?/i);
    return { intent: 'pay_bill', entities: { billName: m?.[1]?.trim() ?? 'electric' } };
  }

  // Mark bill paid ("mark electric bill paid", "hey mark TXU paid")
  if (/\bmark\s+(?:the\s+)?(.+?)\s+(?:bill\s+)?paid\b|\bmark\s+(.+?)\s+paid\b/i.test(q)) {
    const m = q.match(/mark\s+(?:the\s+)?(.+?)\s+(?:bill\s+)?paid\b/i) ?? q.match(/mark\s+(.+?)\s+paid\b/i);
    return { intent: 'mark_bill_paid', entities: { billName: m?.[1]?.trim() ?? undefined } };
  }

  // Default: search
  return { intent: 'search', entities: {} };
}

function getBillsDueThisWeek(bills: BillWithVendor[] | Bill[]): Bill[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekEnd = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  return bills.filter((b) => b.status === 'pending' && b.due_date >= today && b.due_date <= weekEnd) as Bill[];
}

function resolveReminderDate(when: string): string {
  if (when === 'tomorrow') return format(addDays(new Date(), 1), 'yyyy-MM-dd');
  if (when === 'next_week') return format(addDays(new Date(), 7), 'yyyy-MM-dd');
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}

/**
 * Execute parsed command with current data. Returns answer text + action buttons.
 */
export function executeCommand(parseResult: CommandParseResult, data: CommandData): CommandResult {
  const { intent, entities } = parseResult;

  switch (intent) {
    case 'bills_due_week': {
      const due = getBillsDueThisWeek(data.bills);
      const total = due.reduce((s, b) => s + Number(b.amount), 0);
      const answer = due.length === 0
        ? "You have no bills due this week."
        : `I found ${due.length} bill${due.length === 1 ? '' : 's'} due this week ($${total.toFixed(2)} total).`;
      const actions: CommandAction[] = due.length > 0
        ? [{ label: 'Show bills', type: 'navigate', payload: { route: '/(tabs)', params: {} } }]
        : [];
      return { answer, actions };
    }

    case 'shoe_size': {
      const name = entities.personName?.toLowerCase();
      const records = data.growthRecords
        .filter((r) => !name || r.name.toLowerCase().includes(name))
        .sort((a, b) => b.record_date.localeCompare(a.record_date));
      const latest = records[0];
      if (!latest) {
        return {
          answer: entities.personName ? `I don't have a shoe size on file for ${entities.personName}.` : "I don't have any growth records with shoe size.",
          actions: [{ label: 'Add growth record', type: 'navigate', payload: '/(modals)/add-appointment' }],
        };
      }
      const size = latest.shoe_size ?? 'not recorded';
      return {
        answer: `${latest.name}'s latest shoe size is ${size} (recorded ${format(parseISO(latest.record_date), 'MMM d, yyyy')}).`,
        actions: [{ label: 'View growth records', type: 'navigate', payload: '/(tabs)' }],
      };
    }

    case 'add_reminder': {
      const title = entities.reminderTitle ?? 'Reminder';
      const date = resolveReminderDate(entities.reminderWhen ?? 'tomorrow');
      return {
        answer: `I'll add a reminder: "${title}" for ${format(parseISO(date), 'EEEE, MMM d')}.`,
        actions: [
          {
            label: 'Add reminder',
            type: 'create_reminder',
            payload: JSON.stringify({ title, appointment_date: date }),
          },
        ],
      };
    }

    case 'spending_summary': {
      const cat = entities.category?.toLowerCase();
      const byCat = data.spendingByCategory ?? {};
      const total = data.spendingTotal ?? 0;
      if (cat) {
        const categoryKey = Object.keys(byCat).find((k) => k.toLowerCase().includes(cat));
        const amount = categoryKey ? byCat[categoryKey] : 0;
        const label = categoryKey ?? cat;
        return {
          answer: amount > 0
            ? `You spent $${amount.toFixed(2)} on ${label} last month.`
            : `I didn't find spending for "${cat}" last month.`,
          actions: [{ label: 'View transactions', type: 'navigate', payload: '/(tabs)/transactions' }],
        };
      }
      return {
        answer: total > 0 ? `You spent $${total.toFixed(2)} last month total.` : "No spending data for last month.",
        actions: [{ label: 'View transactions', type: 'navigate', payload: '/(tabs)/transactions' }],
      };
    }

    case 'registration_due': {
      const withReg = data.vehicles.filter((v) => v.registration_expiry);
      if (withReg.length === 0) {
        return { answer: "No vehicle registration dates on file.", actions: [{ label: 'Vehicles', type: 'navigate', payload: '/vehicles' }] };
      }
      const lines = withReg.map((v) => {
        const label = [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';
        const d = v.registration_expiry ? format(parseISO(v.registration_expiry), 'MMMM d, yyyy') : '—';
        return `${label}: ${d}`;
      });
      return {
        answer: 'Registration due:\n' + lines.join('\n'),
        actions: [{ label: 'View vehicles', type: 'navigate', payload: '/vehicles' }],
      };
    }

    case 'call_contact': {
      const type = (entities.contactType ?? '').toLowerCase();
      const contacts = data.homeServiceContacts.filter(
        (c) => c.service_type?.toLowerCase().includes(type) || c.name?.toLowerCase().includes(type)
      );
      const withPhone = contacts.filter((c) => c.phone?.trim());
      if (withPhone.length === 0) {
        return {
          answer: type ? `I don't have a phone number for ${type}.` : "I don't have that contact's number.",
          actions: [{ label: 'Home services', type: 'navigate', payload: '/home-services' }],
        };
      }
      const first = withPhone[0];
      const tel = (first.phone ?? '').replace(/\D/g, '');
      const displayName = first.name ?? type;
      return {
        answer: `I found ${displayName}. Tap to call.`,
        actions: [{ label: `Call ${displayName}`, type: 'call', payload: tel ? `tel:${tel}` : '' }],
      };
    }

    case 'pay_bill': {
      const term = (entities.billName ?? 'electric').toLowerCase();
      const match = data.bills.find(
        (b) =>
          (b as Bill).payment_url &&
          ((b as Bill).bill_name?.toLowerCase().includes(term) ||
            (b as Bill).provider_name?.toLowerCase().includes(term))
      ) as Bill | undefined;
      if (!match?.payment_url) {
        return {
          answer: `I couldn't find a bill with a payment link for "${entities.billName ?? 'that'}".`,
          actions: [{ label: 'View bills', type: 'navigate', payload: '/(tabs)' }],
        };
      }
      const name = match.bill_name ?? match.provider_name ?? 'Bill';
      return {
        answer: `Opening ${name} payment link.`,
        actions: [{ label: `Pay ${name}`, type: 'open_url', payload: match.payment_url }],
      };
    }

    case 'mark_bill_paid': {
      const term = (entities.billName ?? '').toLowerCase();
      const pending = data.bills.filter(
        (b) => (b as Bill).status === 'pending' && ((b as Bill).bill_name?.toLowerCase().includes(term) || (b as Bill).provider_name?.toLowerCase().includes(term))
      ) as Bill[];
      if (pending.length === 0) {
        return {
          answer: term ? `I couldn't find a pending bill matching "${entities.billName}".` : "I don't see a pending bill to mark paid.",
          actions: [{ label: 'View bills', type: 'navigate', payload: '/(tabs)' }],
        };
      }
      const bill = pending[0];
      const billName = bill.bill_name ?? bill.provider_name ?? 'Bill';
      return {
        answer: `I found ${billName}. Tap to mark it paid.`,
        actions: [
          {
            label: `Mark ${billName} paid`,
            type: 'mark_bill_paid',
            payload: JSON.stringify({ billId: bill.id, amount: bill.amount }),
          },
        ],
      };
    }

    case 'search':
    default:
      return {
        answer: 'Type to search across bills, documents, vehicles, pets, appointments, and more.',
        actions: [],
        searchSummary: {},
      };
  }
}

/** Build search summary for "I found X" from GlobalSearchResult-style counts */
export function buildSearchResultAnswer(summary: Record<string, number>): string {
  const parts = Object.entries(summary)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${n} ${type}`);
  if (parts.length === 0) return "I didn't find anything matching that.";
  return `I found ${parts.join(', ')}.`;
}
