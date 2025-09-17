"use client";
import { useMemo, useState } from "react";
import { Info, Calculator } from "lucide-react";
import { toast } from "react-toastify";
import { ELDonut } from "../components/ELDonut";

// === Estado de formulario ===
export type PEFormState = {
  pd: number; // Probabilidad de Default (%)
  lgd: number; // Pérdida en Caso de Default (%)
  ead: number; // Exposición en Caso de Default (Q)
};

export type PEFormDisplay = {
  pd: string; // Display value for PD input
  lgd: string; // Display value for LGD input
  ead: string; // Display value for EAD input
};

function computeEL(input: PEFormState) {
  // Fórmula: EL = PD × LGD × EAD
  // PD y LGD en porcentajes (0-100), EAD en quetzales
  const pdDecimal = input.pd / 100; // Convertir porcentaje a decimal
  const lgdDecimal = input.lgd / 100; // Convertir porcentaje a decimal

  const el = pdDecimal * lgdDecimal * input.ead;
  return el;
}

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

export default function PEPage() {
  const [form, setForm] = useState<PEFormState>({
    pd: 6.7,
    lgd: 45,
    ead: 250000,
  });

  const [displayForm, setDisplayForm] = useState<PEFormDisplay>({
    pd: "6.7",
    lgd: "45",
    ead: "250000",
  });

  const el = useMemo(() => computeEL(form), [form]);

  // Determinar nivel de riesgo basado en EL
  const riskLevel = useMemo(() => {
    const elTotal = el;
    if (elTotal <= 5000) {
      return {
        label: "Riesgo Mínimo",
        color: "#009000",
        description: "Aprobación directa por el comité de agencia",
      };
    } else if (elTotal <= 25000) {
      return {
        label: "Riesgo Moderado",
        color: "#002960",
        description: "Revisión por el comité técnico de crédito",
      };
    } else {
      return {
        label: "Riesgo Crítico",
        color: "#ED1C1C",
        description: "Revisión por el consejo de administración",
      };
    }
  }, [el]);

  const updateField = (field: keyof PEFormState) => (value: string) => {
    const validation = validateNumericInput(value);

    // Actualizar el display value
    setDisplayForm((prev) => ({ ...prev, [field]: validation.displayValue }));

    // Solo actualizar el valor numérico si es válido
    if (validation.numericValue > 0 || value === "" || value === "0") {
      setForm((prev) => ({ ...prev, [field]: validation.numericValue }));
    }
  };

  // Clamp helper with toast (generic for this page)
  const updateFieldClamped = (
    field: keyof PEFormState,
    rawValue: string,
    min: number,
    max: number,
    label: string
  ) => {
    // Allow only numbers and decimal separators
    const cleaned = rawValue.replace(/[^0-9.,]/g, "");
    
    // If value ends with a dot or comma, keep it for decimal input
    if (cleaned.endsWith(".") || cleaned.endsWith(",")) {
      setDisplayForm((prev) => ({ ...prev, [field]: cleaned }));
      return;
    }

    const normalized = cleaned.replace(",", ".");
    const parsed = parseFloat(normalized);
    
    // If empty or invalid, just update display
    if (isNaN(parsed) || cleaned === "") {
      setDisplayForm((prev) => ({ ...prev, [field]: cleaned }));
      return;
    }

    // Handle zero as a special case
    if (parsed === 0) {
      setDisplayForm((prev) => ({ ...prev, [field]: "0" }));
      setForm((prev) => ({ ...prev, [field]: 0 }));
      return;
    }

    // Apply min/max constraints
    const clamped = Math.max(min, Math.min(max, parsed));
    
    // Show toast if value was adjusted
    if (clamped !== parsed) {
      toast.info(`${label} ajustado a ${clamped} (rango permitido ${min}-${max})`);
    }
    
    // Update both display and form values
    const displayValue = normalized.includes(".") 
      ? normalized.endsWith("0") 
        ? normalized // Keep trailing zeros after decimal
        : clamped.toString()
      : clamped.toString();
      
    setDisplayForm((prev) => ({ ...prev, [field]: displayValue }));
    setForm((prev) => ({ ...prev, [field]: clamped }));
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pérdidas Esperadas (PE)</h1>
        <button className="btn">
          <Calculator className="w-4 h-4" /> Calcular
        </button>
      </header>

      {/* Fórmula */}
      <section className="card">
        <div className="text-sm label mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" /> Fórmula de Pérdidas Esperadas
        </div>
        <div className="text-center p-4 bg-[var(--muted)] rounded-xl">
          <div className="text-2xl font-mono">
            <span className="text-[var(--brand)]">PE</span> ={" "}
            <span className="text-[var(--ok)]">PD</span> ×{" "}
            <span className="text-[var(--warn)]">EAD</span> ×{" "}
            <span className="text-[var(--danger)]">LGD</span>
          </div>
          <div className="text-sm mt-2" style={{ color: "var(--fg-muted)" }}>
            Donde: PD = Probabilidad de Default (%), LGD = Perdida dada al
            default (%), EAD = Exposición en Caso de Default (Q)
          </div>
        </div>
      </section>

      {/* Resultado */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-stretch">
        <section className="card flex flex-col">
          <div className="text-sm label mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Resultado de Pérdidas Esperadas
          </div>
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="h-56">
              <ELDonut
                value={el}
                max={25000}
                thresholds={[5000, 25000]}
                caption=""
              />
            </div>
            <div>
              <div className="text-xl font-semibold flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: riskLevel.color }}
                />{" "}
                {riskLevel.label}
              </div>
              <ul className="mt-3 text-sm space-y-2">
                <li>
                  <span className="label">Pérdida Esperada:</span> Q{" "}
                  {el.toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </li>
                <li>
                  <span className="label">Descripción:</span>{" "}
                  {riskLevel.description}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section className="card flex flex-col space-y-4">
          <h2 className="text-sm font-semibold">
            Ingrese los parámetros de riesgo
          </h2>

          <div className="flex-1 space-y-4">
            <div>
              <div className="label mb-1">Probabilidad de Default - PD (%)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayForm.pd}
                onChange={(e) => updateFieldClamped("pd", e.target.value, 0, 100, "PD")}
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="label mb-1">
                Pérdida dada al Default - LGD (%)
              </div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayForm.lgd}
                onChange={(e) => updateFieldClamped("lgd", e.target.value, 0, 100, "LGD")}
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="label mb-1">
                Exposición en Caso de Default - EAD (Q)
              </div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayForm.ead}
                onChange={(e) => updateField("ead")(e.target.value)}
                placeholder="00.0"
              />
              <div
                className="text-xs mt-1"
                style={{ color: "var(--fg-muted)" }}
              >
                Monto total expuesto
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setForm({
                  pd: 6.7,
                  lgd: 45,
                  ead: 250000,
                });
                setDisplayForm({
                  pd: "6.7",
                  lgd: "45",
                  ead: "250000",
                });
              }}
            >
              Valores por Defecto
            </button>
          </div>
        </section>
      </div>

      {/* Desglose de Cálculo */}
      <section className="card">
        <h3 className="text-sm font-semibold mb-2">Desglose del Cálculo</h3>
        <div className="overflow-auto">
          <table className="table w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th>
                  <p className="text-white">Parametros</p>
                </th>
                <th>
                  <p className="text-white">Valor</p>
                </th>
                <th>
                  <p className="text-white">Descripción</p>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-[var(--ok)]">PD</td>
                <td>{form.pd}%</td>
                <td>Probabilidad de Default</td>
              </tr>
              <tr>
                <td className="font-mono text-[var(--warn)]">LGD</td>
                <td>{form.lgd}%</td>
                <td>Pérdida dada al Default</td>
              </tr>
              <tr>
                <td className="font-mono text-[var(--danger)]">EAD</td>
                <td>Q {form.ead.toLocaleString("es-GT")}</td>
                <td>Exposición en Caso de Default</td>
              </tr>
              <tr className="border-t-2" style={{ borderColor: "var(--ring)" }}>
                <td className="font-mono text-[var(--brand)] font-semibold">
                  PE
                </td>
                <td className="font-semibold">
                  Q{" "}
                  {el.toLocaleString("es-GT", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="font-semibold">Pérdida Esperada</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Información Adicional */}
      <section className="card">
        <h3 className="text-sm font-semibold mb-2">
          Información sobre los Parámetros
        </h3>
        <div className="text-sm space-y-2" style={{ color: "var(--fg-muted)" }}>
          <p>
            <strong>PD (Probabilidad de Default):</strong> Probabilidad de que
            el deudor no pueda cumplir con sus obligaciones de pago en un
            período determinado.
          </p>
          <p>
            <strong>LGD (Perdida dada al default):</strong> Porcentaje de la
            exposición que se pierde cuando ocurre un impago, considerando
            recuperaciones.
          </p>
          <p>
            <strong>EAD (Exposición en Caso de Default):</strong> Monto total de
            la exposición crediticia al momento de la solicitud.
          </p>
        </div>
      </section>
    </div>
  );
}
