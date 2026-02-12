export type ParsedTransaction = {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
};

export type ParseResult = {
  transactions: ParsedTransaction[];
  metadata?: {
    startDate?: string;
    endDate?: string;
    startingBalance?: number;
    endingBalance?: number;
  };
};

function normalizeDate(val: string): string {
  const s = val.trim();
  if (!s) return '';

  const dashMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) {
    return `${dashMatch[1]}-${dashMatch[2]}-${dashMatch[3]}`;
  }

  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, m, d, y] = slashMatch;
    const mm = m!.padStart(2, '0');
    const dd = d!.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  const slashMatch2 = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (slashMatch2) {
    const [, y, m, d] = slashMatch2;
    const mm = m!.padStart(2, '0');
    const dd = d!.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  return s;
}

function parseAmount(val: string): number {
  const cleaned = val.replace(/[$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseCSVStatement(csvContent: string): ParseResult {
  const lines = csvContent.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { transactions: [] };

  const headerLine = lines[0];
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());

  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };

  const dateIdx = colIdx(['date', 'posting date', 'trans date']);
  const descIdx = colIdx(['description', 'memo', 'details', 'name', 'payee']);
  const amountIdx = colIdx(['amount', 'transaction amount']);
  const debitIdx = colIdx(['debit', 'withdrawal']);
  const creditIdx = colIdx(['credit', 'deposit']);

  if (dateIdx < 0) return { transactions: [] };

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',').map((p) => p.trim());

    const dateVal = dateIdx >= 0 ? parts[dateIdx] ?? '' : '';
    const date = normalizeDate(dateVal);
    if (!date || date.length < 10) continue;

    const description = (descIdx >= 0 ? parts[descIdx] ?? '' : '').trim() || 'Unknown';

    let amount = 0;
    let type: 'income' | 'expense' = 'expense';

    if (amountIdx >= 0) {
      const raw = parts[amountIdx] ?? '';
      amount = Math.abs(parseAmount(raw));
      if (raw.startsWith('-') || raw.includes('(')) {
        type = 'expense';
      } else {
        type = 'income';
      }
    } else if (debitIdx >= 0 || creditIdx >= 0) {
      const debit = debitIdx >= 0 ? parseAmount(parts[debitIdx] ?? '') : 0;
      const credit = creditIdx >= 0 ? parseAmount(parts[creditIdx] ?? '') : 0;
      if (debit > 0) {
        amount = debit;
        type = 'expense';
      } else if (credit > 0) {
        amount = credit;
        type = 'income';
      }
    }

    if (amount <= 0) continue;

    transactions.push({ date, description, amount, type });
  }

  let metadata: ParseResult['metadata'];
  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.date).filter(Boolean).sort();
    if (dates.length > 0) {
      metadata = {
        startDate: dates[0],
        endDate: dates[dates.length - 1],
      };
    }
  }

  return { transactions, metadata };
}
