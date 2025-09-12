// -----------------------------------------------------------------------------
// components/Gauge.tsx (medidor semicircular SVG)
// -----------------------------------------------------------------------------
"use client";
import React from "react";

/**
 * Gauge semicircular 0–100
 * props.value: 0..100
 * props.threshold: marca roja
 */
export function Gauge({
  value,
  threshold = 80,
}: {
  value: number;
  threshold?: number;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const v = clamp(value);
  const theta = -Math.PI + Math.PI * (v / 100); // -180° .. 0°
  const x = 100 + 80 * Math.cos(theta);
  const y = 100 + 80 * Math.sin(theta);
  const needleColor = v <= 3 ? "#1802BF" : v <= 10 ? "#19C904" : v < 20 ? "#DAED07" : v <= 30 ? "#F79705" : "#ED1C1C";
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      {/* arco base */}
      <path
        d="M20,100 A80,80 0 0,1 180,100"
        fill="none"
        stroke="#3a444f"
        strokeWidth="18"
        strokeLinecap="round"
      />
      {/* ticks simples */}
      {[0, 20, 40, 60, 80, 100].map((t) => {
        const ang = -Math.PI + Math.PI * (t / 100);
        const x1 = 100 + 72 * Math.cos(ang);
        const y1 = 100 + 72 * Math.sin(ang);
        const x2 = 100 + 88 * Math.cos(ang);
        const y2 = 100 + 88 * Math.sin(ang);
        return (
          <line
            key={t}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#4b5563"
            strokeWidth="2"
          />
        );
      })}
      {/* threshold */}
      {threshold != null &&
        (() => {
          const ang = -Math.PI + Math.PI * (clamp(threshold) / 100);
          const x1 = 100 + 60 * Math.cos(ang);
          const y1 = 100 + 60 * Math.sin(ang);
          const x2 = 100 + 88 * Math.cos(ang);
          const y2 = 100 + 88 * Math.sin(ang);
          return (
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ef4444"
              strokeWidth="0"
            />
          );
        })()}
      {/* needle */}
      <line
        x1={100}
        y1={100}
        x2={x}
        y2={y}
        stroke={needleColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* pivot */}
      <circle cx={100} cy={100} r={5} fill="#9ca3af" />
      {/* label */}
      <text
        x={100}
        y={104}
        textAnchor="middle"
        dy="1.1em"
        fontSize="18"
        fill="var(--fg)"
      >
        {v.toFixed(1)}%
      </text>
    </svg>
  );
}
