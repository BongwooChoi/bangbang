import assert from 'node:assert/strict';

const target = new URL(process.argv[2] || 'http://127.0.0.1:3000');
const canonical = new URL(process.argv[3] || 'https://bangbang-five.vercel.app');
const checks = ['/', '/guide', '/robots.txt', '/sitemap.xml', '/llms.txt', '/share', '/offline.html'];
const results = await Promise.all(checks.map(async path => {
  const response = await fetch(new URL(path, target), { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `${path} status`);
  return [path, { response, text: await response.text() }];
}));
const pages = Object.fromEntries(results);
const scripts = html => [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
const visibleHtml = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '');
for (const path of ['/', '/guide']) {
  const { text, response } = pages[path];
  assert.match(text, /<html[^>]*lang="ko"/);
  assert.match(text, /<title>[^<]*뱅뱅사거리[^<]*<\/title>/);
  assert.match(text, /<title>[^<]*뱅뱅밥<\/title>/);
  const canonicalHref = text.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonicalHref, `${path} canonical exists`);
  assert.equal(new URL(canonicalHref).href, new URL(path, canonical).href, `${path} canonical`);
  assert.match(text, /<meta name="robots" content="index, follow"/);
  assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'), `${path} indexable`);
  assert.equal(scripts(text).filter(item => item['@type'] === 'WebSite').length, 1);
  assert.ok(visibleHtml(text).includes('강남역'), `${path} content available without JavaScript`);
  assert.ok(visibleHtml(text).includes('양재역'), `${path} area content`);
}
assert.ok(pages['/'].text.includes('href="/guide"'), 'guide discoverable from home');
const faq = scripts(pages['/guide'].text).flatMap(item => item['@graph'] || []).find(item => item['@type'] === 'FAQPage');
assert.ok(faq?.mainEntity.length >= 7, 'structured FAQ available');
const guideText = visibleHtml(pages['/guide'].text);
for (const question of faq.mainEntity) {
  assert.ok(guideText.includes(question.name), 'schema question visible');
  assert.ok(guideText.includes(question.acceptedAnswer.text), 'schema answer visible');
}
assert.match(pages['/robots.txt'].text, /User-Agent: \*/i);
assert.match(pages['/robots.txt'].text, /Allow: \/\s/);
assert.match(pages['/robots.txt'].text, /Disallow: \/api\//);
assert.ok(pages['/robots.txt'].text.includes(new URL('/sitemap.xml', canonical).href));
const locations = [...pages['/sitemap.xml'].text.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.deepEqual(locations.sort(), ['/', '/guide'].map(path => new URL(path, canonical).href).sort());
assert.match(pages['/llms.txt'].response.headers.get('content-type'), /text\/plain/);
assert.ok(pages['/llms.txt'].text.includes(new URL('/guide', canonical).href));
assert.match(pages['/share'].response.headers.get('x-robots-tag'), /noindex/);
assert.match(pages['/offline.html'].response.headers.get('x-robots-tag'), /noindex/);
assert.match(pages['/share'].text, /<meta name="robots" content="noindex, follow"/);
const og = await fetch(new URL('/og-image.png', target), { signal: AbortSignal.timeout(15000) });
assert.equal(og.status, 200);
assert.match(og.headers.get('content-type'), /image\/png/);
console.log(`SEO checks passed: ${target.origin} — static HTML, canonical, robots, sitemap, structured data, sharing exclusions, image and llms.txt`);
