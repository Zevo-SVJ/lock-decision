import { useMemo } from "react";

import { hashSeal } from "@/lib/lock-seal";

/**
 * The mark of a locked decision.
 *
 * Geometry is derived from the seal identifier, so every locked decision
 * carries a different figure while the system stays recognisably one system.
 */
export function Sigil({ id, size = 88 }: { id: string; size?: number }) {
  const { ticks, gap, inner } = useMemo(() => {
    const h = hashSeal(id);
    const count = 24;
    const generated: number[] = [];
    let bits = h;
    for (let i = 0; i < count; i += 1) {
      // xorshift keeps the figure varied without repeating every 32 bits
      bits ^= bits << 13;
      bits ^= bits >>> 17;
      bits ^= bits << 5;
      bits >>>= 0;
      generated.push(4 + (bits % 11));
    }
    return {
      ticks: generated,
      gap: (h % 360) - 180,
      inner: 16 + ((h >>> 8) % 9),
    };
  }, [id]);

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label={`Lock mark ${id}`}
    >
      <circle cx="50" cy="50" r="46" stroke="currentColor" strokeOpacity="0.16" strokeWidth="1" />
      <g stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        {ticks.map((len, i) => {
          const a = (i / ticks.length) * Math.PI * 2 - Math.PI / 2;
          const r0 = 46 - len;
          return (
            <line
              key={i}
              x1={50 + Math.cos(a) * r0}
              y1={50 + Math.sin(a) * r0}
              x2={50 + Math.cos(a) * 45}
              y2={50 + Math.sin(a) * 45}
              strokeOpacity={0.14 + (len / 15) * 0.5}
            />
          );
        })}
      </g>
      <circle
        cx="50"
        cy="50"
        r={inner + 8}
        stroke="currentColor"
        strokeOpacity="0.34"
        strokeWidth="1"
        strokeDasharray="150 40"
        transform={`rotate(${gap} 50 50)`}
      />
      <g transform="translate(50 50)">
        <path
          d="M-6 -2V-6a6 6 0 0 1 12 0v4"
          stroke="currentColor"
          strokeOpacity="0.72"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <rect
          x="-9"
          y="-2"
          width="18"
          height="12"
          rx="3.6"
          stroke="currentColor"
          strokeOpacity="0.72"
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
}
