import { CATEGORIES, type Category } from './restaurants';
import { CUSTOMER_AGES, CUSTOMER_GENDERS, type CustomerAge, type CustomerGender } from './customers';
import type { Zone } from './geo';

export const SEARCH_MODEL = 'gpt-6-luna';
export const MAX_SEARCH_LENGTH = 300;
export const PROVIDER_GENRES = ['일반한식', '서양음식', '스넥', '중국음식', '일식회집', '주점', '칵테일바', '갈비전문점', '한정식', '카페', '고기구이', '찜/탕/찌개', '치킨', '국수/면/만두', '해산물구이/찜', '김밥전문점', '분식', '기타외국식', '곱창전골/구이', '피자', '족발/보쌈', '버거', '스시/초밥', '브런치카페/샐러드', '떡볶이전문점', '빵/도넛', '도시락/죽', '일식돈가스', '뷔페', '마라탕', '이탈리아음식', '샌드위치/토스트', '양꼬치', '아시안', '아이스크림/요거트/빙수', '전/부침개', '기타베이커리', '일식라멘', '멕시칸', '떡/한과', '프랑스음식', '비건/채식/사찰', '기타'] as const;
const ZONES = ['all', 'bangbang', 'gangnam', 'yangjae'] as const;
const SORTS = ['recommended', 'distance', 'rank'] as const;
const UNSUPPORTED = ['가격·예산', '구체적인 메뉴·맛', '실시간 영업·대기', '좌석·예약·주차', '분위기·혼밥', '식이·알레르기 안전', '도보 시간', '서비스 지역 밖', '기타 조건'] as const;
export type SearchIntent = {
  merNm: string; merTpbuzNm: typeof PROVIDER_GENRES[number] | null;
  category: Category; excludedCategories: Category[]; zone: Zone;
  sort: typeof SORTS[number]; localOnly: boolean; groupOnly: boolean;
  customerAge: CustomerAge; customerGender: CustomerGender;
  unsupported: typeof UNSUPPORTED[number][];
};
const enumSchema = (values: readonly string[]) => ({ type: 'string', enum: values });
const properties = {
  merNm: { type: 'string', maxLength: 60 },
  merTpbuzNm: { anyOf: [enumSchema(PROVIDER_GENRES), { type: 'null' }] },
  category: enumSchema(CATEGORIES.map(c => c.id)),
  excludedCategories: { type: 'array', maxItems: 7, items: enumSchema(CATEGORIES.filter(c => c.id !== 'all').map(c => c.id)) },
  zone: enumSchema(ZONES), sort: enumSchema(SORTS),
  localOnly: { type: 'boolean' }, groupOnly: { type: 'boolean' },
  customerAge: enumSchema(CUSTOMER_AGES.map(c => c.id)), customerGender: enumSchema(CUSTOMER_GENDERS.map(c => c.id)),
  unsupported: { type: 'array', maxItems: 9, items: enumSchema(UNSUPPORTED) },
};
export const SEARCH_SCHEMA = { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
const includes = (items: readonly string[], value: unknown) => typeof value === 'string' && items.includes(value);
export function validateSearchIntent(value: unknown): SearchIntent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid_search_intent');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).length !== Object.keys(properties).length || Object.keys(v).some(k => !Object.hasOwn(properties, k))
    || typeof v.merNm !== 'string' || v.merNm.length > 60
    || (v.merTpbuzNm !== null && !includes(PROVIDER_GENRES, v.merTpbuzNm))
    || !includes(CATEGORIES.map(c => c.id), v.category) || !includes(ZONES, v.zone) || !includes(SORTS, v.sort)
    || typeof v.localOnly !== 'boolean' || typeof v.groupOnly !== 'boolean'
    || !includes(CUSTOMER_AGES.map(c => c.id), v.customerAge) || !includes(CUSTOMER_GENDERS.map(c => c.id), v.customerGender)
    || !Array.isArray(v.excludedCategories) || v.excludedCategories.length > 7 || !v.excludedCategories.every(c => c !== 'all' && includes(CATEGORIES.map(c => c.id), c))
    || !Array.isArray(v.unsupported) || v.unsupported.length > 9 || !v.unsupported.every(c => includes(UNSUPPORTED, c))) throw new Error('invalid_search_intent');
  return { ...v, merNm: v.merNm.trim() } as SearchIntent;
}
export function searchIntentLabels(intent: SearchIntent): string[] {
  const labels: string[] = [];
  if (intent.merNm) labels.push(`가게명: ${intent.merNm}`);
  if (intent.merTpbuzNm) labels.push(intent.merTpbuzNm);
  else if (intent.category !== 'all') labels.push(CATEGORIES.find(c => c.id === intent.category)!.label);
  if (intent.zone !== 'all') labels.push({ bangbang: '뱅뱅사거리', gangnam: '강남역 쪽', yangjae: '양재역 쪽' }[intent.zone]);
  if (intent.localOnly) labels.push('동네 단골');
  if (intent.groupOnly) labels.push('회식 후보');
  if (intent.customerAge !== 'all' || intent.customerGender !== 'all') labels.push([intent.customerAge !== 'all' ? CUSTOMER_AGES.find(c => c.id === intent.customerAge)!.label : '', intent.customerGender !== 'all' ? CUSTOMER_GENDERS.find(c => c.id === intent.customerGender)!.label : '', '주요 방문 고객층'].filter(Boolean).join(' '));
  intent.excludedCategories.forEach(c => labels.push(`${CATEGORIES.find(item => item.id === c)!.label} 제외`));
  labels.push({ recommended: '뱅뱅 추천순', distance: '사거리 가까운 순', rank: '지역 매출 상위순' }[intent.sort]);
  return labels;
}
