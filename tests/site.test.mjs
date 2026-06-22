import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { site } from "../lib/site-data.js";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("site metadata is wired for the shell", () => {
  assert.equal(site.name, "Pairview");
  assert.equal(site.tagline, "함께한 경험, 서로 다른 리뷰.");
  assert.match(site.url, /^https?:\/\//);
});

test("release states and documentation are present", () => {
  assert.match(read("app/loading.tsx"), /aria-busy="true"/);
  assert.match(read("app/error.tsx"), /다시 시도/);
  assert.match(read("app/not-found.tsx"), /404/);
  assert.match(read("app/offline-notice.tsx"), /navigator\.onLine/);
  assert.match(read("README.md"), /npm run test:e2e/);
  assert.match(read("README.md"), /Vercel deployment/);
  assert.match(read("docs/RELEASE.md"), /Supabase and Google/);
});
