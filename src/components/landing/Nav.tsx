import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The whole navigation. There is nowhere else to go, and a menu here would
 * only offer the visitor ways of not trying the product.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="nav-mark" href="/" aria-label="Lock, home">
          <LockGlyph progress={1} size={15} />
          <span className="nav-word">Lock</span>
        </a>

        <button type="button" onClick={onStart} className="nav-cta">
          Try Lock
        </button>
      </div>
    </header>
  );
}
