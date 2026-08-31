import type { Criterion, Decision, DecisionOption, Ratings, Review } from "@/lib/decision-types";

/**
 * Everything Lock works out about a decision.
 *
 * Nothing in this file talks to storage or to React, so all of it is testable
 * and none of it can invent anything: every number below is a restatement of
 * something the person typed. Where there is not enough to say, these
 * functions say so rather than guessing.
 */

/** The highest rating on the 1..5 scale. */
export const MAX_RATING = 5;

/** Two options this close on the index are not meaningfully apart. */
export const CLOSE_MARGIN = 5;

/** How long after locking a decision is worth looking back at. */
export const REVIEW_AFTER_DAYS = 7;

/** Reviews needed before Lock will say anything about the set as a whole. */
export const PATTERN_THRESHOLD = 5;

export function rating(ratings: Ratings, optionId: string, criterionId: string): number | null {
  return ratings[optionId]?.[criterionId] ?? null;
}

/** A criterion counts toward the standing only once every option has a rating. */
export function isComparable(d: Decision, criterion: Criterion): boolean {
  if (d.options.length < 2) return false;
  return d.options.every((o) => rating(d.ratings, o.id, criterion.id) !== null);
}

export type CriterionRow = {
  criterion: Criterion;
  /** One entry per option, in the decision's own option order. */
  cells: { option: DecisionOption; value: number | null }[];
  /** Options holding the top rating, when the ratings are not all equal. */
  leaders: string[];
  /** Options holding the bottom rating, when the ratings are not all equal. */
  laggards: string[];
  /** Every option rated, and all the same. */
  even: boolean;
  complete: boolean;
};

export function criterionRow(d: Decision, criterion: Criterion): CriterionRow {
  const cells = d.options.map((option) => ({
    option,
    value: rating(d.ratings, option.id, criterion.id),
  }));
  const values = cells.map((c) => c.value).filter((v): v is number => v !== null);
  const complete = values.length === d.options.length && d.options.length >= 2;
  const top = values.length ? Math.max(...values) : 0;
  const bottom = values.length ? Math.min(...values) : 0;
  const spread = complete && top !== bottom;
  return {
    criterion,
    cells,
    leaders: spread ? cells.filter((c) => c.value === top).map((c) => c.option.id) : [],
    laggards: spread ? cells.filter((c) => c.value === bottom).map((c) => c.option.id) : [],
    even: complete && top === bottom,
    complete,
  };
}

export type Standing = {
  option: DecisionOption;
  /**
   * 0..100. The share of the weight this option earned across the criteria
   * that every option has been rated on — not a probability, not a rating out
   * of ten, and never comparable between two different decisions.
   */
  index: number;
  strongOn: Criterion[];
  weakOn: Criterion[];
};

export type Comparison = {
  /** True when there is at least one criterion every option has been rated on. */
  ready: boolean;
  rows: CriterionRow[];
  comparable: Criterion[];
  standings: Standing[];
  /** The leader and the runner-up are within `CLOSE_MARGIN`. */
  close: boolean;
  /** Ratings still missing, out of options x criteria. */
  missing: number;
  total: number;
};

export function compare(d: Decision): Comparison {
  const rows = d.criteria.map((c) => criterionRow(d, c));
  const comparable = rows.filter((r) => r.complete).map((r) => r.criterion);
  const total = d.options.length * d.criteria.length;
  const missing = rows.reduce((n, r) => n + r.cells.filter((c) => c.value === null).length, 0);

  const weightTotal = comparable.reduce((sum, c) => sum + c.weight, 0);
  const standings: Standing[] = d.options.map((option) => {
    const earned = comparable.reduce(
      (sum, c) => sum + c.weight * (rating(d.ratings, option.id, c.id) ?? 0),
      0,
    );
    const index = weightTotal > 0 ? (earned / (weightTotal * MAX_RATING)) * 100 : 0;
    return {
      option,
      index: Math.round(index),
      strongOn: rows.filter((r) => r.leaders.includes(option.id)).map((r) => r.criterion),
      weakOn: rows.filter((r) => r.laggards.includes(option.id)).map((r) => r.criterion),
    };
  });

  standings.sort((a, b) => b.index - a.index || a.option.label.localeCompare(b.option.label));
  const [first, second] = standings;
  const close =
    comparable.length > 0 &&
    first !== undefined &&
    second !== undefined &&
    first.index - second.index <= CLOSE_MARGIN;

  return { ready: comparable.length > 0, rows, comparable, standings, close, missing, total };
}

/**
 * The one line Lock is allowed to say about a comparison. It is always framed
 * as a restatement, because that is all it is.
 */
export function standingSentence(c: Comparison): string | null {
  if (!c.ready) return null;
  const [first, second] = c.standings;
  if (!first) return null;
  if (!second) return null;
  if (c.close) {
    return `Based on what you told Lock, ${first.option.label} and ${second.option.label} are close. Nothing you have said so far separates them.`;
  }
  const on = first.strongOn.slice(0, 2).map((x) => x.label.toLowerCase());
  const because = on.length ? ` It is ahead on ${listPhrase(on)}.` : "";
  return `Based on what you told Lock, ${first.option.label} comes out ahead.${because}`;
}

/**
 * What the standing says about the option that was actually taken. People do
 * not always take the one their own ratings favour, and when they do not, Lock
 * says so plainly rather than quietly implying the numbers agreed with them.
 */
export function choiceLine(d: Decision): string | null {
  const c = compare(d);
  const chosen = chosenOption(d);
  if (!c.ready || !chosen) return null;
  const mine = c.standings.find((s) => s.option.id === chosen.id);
  const top = c.standings[0];
  if (!mine || !top) return null;

  if (top.option.id === chosen.id) {
    const tail = c.close ? ", level with the next one" : ", ahead of the rest";
    return `Based on what you told Lock, ${chosen.label} stood at ${mine.index} of 100${tail}.`;
  }
  return `Based on what you told Lock, ${chosen.label} stood at ${mine.index} of 100 and ${top.option.label} at ${top.index}. You went the other way — the ratings were only ever what you said, not the answer.`;
}

export function listPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** How much of a trade-off has actually been written down. */
export function tradeoffFilled(d: Decision, optionId: string): number {
  const t = d.tradeoffs[optionId];
  if (!t) return 0;
  const fields = [t.upside, t.downside, t.risk, t.uncertainty, t.crux].filter(
    (v) => v.trim().length > 0,
  ).length;
  return t.gains.length + t.gives.length + fields;
}

export function hasAnyTradeoff(d: Decision): boolean {
  return d.options.some((o) => tradeoffFilled(d, o.id) > 0);
}

/**
 * The next thing worth doing. Lock guides one step at a time rather than
 * presenting a form, so this is the only place that decides what that step is.
 */
export type Gap = "options" | "criteria" | "ratings" | "choice" | null;

export function nextGap(d: Decision): Gap {
  if (d.options.length < 2) return "options";
  if (d.criteria.length === 0) return "criteria";
  if (compare(d).missing > 0) return "ratings";
  if (!d.chosenOptionId) return "choice";
  return null;
}

/**
 * Locking needs a question, something to choose between, and a choice. It does
 * not need criteria or trade-offs: an easy decision should not be padded out to
 * look thorough.
 */
export function lockBlocker(d: Decision): string | null {
  if (!d.question.trim()) return "Give the decision a question first.";
  if (d.options.length < 2) return "Add at least two options first.";
  if (!d.chosenOptionId) return "Choose the option you are taking first.";
  if (!d.options.some((o) => o.id === d.chosenOptionId)) return "Choose an option first.";
  return null;
}

export function chosenOption(d: Decision): DecisionOption | null {
  if (!d.chosenOptionId) return null;
  return d.options.find((o) => o.id === d.chosenOptionId) ?? null;
}

export function alternatives(d: Decision): DecisionOption[] {
  return d.options.filter((o) => o.id !== d.chosenOptionId);
}

/** Locked, unreviewed, and old enough that hindsight exists. */
export function awaitingReview(d: Decision, now: Date = new Date()): boolean {
  if (d.status !== "locked" || d.review || !d.lockedAt) return false;
  const at = new Date(d.lockedAt).getTime();
  if (Number.isNaN(at)) return false;
  return now.getTime() - at >= REVIEW_AFTER_DAYS * 86_400_000;
}

export type Shelf = "active" | "locked" | "review" | "archived";

export function shelfOf(d: Decision, now: Date = new Date()): Shelf {
  if (d.status === "archived") return "archived";
  if (d.status === "active") return "active";
  return awaitingReview(d, now) ? "review" : "locked";
}

export type ReviewStats = {
  reviewed: number;
  yes: number;
  unsure: number;
  no: number;
  /** True once there is enough real data to say anything at all. */
  enough: boolean;
  remaining: number;
};

export function reviewStats(decisions: Decision[]): ReviewStats {
  const reviews = decisions
    .map((d) => d.review)
    .filter((r): r is Review => r !== null && r !== undefined);
  const count = (v: Review["verdict"]) => reviews.filter((r) => r.verdict === v).length;
  return {
    reviewed: reviews.length,
    yes: count("yes"),
    unsure: count("unsure"),
    no: count("no"),
    enough: reviews.length >= PATTERN_THRESHOLD,
    remaining: Math.max(0, PATTERN_THRESHOLD - reviews.length),
  };
}

/** e.g. "3 days ago", "today". Plain, never cute. */
export function relativeDay(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const days = Math.floor((startOfDay(now) - startOfDay(then)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? "a month ago" : `${months} months ago`;
  const years = Math.round(days / 365);
  return years === 1 ? "a year ago" : `${years} years ago`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** e.g. "12 Mar 2026". */
export function formatDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Days until a deadline; negative once it has passed. */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 0;
  return Math.round((startOfDay(then) - startOfDay(now)) / 86_400_000);
}

export function deadlineLine(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now);
  if (days < 0) return `Deadline passed ${formatDay(iso)}`;
  if (days === 0) return "Deadline today";
  if (days === 1) return "Deadline tomorrow";
  return `${days} days left`;
}
