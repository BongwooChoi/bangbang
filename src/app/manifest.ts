import type { MetadataRoute } from 'next';
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: '뱅뱅밥 · 우리 동네 한 끼 지도', short_name: '뱅뱅밥',
    description: '뱅뱅사거리부터 강남역·양재역까지, 맛집을 찾고 함께 나눠요.',
    lang: 'ko', start_url: '/', scope: '/', display: 'standalone',
    background_color: '#fffdf7', theme_color: '#fffdf7', categories: ['food', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
