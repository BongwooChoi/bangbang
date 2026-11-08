import type { MetadataRoute } from 'next';
import { absoluteUrl, IS_PREVIEW } from '@/lib/site';
import { GUIDE_UPDATED } from '@/lib/guide';

export default function sitemap(): MetadataRoute.Sitemap {
  if (IS_PREVIEW) return [];
  // Only stable, indexable pages. Never fabricate a fresh lastmod on every request.
  return [{ url: absoluteUrl('/') }, { url: absoluteUrl('/guide'), lastModified: GUIDE_UPDATED }];
}
