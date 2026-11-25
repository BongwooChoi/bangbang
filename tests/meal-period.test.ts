import test from 'node:test';
import assert from 'node:assert/strict';
import { seoulMealPeriod } from '../src/lib/meal-period';

test('the home meal label switches at 15:00 and midnight in Seoul', () => {
  for (const [instant, label, untilChange] of [
    ['2026-11-25T05:59:59.999Z', '오늘 점심 후보', 1],
    ['2026-11-25T06:00:00.000Z', '오늘 저녁 후보', 9 * 3_600_000],
    ['2026-11-25T14:59:59.999Z', '오늘 저녁 후보', 1],
    ['2026-11-25T15:00:00.000Z', '오늘 점심 후보', 15 * 3_600_000],
  ] as const) {
    assert.deepEqual(seoulMealPeriod(Date.parse(instant)), { label, untilChange });
  }
});
