export type BrowsingEnvironment = 'browser' | 'in_app' | 'standalone';
export function browsingEnvironment(userAgent: string, standalone: boolean): BrowsingEnvironment {
  if (standalone) return 'standalone';
  return /KAKAOTALK|Instagram|FBAN|FBAV|LinkedInApp|\bLine\/|; wv\)/i.test(userAgent) ? 'in_app' : 'browser';
}

export type OutboundClick = {
  event: 'eatpl_open';
  placement: 'list' | 'detail';
  page: 'home' | 'share';
  browser: BrowsingEnvironment;
  activation: 'same_tab' | 'new_tab';
};
export function parseOutboundClick(value: unknown): OutboundClick | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).length !== 5 || row.event !== 'eatpl_open'
    || !['list', 'detail'].includes(row.placement as string)
    || !['home', 'share'].includes(row.page as string)
    || !['browser', 'in_app', 'standalone'].includes(row.browser as string)
    || !['same_tab', 'new_tab'].includes(row.activation as string)) return null;
  return { event: 'eatpl_open', placement: row.placement, page: row.page, browser: row.browser, activation: row.activation } as OutboundClick;
}

type Transport = { beacon?: (url: string, body: string) => boolean; fetch: typeof fetch };
// Diagnostics must never delay, cancel, or replace the user's original link navigation.
export function reportOutboundClick(payload: OutboundClick, transport: Transport = {
  beacon: typeof navigator !== 'undefined' && navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : undefined,
  fetch: globalThis.fetch.bind(globalThis),
}): void {
  const body = JSON.stringify(payload);
  try { if (transport.beacon?.('/api/outbound', body)) return; } catch { /* Try keepalive instead. */ }
  try {
    void transport.fetch('/api/outbound', { method: 'POST', body, headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, keepalive: true, credentials: 'same-origin', cache: 'no-store' }).catch(() => { /* Navigation still proceeds. */ });
  } catch { /* Diagnostics are optional even if fetch is unavailable. */ }
}
