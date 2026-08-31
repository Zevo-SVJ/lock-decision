import { useMemo, useState } from "react";

import { Artifact } from "@/components/decision/Artifact";
import { ReviewPanel } from "@/components/decision/Review";
import { LockGlyph } from "@/components/lock/LockGlyph";
import { archiveDecision, restoreDecision } from "@/lib/decision-actions";
import {
  alternatives,
  awaitingReview,
  choiceLine,
  chosenOption,
  formatDay,
  relativeDay,
  tradeoffFilled,
} from "@/lib/decision-model";
import { WEIGHTS, type Decision } from "@/lib/decision-types";

/**
 * A locked decision, read back.
 *
 * The whole point of locking is that the decision stops being a live question
 * and becomes a record, so this screen is written for the person who opens it
 * six months later: what they decided, what they turned down, why, what they
 * knew it would cost, and whether it turned out.
 *
 * It shows exactly what exists. A decision made in thirty seconds has three
 * lines here and no empty scaffolding around them.
 */
export function LockedDetail({
  decision,
  onSave,
}: {
  decision: Decision;
  onSave: (fn: () => void) => void;
}) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const chosen = chosenOption(decision);
  const others = alternatives(decision);
  const basis = useMemo(() => choiceLine(decision), [decision]);
  const t = chosen ? decision.tradeoffs[chosen.id] : undefined;
  const hasTradeoff = chosen ? tradeoffFilled(decision, chosen.id) > 0 : false;
  const due = awaitingReview(decision);

  return (
    <div className="stack detail">
      <header className="detail-head">
        <span className="detail-sealed">
          <LockGlyph progress={1} size={16} className="is-check" />
          <span className="type-meta">
            {decision.status === "archived" ? "Archived" : "Locked"}
            {decision.lockedAt ? ` ${relativeDay(decision.lockedAt)}` : ""}
          </span>
        </span>
        {decision.seal && <span className="type-mono detail-seal">{decision.seal.id}</span>}
      </header>

      <section className="detail-verdict">
        {chosen ? (
          <>
            <p className="detail-kicker">{decision.question}</p>
            <h2 className="type-statement detail-choice">{chosen.label}</h2>
          </>
        ) : (
          <h2 className="type-statement detail-choice">{decision.question}</h2>
        )}
        {decision.lockedAt && <p className="detail-when">{formatDay(decision.lockedAt)}</p>}
      </section>

      {others.length > 0 && (
        <section className="detail-block">
          <p className="type-meta">Instead of</p>
          <ul className="detail-alts">
            {others.map((o) => (
              <li key={o.id}>{o.label}</li>
            ))}
          </ul>
        </section>
      )}

      {decision.reason.trim() && (
        <section className="detail-block">
          <p className="type-meta">Why</p>
          <p className="detail-prose">{decision.reason}</p>
        </section>
      )}

      {hasTradeoff && t && chosen && (
        <section className="detail-block">
          <p className="type-meta">What you accepted</p>
          {t.crux && <p className="detail-crux">{t.crux}</p>}
          <div className="detail-ledger">
            {t.gains.length > 0 && (
              <div className="detail-ledger-half">
                <p className="type-meta">Gained</p>
                <ul>
                  {t.gains.map((g, i) => (
                    <li key={`${g}-${i}`}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
            {t.gives.length > 0 && (
              <div className="detail-ledger-half detail-ledger-half--give">
                <p className="type-meta">Gave up</p>
                <ul>
                  {t.gives.map((g, i) => (
                    <li key={`${g}-${i}`}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {[t.upside, t.downside, t.risk, t.uncertainty].some((v) => v.trim()) && (
            <dl className="detail-edges">
              {t.upside && <Edge term="Biggest upside" value={t.upside} />}
              {t.downside && <Edge term="Biggest downside" value={t.downside} />}
              {t.risk && <Edge term="The risk" value={t.risk} />}
              {t.uncertainty && <Edge term="Not knowable yet" value={t.uncertainty} />}
            </dl>
          )}
        </section>
      )}

      {decision.criteria.length > 0 && (
        <section className="detail-block">
          <p className="type-meta">What it turned on</p>
          <ul className="detail-criteria">
            {decision.criteria.map((crit) => (
              <li key={crit.id} data-weight={crit.weight}>
                <span>{crit.label}</span>
                <span className="detail-weight">
                  {WEIGHTS.find((w) => w.value === crit.weight)?.label}
                </span>
              </li>
            ))}
          </ul>
          {basis && <p className="detail-basis">{basis}</p>}
        </section>
      )}

      {decision.context.trim() && (
        <section className="detail-block">
          <p className="type-meta">Context — only on this device</p>
          <p className="detail-prose detail-context">{decision.context}</p>
        </section>
      )}

      <ReviewPanel decision={decision} onSave={onSave} emphasised={due} />

      {decision.seal && <Artifact decision={decision} onSave={onSave} />}

      <div className="detail-foot">
        {decision.status === "archived" ? (
          <button
            type="button"
            className="action-plain"
            onClick={() => onSave(() => restoreDecision(decision.id))}
          >
            Put it back
          </button>
        ) : (
          <button
            type="button"
            className="action-plain"
            onClick={() =>
              confirmArchive ? onSave(() => archiveDecision(decision.id)) : setConfirmArchive(true)
            }
            onBlur={() => setConfirmArchive(false)}
          >
            {confirmArchive ? "Archive it?" : "Archive"}
          </button>
        )}
      </div>
    </div>
  );
}

function Edge({ term, value }: { term: string; value: string }) {
  return (
    <div className="detail-edge">
      <dt className="type-meta">{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}
