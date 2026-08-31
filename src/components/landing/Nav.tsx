import { Link } from "@tanstack/react-router";

import { LockGlyph } from "@/components/lock/LockGlyph";

/**
 * The whole navigation. One way in, and one way back to the decisions this
 * device already holds. A menu here would only offer the visitor ways of not
 * trying the product.
 */
export function Nav({ onStart }: { onStart: () => void }) {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="nav-mark" href="/" aria-label="Lock, home">
          <LockGlyph progress={1} size={15} />
          <span className="nav-word">Lock</span>
        </a>

        <div className="nav-right">
          <Link to="/decisions" className="nav-link">
            Your decisions
          </Link>
          <button type="button" onClick={onStart} className="nav-cta">
            Try Lock
          </button>
        </div>
      </div>
    </header>
  );
}
