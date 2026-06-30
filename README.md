# Pairview

함께한 경험, 서로 다른 리뷰.

Pairview는 두 사람이 함께한 경험을 각자의 점수와 한줄평으로 남기는 비공개 페어 로그입니다. MVP는 음식점 기록에 집중하며 평균 점수 대신 두 사람의 취향을 그대로 보여줍니다.

## MVP features

- Google 로그인과 보호된 앱 영역
- 일회성 초대 링크로 구성하는 2인 pair
- 음식점, 방문일, 위치, 카테고리, 주문 메뉴 기록
- 각 멤버의 독립적인 0–5점 평가와 한줄평
- 검색, 정렬, 필터가 가능한 기록 목록과 상세 화면
- pair별 커스텀 마커와 비공개 사진 첨부
- pair 단위 데이터 및 Storage 접근 격리

제품 결정 사항은 [`docs/PRODUCT.md`](docs/PRODUCT.md), 구현 순서는 [`PLAN.md`](PLAN.md)에 정리되어 있습니다.

## Stack and architecture

- Next.js App Router, React, TypeScript, Tailwind CSS
- Supabase Auth, Postgres, Row Level Security, private Storage
- Vercel Web Analytics와 GitHub 연동 Vercel 배포
- Node test runner 단위/구조 테스트와 Playwright E2E

브라우저와 Server Component는 각각 `lib/supabase`의 전용 클라이언트를 사용합니다. 쓰기 작업은 `app/api`의 Route Handler에서 인증과 입력을 확인한 뒤 실행합니다. `subjects`와 `experiences`를 분리해 재방문 정책 및 음식점 이외 카테고리 확장을 열어 두었습니다.

## Local setup

Node.js 20 이상과 npm이 필요합니다.

```bash
npm install
cp .env.example .env.local
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 열립니다. 처음 E2E를 실행할 때 Chromium이 없다면 `npx playwright install chromium`을 실행합니다.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | yes | 공개 배포 URL. 로컬에서는 `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | 브라우저와 서버에서 사용하는 publishable anon key |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | yes | Google Identity Services Web client ID |
| `SUPABASE_SERVICE_ROLE_KEY` | no | 현재 앱 런타임에서는 사용하지 않음. 로컬 관리 작업에만 보관하며 VCS에 커밋 금지 |

실제 값은 `.env.local`과 Vercel Environment Variables에만 저장합니다. E2E 전용 `PAIRVIEW_E2E_MODE`는 Playwright가 자체 주입하며 일반 실행이나 배포에 설정하면 안 됩니다.

## Supabase setup

1. Supabase 프로젝트를 만들고 Google provider를 활성화합니다.
2. SQL editor에서 아래 migration을 번호 순서대로 실행합니다.
   - `supabase/migrations/0001_initial_schema.sql`
   - `supabase/migrations/0002_pair_onboarding.sql`
   - `supabase/migrations/0003_storage_and_photos.sql`
3. Google OAuth의 Authorized JavaScript origins에 local/production origin을 등록하고, Supabase redirect allow list에 다음 callback을 등록합니다.
   - `http://localhost:3000/auth/callback`
   - `https://pairview.vercel.app/auth/callback`
4. 생성된 private `pairview` Storage bucket이 public으로 노출되지 않았는지 확인합니다.
5. [`supabase/tests/cross_pair_denial.sql`](supabase/tests/cross_pair_denial.sql)을 실제 테스트 사용자와 pair ID로 실행합니다.

세부 스키마와 정책 설명은 [`supabase/README.md`](supabase/README.md)에 있습니다.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Playwright E2E는 외부 OAuth와 DB에 의존하지 않는 격리 fixture 모드로 로그인 경계, pair 생성/합류, 음식점 등록, 두 리뷰, 마커, 사진, 기록 조회를 검증합니다. 실제 Google/Supabase 연결은 배포 전 수동 점검표로 별도 확인해야 합니다.

Production 로그인은 Google Identity Services popup에서 받은 ID token을 nonce와 함께 Supabase에 전달합니다. 따라서 사용자는 Google 로그인 중 Supabase project domain으로 이동하지 않습니다.

## Vercel deployment

1. Vercel의 기존 `pairview` 프로젝트가 GitHub 저장소 `tldtyd508/pairview`와 연결됐는지 확인합니다.
2. Production 환경변수에 `.env.example`의 공개 설정 값을 등록합니다. service-role key는 앱에서 필요하지 않습니다.
3. Production branch를 저장소 기본 브랜치로 설정합니다.
4. PR preview에서 기능을 확인한 뒤 기본 브랜치에 merge합니다. Vercel CLI는 사용하지 않습니다.
5. 배포 후 `https://pairview.vercel.app`, OAuth callback, Analytics 수집 여부를 확인합니다.

실환경 점검 항목은 [`docs/RELEASE.md`](docs/RELEASE.md)를 따릅니다.

## Repository documents

- [`docs/PRODUCT.md`](docs/PRODUCT.md): 제품 요구사항과 미결정 사항
- [`PLAN.md`](PLAN.md): MVP 작업 1–8과 수용 조건
- [`AGENTS.md`](AGENTS.md): 저장소 작업 규칙
- [`docs/RELEASE.md`](docs/RELEASE.md): preview/production 릴리스 점검표
- [`supabase/README.md`](supabase/README.md): Supabase 구조와 설정
