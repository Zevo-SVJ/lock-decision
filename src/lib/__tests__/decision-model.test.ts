import { describe, expect, test } from "bun:test";

import {
  awaitingReview,
  choiceLine,
  compare,
  lockBlocker,
  nextGap,
  relativeDay,
  reviewStats,
  shelfOf,
  standingSentence,
  tradeoffFilled,
} from "@/lib/decision-model";
import { defaultShareSettings, emptyTradeoff, type Decision } from "@/lib/decision-types";

function make(patch: Partial<Decision> = {}): Decision {
  const now = "2026-01-01T00:00:00.000Z";
  return {
    id: "d1",
    question: "Where to move?",
    context: "",
    deadline: null,
    options: [],
    criteria: [],
    ratings: {},
    tradeoffs: {},
    chosenOptionId: null,
    reason: "",
    status: "active",
    seal: null,
    share: defaultShareSettings(),
    review: null,
    source: "workspace",
    createdAt: now,
    updatedAt: now,
    lockedAt: null,
    archivedAt: null,
    ...patch,
  };
}

const twoOptions = [
  { id: "a", label: "Berlin" },
  { id: "b", label: "Lisbon" },
];

describe("comparison", () => {
  test("says nothing until every option is rated on something", () => {
    const d = make({
      options: twoOptions,
      criteria: [{ id: "c1", label: "Cost", weight: 2 }],
      ratings: { a: { c1: 4 } },
    });
    const c = compare(d);
    expect(c.ready).toBe(false);
    expect(standingSentence(c)).toBeNull();
    expect(c.missing).toBe(1);
  });

  test("scores as the share of the weight actually earned", () => {
    const d = make({
      options: twoOptions,
      criteria: [{ id: "c1", label: "Cost", weight: 3 }],
      ratings: { a: { c1: 5 }, b: { c1: 1 } },
    });
    const c = compare(d);
    expect(c.ready).toBe(true);
    expect(c.standings[0]?.option.id).toBe("a");
    expect(c.standings[0]?.index).toBe(100);
    expect(c.standings[1]?.index).toBe(20);
    expect(c.close).toBe(false);
  });

  test("weights change the order", () => {
    const d = make({
      options: twoOptions,
      criteria: [
        { id: "c1", label: "Cost", weight: 1 },
        { id: "c2", label: "Work", weight: 3 },
      ],
      ratings: { a: { c1: 5, c2: 1 }, b: { c1: 1, c2: 5 } },
    });
    expect(compare(d).standings[0]?.option.id).toBe("b");
  });

  test("calls a near-tie close rather than picking a winner", () => {
    const d = make({
      options: twoOptions,
      criteria: [
        { id: "c1", label: "Cost", weight: 2 },
        { id: "c2", label: "Work", weight: 2 },
      ],
      ratings: { a: { c1: 4, c2: 3 }, b: { c1: 3, c2: 4 } },
    });
    const c = compare(d);
    expect(c.close).toBe(true);
    expect(standingSentence(c)).toContain("are close");
  });

  test("every sentence names where the numbers came from", () => {
    const d = make({
      options: twoOptions,
      criteria: [{ id: "c1", label: "Cost", weight: 2 }],
      ratings: { a: { c1: 5 }, b: { c1: 2 } },
    });
    expect(standingSentence(compare(d))).toStartWith("Based on what you told Lock");
  });

  test("a criterion only half rated is left out of the standing", () => {
    const d = make({
      options: twoOptions,
      criteria: [
        { id: "c1", label: "Cost", weight: 2 },
        { id: "c2", label: "Work", weight: 3 },
      ],
      ratings: { a: { c1: 4, c2: 5 }, b: { c1: 4 } },
    });
    const c = compare(d);
    expect(c.comparable.map((x) => x.id)).toEqual(["c1"]);
    expect(c.standings[0]?.index).toBe(80);
    expect(c.missing).toBe(1);
  });

  test("marks the strongest and weakest on each criterion", () => {
    const d = make({
      options: [...twoOptions, { id: "c", label: "Athens" }],
      criteria: [{ id: "c1", label: "Cost", weight: 2 }],
      ratings: { a: { c1: 5 }, b: { c1: 3 }, c: { c1: 1 } },
    });
    const row = compare(d).rows[0];
    expect(row?.leaders).toEqual(["a"]);
    expect(row?.laggards).toEqual(["c"]);
    expect(row?.even).toBe(false);
  });

  test("equal ratings are even, with no leader", () => {
    const d = make({
      options: twoOptions,
      criteria: [{ id: "c1", label: "Cost", weight: 2 }],
      ratings: { a: { c1: 3 }, b: { c1: 3 } },
    });
    const row = compare(d).rows[0];
    expect(row?.even).toBe(true);
    expect(row?.leaders).toEqual([]);
  });
});

describe("guidance", () => {
  test("asks for options, then criteria, then ratings, then a choice", () => {
    expect(nextGap(make())).toBe("options");
    expect(nextGap(make({ options: twoOptions }))).toBe("criteria");

    const rated = make({
      options: twoOptions,
      criteria: [{ id: "c1", label: "Cost", weight: 2 }],
    });
    expect(nextGap(rated)).toBe("ratings");
    expect(nextGap({ ...rated, ratings: { a: { c1: 3 }, b: { c1: 4 } } })).toBe("choice");
    expect(
      nextGap({ ...rated, ratings: { a: { c1: 3 }, b: { c1: 4 } }, chosenOptionId: "a" }),
    ).toBeNull();
  });

  test("locking needs a question, two options and a choice — nothing else", () => {
    expect(lockBlocker(make())).toContain("two options");
    expect(lockBlocker(make({ options: twoOptions }))).toContain("Choose");
    expect(lockBlocker(make({ options: twoOptions, chosenOptionId: "a" }))).toBeNull();
  });

  test("a choice pointing at a removed option still blocks", () => {
    expect(lockBlocker(make({ options: twoOptions, chosenOptionId: "gone" }))).toContain("Choose");
  });
});

describe("trade-offs", () => {
  test("counts everything actually written", () => {
    const d = make({
      options: twoOptions,
      tradeoffs: { a: { ...emptyTradeoff(), gains: ["space"], upside: "room to work" } },
    });
    expect(tradeoffFilled(d, "a")).toBe(2);
    expect(tradeoffFilled(d, "b")).toBe(0);
  });
});

describe("shelves", () => {
  const locked = (daysAgo: number) =>
    make({
      status: "locked",
      lockedAt: new Date(Date.UTC(2026, 0, 20 - daysAgo)).toISOString(),
    });
  const now = new Date(Date.UTC(2026, 0, 20));

  test("a fresh lock is not yet worth reviewing", () => {
    expect(awaitingReview(locked(2), now)).toBe(false);
    expect(shelfOf(locked(2), now)).toBe("locked");
  });

  test("an old unreviewed lock is", () => {
    expect(awaitingReview(locked(9), now)).toBe(true);
    expect(shelfOf(locked(9), now)).toBe("review");
  });

  test("a reviewed one never comes back", () => {
    const d = {
      ...locked(40),
      review: { verdict: "yes" as const, happened: "", learned: "", differently: "", at: "x" },
    };
    expect(awaitingReview(d, now)).toBe(false);
    expect(shelfOf(d, now)).toBe("locked");
  });

  test("archived beats everything", () => {
    expect(shelfOf({ ...locked(90), status: "archived" }, now)).toBe("archived");
    expect(shelfOf(make(), now)).toBe("active");
  });
});

describe("looking back", () => {
  const reviewed = (verdict: "yes" | "unsure" | "no") =>
    make({ review: { verdict, happened: "", learned: "", differently: "", at: "x" } });

  test("refuses to generalise from a handful", () => {
    const stats = reviewStats([reviewed("yes"), reviewed("no")]);
    expect(stats.reviewed).toBe(2);
    expect(stats.enough).toBe(false);
    expect(stats.remaining).toBe(3);
  });

  test("counts only what is really there", () => {
    const stats = reviewStats([
      reviewed("yes"),
      reviewed("yes"),
      reviewed("unsure"),
      reviewed("no"),
      reviewed("yes"),
      make(),
    ]);
    expect(stats).toMatchObject({ reviewed: 5, yes: 3, unsure: 1, no: 1, enough: true });
  });
});

describe("dates", () => {
  const now = new Date(2026, 0, 20);
  test("reads as a person would say it", () => {
    expect(relativeDay(new Date(2026, 0, 20).toISOString(), now)).toBe("today");
    expect(relativeDay(new Date(2026, 0, 19).toISOString(), now)).toBe("yesterday");
    expect(relativeDay(new Date(2026, 0, 15).toISOString(), now)).toBe("5 days ago");
    expect(relativeDay(new Date(2025, 11, 1).toISOString(), now)).toBe("2 months ago");
  });

  test("never guesses at nonsense", () => {
    expect(relativeDay("not a date", now)).toBe("");
  });
});

describe("the choice against the standing", () => {
  const rated = (chosenId: string) =>
    make({
      options: twoOptions,
      criteria: [{ id: "c1", label: "Cost", weight: 2 }],
      ratings: { a: { c1: 5 }, b: { c1: 1 } },
      chosenOptionId: chosenId,
    });

  test("says nothing without ratings or a choice", () => {
    expect(choiceLine(make({ options: twoOptions, chosenOptionId: "a" }))).toBeNull();
    expect(choiceLine({ ...rated("a"), chosenOptionId: null })).toBeNull();
  });

  test("states where the taken option stood", () => {
    expect(choiceLine(rated("a"))).toBe(
      "Based on what you told Lock, Berlin stood at 100 of 100, ahead of the rest.",
    );
  });

  test("never implies the ratings agreed when they did not", () => {
    const line = choiceLine(rated("b"));
    expect(line).toContain("Lisbon stood at 20 of 100 and Berlin at 100");
    expect(line).toContain("You went the other way");
  });
});
