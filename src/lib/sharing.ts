import { sharePath, type Restaurant } from './restaurants';
import { SITE_URL } from './site';
type KakaoClient = { isInitialized(): boolean; init(key: string): void; Share: { sendDefault(args: unknown): void } };
declare global { interface Window { Kakao?: KakaoClient } }
let sdk: Promise<void> | undefined;
function loadKakao(): Promise<void> {
  if (window.Kakao) return Promise.resolve();
  if (sdk) return sdk;
  sdk = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js';
    script.async = true;
    script.onload = () => window.Kakao ? resolve() : reject(new Error('SDK unavailable'));
    script.onerror = () => { sdk = undefined; script.remove(); reject(new Error('SDK unavailable')); };
    document.head.appendChild(script);
  });
  return sdk;
}
export function sharedContent(rows: Restaurant[]) {
  const title = rows.length === 1 ? `${rows[0].name} · 뱅뱅밥` : `오늘 같이 먹을 맛집 ${rows.length}곳 · 뱅뱅밥`;
  return { title, text: `${rows.map(r => r.name).join(', ')}\n우리 동네에서 같이 한 끼 어때요?`, url: `${SITE_URL}${sharePath(rows.map(r => r.id))}` };
}
export async function kakaoShare(rows: Restaurant[]): Promise<'kakao' | 'native'> {
  const content = sharedContent(rows);
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) {
    if (!navigator.share) throw new Error('native_unavailable');
    await navigator.share(content); return 'native';
  }
  await loadKakao();
  if (!window.Kakao!.isInitialized()) window.Kakao!.init(key);
  window.Kakao!.Share.sendDefault({ objectType: 'text', text: `${content.title}\n${content.text}`, link: { mobileWebUrl: content.url, webUrl: content.url }, buttonTitle: '같이 맛집 보기' });
  return 'kakao';
}
