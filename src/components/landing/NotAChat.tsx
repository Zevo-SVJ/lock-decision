/**
 * What Lock does instead of asking questions.
 *
 * Two real product surfaces — a reflection and a tradeoff — shown as the
 * artefacts they are. Scroll trades emphasis between them and fills the
 * weighing in front of the reader, driven by the browser's own view timeline
 * rather than a JavaScript loop.
 */
export function NotAChat() {
  return (
    <div className="moves">
      <figure className="move move--reflect">
        <figcaption className="type-meta">It reflects</figcaption>
        <p className="move-statement">
          You are not choosing between two jobs. You are choosing between security and autonomy.
        </p>
        <div className="move-replies" aria-hidden="true">
          <span className="move-reply">That&rsquo;s it.</span>
          <span className="move-reply">Not quite.</span>
        </div>
      </figure>

      <figure className="move move--tradeoff">
        <figcaption className="type-meta">It weighs</figcaption>
        <p className="move-question">Which one are you protecting?</p>
        <div className="move-scales" aria-hidden="true">
          <div className="move-scale" style={{ "--w": 0.28 } as React.CSSProperties}>
            <span className="move-scale-name">Security</span>
            <span className="move-scale-bar">
              <span className="move-scale-fill" />
            </span>
          </div>
          <div className="move-scale" style={{ "--w": 0.72 } as React.CSSProperties}>
            <span className="move-scale-name">Autonomy</span>
            <span className="move-scale-bar">
              <span className="move-scale-fill" />
            </span>
          </div>
        </div>
      </figure>
    </div>
  );
}
