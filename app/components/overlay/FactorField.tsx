"use client";
import { useState, useEffect } from "react";
import { Percent, ChevronDown } from "lucide-react";
import { toast } from "react-toastify";

export function FactorField({
  label,
  kind,
  value,
  onChange,
  spanLabel,
}: {
  label: string;
  kind: "percent" | "amount" | "select" | "equation";
  value: number | string;
  onChange: (v: number | string) => void;
  spanLabel?: string;
}) {
  // For numeric inputs, maintain display value state
  const [displayValue, setDisplayValue] = useState(() => {
    if (kind === "select") return "";
    return value?.toString() || "";
  });

  const handleNumericChange = (inputValue: string) => {
    // permitir solo números y separadores decimales
    const cleaned = inputValue.replace(/[^0-9.,]/g, "");
    const normalized = cleaned.replace(",", ".");

    // si termina en punto/coma, no forzar aún (pero no propagar)
    if (cleaned.endsWith(".") || cleaned.endsWith(",")) {
      setDisplayValue(cleaned);
      return;
    }

    const parsed = parseFloat(normalized);
    if (Number.isNaN(parsed)) {
      setDisplayValue(cleaned);
      return;
    }

    const min = 0;
    const max = (kind === "percent" || kind === "equation") ? 100 : 100000000;
    const clamped = Math.max(min, Math.min(max, parsed));
    if (clamped !== parsed) {
      toast.info(`${label} ajustado a ${clamped} (rango permitido ${min}-${max})`);
    }

    setDisplayValue(clamped.toString());
    onChange(clamped);
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (kind !== "select") {
      setDisplayValue(value?.toString() || "");
    }
  }, [value, kind]);

  return (
    <div className="space-y-1">
      <div className="label">{label}</div>
      {kind === "select" ? (
        <div className="relative">
          <select
            className="select appearance-none pr-8"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            {["Bajo", "Medio", "Alto"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
        </div>
      ) : (
        <div className="relative">
          <input
            className="input pr-8"
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={(e) => handleNumericChange(e.target.value)}
            placeholder={(kind === "percent" || kind === "equation") ? "0.00" : "0"}
          />
          {(
            spanLabel ? (
              <span className="text-xs font-medium absolute right-2 top-1/2 -translate-y-1/2 opacity-70">
                {spanLabel}
              </span>
            ) : (kind === "percent" || kind === "equation") ? (
              <Percent className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
            ) :(
              <span className="text-xs font-medium absolute right-2 top-1/2 -translate-y-1/2 opacity-70">Q.</span>
            )
          )}
        </div>
      )}
    </div>
  );
}
