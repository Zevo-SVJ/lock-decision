const QUESTIONS = [
  {
    q: "Does Lock decide for me?",
    a: "No. It gets you to the point where you can. The last action is yours, and it is a gesture you have to complete on purpose.",
  },
  {
    q: "How long does it take?",
    a: "A decision you have already made takes about twenty seconds. One you are genuinely stuck on can take a few minutes. Nothing is padded to feel thorough.",
  },
  {
    q: "Is it a chatbot?",
    a: "No. There is no thread and no assistant. Lock reflects what your decision is about, shows you the tension in it, and asks for a commitment.",
  },
  {
    q: "What happens to what I write?",
    a: "It is used to work out your decision and nothing else. Sending a decision to someone else sends only the line you wrote for them — never your answers.",
  },
  {
    q: "Can I change a locked decision?",
    a: "Yes. Locking is a commitment, not a trap. You can reopen it, and you can go back a step at any point before it.",
  },
  {
    q: "What do I get at the end?",
    a: "The decision, the reason it holds, and an image of it with its own identifier and timestamp. Yours to keep or to post.",
  },
];

/**
 * Real objections, answered plainly. Native disclosure elements, so it works
 * before hydration and with a keyboard for free.
 */
export function Faq() {
  return (
    <div className="faq">
      {QUESTIONS.map(({ q, a }) => (
        <details key={q} className="faq-item" name="faq">
          <summary className="faq-q">
            <span>{q}</span>
            <span className="faq-mark" aria-hidden="true" />
          </summary>
          <p className="faq-a">{a}</p>
        </details>
      ))}
    </div>
  );
}
