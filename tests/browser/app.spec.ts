import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { prepare } from "../../src/engine.mjs";
const questions = JSON.parse(
  fs.readFileSync("public/data/questions.json", "utf8"),
);
const library = JSON.parse(fs.readFileSync("public/data/library.json", "utf8"));
async function seed(page: any, q: any) {
  await page.addInitScript(
    ({ q, item }: any) => {
      if (!localStorage.getItem("seeded")) {
        localStorage.setItem(
          "mockbook-v1",
          JSON.stringify({
            bankRevision: 3,
            progress: { version: 1, records: {}, bookmarks: [] },
            session: {
              items: [item],
              index: 0,
              done: false,
              title: "Browser verification",
            },
          }),
        );
        localStorage.setItem("seeded", "1");
      }
    },
    { q, item: prepare(q) },
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: /Pick up where you left off/ })
    .click();
}
for (const type of ["single", "multi", "order", "match"])
  test(`${type}: correct response, feedback, persistence, completion`, async ({
    page,
  }) => {
    const q = questions.find((q: any) => q.type === type);
    await seed(page, q);
    if (type === "single")
      await page
        .getByRole("button", {
          name: new RegExp(q.options[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        })
        .click();
    if (type === "multi") {
      for (const i of q.answer)
        await page
          .getByRole("button", { name: q.options[i], exact: true })
          .click();
      await page.getByRole("button", { name: "Check answer" }).click();
    }
    if (type === "order") {
      for (let target = 0; target < q.options.length; target++) {
        for (let guard = 0; guard < 10; guard++) {
          const current = await page.locator(".sort-text").allTextContents();
          const pos = current.indexOf(q.options[target]);
          if (pos === target) break;
          await page
            .getByRole("button", {
              name: `Move item ${pos + 1} up`,
              exact: true,
            })
            .click();
        }
      }
      await page.getByRole("button", { name: "Check answer" }).click();
    }
    if (type === "match") {
      for (const pair of q.options) {
        await page
          .locator(".matching>div")
          .first()
          .getByRole("button", {
            name: new RegExp(pair[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
          })
          .click();
        await page
          .locator(".matching>div")
          .last()
          .getByRole("button", { name: new RegExp(pair[1]) })
          .click();
      }
      await page.getByRole("button", { name: "Check answer" }).click();
    }
    await expect(
      page.getByRole("heading", { name: "That’s right." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Bookmark question" }).click();
    await page.reload();
    await page
      .getByRole("button", { name: /Pick up where you left off/ })
      .click();
    await expect(
      page.getByRole("heading", { name: "That’s right." }),
    ).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mockbook-v1")!),
    );
    expect(stored.progress.records[q.id].attempts).toBe(1);
    expect(stored.progress.bookmarks).toContain(q.id);
    await page.getByRole("button", { name: "Finish session" }).click();
    await expect(
      page.getByRole("heading", { name: "Another step forward." }),
    ).toBeVisible();
  });
test("wrong answer enters review, correct retry resolves it", async ({
  page,
}) => {
  const q = questions.find((q: any) => q.type === "single");
  await seed(page, q);
  await page.locator(".choice").filter({ hasText: q.options[1] }).click();
  await expect(page.getByRole("heading", { name: /Not quite/ })).toBeVisible();
  await page.getByRole("button", { name: "Finish session" }).click();
  await page.getByRole("button", { name: /Review mistakes/ }).click();
  await expect(page.locator(".review-row")).toHaveCount(1);
  await page
    .locator(".review-row")
    .getByRole("button", { name: "Practice", exact: true })
    .click();
  await page.locator(".choice").filter({ hasText: q.options[0] }).click();
  await page.getByRole("button", { name: /Review mistakes/ }).click();
  await expect(
    page.getByRole("heading", { name: "A fresh start." }),
  ).toBeVisible();
});
test("library searches both years and source notes retain provenance", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Question library", exact: true })
    .click();
  await expect(page.locator(".source-row")).toHaveCount(library.sources.length);
  await page
    .getByRole("combobox", { name: "Filter by source year" })
    .selectOption("2025");
  await expect(page.locator(".source-row")).toHaveCount(
    library.sources.filter((s: any) => s.years.includes(2025)).length,
  );
  await page.getByRole("textbox", { name: "Search questions" }).fill("What is join()?");
  await page.locator(".source-row").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".source-provenance")).toContainText("2025mock.md");
  await page
    .getByRole("button", { name: "Bookmark source", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Bookmarks", exact: true }).click();
  await expect(page.locator(".source-row")).toHaveCount(1);
});
test("backup export/import validates errors and preserves newer progress", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open settings and backup" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress" }).click();
  expect((await dl).suggestedFilename()).toContain("mockbook-progress");
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":77}'),
  });
  await expect(page.getByRole("status")).toContainText(
    "not a valid Mockbook backup",
  );
  const data = {
    version: 1,
    records: {
      [questions[0].id]: {
        attempts: 2,
        correct: 1,
        lastCorrect: false,
        lastAt: "2026-10-01T00:00:00Z",
      },
    },
    bookmarks: [library.sources[0].id],
  };
  await page.locator("input[type=file]").setInputFiles({
    name: "good.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.getByRole("status")).toContainText("Backup imported");
  await page.getByRole("button", { name: /Review mistakes/ }).click();
  await expect(page.locator(".review-row")).toHaveCount(1);
});
test("practice filters can start source recall and restore a session", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await page.getByRole("button", { name: /Full-bank recall/ }).click();
  await page.getByLabel("Category", { exact: true }).selectOption("6");
  await page.getByRole("button", { name: "Begin session" }).click();
  await expect(page.locator(".passage")).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mockbook-v1")!),
  );
  expect(state.session.items.length).toBe(
    Math.min(
      10,
      library.recognition.filter((q: any) => q.category === 6).length,
    ),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Pick up where you left off/ }),
  ).toBeVisible();
});
test("mobile has no page overflow and settings remain reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Build confidence/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Open settings and backup" }).click();
  await expect(
    page.getByRole("heading", { name: "Keep your progress safe." }),
  ).toBeVisible();
});

test("OOP is consolidated, old title finds it, and topic practice opens concepts", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Question library", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search questions" })
    .fill("What is OOP?");
  await expect(page.locator(".source-row")).toHaveCount(1);
  await page.locator(".source-row").click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "The Four OOP Principles", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".source-provenance")).toContainText("2026mock.md");
  await expect(page.locator(".source-excerpts summary")).toHaveCount(4);
  await page
    .locator(".source-excerpts summary")
    .filter({ hasText: "What is OOP?" })
    .click();
  await expect(
    page.locator(".source-excerpts details[open] .markdown"),
  ).toBeVisible();
  await page.getByRole("button", { name: /Practice this topic/ }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mockbook-v1")!),
  );
  expect(state.session.items.length).toBe(4);
  expect(
    state.session.items.every((i: any) => i.id.startsWith("concept")),
  ).toBe(true);
});
test("2025 Stream reference remains searchable with multiple concept exercises", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Question library", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search questions" })
    .fill("Stream API Reference");
  await expect(page.locator(".source-row")).toHaveCount(1);
  await page.locator(".source-row").click();
  await expect(
    page.getByRole("heading", { name: "Terminal operations", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Practice this topic/ }).click();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mockbook-v1")!),
  );
  expect(state.session.items.length).toBeGreaterThanOrEqual(15);
});
test("previous-version bookmarks and answers survive library consolidation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "mockbook-v1",
      JSON.stringify({
        progress: {
          version: 1,
          records: {
            "rec-y25-002": {
              attempts: 3,
              correct: 1,
              lastCorrect: false,
              lastAt: "2026-10-05T00:00:00Z",
            },
          },
          bookmarks: ["y25-002"],
        },
        session: null,
      }),
    ),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Bookmarks", exact: true }).click();
  await expect(page.locator(".source-row")).toHaveCount(1);
  await expect(page.locator(".source-row")).toContainText(
    "The Four OOP Principles",
  );
  await page.getByRole("button", { name: /Review mistakes/ }).click();
  await expect(page.locator(".review-row")).toHaveCount(1);
  await page
    .locator(".review-row")
    .getByRole("button", { name: "Practice", exact: true })
    .click();
  await expect(page.locator(".passage")).toBeVisible();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("mockbook-v1")!),
  );
  expect(state.progress.records["rec-y25-002"].attempts).toBe(3);
});
