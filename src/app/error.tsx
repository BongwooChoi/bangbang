'use client';
export default function ErrorPage({ reset }: { reset: () => void }) { return <main className="empty-state"><h1>화면을 잠시 불러오지 못했어요</h1><p>다시 시도하거나 처음 화면에서 맛집을 찾아주세요.</p><button className="primary-button" onClick={reset}>다시 시도하기</button><a href="/">처음으로</a></main>; }
