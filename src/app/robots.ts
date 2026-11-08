import type { MetadataRoute } from 'next';
import { absoluteUrl, IS_PREVIEW } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', ...(IS_PREVIEW ? { disallow: '/' } : { allow: '/', disallow: '/api/' }) },
    ...(!IS_PREVIEW && { sitemap: absoluteUrl('/sitemap.xml') }),
  };
}
