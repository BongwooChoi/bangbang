# bangbang

뱅뱅사거리 직장인을 위한 모바일 맛집 지도 프로젝트입니다. 강남역에서 양재역 사이의 음식점을 탐색하고, 점심 후보를 동료에게 공유하는 경험을 만듭니다.

**[뱅뱅밥 바로 열기](https://bangbang-five.vercel.app)** · Vercel에 첫 버전을 배포했습니다. 실제 잇플 음식점 조회, 모바일 지도·목록, 필터, 담아두기, 공유 페이지, PWA를 제공합니다.

## 서비스 범위

- 중심: 뱅뱅사거리
- 북쪽 한계: 강남역 1번·8번 출구
- 남쪽 한계: 양재역 1번·4번 출구
- 출구 좌표를 연결한 남북 경계와 중심선 양쪽 약 400m를 사용합니다. 동서 폭은 초기 기본값이며 조정할 수 있습니다.

## 만들려는 경험

- 모바일 지도에서 음식점 후보를 빠르게 탐색하고 비교합니다.
- 잇플의 결제 데이터 기반 정보를 추천 근거로 활용합니다.
- 음식점 하나 또는 함께 고른 후보를 카카오톡·SNS로 공유합니다.
- 설치 없이 사용할 수 있으며, PWA를 홈 화면에 추가할 수도 있습니다.
- 잇플 상세 페이지에서 추가 정보를 확인할 수 있게 연결합니다.

## 문서

- [제품 기획과 지역 범위](docs/product-brief.md)
- [모바일 PWA와 공유 설계](docs/mobile-and-sharing.md)
- [데이터 연동과 실제 지도 경계](docs/data-and-boundary.md)
- [추천 기준·회식·고객층 필터·혼잡 안내](docs/recommendations.md)
- [SEO·GEO와 검색 서비스 등록](docs/seo-and-geo.md)
- [검증 결과와 남은 실기기 확인](docs/verification.md)
- [공모전 배경과 참가 준비](docs/contest-background.md)
- [기여 방법](CONTRIBUTING.md)

## 개발과 호스팅

Next.js App Router, React, TypeScript, Leaflet, Proj4를 사용합니다. Node.js 22 이상이 필요하며 CI는 Node.js 24에서 실행합니다.

```sh
npm ci
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다. API 키 없이 기본 맛집 조회와 지도·수동 필터를 확인할 수 있습니다. 자연어 AI 검색은 서버의 `OPENAI_API_KEY`가 필요하며 `gpt-6-luna`를 사용합니다. 공개 k-skill 프록시와 OpenStreetMap의 제공 상태·이용 조건에 따라 기능이 제한될 수 있습니다.

```sh
npm run typecheck
npm test
npm run build
npm run start
```

PWA의 서비스 워커는 프로덕션 실행에서만 등록됩니다. 정적 화면 자원과 오프라인 안내만 캐시하며 음식점 응답과 지도 타일은 서비스 워커에 저장하지 않습니다.

잇플 이동 문제를 점검할 때는 Vercel Logs에서 `/api/outbound` 또는 `eatpl_open`을 검색합니다. 링크 클릭 시도만 남기는 임시 진단이며, Hobby는 1시간만 보관하므로 누적 순사용자 통계가 아닙니다. 관련 검증은 `npx tsx --test tests/outbound.test.ts`로 실행합니다. 상세 동작과 한계는 [모바일 및 공유 설계](docs/mobile-and-sharing.md)를 참고하세요.

### 환경 변수

필요한 경우 `.env.example`을 참고해 `.env.local`을 만듭니다.

| 변수 | 용도 |
| --- | --- |
| `OPENAI_API_KEY` | 자연어 검색용 OpenAI API 키. 서버 전용. 운영 환경 Secret으로 저장하며 공개 변수·브라우저·저장소에 넣지 않음 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 선택. 카카오 전용 공유 템플릿 사용. SDK·제품 링크에 운영 도메인 등록 필요 |
| `KSKILL_PROXY_BASE_URL` | 선택. 별도 k-skill 프록시 주소 |
| `NEXT_PUBLIC_MAP_TILE_URL` | 선택. 다른 지도 타일 제공자 URL |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | 선택. 지도 제공자의 출처 표시 |
| `NEXT_PUBLIC_SITE_URL` | 선택. 사용자 지정 운영 도메인의 HTTPS origin. 기본값은 `https://bangbang-five.vercel.app` |
| `SEO_GOOGLE_VERIFICATION` / `SEO_NAVER_VERIFICATION` / `SEO_BING_VERIFICATION` | 선택. 각 검색 서비스가 발급한 소유권 확인 메타태그의 content 값 |

카카오 키가 없을 때도 기기 기본 공유 창 또는 링크 복사로 카카오톡·SNS에 공유할 수 있습니다. 모든 SNS의 직접 게시를 지원하는 것은 아닙니다. 홈 화면 설치 방식은 브라우저·기기에 따라 다릅니다.

### 자연어 검색

`POST /api/search`는 1~300자의 문장을 GPT-6 Luna의 엄격한 JSON Schema 출력으로 변환한 뒤, 검증된 가게명·업종과 고정된 지역 주소를 잇플 검색 API에 전달합니다. 지역·단골·회식·주요 방문 고객층·제외 카테고리·정렬은 화면 필터에 적용합니다. 해석 결과를 화면에 표시하며, 가격·좌석·실시간 대기 등 제공 데이터로 검증할 수 없는 조건은 미확인으로 안내합니다. 기본 추천 점수와 무작위 뽑기는 기존 방식입니다.

문장만 OpenAI로 전송하고 `store: false`로 호출합니다. 원본 식당 데이터나 즐겨찾기를 모델에 전달하지 않습니다. 자동 재시도 없이 15초 제한·900 출력 토큰 상한을 사용합니다. 서버 인스턴스별로 IP 해시당 분당 6회, 전체 분당 60회의 보조 제한을 두지만, 분산 인스턴스 전체의 비용 상한은 아닙니다. 운영 비용 제한은 OpenAI 프로젝트 설정과 호스팅 측 제한을 별도로 관리해야 합니다. 키가 없는 CI·외부 PR Preview에서도 빌드와 수동 탐색이 가능합니다.

### Vercel

GitHub 저장소를 Import하고 Next.js 프리셋과 기본 빌드 명령을 사용합니다. 위 선택 환경 변수는 Vercel의 Environment Variables에 등록합니다. 소스코드에 자격 증명을 넣지 않습니다.

Vercel을 우선 호스팅 후보로 두고 무료 운영을 목표로 합니다. [Hobby 이용 조건](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)은 개인·비상업 용도만 허용합니다. 공모전의 유입 리워드 구조가 해당 조건에 부합하는지 확인하기 전에는 무료 운영이 확정된 것으로 보지 않습니다. 유료 플랜은 자동으로 선택하지 않습니다.

## 참여하기

기능 제안, 모바일 사용성 개선, 접근성, 문서 보완에 참여할 수 있습니다. [기여 안내](CONTRIBUTING.md)를 읽고 Issue 또는 PR을 열어 주세요. 큰 변경은 먼저 Issue에서 범위를 논의하는 것을 권장합니다.

## 라이선스와 데이터

프로젝트가 작성한 코드와 문서는 [MIT License](LICENSE)를 따릅니다. 외부 자료의 권리와 이용 조건은 해당 제공자에게 있습니다. 공개 저장소에 잇플 원본 데이터, API 자격 증명, 개인정보, 이용 권한이 없는 사진을 올리지 않습니다. 공개 소스코드가 잇플 데이터의 재배포 권한을 의미하지 않습니다.

이 프로젝트는 BC카드의 공식 서비스가 아닙니다. 공개 k-skill 경로의 조회 연동은 구현했지만 공모전 참가 등록과 유입 집계 검증은 별도입니다. 화면의 매출·영업 추정 정보는 실시간 영업 여부·대기 시간·가격을 보장하지 않습니다.
