import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  grade,
  prepare,
  validateProgress,
  mergeProgress,
  recordResult,
} from "../src/engine.mjs";
const library = JSON.parse(
  fs.readFileSync(new URL("../public/data/library.json", import.meta.url)),
);
const questions = JSON.parse(
  fs.readFileSync(new URL("../public/data/questions.json", import.meta.url)),
);
const all = [...questions, ...library.recognition];
const sourceIds = new Set(library.sources.map((s) => s.id));
test("consolidation preserves every source exactly once and prioritizes 2026", () => {
  const refs = library.sources.flatMap((s) => s.references);
  assert.equal(refs.length, 307);
  assert.equal(new Set(refs.map((r) => r.id)).size, 307);
  assert.equal(
    refs.filter((r) => r.year === 2026 && !r.supplement).length,
    140,
  );
  assert.equal(
    refs.filter((r) => r.year === 2025 && !r.supplement).length,
    164,
  );
  for (const source of library.sources) {
    assert(source.references.some((r) => r.id === source.id));
    if (source.references.some((r) => r.year === 2026))
      assert.equal(source.year, 2026);
    for (const ref of source.references)
      assert.equal(library.aliases[ref.id], source.id);
  }
  assert.equal(library.aliases["y25-002"], "y26-2.6");
  const oop = library.sources.find((s) => s.id === "y26-2.6");
  assert(oop.body.includes("Overloading and overriding"));
  assert(oop.references.some((r) => r.id === "y25-002"));
  assert.equal(library.sources.filter((s) => s.id === "y25-002").length, 0);
  const stream = library.sources.find((s) => s.id === "y25-extra-stream");
  assert(stream.body.includes("Terminal operations"));
  assert(stream.references.some((r) => r.id === "y25-052"));
  assert.equal(stream.supplement, false);
});
test("every practice topic has authored concepts and one current recall question", () => {
  const covered = new Set(questions.flatMap((q) => q.sourceIds));
  for (const s of library.sources.filter((s) => !s.supplement)) {
    assert(covered.has(s.id), `Missing concept coverage for ${s.id}`);
    assert.equal(
      library.recognition.filter((q) => q.sourceIds.includes(s.id)).length,
      1,
    );
  }
  assert(questions.length >= 200);
  assert.equal(new Set(all.map((q) => q.id)).size, all.length);
  for (const q of all) {
    assert(
      q.sourceIds.every((id) => sourceIds.has(id)),
      q.id,
    );
    assert.equal(
      q.category,
      library.sources.find((s) => s.id === q.sourceIds[0]).category,
    );
    assert(q.options.length >= 2);
    assert.equal(
      new Set(q.options.map((v) => JSON.stringify(v))).size,
      q.options.length,
    );
  }
  assert.equal(
    library.legacyRecognition.filter((q) =>
      all.some((current) => current.id === q.id),
    ).length,
    0,
  );
  for (const q of library.legacyRecognition)
    assert(q.sourceIds.every((id) => sourceIds.has(id)));
});
test("old bookmarks migrate to primary topics without duplicating them", () => {
  const ids = new Set([
    ...sourceIds,
    ...all.map((q) => q.id),
    ...library.legacyRecognition.map((q) => q.id),
  ]);
  const old = {
    version: 1,
    records: {
      "rec-y25-002": {
        attempts: 3,
        correct: 1,
        lastCorrect: false,
        lastAt: "2026-10-05T00:00:00Z",
      },
    },
    bookmarks: ["y25-002", "y26-2.6", "rec-y25-002"],
  };
  const migrated = validateProgress(old, ids, library.aliases);
  assert.deepEqual(migrated.bookmarks, ["y26-2.6", "rec-y25-002"]);
  assert.equal(migrated.records["rec-y25-002"].attempts, 3);
});
test("all shipped text is English, with no untranslated Chinese text", () => {
  assert(!/[\u4e00-\u9fff]/u.test(JSON.stringify(library)));
  assert(!/[\u4e00-\u9fff]/u.test(JSON.stringify(questions)));
});
test("all four formats correctly grade canonical answers and reject wrong answers", () => {
  assert.equal(new Set(questions.map((q) => q.type)).size, 4);
  for (const q of all) {
    const expected = ["match", "order"].includes(q.type)
      ? q.options.map((_, i) => i)
      : q.answer;
    assert.equal(grade(q, expected), true, q.id);
    assert.equal(grade(q, []), false, q.id);
    if (expected.length > 1 && q.type !== "multi") {
      const wrong = [...expected];
      [wrong[0], wrong[1]] = [wrong[1], wrong[0]];
      assert.equal(grade(q, wrong), false, q.id);
    }
  }
  const multi = questions.find((q) => q.type === "multi");
  assert.equal(grade(multi, [...multi.answer].reverse()), true);
  assert.equal(grade(multi, [0, 0, 0]), false);
  assert.equal(grade(multi, [...multi.answer, 3]), false);
});
test("question preparation preserves identities and shuffles initial sorting exercises", () => {
  for (const q of questions) {
    const item = prepare(q);
    assert.deepEqual(
      [...item.order].sort((a, b) => a - b),
      q.options.map((_, i) => i),
    );
    assert.equal(item.result, null);
    if (q.type === "order") assert.equal(grade(q, item.response), false);
    if (q.type === "match") assert(item.response.every((v) => v === -1));
  }
});
test("wrong answers are resolved by a later correct answer, with attempt history retained", () => {
  let p = { version: 1, records: {}, bookmarks: [] };
  p = recordResult(p, "concept-001", false);
  p = recordResult(p, "concept-001", true);
  assert.deepEqual(
    { ...p.records["concept-001"], lastAt: null },
    { attempts: 2, correct: 1, lastCorrect: true, lastAt: null },
  );
});
test("backup import rejects malformed data and merges newer records without double counting", () => {
  const ids = new Set(["concept-001"]);
  const a = recordResult(
    { version: 1, records: {}, bookmarks: ["concept-001"] },
    "concept-001",
    false,
    "2026-10-01T00:00:00Z",
  );
  const b = recordResult(a, "concept-001", true, "2026-10-02T00:00:00Z");
  const merged = mergeProgress(b, validateProgress(a, ids));
  assert.equal(merged.records["concept-001"].attempts, 2);
  assert.equal(merged.bookmarks.length, 1);
  assert.throws(() => validateProgress({ version: 2 }, ids));
  assert.throws(() =>
    validateProgress(
      { ...a, records: { "concept-001": { attempts: -1 } } },
      ids,
    ),
  );
  assert.throws(() => validateProgress({ ...a, records: [] }, ids));
  const safe = validateProgress(
    { ...a, bookmarks: ["missing", 7, "concept-001", "concept-001"] },
    ids,
  );
  assert.deepEqual(safe.bookmarks, ["concept-001"]);
});
