const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export function seoulMealPeriod(now: number) {
  const sinceMidnight = (now + 9 * HOUR) % DAY;
  const lunch = sinceMidnight < 15 * HOUR;
  return {
    label: lunch ? '오늘 점심 후보' : '오늘 저녁 후보',
    untilChange: (lunch ? 15 * HOUR : DAY) - sinceMidnight,
  };
}
