// components/ELMeter.tsx
import React from "react";

type Props = {
  value: number;                  // EL (Q)
  thresholds?: [number, number];  // [Q5,000, Q25,000]
  mode?: "autoThreshold" | "toEAD";
  max?: number;                   // solo si mode="toEAD"
  caption?: string;
};

const fmtQ = (n: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 2 }).format(n);

const fmtCompact = (n: number) =>
  new Intl.NumberFormat("es-GT", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function niceMax(x: number) {
  // redondea hacia arriba a {1,2,5} * 10^k
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const m = x / p;
  const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return step * p;
}

export function ELMeter({
  value,
  thresholds = [5000, 25000],
  mode = "autoThreshold",
  max,
  caption,
}: Props) {
  const [t1, t2] = thresholds;

  // Escala:
  // - autoThreshold: basa la escala en t2 y value (ignora EAD)
  // - toEAD: usa max (EAD) pero con tope mínimo "legible"
  const rawMax =
    mode === "toEAD"
      ? Math.max(t2 * 1.2, value * 1.2, max ?? 0)
      : Math.max(t2 * 1.2, value * 1.2);

  const maxScale = Math.max(1, niceMax(rawMax)); // evita 0 y redondea bonito
  const clamp = (n: number) => Math.max(0, Math.min(maxScale, n));

  // Layout (alto compacto, ancho flexible)
  const VB_W = 1000, VB_H = 120;
  const PAD = 40;
  const x0 = PAD, xMax = VB_W - PAD;
  const W = xMax - x0, H = 28, Y = 44;

  const xFrom = (n: number) => x0 + (W * clamp(n)) / maxScale;

  // Segmentos
  const xG2 = xFrom(t1);
  const xB2 = xFrom(t2);

  // Valor
  const xVal = xFrom(value);

  // Ticks
  const ticks = [
    { x: x0, label: "Q0" },
    { x: xG2, label: fmtQ(t1) },
    { x: xB2, label: fmtQ(t2) },
    { x: xMax, label: fmtQ(maxScale) },
  ];

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-[120px]" preserveAspectRatio="none">
      {/* Barra base */}
      <rect x={x0} y={Y} width={W} height={H} rx={H/2} fill="#2f3845" stroke="var(--ring)" strokeWidth="2" />

      {/* Segmentos */}
      <rect x={x0}  y={Y} width={Math.max(0, xG2 - x0)}          height={H} rx={H/2} fill="#16a34a" opacity="0.9" />
      <rect x={xG2} y={Y} width={Math.max(0, xB2 - xG2)}         height={H}          fill="#1d4ed8" opacity="0.9" />
      <rect x={xB2} y={Y} width={Math.max(0, xMax - xB2)}        height={H} rx={H/2} fill="#ef4444" opacity="0.9" />

      {/* Marcador de valor */}
      <line x1={xVal} y1={Y-6} x2={xVal} y2={Y+H+6} stroke="white" strokeWidth="3" />
      <circle cx={xVal} cy={Y+H/2} r="8" fill="white" />

      {/* Valor centrado */}
      <text x={VB_W/2} y={Y+H+34} textAnchor="middle" fontSize="20" fill="var(--fg)" fontWeight={700}>
        {fmtQ(value)}
      </text>
      {caption && (
        <text x={VB_W/2} y={Y+H+54} textAnchor="middle" fontSize="13" fill="var(--fg-muted)">
          {caption}
        </text>
      )}

      {/* Ticks */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={t.x} y1={Y+H+8} x2={t.x} y2={Y+H+14} stroke="var(--fg-muted)" strokeWidth="2" />
          <text
            x={t.x}
            y={Y+H+30}
            textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
            fontSize="12"
            fill="var(--fg-muted)"
          >
            {/* usa compacto para que quepa mejor */}
            {i === 0 ? t.label : fmtCompact(clamp([t1, t2, maxScale][i-1] ?? 0))}
          </text>
        </g>
      ))}
    </svg>
  );
}
