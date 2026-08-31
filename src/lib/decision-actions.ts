import { createSeal, type LockSeal } from "@/lib/lock-seal";
import { blankDecision, insertDecision, newId, updateDecision } from "@/lib/decision-store";
import {
  emptyTradeoff,
  type Decision,
  type Ratings,
  type Review,
  type ShareSettings,
  type Tradeoff,
} from "@/lib/decision-types";

/**
 * Every change a person can make to a decision, in one place.
 *
 * Each of these is a whole, meaningful edit rather than a field setter, so the
 * consequences of a change — dropping an option also drops its ratings and its
 * trade-off — can never be forgotten at a call site.
 */

const clean = (s: string, max: number) => s.trim().replace(/\s+/g, " ").slice(0, max);

export function setQuestion(id: string, question: string) {
  return updateDecision(id, (d) => ({ ...d, question: clean(question, 300) }));
}

export function setContext(id: string, context: string) {
  return updateDecision(id, (d) => ({ ...d, context: context.slice(0, 2000) }));
}

export function setDeadline(id: string, deadline: string | null) {
  return updateDecision(id, (d) => ({ ...d, deadline: deadline || null }));
}

export function addOption(id: string, label: string) {
  const text = clean(label, 120);
  if (!text) return null;
  return updateDecision(id, (d) =>
    d.options.length >= 12 || d.options.some((o) => o.label.toLowerCase() === text.toLowerCase())
      ? d
      : { ...d, options: [...d.options, { id: newId(), label: text }] },
  );
}

export function renameOption(id: string, optionId: string, label: string) {
  const text = clean(label, 120);
  if (!text) return null;
  return updateDecision(id, (d) => ({
    ...d,
    options: d.options.map((o) => (o.id === optionId ? { ...o, label: text } : o)),
  }));
}

/** Removing an option takes its ratings, its trade-off and its choice with it. */
export function removeOption(id: string, optionId: string) {
  return updateDecision(id, (d) => {
    const ratings: Ratings = { ...d.ratings };
    delete ratings[optionId];
    const tradeoffs = { ...d.tradeoffs };
    delete tradeoffs[optionId];
    return {
      ...d,
      options: d.options.filter((o) => o.id !== optionId),
      ratings,
      tradeoffs,
      chosenOptionId: d.chosenOptionId === optionId ? null : d.chosenOptionId,
    };
  });
}

export function addCriterion(id: string, label: string, weight = 2) {
  const text = clean(label, 80);
  if (!text) return null;
  return updateDecision(id, (d) =>
    d.criteria.length >= 12 || d.criteria.some((c) => c.label.toLowerCase() === text.toLowerCase())
      ? d
      : {
          ...d,
          criteria: [...d.criteria, { id: newId(), label: text, weight: clampWeight(weight) }],
        },
  );
}

export function setCriterionWeight(id: string, criterionId: string, weight: number) {
  return updateDecision(id, (d) => ({
    ...d,
    criteria: d.criteria.map((c) =>
      c.id === criterionId ? { ...c, weight: clampWeight(weight) } : c,
    ),
  }));
}

/** Removing a criterion takes every rating given under it. */
export function removeCriterion(id: string, criterionId: string) {
  return updateDecision(id, (d) => {
    const ratings: Ratings = {};
    for (const [optionId, byCriterion] of Object.entries(d.ratings)) {
      const kept = { ...byCriterion };
      delete kept[criterionId];
      ratings[optionId] = kept;
    }
    return { ...d, criteria: d.criteria.filter((c) => c.id !== criterionId), ratings };
  });
}

/** `null` clears a rating, which is not the same as rating it badly. */
export function setRating(id: string, optionId: string, criterionId: string, value: number | null) {
  return updateDecision(id, (d) => {
    const forOption = { ...(d.ratings[optionId] ?? {}) };
    if (value === null) delete forOption[criterionId];
    else forOption[criterionId] = Math.min(5, Math.max(1, Math.round(value)));
    return { ...d, ratings: { ...d.ratings, [optionId]: forOption } };
  });
}

export function patchTradeoff(id: string, optionId: string, patch: Partial<Tradeoff>) {
  return updateDecision(id, (d) => ({
    ...d,
    tradeoffs: {
      ...d.tradeoffs,
      [optionId]: { ...(d.tradeoffs[optionId] ?? emptyTradeoff()), ...patch },
    },
  }));
}

export function addTradeoffItem(
  id: string,
  optionId: string,
  side: "gains" | "gives",
  text: string,
) {
  const value = clean(text, 160);
  if (!value) return null;
  return updateDecision(id, (d) => {
    const current = d.tradeoffs[optionId] ?? emptyTradeoff();
    if (current[side].length >= 12) return d;
    return {
      ...d,
      tradeoffs: { ...d.tradeoffs, [optionId]: { ...current, [side]: [...current[side], value] } },
    };
  });
}

export function removeTradeoffItem(
  id: string,
  optionId: string,
  side: "gains" | "gives",
  index: number,
) {
  return updateDecision(id, (d) => {
    const current = d.tradeoffs[optionId] ?? emptyTradeoff();
    return {
      ...d,
      tradeoffs: {
        ...d.tradeoffs,
        [optionId]: { ...current, [side]: current[side].filter((_, i) => i !== index) },
      },
    };
  });
}

export function setChoice(id: string, optionId: string | null) {
  return updateDecision(id, (d) => ({ ...d, chosenOptionId: optionId }));
}

export function setReason(id: string, reason: string) {
  return updateDecision(id, (d) => ({ ...d, reason: reason.slice(0, 1000) }));
}

/**
 * The lock. It is the only irreversible thing in the product: after this the
 * decision is a record, and the way out is to archive it, not to un-decide it.
 */
export function lockDecision(id: string) {
  const at = new Date();
  return updateDecision(id, (d) =>
    d.status === "locked"
      ? d
      : { ...d, status: "locked", seal: d.seal ?? createSeal(at), lockedAt: at.toISOString() },
  );
}

export function archiveDecision(id: string) {
  return updateDecision(id, (d) => ({
    ...d,
    status: "archived",
    archivedAt: new Date().toISOString(),
  }));
}

export function restoreDecision(id: string) {
  return updateDecision(id, (d) => ({
    ...d,
    status: d.lockedAt ? "locked" : "active",
    archivedAt: null,
  }));
}

/** The first answer stamps the review; later edits refine it in place. */
export function saveReview(id: string, review: Omit<Review, "at">) {
  return updateDecision(id, (d) => ({
    ...d,
    review: { ...review, at: d.review?.at ?? new Date().toISOString() },
  }));
}

export function clearReview(id: string) {
  return updateDecision(id, (d) => ({ ...d, review: null }));
}

export function setShare(id: string, patch: Partial<ShareSettings>) {
  return updateDecision(id, (d) => ({ ...d, share: { ...d.share, ...patch } }));
}

/**
 * A decision reached in the guided journey, kept so it joins the record.
 *
 * The journey produces a statement and the reasoning behind it rather than a
 * set of rated options, so the record it leaves is genuinely smaller — and the
 * detail screen shows exactly what exists and nothing more.
 */
export function recordJourneyDecision(input: {
  decision: string;
  reason: string;
  seal: LockSeal;
}): Decision {
  const base = blankDecision(input.decision);
  return insertDecision({
    ...base,
    reason: input.reason.slice(0, 1000),
    status: "locked",
    seal: input.seal,
    lockedAt: input.seal.at,
    source: "journey",
  });
}

function clampWeight(weight: number): number {
  return Math.min(3, Math.max(1, Math.round(weight)));
}
