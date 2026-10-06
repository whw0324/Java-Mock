export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function grade(question, response) {
  if (!Array.isArray(response)) return false;
  if (question.type === "match" || question.type === "order") {
    return (
      response.length === question.options.length &&
      response.every((value, index) => value === index)
    );
  }
  return (
    response.length === question.answer.length &&
    new Set(response).size === response.length &&
    response.every((value) => question.answer.includes(value))
  );
}
export function prepare(question) {
  const indices = question.options.map((_, i) => i);
  let order = shuffle(indices);
  if (order.every((v, i) => v === i) && order.length > 1)
    order.push(order.shift());
  return {
    id: question.id,
    order,
    right: shuffle(indices),
    response:
      question.type === "order"
        ? [...order]
        : question.type === "match"
          ? indices.map(() => -1)
          : [],
    result: null,
  };
}
export function validateProgress(input, validIds, aliases = {}) {
  if (
    !input ||
    input.version !== 1 ||
    typeof input.records !== "object" ||
    input.records === null ||
    Array.isArray(input.records) ||
    !Array.isArray(input.bookmarks)
  )
    throw new Error("This is not a valid Mockbook backup.");
  const records = {};
  for (const [id, r] of Object.entries(input.records)) {
    if (!validIds.has(id)) continue;
    if (
      !r ||
      typeof r !== "object" ||
      !Number.isSafeInteger(r.attempts) ||
      r.attempts < 1 ||
      !Number.isSafeInteger(r.correct) ||
      r.correct < 0 ||
      r.correct > r.attempts ||
      typeof r.lastCorrect !== "boolean" ||
      typeof r.lastAt !== "string" ||
      !Number.isFinite(Date.parse(r.lastAt))
    )
      throw new Error("The backup contains invalid progress records.");
    records[id] = {
      attempts: r.attempts,
      correct: r.correct,
      lastCorrect: r.lastCorrect,
      lastAt: r.lastAt,
    };
  }
  return {
    version: 1,
    records,
    bookmarks: [
      ...new Set(
        input.bookmarks
          .filter(
            (id) => typeof id === "string" && validIds.has(aliases[id] || id),
          )
          .map((id) => aliases[id] || id),
      ),
    ],
  };
}
export function mergeProgress(current, incoming) {
  const records = { ...current.records };
  for (const [id, r] of Object.entries(incoming.records)) {
    const existing = records[id];
    if (!existing || Date.parse(r.lastAt) > Date.parse(existing.lastAt))
      records[id] = r;
  }
  return {
    version: 1,
    records,
    bookmarks: [...new Set([...current.bookmarks, ...incoming.bookmarks])],
  };
}
export function recordResult(
  progress,
  id,
  correct,
  now = new Date().toISOString(),
) {
  const old = progress.records[id] || { attempts: 0, correct: 0 };
  return {
    ...progress,
    records: {
      ...progress.records,
      [id]: {
        attempts: old.attempts + 1,
        correct: old.correct + Number(correct),
        lastCorrect: correct,
        lastAt: now,
      },
    },
  };
}
