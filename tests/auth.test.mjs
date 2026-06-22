import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = "/Users/jhg/vercelebesel/pairview";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("auth route files are wired", () => {
  const loginPage = read("app/login/page.tsx");
  const loginPanel = read("app/login/login-panel.tsx");
  const callbackRoute = read("app/auth/callback/route.ts");
  const logoutRoute = read("app/logout/route.ts");
  const middleware = read("middleware.ts");

  assert.match(loginPanel, /signInWithOAuth/);
  assert.match(callbackRoute, /exchangeCodeForSession/);
  assert.match(callbackRoute, /upsert/);
  assert.match(logoutRoute, /signOut/);
  assert.match(middleware, /matcher:\s*\[\s*"\/app\/:path\*"/);
  assert.match(middleware, /\/login/);
  assert.match(loginPage, /Google 로그인/);
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
