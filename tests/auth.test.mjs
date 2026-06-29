import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = "/Users/jhg/vercelebesel/pairview";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("auth route files are wired", () => {
  const landingPage = read("app/page.tsx");
  const loginPage = read("app/login/page.tsx");
  const loginPanel = read("app/login/login-panel.tsx");
  const callbackRoute = read("app/auth/callback/route.ts");
  const profileRoute = read("app/api/auth/profile/route.ts");
  const logoutRoute = read("app/logout/route.ts");
  const middleware = read("middleware.ts");
  const createRoute = read("app/api/pairs/create/route.ts");
  const joinRoute = read("app/api/pairs/join/route.ts");
  const appPage = read("app/app/page.tsx");
  const evaluatePage = read("app/evaluate/page.tsx");
  const workspaceNav = read("app/_components/workspace-nav.tsx");
  const migration = read("supabase/migrations/0002_pair_onboarding.sql");
  const experienceRoute = read("app/api/experiences/route.ts");
  const reviewRoute = read("app/api/reviews/route.ts");
  const serverAuth = read("lib/auth/server.ts");
  const postRedirect = read("lib/http/redirect.ts");

  assert.match(loginPanel, /signInWithIdToken/);
  assert.match(loginPanel, /accounts\.google\.com\/gsi\/client/);
  assert.match(loginPanel, /use_fedcm_for_prompt/);
  assert.match(loginPanel, /nonce/);
  assert.match(callbackRoute, /exchangeCodeForSession/);
  assert.match(callbackRoute, /syncUserProfile/);
  assert.match(profileRoute, /syncUserProfile/);
  assert.match(logoutRoute, /signOut/);
  assert.match(middleware, /matcher:\s*\[\s*"\/app\/:path\*"/);
  assert.match(middleware, /"\/evaluate\/:path\*"/);
  assert.match(middleware, /"\/history\/:path\*"/);
  assert.match(middleware, /\/login/);
  assert.match(createRoute, /create_pair_with_invitation/);
  assert.match(joinRoute, /join_pair_via_invitation/);
  assert.match(experienceRoute, /first_visit_only/);
  assert.match(experienceRoute, /restaurant_name/);
  assert.match(reviewRoute, /experience_id/);
  assert.match(reviewRoute, /upsert/);
  assert.match(serverAuth, /getClaims/);
  assert.doesNotMatch(createRoute, /auth\.getUser/);
  assert.doesNotMatch(joinRoute, /auth\.getUser/);
  assert.match(postRedirect, /status:\s*303/);
  assert.doesNotMatch(middleware, /auth\.getUser/);
  assert.match(appPage, /최근 기록/);
  assert.match(appPage, /베스트 기록/);
  assert.match(appPage, /평가 대기/);
  assert.doesNotMatch(appPage, /onboarding/);
  assert.match(workspaceNav, /대시보드/);
  assert.match(workspaceNav, /평가 남기기/);
  assert.match(workspaceNav, /기록 보관함/);
  assert.match(evaluatePage, /기록 남기기/);
  assert.match(evaluatePage, /새 음식점 기록/);
  assert.match(evaluatePage, /기록은 처음 방문 기준/);
  assert.match(evaluatePage, /평가를 저장했어요/);
  assert.match(landingPage, /Google로 시작/);
  assert.match(landingPage, /각자 점수/);
  assert.match(landingPage, /마커를 남기고 사진을 붙여 둘 수 있어요/);
  assert.doesNotMatch(landingPage, /Coming soon/);
  assert.match(migration, /shares_pair_with_user/);
  assert.match(migration, /users can read pairmate profiles/);
  assert.match(migration, /pair_is_full/);
  assert.match(loginPage, /Google 계정으로 로그인하면/);
});

test("auth redirect helper is safe", () => {
  const redirect = read("lib/auth/redirect.ts");

  assert.match(redirect, /DEFAULT_NEXT_PATH/);
  assert.match(redirect, /startsWith\("\/\/"\)/);
});

test("supabase auth docs mention provider and callback URLs", () => {
  const docs = read("supabase/README.md");

  assert.match(docs, /Google as an auth provider/);
  assert.match(docs, /\/auth\/callback/);
  assert.match(docs, /NEXT_PUBLIC_SITE_URL/);
});
