# Project working agreement

## Context

- Read README.md, docs/product-brief.md, and docs/mobile-and-sharing.md before implementation.
- This repository currently contains planning documents only. Do not invent install, build, or test commands. Add verified commands to README.md when introducing the application.
- Respond in Korean by default and preserve unrelated work.

## Product requirements

- Prioritize mobile use, install-optional PWA behavior, accessible controls, and sharing.
- Center the map on Bangbang Intersection. The northern boundary is Gangnam Station exits 1 and 8; the southern boundary is Yangjae Station exits 1 and 4. Verify coordinates before implementing the boundary; the east-west extent is not yet fixed.
- Sharing should open useful content on this service. The user may then explicitly follow the unmodified eat.pl URL. Do not add automatic redirects or tracking parameters to eat.pl links.
- Do not treat historical payment data as confirmed live opening hours, wait times, prices, or dietary safety.

## Data and deployment

- Do not commit credentials, personal information, raw eat.pl datasets, or unlicensed assets.
- Use synthetic data for fixtures. Do not persist or service-worker-cache eat.pl responses or map tiles without permission from the provider.
- Vercel is the preferred host, with free operation as a goal. Hobby eligibility for a reward-generating contest service is unresolved. Do not assume free eligibility or start a paid plan.

## Verification

- Inspect the diff and run checks relevant to the change.
- For mobile/PWA/sharing changes, distinguish automated checks from real-device verification. Never claim an untested platform works.
- Record stable setup and validation commands in this file or README.md when they are established.
