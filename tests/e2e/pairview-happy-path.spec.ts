import { expect, test } from "@playwright/test";

const authCookie = {
  name: "pairview-fixture-auth",
  value: "user-a",
  url: "http://localhost:3001",
};

const partnerAuthCookie = {
  name: "pairview-fixture-auth",
  value: "user-b",
  url: "http://localhost:3001",
};

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z5y8AAAAASUVORK5CYII=",
  "base64",
);

test.describe.configure({ mode: "serial" });

test("pairview happy path", async ({ browser }) => {
  const unauthenticated = await browser.newContext();
  const unauthenticatedPage = await unauthenticated.newPage();
  await unauthenticatedPage.goto("/app");
  await expect(unauthenticatedPage).toHaveURL(/\/login/);
  await expect(unauthenticatedPage.getByRole("button", { name: "Google로 시작" })).toBeVisible();
  await unauthenticated.close();

  const owner = await browser.newContext();
  await owner.addCookies([authCookie]);
  const ownerPage = await owner.newPage();

  await ownerPage.goto("/app");
  await expect(ownerPage.getByText("Pair setup")).toBeVisible();

  await ownerPage.getByLabel("Pair label").fill("우리 커플");
  await ownerPage.getByRole("button", { name: "Pair 만들기" }).click();
  await expect(ownerPage.getByText("최근 기록", { exact: true })).toBeVisible();
  await expect(ownerPage.getByText("베스트 기록", { exact: true })).toBeVisible();
  await expect(ownerPage.getByText("PAIRVIEW", { exact: true })).toBeVisible();

  await ownerPage.goto("/evaluate");
  await expect(ownerPage.getByRole("heading", { name: "평가 남기기" })).toBeVisible();

  await ownerPage.getByRole("textbox", { name: "이름", exact: true }).fill("셀카");
  await ownerPage.getByLabel("아이콘").fill("📸");
  await ownerPage.getByLabel("색상").fill("#ef6a4c");
  await ownerPage.getByRole("button", { name: "마커 추가" }).click();
  await expect(ownerPage.getByText("마커를 추가했다.")).toBeVisible();

  await ownerPage.getByLabel("음식점 이름").fill("Mellow Table");
  await ownerPage.getByLabel("위치").fill("Seoul Forest");
  await ownerPage.getByLabel("방문일").fill("2026-01-05");
  await ownerPage.getByPlaceholder("예: 한식 / 이탈리안").fill("Italian");
  await ownerPage.getByLabel("주문한 메뉴").fill("truffle pasta");
  await ownerPage.getByLabel("메모").fill("데이트 코스");
  await ownerPage.getByRole("button", { name: "기록 저장" }).click();
  await expect(ownerPage.getByText("첫 방문 기록이 추가됐다")).toBeVisible();

  const createdExperienceUrl = new URL(ownerPage.url());
  const experienceId = createdExperienceUrl.searchParams.get("experience");
  expect(experienceId).not.toBeNull();

  await ownerPage.locator('select[name="score"]').selectOption("4.5");
  await ownerPage.getByLabel("한줄평").fill("분위기가 좋았다.");
  await ownerPage.getByRole("button", { name: "저장", exact: true }).click();
  await expect(ownerPage.getByText("리뷰를 저장했다.")).toBeVisible();

  const partner = await browser.newContext();
  await partner.addCookies([partnerAuthCookie]);
  const partnerPage = await partner.newPage();

  await partnerPage.goto("/app");
  await expect(partnerPage.getByText("Join with code")).toBeVisible();
  await partnerPage.getByLabel("Invitation code").fill("PAIRVIEW");
  await partnerPage.getByRole("button", { name: "Join pair" }).click();
  await expect(partnerPage.getByText("최근 기록", { exact: true })).toBeVisible();

  await partnerPage.goto(`/evaluate?experience=${experienceId}`);
  await partnerPage.locator('select[name="score"]').selectOption("5.0");
  await partnerPage.getByLabel("한줄평").fill("재방문할 만하다.");
  await partnerPage.getByRole("button", { name: "저장", exact: true }).click();
  await expect(partnerPage.getByText("리뷰를 저장했다.")).toBeVisible();

  await ownerPage.goto("/app");
  await expect(ownerPage.getByText("최근 기록", { exact: true })).toBeVisible();
  await expect(ownerPage.getByText("베스트 기록", { exact: true })).toBeVisible();
  await expect(ownerPage.getByRole("link", { name: "Mellow Table" }).first()).toBeVisible();

  await ownerPage.getByRole("link", { name: "Mellow Table" }).first().click();
  await expect(ownerPage).toHaveURL(/\/history\//);
  await expect(ownerPage.getByText("History detail")).toBeVisible();

  await ownerPage.getByRole("button", { name: "마커 붙이기" }).click();
  await expect(ownerPage.getByText("마커를 붙였다.")).toBeVisible();

  await ownerPage.getByLabel("사진 파일").setInputFiles({
    name: "pairview.png",
    mimeType: "image/png",
    buffer: tinyPng,
  });
  await ownerPage.getByLabel("설명").fill("셀카");
  await ownerPage.getByRole("button", { name: "사진 업로드" }).click();
  await expect(ownerPage.getByText("사진을 올렸다.")).toBeVisible();
  await expect(ownerPage.getByRole("img", { name: "셀카" })).toBeVisible();
  await expect(ownerPage.getByRole("button", { name: "📸 셀카 ×" })).toBeVisible();

  await ownerPage.goto("/history?sort=best");
  await expect(ownerPage).toHaveURL(/sort=best/);
  await expect(ownerPage.getByRole("link", { name: "Mellow Table" }).first()).toBeVisible();

  await partner.close();
  await owner.close();
});
