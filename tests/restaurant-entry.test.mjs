import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = "/Users/jhg/vercelebesel/pairview";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("restaurant entry uses first-visit-only behavior", () => {
  const appPage = read("app/app/page.tsx");
  const experienceCards = read("app/_components/experience-cards.tsx");
  const experienceRoute = read("app/api/experiences/route.ts");

  assert.match(appPage, /첫 방문만 새 기록/);
  assert.match(appPage, /평가 남기기/);
  assert.match(experienceCards, /한줄평/);
  assert.match(experienceCards, /아직 리뷰가 없다/);
  assert.match(experienceRoute, /record_mode: "first_visit_only"/);
});
