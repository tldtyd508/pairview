import assert from "node:assert/strict";
import test from "node:test";
import { site } from "../lib/site-data.js";

test("site metadata is wired for the shell", () => {
  assert.equal(site.name, "Pairview");
  assert.equal(site.tagline, "함께한 경험, 서로 다른 리뷰.");
  assert.match(site.url, /^https?:\/\//);
});
