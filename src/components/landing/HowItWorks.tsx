const STEPS = [
  { n: "01", head: "Bring the decision", body: "One line. Whatever you have been circling." },
  {
    n: "02",
    head: "Lock reads it",
    body: "What the decision is actually about, and what is holding it.",
  },
  {
    n: "03",
    head: "It goes as deep as it needs",
    body: "One exchange, or five. The decision sets the depth, not a script.",
  },
  {
    n: "04",
    head: "The tension gets named",
    body: "Not more information. The thing you were avoiding choosing between.",
  },
  {
    n: "05",
    head: "You choose",
    body: "Lock never decides for you. It gets you to where deciding is possible.",
  },
  {
    n: "06",
    head: "You lock it",
    body: "One gesture, and it stops being a thing you are still carrying.",
  },
];

/**
 * How it works, as a rail rather than six cards.
 *
 * The line down the left is continuous and fills as the section is read, so
 * the steps are a single movement through a mechanism rather than a grid of
 * equal-weight boxes.
 */
export function HowItWorks() {
  return (
    <ol className="rail">
      {STEPS.map((s) => (
        <li key={s.n} className="rail-step">
          <span className="rail-index type-mono">{s.n}</span>
          <div className="rail-copy">
            <h3 className="rail-head">{s.head}</h3>
            <p className="rail-body">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
