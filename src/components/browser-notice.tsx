'use client';
import { useEffect, useState } from 'react';
import { Copy, Smartphone, X } from 'lucide-react';
import { browsingEnvironment } from '@/lib/outbound';
import { SITE_URL } from '@/lib/site';

export function BrowserNotice() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState('');
  useEffect(() => { setVisible(browsingEnvironment(navigator.userAgent, false) === 'in_app'); }, []);
  if (!visible) return null;
  async function copy() {
    const url = new URL(location.pathname + location.search, SITE_URL).href;
    try { await navigator.clipboard.writeText(url); setCopied(true); setFallback(''); }
    catch { setFallback(url); }
  }
  return <aside className="browser-notice" aria-label="브라우저 이용 안내">
    <Smartphone size={21} aria-hidden="true"/>
    <div><strong>매장 상세가 잘 열리지 않나요?</strong><p>앱 메뉴에서 Safari나 Chrome으로 이 페이지를 열어보세요.</p>
      <button onClick={() => void copy()}><Copy size={14}/>{copied ? '링크를 복사했어요' : '현재 페이지 링크 복사'}</button>
      <span className="sr-only" role="status">{copied ? '현재 페이지 링크를 복사했어요.' : ''}</span>
      {fallback && <label>아래 주소를 복사해 브라우저에서 열어주세요.<input aria-label="브라우저에서 열 주소" readOnly value={fallback} onFocus={event => event.target.select()}/></label>}
    </div><button className="icon-button" onClick={() => setVisible(false)} aria-label="브라우저 안내 닫기"><X size={18}/></button>
  </aside>;
}
