/** The wordmark. Small, fixed, never decorative. */
export function LockMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden="true">
        <path
          d="M8 10V7a4 4 0 0 1 8 0v3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="4.75"
          y="10"
          width="14.5"
          height="9.5"
          rx="3.1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
      <span className="text-[0.6875rem] font-medium tracking-[0.42em] uppercase">Lock</span>
    </div>
  );
}
