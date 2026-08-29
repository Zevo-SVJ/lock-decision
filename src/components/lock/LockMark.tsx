import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The wordmark, and the only progress indicator in the product.
 *
 * The shackle closes as the system approaches certainty, so position in the
 * journey is read off the mark itself rather than a bar or a step count.
 */
export function LockMark({
  progress = 0,
  pulsing = false,
}: {
  progress?: number;
  pulsing?: boolean;
}) {
  return (
    <div className="lock-wordmark" data-pulsing={pulsing || undefined}>
      <LockGlyph progress={progress} size={15} className="lock-wordmark-glyph" />
      <span className="lock-wordmark-text">Lock</span>
    </div>
  );
}
