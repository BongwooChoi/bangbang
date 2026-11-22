import type { Restaurant } from './restaurants';
import type { SearchIntent } from './search-intent';

function displayName(name: string): string {
  return name.normalize('NFKC').replace(/^\s*(?:주식회사|\(주\))\s*|\s*(?:주식회사|\(주\))\s*$/g, '').trim();
}

export function merchantKey(name: string): string {
  return displayName(name).replace(/\s+/g, '').toLowerCase();
}

export function knownMerchantName(input: string, rows: Restaurant[]): string | undefined {
  const key = merchantKey(input);
  const match = key && rows.find(row => merchantKey(row.name) === key);
  return match ? displayName(match.name) : undefined;
}

export function merchantIntent(merNm: string): SearchIntent {
  return { merNm, merTpbuzNm: null, category: 'all', excludedCategories: [], includedCategories: [],
    zone: 'all', sort: 'recommended', localOnly: false, groupOnly: false, mealOnly: false,
    customerAge: 'all', customerAges: [], customerGender: 'all', unsupported: [] };
}

export function includeCatalogMatches(results: Restaurant[], catalog: Restaurant[], intent: SearchIntent): Restaurant[] {
  const key = merchantKey(intent.merNm);
  // The catalog does not contain all of the provider's independent genre classifications.
  if (!key || intent.merTpbuzNm) return results;
  const ids = new Set(results.map(row => row.id));
  return [...results, ...catalog.filter(row => !ids.has(row.id) && merchantKey(row.name).includes(key))];
}
