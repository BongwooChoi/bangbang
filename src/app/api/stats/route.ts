import { authorizedStats, readClickStats } from '@/lib/click-stats';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Vary': 'Authorization' };
const escape = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function GET(request: Request) {
  if (!authorizedStats(request)) return new Response('관리자 로그인이 필요합니다.', {
    status: 401, headers: { ...headers, 'WWW-Authenticate': 'Basic realm="Bangbang statistics", charset="UTF-8"' },
  });
  const url = new URL(request.url);
  const days = Number(url.searchParams.get('days') ?? 30);
  if (!Number.isInteger(days) || days < 1 || days > 366) return new Response('days: 1–366', { status: 400, headers });
  try {
    const stats = await readClickStats(days);
    if (url.searchParams.get('format') === 'json') return Response.json(stats, { headers });
    const started = stats.startedAt ? new Date(stats.startedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) : '미설정';
    const rows = stats.daily.map(row => `<tr><td>${escape(row.day)}</td><td>${escape(row.total)}</td><td>${escape(row.list)}</td><td>${escape(row.detail)}</td><td>${escape(row.share)}</td><td>${escape(row.in_app)}</td></tr>`).join('');
    return new Response(`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>뱅뱅밥 클릭 통계</title>
      <style>body{font-family:system-ui,sans-serif;margin:0;background:#fff9ef;color:#343b33}main{max-width:850px;margin:auto;padding:24px 16px}h1{font-size:26px}a{color:#35684a}p{line-height:1.7}.total{font-size:32px;color:#b34837;font-weight:bold}.table{overflow-x:auto;background:white;border-radius:16px;padding:12px}table{border-collapse:collapse;width:100%;white-space:nowrap}th,td{padding:12px 10px;border-bottom:1px solid #eee;text-align:right}th:first-child,td:first-child{text-align:left}small{color:#67675e}</style>
      <main><h1>🍚 뱅뱅밥 클릭 통계</h1><p>누적 잇플 이동 버튼 클릭 <span class="total">${escape(stats.allTimeClicks)}회</span></p>
      <p>한국 시간 기준 · <a href="?days=30">30일</a> / <a href="?days=90">90일</a> / <a href="?days=366">1년</a> · <a href="?days=${days}&format=json">JSON</a></p>
      <p><small>저장 시작: ${escape(started)} (한국 시간)<br>설치 이전 기록은 포함되지 않습니다. 오늘 수치는 집계 중입니다.</small></p>
      <div class="table"><table><thead><tr><th>날짜</th><th>전체</th><th>목록 버튼</th><th>상세 버튼</th><th>공유 화면</th><th>인앱 브라우저</th></tr></thead><tbody>${rows}</tbody></table></div>
      <p>전체 = 목록 버튼 + 상세 버튼. 공유 화면·인앱 브라우저는 전체에 포함되는 별도 분류입니다.</p>
      <p><strong>클릭 횟수이며 순사용자 수가 아닙니다.</strong> 같은 사람이 다시 누르면 추가됩니다. 잇플 페이지 도착·체류나 BC카드의 공모전 인정 실적을 뜻하지 않습니다. 통신 실패, 차단 도구, 우클릭 메뉴로 여는 경우 등은 누락될 수 있습니다.</p></main></html>`, {
      headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'" },
    });
  } catch { return new Response('통계 저장소에 연결하지 못했습니다. 잠시 후 다시 확인해주세요.', { status: 503, headers }); }
}
