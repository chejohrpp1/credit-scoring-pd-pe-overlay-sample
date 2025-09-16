"use client";
import { useState, useEffect } from "react";
import { Percent, ChevronDown } from "lucide-react";

// Validation function from PE page
function validateNumericInput(value: string): {
  numericValue: number;
  displayValue: string;
} {
  // Permitir solo números, punto decimal y coma como separador decimal
  // Permitir punto o coma al final para que el usuario pueda escribir decimales
  const cleaned = value.replace(/[^0-9.,]/g, "");

  // Si el valor termina en punto o coma, mantenerlo para permitir escritura de decimales
  if (cleaned.endsWith(".") || cleaned.endsWith(",")) {
    return { numericValue: 0, displayValue: cleaned };
  }

  const normalized = cleaned.replace(",", ".");
  const parsed = parseFloat(normalized);

  // Si es un número válido, devolverlo formateado
  if (!isNaN(parsed) && parsed >= 0) {
    return { numericValue: parsed, displayValue: parsed.toString() };
  }

  // Si está vacío o es inválido, permitir cadena vacía para edición
  return { numericValue: 0, displayValue: cleaned };
}

export function FactorField({
  label,
  kind,
  value,
  onChange,
  helper, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  label: string;
  kind: "percent" | "amount" | "select" | "equation";
  value: number | string;
  onChange: (v: number | string) => void;
  helper?: string;
}) {
  // For numeric inputs, maintain display value state
  const [displayValue, setDisplayValue] = useState(() => {
    if (kind === "select") return "";
    return value?.toString() || "";
  });

  const handleNumericChange = (inputValue: string) => {
    const validation = validateNumericInput(inputValue);
    
    // Update display value
    setDisplayValue(validation.displayValue);
    
    // Only update the actual value if it's valid
    if (validation.numericValue > 0 || inputValue === "" || inputValue === "0") {
      onChange(validation.numericValue);
    }
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
            placeholder={kind === "percent" || "equation" ? "0.00" : "0"}
          />
          {kind === "percent" || "equation" ? (
            <Percent className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 opacity-70" />
          ) : (
            <span className="text-xs font-medium absolute right-2 top-1/2 -translate-y-1/2 opacity-70">Q.</span>
          )}
        </div>
      )}
    </div>
  );
}
