import type { Metadata, Viewport } from 'next';
import './globals.css';

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (host ? `https://${host}` : 'http://localhost:3000')),
  title: { default: '뱅뱅밥 · 우리 동네 한 끼 지도', template: '%s · 뱅뱅밥' },
  description: '오늘 점심, 뱅뱅 돌지 말고. 뱅뱅사거리부터 강남역·양재역까지 맛집을 찾고, 담고, 같이 먹을 사람에게 공유해요.',
  applicationName: '뱅뱅밥', manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '뱅뱅밥' },
  icons: { icon: '/icon.svg', apple: '/icons/apple-touch-icon.png' },
  openGraph: { title: '오늘 점심, 뱅뱅 돌지 말고.', description: '강남역부터 양재역까지, 우리 동네 한 끼 지도', locale: 'ko_KR', type: 'website', siteName: '뱅뱅밥', images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '뱅뱅밥 우리 동네 한 끼 지도' }] },
  twitter: { card: 'summary_large_image', title: '뱅뱅밥 · 우리 동네 한 끼 지도', images: ['/og-image.png'] },
  referrer: 'strict-origin-when-cross-origin',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffdf7' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
