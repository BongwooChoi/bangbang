# 클릭 통계 운영

`/api/stats`는 관리자 전용 HTML 보고서다. 사용자명은 `admin`, 비밀번호는 `STATS_ADMIN_TOKEN`이다. HTTPS로 접속한다. `?days=90` 또는 `?days=366`으로 기간을 바꿀 수 있고 `?days=30&format=json`은 JSON을 반환한다. 자동 조회에는 `Authorization: Bearer <STATS_ADMIN_TOKEN>`도 지원한다. 비밀번호는 URL에 넣지 않는다.

한국 시간(Asia/Seoul) 기준 누적·일별 클릭 합계와 목록/상세 버튼별 횟수를 제공한다. 공유 화면과 인앱 브라우저 열은 전체에 포함되는 별도 분류다. 클릭이 없었던 날짜는 0으로 표시하며 저장 시작 전 날짜는 표시하지 않는다. 같은 사람이 다시 누르면 추가된다. BC의 인정 순사용자나 실제 도착·체류를 측정하는 수치가 아니며 요청 차단·통신 실패·우클릭 메뉴는 누락될 수 있다. 공개 기록 API이므로 자동화된 요청이 없는 실사용 통계라고 보증하지 않는다.

## 저장소

Vercel Marketplace의 Neon **Free** 전용 프로젝트 `bangbang-clicks`. Production에만 `STATS_` 접두사로 연결한다. Preview/로컬 테스트를 운영 DB에 자동 연결하지 않는다. 유료 플랜을 활성화하지 않는다. 무료 한도나 공급자 장애로 저장이 실패하면 503을 반환하고 원래 잇플 이동은 계속된다. 실패한 클릭을 성공으로 보고하거나 메모리/파일 저장으로 대체하지 않는다.

서버는 `STATS_DATABASE_URL`로 연결한다. 초기화는 다음과 같고 재실행해도 기존 합계와 시작 시각을 보존한다.

```sh
node --env-file=.env.stats.local scripts/setup-click-stats.mjs
```

`.env.stats.local`은 Git에서 제외되며 `STATS_DATABASE_URL`, `STATS_ADMIN_TOKEN`을 담는다. 관리자 토큰은 무작위 32자 이상으로 생성하고 Vercel Production Secret에도 등록한다. 교체 시 재배포한다. 초기 스키마의 시작 시각은 준비 시각이며, 실제 수집은 해당 코드를 운영 배포한 시점부터다.

`click_daily`는 합계를 만료 없이 유지한다. `click_receipts`는 클릭마다 만든 UUID와 수신 시각만 저장하며 다음 쓰기 때 7일 지난 항목을 정리한다. 동일 UUID 중복은 한 SQL 문장의 `ON CONFLICT`로 차단하고 합계를 원자적으로 증가시킨다. 구버전 클라이언트의 ID 없는 요청은 서버가 UUID를 부여한다. IP, 쿠키, 검색문, 매장 원본 데이터와 사람/기기 식별자는 저장하지 않는다. 보고서는 인증 없이 조회할 수 없고 캐시·검색 색인을 금지한다.

## 검증

```sh
npx tsx --test tests/outbound.test.ts tests/click-stats.test.ts
node --env-file=.env.stats.local --import tsx scripts/verify-click-stats.ts
```

두 번째 명령은 실제 DB의 트랜잭션 임시 테이블로 중복 전송·합계·한국 자정 경계를 검증하며 운영 합계를 바꾸지 않는다. 운영 점검에서는 인증된 JSON 조회와 로그의 `outbound_storage_failed`를 확인한다. 과거 런타임 로그의 보존 기간이 지난 클릭은 소급 복구할 수 없다.
