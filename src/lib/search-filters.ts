import { filterRestaurants, type Restaurant, type Category } from './restaurants';
import type { SearchIntent } from './search-intent';

export function matchesSearchFood(row: Restaurant, intent?: SearchIntent): boolean {
  if (!intent) return true;
  return !intent.excludedCategories.includes(row.category)
    && (!intent.includedCategories.length || intent.includedCategories.includes(row.category as Exclude<Category, 'all'>))
    // A meal request is not evidence of live opening hours or a lunch menu.
    && (!intent.mealOnly || (row.category !== 'cafe' && !/주점|칵테일바/.test(row.genre)));
}

export function searchCandidates(rows: Restaurant[], intent: SearchIntent): Restaurant[] {
  return filterRestaurants(rows, { ...intent, query: '', customerAges: intent.customerAges })
    .filter(row => matchesSearchFood(row, intent));
}
