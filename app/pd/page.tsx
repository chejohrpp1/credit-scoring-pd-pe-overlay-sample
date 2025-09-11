"use client";
import { useMemo, useState } from "react";
import { Info, Sparkles } from "lucide-react";
import { Gauge } from "../components/Gauge";
import Image from "next/image";

const mapBuro = { A: 0, B: 1, C: 2, D: 3, E: 4 } as const;
const mapSexo = { Masculino: 0, Femenino: 1 } as const;
const mapEmpleo = { Formal: 0, Independiente: 1, Informal: 2 } as const;
const mapUso = {
  Productivos: 1,
  Educación: 2,
  Consumo: 3,
  Consolidación: 4,
} as const; // ya viene codificado
const mapGarantia = {
  Hipoteca: 0,
  "Prendaria/Prenda": 1,
  "Sin garantía": 3,
} as const; // según tu especificación

const COEF = {
  intercepto: -1.97,
  monto: 0.36 / 100000, // a mayor monto (Q), menor PD (de ejemplo)
  buro: 0.01, // peores letras aumentan PD
  endeudamiento: 5.46 / 100, // % 0..100
  ingresos: -0.12 / 1000, // más ingresos, menor PD
  edad: -0.03, // mayor edad, leve menor PD
  sexo: -0.01, // Masculino=1, Femenino=0 (ejemplo, ajusta o elimina si no procede)
  antiguedad: -0.25, // años en empleo actual
  empleo: 0.14, // Formal>Indep>Informal (mayor valor -> menor riesgo)
  uso: 0.01, // Productivos(1) mejor que Consumo(3), etc.
  garantia: 0.01, // hipoteca mejor que sin garantía (3)
};

function computePD(input: FormState) {
  const x =
    COEF.intercepto +
    COEF.monto * (input.monto || 0) +
    COEF.buro * mapBuro[input.buro] +
    COEF.endeudamiento * (input.endeudamiento || 0) +
    COEF.ingresos * (input.ingresos || 0) +
    COEF.edad * (input.edad || 0) +
    COEF.sexo * mapSexo[input.sexo] +
    COEF.antiguedad * (input.antiguedad || 0) +
    COEF.empleo * mapEmpleo[input.empleo] +
    COEF.uso * mapUso[input.uso] +
    COEF.garantia * mapGarantia[input.garantia];

  // Escalamos a 0..100 y limitamos. Ajusta a tu ecuación real.
  const raw = x;
  const pd = Math.max(0, Math.min(100, calculateValue(raw)));
  return pd*100;
}

function calculateValue(m15: number): number {
    return 1 - 1 / (1 + Math.exp(m15));
  }
  

// === Estado de formulario ===
export type FormState = {
  monto: number; // Q
  buro: keyof typeof mapBuro; // A-D
  endeudamiento: number; // %
  ingresos: number; // Q
  edad: number; // 15..101
  sexo: keyof typeof mapSexo; // Masculino/Femenino
  antiguedad: number; // años
  empleo: keyof typeof mapEmpleo; // Formal/Independiente/Informal
  uso: keyof typeof mapUso; // Productivos/Educación/Consumo/Consolidación
  garantia: keyof typeof mapGarantia; // Hipoteca/Prendaria/…
};

export default function PDPage() {
  const [f, setF] = useState<FormState>({
    monto: 250000,
    buro: "B",
    endeudamiento: 15,
    ingresos: 6000,
    edad: 23,
    sexo: "Masculino",
    antiguedad: 4,
    empleo: "Formal",
    uso: "Productivos",
    garantia: "Prendaria/Prenda",
  });

  const pd = useMemo(() => computePD(f), [f]);
  const level =
    pd <= 3
      ? { label: "Muy Bajo riesgo", color: "#1802BF" }
      : pd <= 10
      ? { label: "Bajo riesgo", color: "#19C904" }
      : pd < 20
      ? { label: "Medio riesgo", color: "#DAED07" }
      : pd <= 30
      ? { label: "Alto riesgo", color: "#F79705" }
      : { label: "Critico", color: "#ED1C1C" };

  const set =
    <K extends keyof FormState>(k: K) =>
    (v: FormState[K]) =>
      setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Predictor de Riesgo individual (Probabilidad de Default)</h1>
        <button className="btn">
          <Sparkles className="w-4 h-4" /> Predecir
        </button>
      </header>

      {/* Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:[grid-template-columns:1fr_400px] lg:auto-rows-fr gap-6 items-start">

        <div className="flex flex-col gap-5">
          <section className="card">
            <div className="text-sm label mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Probabilidad de Default
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="h-56">
                <Gauge value={pd} threshold={80} />
              </div>
              <div>
                <div className="text-xl font-semibold flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: level.color }}
                  />{" "}
                  {level.label}
                </div>
                <ul className="mt-3 text-sm space-y-2">
                  <li>
                    <span className="label">Probabilidad de Default:</span>{" "}
                    {pd.toFixed(2)}%
                  </li>
                  <li>
                    <span className="label">Optimizado:</span> Utilizando las 10 características más importantes
                  </li>
                </ul>
              </div>
            </div>
          </section>
          <section className="card">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-center">
              <div className="flex items-center justify-center">
                <Image
                  src="/images/lu_face.png"
                  alt="Fondo de Garantía MICOOPE"
                  width={150}
                  height={150}
                  className="object-contain"
                />
              </div>
              <div className="text-xl font-semibold flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: level.color }}
                  />{" "}
                  PD: {pd.toFixed(2)}%
                </div>
            </div>

          </section>
        </div>

        {/* Formulario */}
        <section className="card space-y-4">
          <h2 className="text-sm font-semibold">
            Ingrese la información del cliente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="label mb-1">Monto (Q)</div>
              <input
                className="input"
                type="number"
                min={0}
                step={100}
                value={f.monto}
                onChange={(e) => set("monto")(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="label mb-1">Buró</div>
              <select
                className="select"
                value={f.buro}
                onChange={(e) =>
                  set("buro")(e.target.value as FormState["buro"])
                }
              >
                {Object.keys(mapBuro).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="label mb-1">Grado de Endeudamiento (%)</div>
              <input
                className="input"
                type="range"
                min={0}
                max={100}
                step={1}
                value={f.endeudamiento}
                onChange={(e) => set("endeudamiento")(Number(e.target.value))}
              />
              <div
                className="text-xs mt-1"
                style={{ color: "var(--fg-muted)" }}
              >
                {f.endeudamiento}%
              </div>
            </div>

            <div>
              <div className="label mb-1">Ingresos (Q)</div>
              <input
                className="input"
                type="number"
                min={0}
                step={100}
                value={f.ingresos}
                onChange={(e) => set("ingresos")(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="label mb-1">Edad</div>
              <input
                className="input"
                type="number"
                min={15}
                max={101}
                value={f.edad}
                onChange={(e) => set("edad")(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="label mb-1">Sexo</div>
              <select
                className="select"
                value={f.sexo}
                onChange={(e) =>
                  set("sexo")(e.target.value as FormState["sexo"])
                }
              >
                {Object.keys(mapSexo).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="label mb-1">Antigüedad empleo (años)</div>
              <input
                className="input"
                type="number"
                min={0}
                max={60}
                value={f.antiguedad}
                onChange={(e) => set("antiguedad")(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="label mb-1">Empleo / Ocupación</div>
              <select
                className="select"
                value={f.empleo}
                onChange={(e) =>
                  set("empleo")(e.target.value as FormState["empleo"])
                }
              >
                {Object.keys(mapEmpleo).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="label mb-1">Uso de Crédito</div>
              <select
                className="select"
                value={f.uso}
                onChange={(e) => set("uso")(e.target.value as FormState["uso"])}
              >
                {Object.keys(mapUso).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="label mb-1">Garantía</div>
              <select
                className="select"
                value={f.garantia}
                onChange={(e) =>
                  set("garantia")(e.target.value as FormState["garantia"])
                }
              >
                {Object.keys(mapGarantia).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setF({
                  monto: 250000,
                  buro: "B",
                  endeudamiento: 15,
                  ingresos: 6000,
                  edad: 23,
                  sexo: "Masculino",
                  antiguedad: 4,
                  empleo: "Formal",
                  uso: "Productivos",
                  garantia: "Prendaria/Prenda",
                });
              }}
            >
              Reiniciar
            </button>
          </div>
        </section>

        
      </div>

      {/* Tabla simple de variables actuales */}
      <section className="card">
        <h3 className="text-sm font-semibold mb-2">Variables actuales</h3>
        <div className="overflow-auto">
          <table className="table w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th>Variable</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(f).map(([k, v]) => (
                <tr key={k}>
                  <td className="capitalize">{k}</td>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
