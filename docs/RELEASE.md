# Pairview release checklist

자동화된 E2E는 fixture 저장소를 사용합니다. 아래 항목은 실제 Supabase 프로젝트, Google OAuth, Vercel preview 또는 production에서 확인해야 합니다.

## Before merge

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`가 모두 통과한다.
- [ ] `git diff --check`가 통과하고 secret 또는 `.env.local`이 추적되지 않는다.
- [ ] 모바일 폭과 데스크톱 폭에서 landing, login, onboarding, history detail을 확인한다.
- [ ] 키보드만으로 로그인, pair 생성/합류, 기록·리뷰·마커·사진 폼을 조작할 수 있다.
- [ ] 텍스트와 버튼의 focus 상태, label, 오류 메시지를 확인한다.

## Supabase and Google

- [ ] migration 0001–0003이 production Supabase에 순서대로 적용됐다.
- [ ] Google provider와 local/production callback URL이 등록됐다.
- [ ] 서로 다른 두 Google 계정이 로그인하고 하나의 pair로 연결된다.
- [ ] 제3의 계정은 가득 찬 pair에 합류할 수 없다.
- [ ] `supabase/tests/cross_pair_denial.sql`을 실제 UUID로 실행해 모든 pair-owned table의 교차 읽기가 0건임을 확인한다.
- [ ] 다른 pair 사용자가 사진 객체와 signed URL을 읽거나 변경할 수 없다.
- [ ] `pairview` bucket이 private이며 파일 종류와 10 MB 제한이 적용된다.

## Product happy path

- [ ] 첫 사용자가 pair를 만들고 두 번째 사용자에게 초대 링크를 전달한다.
- [ ] 두 번째 사용자가 해당 링크로 합류한다. 링크를 열 수 없을 때만 코드 입력으로 보완한다.
- [ ] 음식점 방문 기록을 만들고 두 사용자가 각자 점수와 한줄평을 저장한다.
- [ ] 평균 점수가 어느 화면에도 표시되지 않는다.
- [ ] 커스텀 마커를 만들고 기록에 붙였다가 제거할 수 있다.
- [ ] 사진을 첨부하고 두 pair 멤버만 볼 수 있다.
- [ ] 검색·정렬·필터 후 새로고침해도 URL에서 상태가 복원된다.

## Vercel production

- [ ] GitHub 저장소와 기존 Vercel 프로젝트가 연결됐다.
- [ ] production 환경변수가 설정됐고 E2E fixture 환경변수는 설정되지 않았다.
- [ ] `pairview.vercel.app`의 metadata, Open Graph, `robots.txt`, `sitemap.xml`이 올바르다.
- [ ] 보호 경로가 비로그인 사용자를 `/login`으로 보낸다.
- [ ] Vercel Web Analytics가 production 방문을 수집한다.
- [ ] 의도적으로 잘못된 주소와 네트워크 단절 시 안내 상태가 표시된다.
