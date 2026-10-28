"use client";

import { useMemo } from "react";

const COLORS = ["#f59e0b", "#38bdf8", "#4ade80", "#fb7185", "#a78bfa"];

/** Lluvia de confeti en CSS puro (sin librerías). */
// Pseudoaleatorio determinista: el render debe ser puro.
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export default function Confetti({ count = 40 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rnd(i, 1) * 100,
        dx: (rnd(i, 2) - 0.5) * 160,
        rot: 360 + rnd(i, 3) * 720,
        dur: 1.6 + rnd(i, 4) * 1.4,
        delay: rnd(i, 5) * 0.4,
        color: COLORS[i % COLORS.length],
      })),
    [count]
  );
  return (
    <div aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              "--dx": `${p.dx}px`,
              "--rot": `${p.rot}deg`,
              "--dur": `${p.dur}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
