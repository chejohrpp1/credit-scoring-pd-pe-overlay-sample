"use client";
import { useMemo, useState } from "react";
import { Info, Sparkles, Calculator } from "lucide-react";
import { Gauge } from "../components/Gauge";

// === Estado de formulario ===
export type PEFormState = {
  pd: number; // Probabilidad de Default (%)
  lgd: number; // Pérdida en Caso de Default (%)
  ead: number; // Exposición en Caso de Default (Q)
};

function computeEL(input: PEFormState) {
  // Fórmula: EL = PD × LGD × EAD
  // PD y LGD en porcentajes (0-100), EAD en quetzales
  const pdDecimal = input.pd / 100; // Convertir porcentaje a decimal
  const lgdDecimal = input.lgd / 100; // Convertir porcentaje a decimal
  
  const el = pdDecimal * lgdDecimal * input.ead;
  return el;
}

function validateNumericInput(value: string): number {
  // Permitir solo números, punto decimal y coma como separador decimal
  const cleaned = value.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

export default function PEPage() {
  const [form, setForm] = useState<PEFormState>({
    pd: 5.5,
    lgd: 45,
    ead: 250000,
  });

  const el = useMemo(() => computeEL(form), [form]);
  
  // Determinar nivel de riesgo basado en EL
  const riskLevel = useMemo(() => {
    const elPercentage = (el / form.ead) * 100;
    if (elPercentage <= 1) {
      return { label: "Muy Bajo Riesgo", color: "#1802BF", description: "Exposición muy controlada" };
    } else if (elPercentage <= 3) {
      return { label: "Bajo Riesgo", color: "#19C904", description: "Exposición aceptable" };
    } else if (elPercentage <= 5) {
      return { label: "Medio Riesgo", color: "#DAED07", description: "Exposición moderada" };
    } else if (elPercentage <= 10) {
      return { label: "Alto Riesgo", color: "#F79705", description: "Exposición alta" };
    } else {
      return { label: "Riesgo Crítico", color: "#ED1C1C", description: "Exposición crítica" };
    }
  }, [el, form.ead]);

  const updateField = (field: keyof PEFormState) => (value: string) => {
    const numericValue = validateNumericInput(value);
    setForm(prev => ({ ...prev, [field]: numericValue }));
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
            <span className="text-[var(--brand)]">EL</span> = <span className="text-[var(--ok)]">PD</span> × <span className="text-[var(--warn)]">LGD</span> × <span className="text-[var(--danger)]">EAD</span>
          </div>
          <div className="text-sm mt-2" style={{ color: "var(--fg-muted)" }}>
            Donde: PD = Probabilidad de Default (%), LGD = Pérdida en Caso de Default (%), EAD = Exposición en Caso de Default (Q)
          </div>
        </div>
      </section>

      {/* Resultado */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        <section className="card">
          <div className="text-sm label mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Resultado de Pérdidas Esperadas
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="h-56">
              <Gauge value={(el / form.ead) * 100} threshold={10} />
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
                  <span className="label">Pérdida Esperada:</span>{" "}
                  Q {el.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </li>
                <li>
                  <span className="label">Porcentaje de Exposición:</span>{" "}
                  {((el / form.ead) * 100).toFixed(2)}%
                </li>
                <li>
                  <span className="label">Descripción:</span> {riskLevel.description}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Formulario */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold">
            Ingrese los parámetros de riesgo
          </h2>

          <div className="space-y-4">
            <div>
              <div className="label mb-1">Probabilidad de Default - PD (%)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={form.pd}
                onChange={(e) => updateField("pd")(e.target.value)}
                placeholder="0.00"
              />
              <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                Rango típico: 0.1% - 50%
              </div>
            </div>

            <div>
              <div className="label mb-1">Pérdida en Caso de Default - LGD (%)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={form.lgd}
                onChange={(e) => updateField("lgd")(e.target.value)}
                placeholder="0.00"
              />
              <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                Rango típico: 20% - 80%
              </div>
            </div>

            <div>
              <div className="label mb-1">Exposición en Caso de Default - EAD (Q)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={form.ead}
                onChange={(e) => updateField("ead")(e.target.value)}
                placeholder="0"
              />
              <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                Monto total expuesto
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="btn"
              onClick={() => {
                // Recalcular con valores actuales
              }}
            >
              <Sparkles className="w-4 h-4" /> Recalcular
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setForm({
                  pd: 5.5,
                  lgd: 45,
                  ead: 250000,
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
                <th>Parámetro</th>
                <th>Valor</th>
                <th>Descripción</th>
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
                <td>Pérdida en Caso de Default</td>
              </tr>
              <tr>
                <td className="font-mono text-[var(--danger)]">EAD</td>
                <td>Q {form.ead.toLocaleString('es-GT')}</td>
                <td>Exposición en Caso de Default</td>
              </tr>
              <tr className="border-t-2" style={{ borderColor: "var(--ring)" }}>
                <td className="font-mono text-[var(--brand)] font-semibold">EL</td>
                <td className="font-semibold">Q {el.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="font-semibold">Pérdida Esperada</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Información Adicional */}
      <section className="card">
        <h3 className="text-sm font-semibold mb-2">Información sobre los Parámetros</h3>
        <div className="text-sm space-y-2" style={{ color: "var(--fg-muted)" }}>
          <p>
            <strong>PD (Probabilidad de Default):</strong> Probabilidad de que el deudor no pueda cumplir 
            con sus obligaciones de pago en un período determinado.
          </p>
          <p>
            <strong>LGD (Loss Given Default):</strong> Porcentaje de la exposición que se pierde 
            cuando ocurre un default, considerando recuperaciones.
          </p>
          <p>
            <strong>EAD (Exposure at Default):</strong> Monto total de la exposición crediticia 
            en el momento del default.
          </p>
        </div>
      </section>
    </div>
  );
}
