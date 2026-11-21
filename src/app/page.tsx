import Explorer from '@/components/explorer';
import { LocalIntro } from '@/components/local-intro';
import { absoluteUrl, pageMetadata, serializeJsonLd, SITE_NAME, SITE_DESCRIPTION, SITE_TITLE, SOCIAL_TITLE } from '@/lib/site';

export const metadata = pageMetadata(SITE_TITLE, SITE_DESCRIPTION, '/', SOCIAL_TITLE);
export default function HomePage() {
  const app = {
    '@context': 'https://schema.org', '@type': 'WebApplication', '@id': absoluteUrl('/#app'),
    name: SITE_NAME, url: absoluteUrl('/'), image: absoluteUrl('/icons/icon-512.png'),
    description: SITE_DESCRIPTION, applicationCategory: 'LifestyleApplication', inLanguage: 'ko-KR',
    isAccessibleForFree: true, isPartOf: { '@id': absoluteUrl('/#website') },
    sameAs: ['https://github.com/BongwooChoi/bangbang'],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(app) }}/><Explorer><LocalIntro/></Explorer></>;
}
