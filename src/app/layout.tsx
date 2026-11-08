import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { IS_PREVIEW, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, serializeJsonLd, websiteSchema } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_TITLE} · 뱅뱅밥`, template: '%s · 뱅뱅밥' },
  description: SITE_DESCRIPTION,
  robots: IS_PREVIEW ? { index: false, follow: false } : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  verification: {
    google: process.env.SEO_GOOGLE_VERIFICATION,
    other: {
      ...(process.env.SEO_NAVER_VERIFICATION && { 'naver-site-verification': process.env.SEO_NAVER_VERIFICATION }),
      'msvalidate.01': process.env.SEO_BING_VERIFICATION || '69D062CB33939F9BF0A0C60AAF57CD20',
    },
  },
  applicationName: '뱅뱅밥', manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '뱅뱅밥' },
  icons: { icon: '/icon.svg', apple: '/icons/apple-touch-icon.png' },
  openGraph: { title: '오늘 점심, 뱅뱅 돌지 말고.', description: '강남역부터 양재역까지, 우리 동네 한 끼 지도', locale: 'ko_KR', type: 'website', siteName: '뱅뱅밥', images: [{ url: '/og-image.png', width: 1200, height: 630, alt: '뱅뱅밥 우리 동네 한 끼 지도' }] },
  twitter: { card: 'summary_large_image', title: '뱅뱅밥 · 우리 동네 한 끼 지도', images: ['/og-image.png'] },
  referrer: 'strict-origin-when-cross-origin',
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#fffdf7' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}/>{children}<Analytics /></body></html>;
}
