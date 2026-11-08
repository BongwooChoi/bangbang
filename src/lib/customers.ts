export const CUSTOMER_AGES = [
  { id: 'all', label: '모든 연령대' }, { id: '10', label: '10대' },
  { id: '20', label: '20대' }, { id: '30', label: '30대' },
  { id: '40', label: '40대' }, { id: '50', label: '50대' }, { id: '60+', label: '60대 이상' },
] as const;
export const CUSTOMER_GENDERS = [
  { id: 'all', label: '모든 성별' }, { id: 'female', label: '여성' }, { id: 'male', label: '남성' },
] as const;
export type CustomerAge = typeof CUSTOMER_AGES[number]['id'];
export type CustomerGender = typeof CUSTOMER_GENDERS[number]['id'];
export type CustomerGroup = {
  age: Exclude<CustomerAge, 'all'>;
  gender: Exclude<CustomerGender, 'all'>;
  label: string;
  rank: number;
};

export function parseCustomerGroups(value: unknown): CustomerGroup[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const source = value as Record<string, unknown>;
  const result: CustomerGroup[] = [];
  for (const [index, key] of ['rk01', 'rk02', 'rk03'].entries()) {
    const raw = source[key];
    if (typeof raw !== 'string') continue;
    const match = /^(10대|20대|30대|40대|50대|60대이상)(남성|여성)$/.exec(raw.replace(/\s/g, ''));
    if (!match) continue;
    const age = (match[1] === '60대이상' ? '60+' : match[1].slice(0, 2)) as CustomerGroup['age'];
    const gender = match[2] === '여성' ? 'female' : 'male';
    if (result.some(g => g.age === age && g.gender === gender)) continue;
    result.push({ age, gender, label: `${age === '60+' ? '60대 이상' : `${age}대`} ${match[2]}`, rank: index + 1 });
  }
  return result;
}

export function matchesCustomerGroup(groups: CustomerGroup[] | undefined, age: CustomerAge = 'all', gender: CustomerGender = 'all'): boolean {
  if (age === 'all' && gender === 'all') return true;
  // Both conditions must match the SAME top-three group, never different groups.
  return (groups ?? []).some(group => (age === 'all' || group.age === age) && (gender === 'all' || group.gender === gender));
}
