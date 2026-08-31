import { beforeEach, describe, expect, test } from "bun:test";

/**
 * The store is the only persistence Lock has, so these cover the parts that
 * would silently lose someone's record: a corrupt entry, a bumped version, a
 * device that refuses to store anything, and the cascade when an option that
 * other parts of the decision point at is removed.
 */

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  /** Set to throw from setItem, the way a full or locked-down device does. */
  full = false;

  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.full) throw new DOMException("quota", "QuotaExceededError");
    this.map.set(key, value);
  }
}

const memory = new MemoryStorage();

Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: {
    localStorage: memory,
    addEventListener: () => {},
    removeEventListener: () => {},
  },
});

const { createDecision, getAll, getDecision, removeDecision, resetStore, updateDecision } =
  await import("@/lib/decision-store");
const { addCriterion, addOption, lockDecision, removeOption, setChoice, setRating, saveReview } =
  await import("@/lib/decision-actions");
const { DECISION_STORE_VERSION } = await import("@/lib/decision-types");

beforeEach(() => {
  memory.full = false;
  memory.clear();
  resetStore();
});

describe("persistence", () => {
  test("a decision survives a reload", () => {
    const created = createDecision("Where to move?");
    // A new page load: the cache is gone, the device is not.
    resetStoreCacheOnly();
    expect(getDecision(created.id)?.question).toBe("Where to move?");
  });

  test("newest first", () => {
    createDecision("First");
    createDecision("Second");
    expect(getAll().map((d) => d.question)).toEqual(["Second", "First"]);
  });

  test("a corrupt entry costs only itself", () => {
    createDecision("Kept");
    const stored = JSON.parse(memory.getItem("lock.decisions") ?? "{}");
    stored.decisions.push({ id: "bad", question: 42 });
    memory.setItem("lock.decisions", JSON.stringify(stored));
    resetStoreCacheOnly();
    expect(getAll().map((d) => d.question)).toEqual(["Kept"]);
  });

  test("unreadable storage is treated as empty, never as a crash", () => {
    memory.setItem("lock.decisions", "{{{not json");
    resetStoreCacheOnly();
    expect(getAll()).toEqual([]);
  });

  test("a record from another schema version is not guessed at", () => {
    memory.setItem(
      "lock.decisions",
      JSON.stringify({ version: DECISION_STORE_VERSION + 1, decisions: [{ id: "x" }] }),
    );
    resetStoreCacheOnly();
    expect(getAll()).toEqual([]);
  });

  test("a device that cannot save says so", () => {
    memory.full = true;
    expect(() => createDecision("Nowhere to put this")).toThrow();
  });

  test("removing takes it off the device", () => {
    const d = createDecision("Gone");
    removeDecision(d.id);
    resetStoreCacheOnly();
    expect(getDecision(d.id)).toBeNull();
  });

  test("an edit cannot change which decision it is", () => {
    const d = createDecision("Stays");
    updateDecision(d.id, (current) => ({ ...current, id: "hijacked", question: "Edited" }));
    expect(getDecision("hijacked")).toBeNull();
    expect(getDecision(d.id)?.question).toBe("Edited");
  });
});

describe("edits", () => {
  test("dropping an option drops its ratings, trade-off and choice", () => {
    const d = createDecision("Where to move?");
    addOption(d.id, "Berlin");
    addOption(d.id, "Lisbon");
    addCriterion(d.id, "Cost");
    const before = getDecision(d.id)!;
    const berlin = before.options[0]!;
    const cost = before.criteria[0]!;
    setRating(d.id, berlin.id, cost.id, 4);
    setChoice(d.id, berlin.id);

    removeOption(d.id, berlin.id);

    const after = getDecision(d.id)!;
    expect(after.options).toHaveLength(1);
    expect(after.ratings[berlin.id]).toBeUndefined();
    expect(after.chosenOptionId).toBeNull();
  });

  test("the same option cannot be added twice", () => {
    const d = createDecision("Where to move?");
    addOption(d.id, "Berlin");
    addOption(d.id, "  berlin ");
    expect(getDecision(d.id)?.options).toHaveLength(1);
  });

  test("locking stamps a seal once and never restamps it", () => {
    const d = createDecision("Take the flat?");
    lockDecision(d.id);
    const first = getDecision(d.id)!;
    expect(first.status).toBe("locked");
    expect(first.seal?.id).toMatch(/^LK-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    lockDecision(d.id);
    expect(getDecision(d.id)?.seal?.id).toBe(first.seal!.id);
  });

  test("a review keeps the moment it was first answered", () => {
    const d = createDecision("Take the flat?");
    lockDecision(d.id);
    saveReview(d.id, { verdict: "unsure", happened: "", learned: "", differently: "" });
    const first = getDecision(d.id)!.review!;
    saveReview(d.id, {
      verdict: "yes",
      happened: "It worked out",
      learned: "",
      differently: "",
    });
    const second = getDecision(d.id)!.review!;
    expect(second.at).toBe(first.at);
    expect(second.verdict).toBe("yes");
    expect(second.happened).toBe("It worked out");
  });
});

/** Forget the cache without touching what is on the device. */
function resetStoreCacheOnly() {
  const raw = memory.getItem("lock.decisions");
  resetStore();
  if (raw !== null) memory.setItem("lock.decisions", raw);
}
