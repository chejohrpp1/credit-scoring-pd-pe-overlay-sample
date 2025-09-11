// components/ELDonut.tsx
"use client"
import React, { useRef, useEffect, useState } from "react";

type Props = {
  value: number;                      // EL (Q)
  max?: number;                       // default 25,000
  thresholds?: [number, number];      // [5,000, 25,000]
  colors?: { low: string; mid: string; high: string; track?: string };
  caption?: string;
};

const fmtQ = (n: number) =>
  new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 2 }).format(n);

export function ELDonut({
  value,
  max = 25000,
  thresholds = [5000, 25000],
  colors = { low: "#16a34a", mid: "#1d4ed8", high: "#ef4444", track: "#2f3845" },
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const [t1, t2] = thresholds;
  const v = Math.max(0, Math.min(max, value));
  const riskColor = value <= t1 ? colors.low : value <= t2 ? colors.mid : colors.high;

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate responsive geometry based on container size
  const size = Math.min(dimensions.width, dimensions.height) || 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size * 0.39); // radius as percentage of size
  const sw = (size * 0.1); // stroke width as percentage of size
  const c = 2 * Math.PI * r; // circumference
  const ratio = v / max;
  const dash = c * ratio;

  // Calculate dynamic font size based on text length and available space
  const getDynamicFontSize = (text: string, availableWidth: number) => {
    const baseFontSize = size * 0.1;
    const textLength = text.length;
    
    // Calculate approximate text width (rough estimation)
    const avgCharWidth = baseFontSize * 0.6; // approximate character width
    const estimatedTextWidth = textLength * avgCharWidth;
    
    // If text is too wide, reduce font size proportionally
    if (estimatedTextWidth > availableWidth) {
      const scaleFactor = availableWidth / estimatedTextWidth;
      return Math.max(baseFontSize * scaleFactor, size * 0.04); // minimum font size
    }
    
    return baseFontSize;
  };

  const formattedValue = fmtQ(value);
  const availableWidth = r * 1.6; // available width inside the donut (80% of diameter)
  const dynamicFontSize = getDynamicFontSize(formattedValue, availableWidth);

  // ticks en 0, t1 y max
  const toXY = (amt: number) => {
    const a = (-Math.PI / 2) + (2 * Math.PI * (amt / max));
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };

  const tick = (amt: number) => {
    const p = toXY(amt);
    const len = size * 0.045; // tick length as percentage of size
    const a = (-Math.PI / 2) + (2 * Math.PI * (amt / max));
    const x2 = p.x + (len * Math.cos(a));
    const y2 = p.y + (len * Math.sin(a));
    return <line key={amt} x1={p.x} y1={p.y} x2={x2} y2={y2} stroke="var(--fg-muted)" strokeWidth={size * 0.009} />;
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.track}
          strokeWidth={sw}
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* progreso */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={riskColor}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />

        {/* ticks 0, 5k, 25k */}
        {[0, t1, max].map(tick)}

        {/* labels centro */}
        <text 
          x={cx} 
          y={cy + (size * 0.020)} 
          textAnchor="middle" 
          fontSize={dynamicFontSize} 
          fill="var(--fg)" 
          fontWeight={700}
        >
          {formattedValue}
        </text>
      </svg>
    </div>
  );
}
