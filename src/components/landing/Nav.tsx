import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The whole navigation: who this is, and the one thing to do about it.
 *
 * There is nothing else to link to. A menu here would only offer the visitor
 * ways of not trying the product.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  return (
    <header className="nav">
      <a className="nav-mark" href="/" aria-label="Lock, home">
        <LockGlyph progress={1} size={17} />
        <span className="nav-word">Lock</span>
      </a>

      <button type="button" onClick={onStart} className="btn btn--ghost nav-cta">
        Try Lock
      </button>
    </header>
  );
}
