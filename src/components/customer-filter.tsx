'use client';
import { CUSTOMER_AGES, CUSTOMER_GENDERS, type CustomerAge, type CustomerGender, type CustomerGroup } from '@/lib/customers';

export function CustomerFilter({ age, gender, onAge, onGender }: {
  age: CustomerAge; gender: CustomerGender; onAge: (age: CustomerAge) => void; onGender: (gender: CustomerGender) => void;
}) {
  const active = age !== 'all' || gender !== 'all';
  return <fieldset className={`customer-filter ${active ? 'has-selection' : ''}`}>
    <legend>주요 방문 고객층 <span>상위 3개 기준</span></legend>
    <div className="customer-selects">
      <label><span className="sr-only">방문 고객 성별</span><select aria-label="방문 고객 성별" value={gender} onChange={e => onGender(e.target.value as CustomerGender)}>{CUSTOMER_GENDERS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</select></label>
      <label><span className="sr-only">방문 고객 연령대</span><select aria-label="방문 고객 연령대" value={age} onChange={e => onAge(e.target.value as CustomerAge)}>{CUSTOMER_AGES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
      {active && <button onClick={() => { onAge('all'); onGender('all'); }}>초기화</button>}
    </div>
    {active && <p>선택한 성별·연령대 조합이 주요 고객층 상위 3개에 포함된 곳이에요. 전체 방문 비율이나 취향을 뜻하지는 않아요.</p>}
  </fieldset>;
}

export function CustomerDetails({ groups }: { groups?: CustomerGroup[] }) {
  return <section className="customer-details" aria-label="주요 방문 고객층">
    <h4>주요 방문 고객층</h4>
    {groups?.length ? <ul>{groups.map(g => <li key={`${g.age}-${g.gender}`}><span>{g.rank}위</span> {g.label}</li>)}</ul> : <p>확인된 고객층 정보가 없어요.</p>}
    <p>최근 1개월 결제 기반 상위 3개 집계예요. 고객층별 비율은 제공되지 않아요.</p>
  </section>;
}

export function CustomerMatch({ groups, age, gender }: { groups?: CustomerGroup[]; age: CustomerAge; gender: CustomerGender }) {
  if (age === 'all' && gender === 'all') return null;
  const matches = (groups ?? []).filter(g => (age === 'all' || g.age === age) && (gender === 'all' || g.gender === gender));
  return <p className="customer-match">주요 고객층에 포함: {matches.map(g => g.label).join(' · ')}</p>;
}
