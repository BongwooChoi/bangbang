import { neon } from '@neondatabase/serverless';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { OutboundClick } from './outbound';

export function statsDatabase() {
  const url = process.env.STATS_DATABASE_URL ?? process.env.STATS_URL;
  if (!url) throw new Error('Click statistics storage is not configured');
  return neon(url, { fetchOptions: { signal: AbortSignal.timeout(8000) } });
}

// One atomic statement: a repeated transmission of the same click never increments twice.
// Event IDs identify clicks, not people/devices. Only the deduplication IDs expire.
export const RECORD_CLICK_SQL = `
WITH accepted AS (
  INSERT INTO click_receipts (id) VALUES ($1::uuid)
  ON CONFLICT DO NOTHING RETURNING id
), cleanup AS (
  DELETE FROM click_receipts WHERE received_at < now() - interval '7 days'
)
INSERT INTO click_daily (day, placement, page, browser, activation, clicks)
SELECT (now() AT TIME ZONE 'Asia/Seoul')::date, $2, $3, $4, $5, 1 FROM accepted
ON CONFLICT (day, placement, page, browser, activation)
DO UPDATE SET clicks = click_daily.clicks + 1
RETURNING clicks`;

export async function persistClick(event: OutboundClick) {
  await statsDatabase().query(RECORD_CLICK_SQL, [event.id ?? randomUUID(), event.placement, event.page, event.browser, event.activation]);
}

export function authorizedStats(request: Request, secret = process.env.STATS_ADMIN_TOKEN): boolean {
  if (!secret || secret.length < 32) return false;
  const header = request.headers.get('authorization') ?? '';
  let supplied = '';
  if (header.startsWith('Bearer ')) supplied = header.slice(7);
  if (header.startsWith('Basic ')) {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    if (decoded.startsWith('admin:')) supplied = decoded.slice(6);
  }
  const a = Buffer.from(supplied); const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readClickStats(days: number) {
  const sql = statsDatabase();
  const [metadata, totals, daily] = await sql.transaction([
    sql`SELECT started_at::text FROM click_stats_meta WHERE id = 1`,
    sql`SELECT coalesce(sum(clicks), 0)::text AS clicks FROM click_daily`,
    sql`SELECT d.day::date::text AS day,
      coalesce(sum(c.clicks),0)::text AS total,
      coalesce(sum(c.clicks) FILTER (WHERE c.placement = 'list'),0)::text AS list,
      coalesce(sum(c.clicks) FILTER (WHERE c.placement = 'detail'),0)::text AS detail,
      coalesce(sum(c.clicks) FILTER (WHERE c.page = 'share'),0)::text AS share,
      coalesce(sum(c.clicks) FILTER (WHERE c.browser = 'in_app'),0)::text AS in_app
      FROM generate_series(
        greatest((now() AT TIME ZONE 'Asia/Seoul')::date - (${days}::int - 1),
          (SELECT (started_at AT TIME ZONE 'Asia/Seoul')::date FROM click_stats_meta WHERE id = 1)),
        (now() AT TIME ZONE 'Asia/Seoul')::date, interval '1 day') d(day)
      LEFT JOIN click_daily c ON c.day = d.day::date
      GROUP BY d.day ORDER BY d.day DESC`,
  ]);
  return { timezone: 'Asia/Seoul', startedAt: metadata[0]?.started_at ?? null, allTimeClicks: totals[0].clicks as string, daily };
}
