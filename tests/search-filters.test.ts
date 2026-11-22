import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSearchIntent, searchIntentLabels, type SearchIntent } from '../src/lib/search-intent';
import { searchCandidates } from '../src/lib/search-filters';
import { knownMerchantName, includeCatalogMatches, merchantIntent } from '../src/lib/merchant-search';
import { parseCustomerGroups } from '../src/lib/customers';
import type { Restaurant } from '../src/lib/restaurants';

const intent: SearchIntent = {merNm:'',merTpbuzNm:null,category:'all',includedCategories:[],excludedCategories:[],zone:'all',sort:'recommended',localOnly:false,groupOnly:false,customerAge:'all',customerAges:['30','40'],customerGender:'all',mealOnly:true,unsupported:[]};
const row: Restaurant = {id:'a',name:'가상 식당',address:'테스트',genre:'일반한식',category:'korean',lat:37.49,lng:127.03,distance:100,zone:'bangbang',nationalRank:null,localRank:1,localFavorite:false,groupDining:false,foreignVisitors:false,hours:null,busyDay:null,busyTime:null,eatplUrl:'https://web.paybooc.ai/mer/web/profile/a',customerGroups:parseCustomerGroups({rk01:'30대남성'})};

test('30대 40대 meal candidates use either age, preserve missing data and do not invent meal hours', () => {
 const rows=[row,{...row,id:'b',customerGroups:parseCustomerGroups({rk01:'40대여성'})},{...row,id:'young',customerGroups:parseCustomerGroups({rk01:'20대여성'})},{...row,id:'unknown',customerGroups:[]},{...row,id:'coffee',genre:'카페',category:'cafe' as const},{...row,id:'bar',genre:'주점',category:'western' as const}];
 assert.deepEqual(searchCandidates(rows,intent).map(r=>r.id),['a','b']);
 assert.ok(searchIntentLabels(intent).includes('30대 또는 40대 주요 방문 고객층'));
 assert.deepEqual(searchCandidates(rows,{...intent,customerGender:'female'}).map(r=>r.id),['b']);
 assert.equal(searchCandidates(rows,{...intent,customerAges:[]}).length,4);
 assert.ok(rows.every(r=>r.hours===null));
});

test('OR food categories and exclusions combine with one matching age/gender group', () => {
 const mixed={...row,id:'mixed',category:'japanese' as const,genre:'일식라멘',customerGroups:parseCustomerGroups({rk01:'20대여성',rk02:'30대남성'})};
 const selected=validateSearchIntent({...intent,category:'korean',merTpbuzNm:'일반한식',includedCategories:['korean','japanese'],excludedCategories:['korean'],customerGender:'female'});
 assert.equal(selected.category,'all');assert.equal(selected.merTpbuzNm,null);
 assert.deepEqual(searchCandidates([row,mixed],selected),[]);
 assert.deepEqual(searchCandidates([row,mixed],{...selected,customerGender:'all'}).map(r=>r.id),['mixed']);
 assert.throws(()=>validateSearchIntent({...intent,customerAges:['all']}));
 assert.throws(()=>validateSearchIntent({...intent,includedCategories:['invalid']}));
});

test('direct names ignore spaces and corporate prefixes while mixed queries retain separate filters', () => {
  const store = { ...row, name: '㈜가상막국수' };
  const branch = { ...row, name: '가상 막국수 강남점', id: 'branch', zone: 'gangnam' as const };
  const catalog = [store, branch, { ...row, id: 'other', name: '테스트 국수집' }];
  assert.equal(knownMerchantName('가상 막국수', catalog), '가상막국수');
  assert.equal(knownMerchantName('강남역 근처 가상막국수', catalog), undefined);
  assert.equal(knownMerchantName('막국수', catalog), undefined);
  const query = { ...merchantIntent('가상막국수'), zone: 'gangnam' as const };
  const matches = includeCatalogMatches([branch], catalog, query);
  assert.deepEqual(matches.map(r => r.id), ['branch', 'a']);
  assert.deepEqual(searchCandidates(matches, query).map(r => r.id), ['branch']);
  assert.deepEqual(includeCatalogMatches([], catalog, merchantIntent('없는상호')), []);
});
