# 검색과 AI 검색 노출 설정

2026년 11월 8일 적용. SEO는 검색 수집·색인과 페이지 이해를 돕는 작업이며 GEO는 AI 검색에서 콘텐츠가 이해·인용될 수 있도록 만드는 작업이다. 설정이나 사이트맵 제출만으로 색인, 순위, AI 답변 인용을 보장하지 않는다.

## 공개 페이지와 대표 주소

- 운영 대표 주소는 `https://bangbang-five.vercel.app`이다. `NEXT_PUBLIC_SITE_URL`로 HTTPS origin을 지정하면 canonical, Open Graph, 사이트맵, 구조화 데이터와 llms.txt에 함께 적용된다. Vercel 미리보기 주소를 대표 주소로 사용하지 않는다.
- `/`에는 지역을 담은 제목·설명, 직접 읽을 수 있는 지역 안내와 `/guide` 링크를 제공한다. 안내 문구는 자바스크립트를 실행하지 않은 HTML에도 포함된다. 음식점 목록은 기존의 실시간 클라이언트 조회를 유지한다.
- `/guide`는 정적 HTML 안내 페이지다. 지역 경계, 점심·카페 찾기, 추천 점수, 회식·고객층 조건, 데이터 한계와 출처를 설명한다. 잇플 원본 매장 데이터나 변동하는 후보 수는 정적 문서에 보관하지 않는다.
- `WebSite`, `FAQPage`, `BreadcrumbList` JSON-LD를 제공하며 FAQ 내용은 실제 본문과 같은 데이터에서 생성한다. 식당을 운영하는 업체로 위장한 LocalBusiness, 가짜 평점·리뷰·가격은 넣지 않는다. FAQ 리치 결과 노출 자격이나 표시를 보장하지 않는다.
- `/share`는 임시 후보 조합이므로 `noindex, follow`를 적용하고 사이트맵에 넣지 않는다. 개별 공유 제목·설명·이미지와 원본 잇플 직접 링크는 유지한다.

## 크롤링과 AI 검색

- `/robots.txt`: 일반 검색·AI 검색 크롤러에 공개 페이지와 렌더링 자원을 허용한다. `/api/` 원본 응답 경로만 크롤링을 제한한다. 특정 봇에 더 느슨한 중복 규칙을 만들지 않는다.
- `/sitemap.xml`: 색인 대상인 홈과 안내 페이지 두 곳만 나열한다. 안내의 `lastmod`는 실제 내용 갱신일을 사용한다.
- `/llms.txt`: 서비스 설명과 공개 안내 링크를 담은 보조 읽기 자료다. 검색엔진 공통 표준이나 필수 등록 파일로 간주하지 않는다. 원본 식당 데이터를 덤프하지 않는다.
- Vercel preview 배포는 robots 차단과 noindex 정책을 적용한다. 공유 페이지, API, 오프라인 문서도 검색 결과에서 제외한다. robots.txt는 인증이나 개인정보 보호 수단이 아니다.
- 잇플 상세 링크의 `strict-origin-when-cross-origin` 정책을 유지한다. 공모전 유입 집계와 SEO는 별도이며, 검색 로봇의 방문을 참가 실적으로 만들지 않는다.

Google 공식 안내에 따르면 AI 개요·AI 모드에도 기본 SEO가 적용되며 별도의 AI 파일이나 특수 구조화 데이터는 필요하지 않다. [Google AI 기능 안내](https://developers.google.com/search/docs/appearance/ai-features), [표준 URL 안내](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Next.js robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)

## 검색 서비스 등록과 운영

Google Search Console은 URL 접두어 속성 `https://bangbang-five.vercel.app/`으로 등록한다. Google 발급 `public/google6cac55f830514a99.html`과 Bing 발급 `public/BingSiteAuth.xml`은 소유권 확인용 공개 파일이며 비밀번호나 API 비밀키가 아니다. 등록 유지에 필요하므로 임의 삭제하지 않는다.

Google은 HTML 파일 소유권 확인과 사이트맵 처리를 완료했고 2개 페이지를 발견했다(2026년 11월 8일). 이는 두 페이지의 색인 완료를 의미하지 않는다. Bing의 XML 인증 서버가 파일 접근 실패를 반환하여 홈페이지에 같은 발급 값의 `msvalidate.01` 메타태그도 제공한다.

다른 소유자나 도메인의 인증이 필요하면 `SEO_GOOGLE_VERIFICATION`, `SEO_NAVER_VERIFICATION`, `SEO_BING_VERIFICATION`에 해당 서비스가 발급한 메타태그 content 값만 입력하고 재배포한다. 네이버는 서치어드바이저 로그인과 소유권 확인을 거쳐야 한다. 토큰 설정만으로 등록이 완료되지는 않는다.

등록한 검색 서비스에는 `https://bangbang-five.vercel.app/sitemap.xml`을 제출한다. 이후 홈·안내 페이지의 수집 상태와 색인 제외 원인, 검색어·클릭 실적을 확인한다. 새로 작성한 안내나 지역 범위가 달라지면 `src/lib/guide.ts`의 내용과 실제 수정일을 함께 갱신한다. 대량의 유사 지역 페이지나 근거 없는 맛집 순위를 만들지 않는다.

## 검증

프로덕션 빌드와 서버를 실행한 뒤 다음 명령으로 HTTP 응답과 원본 HTML을 검사한다. 브라우저 자바스크립트 없이 핵심 설명과 구조화 데이터가 읽히는지, canonical과 사이트맵이 같은 도메인을 가리키는지, 공유·오프라인 페이지가 제외되는지를 확인한다.

```sh
npm run build
npm run start
# 별도 터미널
npm run verify:seo
npm run verify:seo -- https://bangbang-five.vercel.app
```

사용자 지정 도메인은 두 번째 인수로 canonical 기준 주소를 넘긴다. `npm run verify:seo -- http://127.0.0.1:3000 https://example.com`
