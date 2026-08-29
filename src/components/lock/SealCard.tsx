import { Sigil } from "@/components/lock/Sigil";
import { formatSealTime, type LockSeal } from "@/lib/lock-seal";

type Props = {
  seal: LockSeal;
  decision: string;
  statement: string;
};

/**
 * The artefact of a locked decision — identifier, mark, statement, moment.
 * A system-generated object, built to survive a screenshot.
 */
export function SealCard({ seal, decision, statement }: Props) {
  return (
    <div className="seal">
      <div className="relative flex items-center justify-between">
        <span className="type-meta">Locked</span>
        <span className="type-mono text-[0.6875rem] text-fg-3">{seal.id}</span>
      </div>

      <div className="relative mt-6 flex justify-center text-fg-1">
        <Sigil id={seal.id} size={82} />
      </div>

      <p className="type-statement relative mt-6">{decision}</p>

      {statement && <p className="read-line read-line--after relative">{statement}</p>}

      <div className="seal-rule relative mt-5" />

      <div className="relative mt-3 flex items-center justify-between">
        <span className="type-mono text-[0.625rem] text-fg-3">{formatSealTime(seal.at)}</span>
        <span className="type-meta text-fg-3">Lock</span>
      </div>
    </div>
  );
}
