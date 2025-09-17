"use client";
import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { FactorField } from "../components/overlay/FactorField";
import {
  FACTOR_SCHEMA,
  CategoryKey,
  inferFieldKind,
  matchRangeGetBeta,
  SelectLevel,
} from "@/app/helpers/overlay/factors";
import { toast } from "react-toastify";

type InputValue = number | SelectLevel;
// removed unused InputMap type

// Utilidades de formato
const fmtQ = (n: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    maximumFractionDigits: 2,
  }).format(n);

// Validation function for numeric inputs
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

// Estado inicial por variable (por tipo)
function defaultValueFor(kind: ReturnType<typeof inferFieldKind>) {
  if (kind === "equation") return 70; // como fracción 0..1
  if (kind === "percent") return 0; // como fracción 0..1
  if (kind === "amount") return 0; // Quetzales o índice
  return "Medio"; // select
}

export default function OverlayPage() {
  // Construye estado por categoría/variable
  const [inputs, setInputs] = useState<Record<string, string | number>>(() => {
    const obj: Record<string, string | number> = {};
    for (const cat of FACTOR_SCHEMA) {
      for (const v of cat.Variables) {
        const key = `${cat.Categoria}::${v.Variable}`;
        const kind = inferFieldKind(v);
        // si el esquema trae Default, úsalo; si no, usa el default por tipo
        obj[key] =
          "Default" in v && v.Default !== undefined
            ? v.Default
            : defaultValueFor(kind);
      }
    }
    return obj;
  });

  // PE base (traída de /pe o ingresada aquí manualmente)
  const [peBase, setPeBase] = useState<number>(7537.5);
  const [peBaseDisplay, setPeBaseDisplay] = useState<string>("7537.50");

  type Detail = { name: string; beta: number; value: InputValue };
  type PerCat = { factor: number; details: Detail[] };
  type PerCategoryMap = Record<CategoryKey, PerCat>;

  // Calcula factores por categoría: 1 + Σ(beta_i * valor_i)
  const perCategory = useMemo(() => {
    const out = {} as PerCategoryMap;
    for (const cat of FACTOR_SCHEMA) {
      let sum = 0;
      const details: Array<{
        name: string;
        beta: number;
        value: InputValue;
      }> = [];
      for (const v of cat.Variables) {
        const key = `${cat.Categoria}::${v.Variable}`;
        const kind = inferFieldKind(v);
        const raw = inputs[key];
        //const rawNum = typeof raw === 'number' ? raw : Number(raw) || 0;
        const beta = matchRangeGetBeta(v, raw as number | string); //return decimal
        let contribution = 0;
        if (kind === "equation") {
          contribution = beta;
        } else {
          // valor para multiplicación: percent -> fracción, amount/index -> número, select -> 1
          const value =
            kind === "percent"
              ? typeof raw === "number"
                ? raw
                : Number(raw) || 0
              : kind === "select"
              ? 1
              : typeof raw === "number"
              ? raw
              : Number(raw) || 0;
          const valForCalc = kind === "amount" ? 1 : value;
          contribution = beta * valForCalc;
        }
        // Nota: para índices/montos sin unidad % el efecto es sólo el beta (value=1). Cambia aquí si quieres otra normalización.
        sum += contribution;
        details.push({ name: v.Variable, beta, value: raw as InputValue });
      }
      const factor = 1 + sum;
      out[cat.Categoria as CategoryKey] = { factor, details };
    }
    return out;
  }, [inputs]);

  const factorProducto = useMemo(
    () => Object.values(perCategory).reduce((acc, c) => acc * c.factor, 1),
    [perCategory]
  );
  const peAjustada = useMemo(
    () => peBase * factorProducto,
    [peBase, factorProducto]
  );

  const set = (key: string) => (val: number | string) =>
    setInputs((prev) => ({ ...prev, [key]: val as InputValue }));

  // Generic numeric clamp with toast notification for overlay inputs
  const setClamped = (
    key: string,
    raw: number | string,
    min: number,
    max: number,
    label?: string
  ) => {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isNaN(n)) return; // ignore invalid numbers
    const clamped = Math.max(min, Math.min(max, n));
    if (clamped !== n) {
      toast.info(
        `${label ?? key} ajustado a ${clamped} (rango permitido ${min}-${max})`
      );
    }
    set(key)(clamped);
  };

  const handlePeBaseChange = (value: string) => {
    const validation = validateNumericInput(value);

    // Update display value
    setPeBaseDisplay(validation.displayValue);

    // Only update the actual value if it's valid
    if (validation.numericValue > 0 || value === "" || value === "0") {
      // Apply clamping for PE base (0 to 100000000)
      const clamped = Math.max(0, Math.min(100000000, validation.numericValue));
      if (clamped !== validation.numericValue) {
        toast.info(
          `PE base ajustada a ${clamped} (rango permitido 0-100000000)`
        );
        setPeBaseDisplay(clamped.toString());
      }
      setPeBase(clamped);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overlay / Factores de Ajuste</h1>

      {/* GRID SUPERIOR: Inputs (izq) + Resumen por grupo (der) – misma altura, scroll interno */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* SECTION 1: Inputs */}
        <section className="card h-[480px] overflow-y-auto">
          <div className="text-sm label mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> Entorno Económico Nacional / Regional /
            Gobierno Cooperativo / Entorno Financiero
          </div>
          {/* Mapeo de inputs por categoría */}
          <div className="space-y-6">
            {FACTOR_SCHEMA.map((cat) => (
              <div key={cat.Categoria}>
                <h3 className="text-sm font-semibold mb-2">{cat.Categoria}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.Variables.map((v) => {
                    const key = `${cat.Categoria}::${v.Variable}`;
                    const kind = inferFieldKind(v);
                    return (
                      <FactorField
                        key={key}
                        label={v.Variable}
                        kind={kind}
                        value={inputs[key]}
                        onChange={(val) => {
                          // Apply clamping based on field kind
                          if (kind === "percent" || kind === "equation") {
                            setClamped(key, val, 0, 100, v.Variable);
                          } else if (kind === "amount") {
                            setClamped(key, val, 0, 100000000, v.Variable);
                          } else {
                            set(key)(val);
                          }
                        }}
                        spanLabel={v.spanLabel}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
        {/* SECTION 2: Resumen por grupo (igual altura, scroll) */}
        <section className="card h-[480px] overflow-y-auto">
          <div className="text-sm label mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> Resumen de factores por grupo
          </div>
          <div className="space-y-6">
            {FACTOR_SCHEMA.map((cat) => {
              const c = perCategory[cat.Categoria as CategoryKey];
              return (
                <div
                  key={cat.Categoria}
                  className="rounded-xl p-3 border"
                  style={{
                    borderColor: "var(--ring)",
                    background: "var(--muted)",
                  }}
                >
                  <div className="text-sm font-semibold mb-1">
                    {cat.Categoria}
                  </div>
                  <div className="mt-4 text-md">
                    Factor total: <b>{c ? c.factor.toFixed(4) : "1.0000"}</b>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      {/* SECTION 3: PE × Factores = Resultado */}
      <section className="card">
        <div className="text-sm label mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" /> Cálculo de PE ajustada
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[260px_auto] items-center gap-6">
          {/* PE base */}
          <div>
            <div className="label mb-1">
              PE (Pérdida Esperada de la cartera)
            </div>
            <input
              className="input"
              type="text"
              inputMode="decimal"
              value={peBaseDisplay}
              onChange={(e) => handlePeBaseChange(e.target.value)}
              placeholder="0.00"
            />
            <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
              {fmtQ(Number(peBaseDisplay))}
            </div>
          </div>

          {/* Factores */}
          <div className="text-sm">
            <div className="mb-2">Producto de factores:</div>
            <div className="flex flex-wrap gap-2">
              {FACTOR_SCHEMA.map((cat, i) => (
                <span
                  key={cat.Categoria}
                  className="rounded-lg px-3 py-1 border"
                  style={{ borderColor: "var(--ring)" }}
                >
                  {" "}
                  {cat.Categoria.split(" ")[1] ?? cat.Categoria}:{" "}
                  <b>
                    {perCategory[cat.Categoria as CategoryKey]?.factor.toFixed(
                      4
                    ) ?? "1.0000"}
                  </b>
                  {i < FACTOR_SCHEMA.length - 1}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Resultado centrado */}
        <div className="mt-6 text-center">
          <div className="uppercase text-sm tracking-wider label">
            Resultado
          </div>
          <div className="text-2xl font-semibold mt-1">{fmtQ(peAjustada)}</div>
          <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
            PE ajustada = PE × {FACTOR_SCHEMA.length} factores
          </div>
        </div>
      </section>
      {/* SECTION 4: Resumen detallado */}
      <section className="card">
        <h3 className="text-sm font-semibold mb-2">Resumen</h3>
        <div className="overflow-auto">
          <table className="table w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th>
                  <p className="text-white">Categoría</p>
                </th>
                <th>
                  <p className="text-white">Variable</p>
                </th>
                <th>
                  <p className="text-white">Valor</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {FACTOR_SCHEMA.flatMap((cat) =>
                cat.Variables.map((v) => {
                  const key = `${cat.Categoria}::${v.Variable}`;
                  return (
                    <tr key={key}>
                      <td>{cat.Categoria}</td>
                      <td>{v.Variable}</td>
                      <td>
                        {typeof inputs[key] === "number"
                          ? inputs[key]
                          : String(inputs[key])}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
