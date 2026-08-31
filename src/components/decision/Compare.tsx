import { useMemo, useState } from "react";

import { AddField } from "@/components/decision/Field";
import {
  addCriterion,
  removeCriterion,
  setCriterionWeight,
  setRating,
} from "@/lib/decision-actions";
import { compare, standingSentence, type CriterionRow } from "@/lib/decision-model";
import { WEIGHTS, type Decision } from "@/lib/decision-types";

/**
 * Compare.
 *
 * Not a matrix. The screen is a stack of one thing at a time: what matters,
 * and how each option does against it. A person answers "how good is Berlin on
 * cost?" — a question they can actually hold in their head — and the standing
 * at the top is assembled from those answers and says so out loud.
 *
 * The index is deliberately not a score out of ten and not a probability. It
 * is the share of the weight an option earned on the criteria every option has
 * been rated on, which is the only comparison the data supports.
 */
export function Compare({
  decision,
  onSave,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
}) {
  const c = useMemo(() => compare(decision), [decision]);
  const sentence = standingSentence(c);
  const best = c.standings[0];

  return (
    <div className="stack">
      {c.ready && best ? (
        <section className="standing">
          <p className="type-meta">Where it stands</p>
          <ol className="standing-list">
            {c.standings.map((s) => (
              <li
                key={s.option.id}
                className="standing-row"
                style={{ "--i": s.index / 100 } as React.CSSProperties}
                data-lead={s.option.id === best.option.id && !c.close ? "" : undefined}
              >
                <span className="standing-name">{s.option.label}</span>
                <span className="standing-index">{s.index}</span>
                <span className="standing-bar" aria-hidden="true">
                  <span className="standing-fill" />
                </span>
              </li>
            ))}
          </ol>
          {sentence && <p className="standing-read">{sentence}</p>}
          <p className="standing-basis">
            Out of 100, weighted by what you said matters, across the{" "}
            {c.comparable.length === 1 ? "one thing" : `${c.comparable.length} things`} every option
            has been rated on.
            {c.missing > 0 && ` ${c.missing} rating${c.missing === 1 ? "" : "s"} still missing.`}
          </p>
        </section>
      ) : (
        <p className="guide">
          {decision.criteria.length === 0
            ? "Name the first thing that actually matters here. Money, time, who it affects — whatever it really turns on."
            : "Rate every option on at least one thing and Lock can show you where they stand."}
        </p>
      )}

      <div className="criteria">
        {c.rows.map((row) => (
          <CriterionCard key={row.criterion.id} decision={decision} row={row} onSave={onSave} />
        ))}
      </div>

      <AddField
        label="Add something that matters"
        placeholder="Something that matters"
        action="Add"
        maxLength={80}
        onAdd={(text) => onSave(() => addCriterion(decision.id, text))}
      />

      {decision.criteria.length === 0 && (
        <div className="suggests">
          <span className="type-meta">Often it is one of these</span>
          <div className="suggest-row">
            {["Cost", "Time", "Risk", "How it feels"].map((s) => (
              <button
                key={s}
                type="button"
                className="chip"
                onClick={() => onSave(() => addCriterion(decision.id, s))}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CriterionCard({
  decision,
  row,
  onSave,
}: {
  decision: Decision;
  row: CriterionRow;
  onSave: (fn: () => void) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const { criterion } = row;

  const readout = row.complete
    ? row.even
      ? "Even. Nothing to choose between them here."
      : leadLine(row)
    : `${row.cells.filter((x) => x.value === null).length} still to rate.`;

  return (
    <section className="criterion" data-weight={criterion.weight}>
      <header className="criterion-head">
        <h3 className="criterion-name">{criterion.label}</h3>
        <button
          type="button"
          className="criterion-drop"
          onClick={() =>
            confirming
              ? onSave(() => removeCriterion(decision.id, criterion.id))
              : setConfirming(true)
          }
          onBlur={() => setConfirming(false)}
        >
          {confirming ? "Remove?" : "Remove"}
        </button>
      </header>

      <div className="weights" role="radiogroup" aria-label={`How much ${criterion.label} counts`}>
        {WEIGHTS.map((w) => (
          <button
            key={w.value}
            type="button"
            role="radio"
            aria-checked={criterion.weight === w.value}
            className="weight"
            data-on={criterion.weight >= w.value || undefined}
            data-exact={criterion.weight === w.value || undefined}
            onClick={() => onSave(() => setCriterionWeight(decision.id, criterion.id, w.value))}
          >
            {w.label}
          </button>
        ))}
      </div>

      <ul className="rates">
        {row.cells.map((cell) => (
          <li
            key={cell.option.id}
            className="rate"
            data-lead={row.leaders.includes(cell.option.id) || undefined}
            data-trail={row.laggards.includes(cell.option.id) || undefined}
          >
            <span className="rate-name">{cell.option.label}</span>
            <Rail
              label={`${cell.option.label} on ${criterion.label}`}
              value={cell.value}
              onChange={(v) =>
                onSave(() => setRating(decision.id, cell.option.id, criterion.id, v))
              }
            />
          </li>
        ))}
      </ul>

      <p className="criterion-read">{readout}</p>
    </section>
  );
}

function leadLine(row: CriterionRow): string {
  const names = row.cells
    .filter((c) => row.leaders.includes(c.option.id))
    .map((c) => c.option.label);
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is stronger here.`;
  return `${names.join(" and ")} are level at the top here.`;
}

/**
 * Five steps, weak to strong. Pressing the step already chosen clears it,
 * because "not rated" has to stay different from "rated badly".
 */
function Rail({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  label: string;
}) {
  return (
    <div className="rail" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} out of 5`}
          className="rail-step"
          data-on={value !== null && n <= value ? "" : undefined}
          onClick={() => onChange(value === n ? null : n)}
        />
      ))}
      <span className="rail-value" aria-hidden="true">
        {value === null ? "—" : value}
      </span>
    </div>
  );
}
