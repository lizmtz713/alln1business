import type { Bill } from '../types/bills';

/** Normalize for matching: lowercase, remove punctuation, collapse spaces, drop common suffixes */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*(inc\.?|llc\.?|corp\.?|co\.?|ltd\.?)\s*$/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Score 0..1 for how well scanned provider matches a bill */
function scoreMatch(scanned: string, bill: Bill): number {
  const a = normalize(scanned);
  if (!a) return 0;
  const b = normalize(bill.provider_name ?? '');
  const c = normalize(bill.bill_name ?? '');
  if (b.includes(a) || a.includes(b)) return 0.9;
  if (c.includes(a) || a.includes(c)) return 0.85;
  const wordsA = a.split(/\s+/).filter((w) => w.length > 1);
  const wordsB = (b + ' ' + c).split(/\s+/).filter((w) => w.length > 1);
  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.some((x) => x.includes(w) || w.includes(x))) matches++;
  }
  if (wordsA.length === 0) return 0;
  return (matches / Math.max(wordsA.length, wordsB.length)) * 0.8;
}

/** Return the best matching bill if score >= threshold, else null */
export function matchScannedBillToExisting(
  scannedProviderName: string,
  existingBills: Bill[],
  threshold = 0.5
): Bill | null {
  let best: { bill: Bill; score: number } | null = null;
  for (const bill of existingBills) {
    const s = scoreMatch(scannedProviderName, bill);
    if (s >= threshold && (!best || s > best.score)) best = { bill, score: s };
  }
  return best?.bill ?? null;
}
