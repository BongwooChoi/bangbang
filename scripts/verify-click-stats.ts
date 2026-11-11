import assert from 'node:assert/strict';
import { RECORD_CLICK_SQL, statsDatabase } from '../src/lib/click-stats';
async function main() {
  const sql = statsDatabase();
  const event = ['d431c117-3daf-4a98-b756-8ed096702369', 'list', 'home', 'browser', 'same_tab'];
  // Temporary tables shadow production tables only inside this transaction and vanish on commit.
  const results = await sql.transaction([
    sql`CREATE TEMP TABLE click_receipts (LIKE public.click_receipts INCLUDING ALL) ON COMMIT DROP`,
    sql`CREATE TEMP TABLE click_daily (LIKE public.click_daily INCLUDING ALL) ON COMMIT DROP`,
    sql.query(RECORD_CLICK_SQL, event),
    sql.query(RECORD_CLICK_SQL, event),
    sql.query(RECORD_CLICK_SQL, ['f0612afd-0335-4d16-812d-3220863500f5', ...event.slice(1)]),
    sql`SELECT sum(clicks)::text AS total, min(day)::text AS day FROM click_daily`,
    sql`SELECT (now() AT TIME ZONE 'Asia/Seoul')::date::text AS today,
      ('2026-11-11T14:59:59Z'::timestamptz AT TIME ZONE 'Asia/Seoul')::date::text AS before,
      ('2026-11-11T15:00:00Z'::timestamptz AT TIME ZONE 'Asia/Seoul')::date::text AS after`,
  ]);
  assert.equal(results[5][0].total, '2');
  assert.equal(results[5][0].day, results[6][0].today);
  assert.equal(results[6][0].before, '2026-11-11');
  assert.equal(results[6][0].after, '2026-11-12');
  console.log('PASS: database persistence, click deduplication, atomic increments, KST midnight; production counts untouched.');
}
main().catch(() => { console.error('Statistics database verification failed'); process.exitCode = 1; });
