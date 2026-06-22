# Pairview

함께한 경험, 서로 다른 리뷰.

Pairview는 함께한 경험에 대해 두 사람이 각자의 평가를 기록하는 비공개 페어 로그입니다. 첫 MVP는 커플의 음식점 기록에 집중합니다.

현재 저장소는 Next.js 앱 shell까지 준비된 상태이며, 제품 구현은 단계별 계획에 따라 진행합니다.

## Project documents

- [`docs/PRODUCT.md`](docs/PRODUCT.md): 확정된 제품 요구사항과 미결정 사항
- [`PLAN.md`](PLAN.md): 작은 단위로 나눈 MVP 구현 순서와 완료 조건
- [`AGENTS.md`](AGENTS.md): 에이전트가 항상 따라야 할 저장소 규칙
- [`supabase/README.md`](supabase/README.md): 스키마와 수동 설정 방법
- [`supabase/tests/cross_pair_denial.sql`](supabase/tests/cross_pair_denial.sql): 교차 페어 차단 검증용 SQL

## Local commands

- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
