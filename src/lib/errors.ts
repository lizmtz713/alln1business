export function normalizeError(e: unknown): string {
  if (e == null) return 'Something went wrong';
  if (typeof e === 'string') return e;
  if (e instanceof Error) {
    const msg = e.message?.trim();
    if (msg) return msg;
    return e.name || 'Something went wrong';
  }
  if (typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return 'Something went wrong';
}

const NETWORK_PATTERNS = [
  /network/i,
  /fetch failed/i,
  /network request failed/i,
  /internet/i,
  /offline/i,
  /timeout/i,
  /econnrefused/i,
  /enotfound/i,
  /failed to load/i,
];

export function isNetworkError(e: unknown): boolean {
  const msg = normalizeError(e);
  return NETWORK_PATTERNS.some((p) => p.test(msg));
}
