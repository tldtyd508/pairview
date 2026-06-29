import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { filterAndSortExperiences, parseHistoryFilters } from "../lib/history.js";

const root = "/Users/jhg/vercelebesel/pairview";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const experiences = [
  {
    id: "1",
    happened_on: "2026-01-05",
    created_at: "2026-01-05T10:00:00.000Z",
    updated_at: "2026-01-05T10:00:00.000Z",
    pair_id: "pair",
    subject_id: "subject-1",
    notes: "truffle pasta",
    created_by_user_id: "user-a",
    subject: {
      id: "subject-1",
      pair_id: "pair",
      kind: "restaurant",
      title: "Mellow Table",
      description: "Seoul Forest",
      metadata: {
        location: "Seoul Forest",
        category: "Italian",
        ordered_menus: "truffle pasta",
      },
      created_by_user_id: "user-a",
      created_at: "2026-01-05T10:00:00.000Z",
      updated_at: "2026-01-05T10:00:00.000Z",
    },
    reviews: [
      {
        id: "r1",
        pair_id: "pair",
        experience_id: "1",
        user_id: "user-a",
        score: 4.5,
        body: "great",
        created_at: "2026-01-05T11:00:00.000Z",
        updated_at: "2026-01-05T11:00:00.000Z",
      },
    ],
    markers: [{ id: "m1", pair_id: "pair", name: "셀카", color: "#ff0000", icon: "📸", description: null, is_default: false, created_by_user_id: "user-a", created_at: "2026-01-05T11:00:00.000Z", updated_at: "2026-01-05T11:00:00.000Z" }],
  },
  {
    id: "2",
    happened_on: "2026-01-10",
    created_at: "2026-01-10T10:00:00.000Z",
    updated_at: "2026-01-10T10:00:00.000Z",
    pair_id: "pair",
    subject_id: "subject-2",
    notes: "ramen",
    created_by_user_id: "user-b",
    subject: {
      id: "subject-2",
      pair_id: "pair",
      kind: "restaurant",
      title: "Noodle Place",
      description: "Gangnam",
      metadata: {
        location: "Gangnam",
        category: "Ramen",
        ordered_menus: "ramen",
      },
      created_by_user_id: "user-b",
      created_at: "2026-01-10T10:00:00.000Z",
      updated_at: "2026-01-10T10:00:00.000Z",
    },
    reviews: [
      {
        id: "r2",
        pair_id: "pair",
        experience_id: "2",
        user_id: "user-a",
        score: 3.0,
        body: "ok",
        created_at: "2026-01-10T11:00:00.000Z",
        updated_at: "2026-01-10T11:00:00.000Z",
      },
      {
        id: "r3",
        pair_id: "pair",
        experience_id: "2",
        user_id: "user-b",
        score: 5.0,
        body: "nice",
        created_at: "2026-01-10T11:10:00.000Z",
        updated_at: "2026-01-10T11:10:00.000Z",
      },
    ],
    markers: [],
  },
  {
    id: "3",
    happened_on: "2026-01-12",
    created_at: "2026-01-12T10:00:00.000Z",
    updated_at: "2026-01-12T10:00:00.000Z",
    pair_id: "pair",
    subject_id: "subject-3",
    notes: "dessert",
    created_by_user_id: "user-a",
    subject: {
      id: "subject-3",
      pair_id: "pair",
      kind: "restaurant",
      title: "Sweet Corner",
      description: "Hongdae",
      metadata: {
        location: "Hongdae",
        category: "Dessert",
        ordered_menus: "cake",
      },
      created_by_user_id: "user-a",
      created_at: "2026-01-12T10:00:00.000Z",
      updated_at: "2026-01-12T10:00:00.000Z",
    },
    reviews: [
      {
        id: "r4",
        pair_id: "pair",
        experience_id: "3",
        user_id: "user-a",
        score: 4.0,
        body: "good",
        created_at: "2026-01-12T11:00:00.000Z",
        updated_at: "2026-01-12T11:00:00.000Z",
      },
      {
        id: "r5",
        pair_id: "pair",
        experience_id: "3",
        user_id: "user-b",
        score: 4.0,
        body: "also good",
        created_at: "2026-01-12T11:10:00.000Z",
        updated_at: "2026-01-12T11:10:00.000Z",
      },
    ],
    markers: [],
  },
];

test("parseHistoryFilters normalizes query parameters", () => {
  const filters = parseHistoryFilters({
    q: "mellow",
    sort: "your_score",
    review_state: "one",
    min_score: "4",
    max_score: "5",
    from: "2026-01-01",
    to: "2026-01-31",
    marker: "셀카",
  });

  assert.equal(filters.query, "mellow");
  assert.equal(filters.sort, "your_score");
  assert.equal(filters.reviewState, "one");
  assert.equal(filters.minScore, 4);
  assert.equal(filters.maxScore, 5);
  assert.equal(filters.marker, "셀카");
});

test("filterAndSortExperiences handles search and sort", () => {
  const filters = parseHistoryFilters({
    q: "truffle",
    sort: "recent",
  });

  const result = filterAndSortExperiences(experiences, filters, "user-a", "user-b");
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "1");
});

test("filterAndSortExperiences handles review state and score sort", () => {
  const filters = parseHistoryFilters({
    review_state: "both",
    sort: "partner_score",
  });

  const result = filterAndSortExperiences(experiences, filters, "user-a", "user-b");
  assert.equal(result.length, 2);
  assert.equal(result[0].id, "2");
  assert.equal(result[1].id, "3");
});

test("filterAndSortExperiences handles best sort", () => {
  const filters = parseHistoryFilters({
    sort: "best",
  });

  const result = filterAndSortExperiences(experiences, filters, "user-a", "user-b");
  assert.equal(result.length, 2);
  assert.equal(result[0].id, "3");
  assert.equal(result[1].id, "2");
});

test("history UI and detail route are wired", () => {
  const appPage = read("app/app/page.tsx");
  const evaluatePage = read("app/evaluate/page.tsx");
  const workspaceNav = read("app/_components/workspace-nav.tsx");
  const historyPage = read("app/history/page.tsx");
  const detailPage = read("app/history/[experienceId]/page.tsx");
  const markerRoute = read("app/api/markers/route.ts");
  const experienceMarkerRoute = read("app/api/experience-markers/route.ts");
  const photoRoute = read("app/api/photos/route.ts");

  assert.match(appPage, /최근 기록/);
  assert.match(appPage, /베스트 기록/);
  assert.match(appPage, /평가 대기/);
  assert.match(workspaceNav, /대시보드/);
  assert.match(workspaceNav, /평가 남기기/);
  assert.match(workspaceNav, /기록 보관함/);
  assert.match(evaluatePage, /기록 남기기/);
  assert.match(evaluatePage, /마커 관리/);
  assert.match(evaluatePage, /기록 저장/);
  assert.match(historyPage, /기록 보관함/);
  assert.match(historyPage, /필터 적용/);
  assert.match(historyPage, /기록 검색과 필터/);
  assert.match(historyPage, /베스트/);
  assert.match(detailPage, /기록 보관함/);
  assert.match(detailPage, /기록 상세/);
  assert.match(detailPage, /마커 없음/);
  assert.match(detailPage, /마커 적용/);
  assert.match(detailPage, /사진 업로드/);
  assert.match(markerRoute, /missing-marker-fields/);
  assert.match(experienceMarkerRoute, /experience_markers/);
  assert.match(photoRoute, /photo-too-large/);
});
