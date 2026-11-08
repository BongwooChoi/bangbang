# Project working agreement

## Context

- Read README.md, docs/product-brief.md, and docs/mobile-and-sharing.md before implementation.
- This is a Next.js App Router / React / TypeScript application. Use `npm ci`, `npm run dev`, `npm run typecheck`, `npm test`, and `npm run build` as appropriate. `npm run start` serves a completed production build at 127.0.0.1:3000.
- Respond in Korean by default and preserve unrelated work.

## Product requirements

- Prioritize mobile use, install-optional PWA behavior, accessible controls, and sharing.
- Center the map on Bangbang Intersection. The northern boundary is Gangnam Station exits 1 and 8; the southern boundary is Yangjae Station exits 1 and 4. Verified anchor coordinates and the provisional 400m-per-side corridor are documented in docs/data-and-boundary.md.
- Preserve the cute cream/coral/green design, rice-bowl mascot, and readable mobile controls.
- Sharing should open useful content on this service. The user may then explicitly follow the unmodified eat.pl URL. Do not add automatic redirects or tracking parameters to eat.pl links.
- Do not treat historical payment data as confirmed live opening hours, wait times, prices, or dietary safety.
- Recommendation weights and tie-breaking are documented in docs/recommendations.md. Preserve the distinction between historical busy-day and busy-period aggregates; do not infer their joint distribution or current congestion. Run npm test for ranking or filter changes.

## Data and deployment

- Do not commit credentials, personal information, raw eat.pl datasets, or unlicensed assets.
- Use synthetic data for fixtures. Do not persist or service-worker-cache eat.pl responses or map tiles without permission from the provider.
- Vercel is the preferred host, with free operation as a goal. Hobby eligibility for a reward-generating contest service is unresolved. Do not assume free eligibility or start a paid plan.

## Verification

- Inspect the diff and run checks relevant to the change.
- For mobile/PWA/sharing changes, distinguish automated checks from real-device verification. Never claim an untested platform works.
- Browser automation uses ego-browser per the global agreement. Test the production build for service-worker behavior. Do not send actual social messages as part of a test.
- Record stable setup and validation commands in this file or README.md when they are established.
- For SEO, metadata or public guide changes, run `npm run verify:seo` against a running production build (or pass the deployment URL). Keep canonical URLs production-only, FAQ markup consistent with visible content, and update `GUIDE_UPDATED` only when the guide changes. Keep webmaster verification files in `public/` intact.
