import Explorer from '@/components/explorer';
import { LocalIntro } from '@/components/local-intro';
import { pageMetadata, SITE_DESCRIPTION, SITE_TITLE } from '@/lib/site';

export const metadata = pageMetadata(SITE_TITLE, SITE_DESCRIPTION, '/');
export default function HomePage() { return <Explorer><LocalIntro/></Explorer>; }
