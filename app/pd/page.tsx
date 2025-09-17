"use client";
import { useMemo, useState } from "react";
import { Info, Sparkles } from "lucide-react";
import { Gauge } from "../components/Gauge";
import Image from "next/image";
import { calculateEdadCOEF, evaluateAntiguedadRangeCOEF } from "../helpers/pd/utils";
import { toast } from "react-toastify";

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
  intercepto: -3.97,
  monto: 0.36 / 100000, // a mayor monto (Q), menor PD (de ejemplo)
  buro: 0.1, // peores letras aumentan PD
  endeudamiento: 5.46 / 100, // % 0..100
  ingresos: -0.038, // más ingresos, menor PD
  edad: calculateEdadCOEF, // will be the funcion calculateEdadCOEF
  sexo: -0.1, // Masculino=1, Femenino=0 (ejemplo, ajusta o elimina si no procede)
  antiguedad: evaluateAntiguedadRangeCOEF, // años en empleo actual -> restriction: hasta 30 años -> hacer un rango -> use the function evaluateAntiguedadRangeCOEF
  empleo: 0.474, // Formal>Indep>Informal (mayor valor -> menor riesgo)
  uso: 0.1, // Productivos(1) mejor que Consumo(3), etc.
  garantia: 0.1, // hipoteca mejor que sin garantía (3)
};

function computePD(input: FormState) {
  const x =
    COEF.intercepto +
    COEF.monto * (input.monto || 0) +
    COEF.buro * mapBuro[input.buro] +
    COEF.endeudamiento * (input.endeudamiento || 0) +
    (input.endeudamiento <= 70 ? 1/ (COEF.ingresos * ((input.monto / input.ingresos)) || 0) : 0) +
    (typeof COEF.edad === "function" ? COEF.edad(input.edad || 0) : COEF.edad * (input.edad || 0)) + //change into to function
    COEF.sexo * mapSexo[input.sexo] + 
    (typeof COEF.antiguedad === "function" ? COEF.antiguedad(input.antiguedad || 0) : COEF.antiguedad * (input.antiguedad || 0)) + //change into to a range
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
    edad: 32,
    sexo: "Masculino",
    antiguedad: 4,  
    empleo: "Formal",
    uso: "Consumo",
    garantia: "Prendaria/Prenda",
  });

  // display strings for numeric inputs so users can clear and see placeholders
  const [displayMonto, setDisplayMonto] = useState<string>("250000");
  const [displayIngresos, setDisplayIngresos] = useState<string>("6000");
  const [displayEndeudamiento, setDisplayEndeudamiento] = useState<string>("15");
  const [displayEdad, setDisplayEdad] = useState<string>("32");
  const [displayAntiguedad, setDisplayAntiguedad] = useState<string>("4");

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

  // Generic numeric clamp with toast notification
  const setClamped = <K extends keyof FormState>(
    key: K,
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
        `${label ?? String(key)} ajustado a ${clamped} (rango permitido ${min}-${max})`
      );
    }
    set(key)(clamped as FormState[K]);
  };

  // Text-input friendly numeric handler with clamping and display sync
  const handleNumericChange = (
    key: keyof FormState,
    label: string,
    raw: string,
    min: number,
    max: number
  ) => {
    const setDisplay = (val: string) => {
      if (key === "monto") setDisplayMonto(val);
      if (key === "ingresos") setDisplayIngresos(val);
      if (key === "endeudamiento") setDisplayEndeudamiento(val);
      if (key === "edad") setDisplayEdad(val);
      if (key === "antiguedad") setDisplayAntiguedad(val);
    };

    // allow clearing and intermediate decimal typing
    const cleaned = raw.replace(/[^0-9.,]/g, "");
    if (cleaned === "" || cleaned.endsWith(".") || cleaned.endsWith(",")) {
      setDisplay(cleaned);
      return;
    }
    const normalized = cleaned.replace(",", ".");
    const parsed = parseFloat(normalized);
    if (Number.isNaN(parsed)) {
      setDisplay(cleaned);
      return;
    }
    const clamped = Math.max(min, Math.min(max, parsed));
    if (clamped !== parsed) {
      toast.info(`${label} ajustado a ${clamped} (rango permitido ${min}-${max})`);
    }
    setDisplay(clamped.toString());
    setF((prev) => ({ ...prev, [key]: clamped }));
  };

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
              <div className="h-56 flex items-center justify-center">
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
                type="text"
                inputMode="decimal"
                value={displayMonto}
                onChange={(e) => handleNumericChange("monto", "Monto", e.target.value, 0, 100000000)}
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="label mb-1">Record crediticio</div>
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
                type="text"
                inputMode="decimal"
                value={displayEndeudamiento}
                onChange={(e) => handleNumericChange("endeudamiento", "Endeudamiento (%)", e.target.value, 0, 100)}
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="label mb-1">Ingresos (Q)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayIngresos}
                onChange={(e) => handleNumericChange("ingresos", "Ingresos", e.target.value, 0, 100000000)}
                placeholder="0.00"
              />
            </div>

            <div>
              <div className="label mb-1">Edad</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayEdad}
                onChange={(e) => handleNumericChange("edad", "Edad", e.target.value, 0, 101)}
                placeholder="0"
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
                type="text"
                inputMode="decimal"
                value={displayAntiguedad}
                onChange={(e) => handleNumericChange("antiguedad", "Antigüedad", e.target.value, 0, 30)}
                placeholder="0"
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
                  edad: 32,
                  sexo: "Masculino",
                  antiguedad: 4,
                  empleo: "Formal",
                  uso: "Consumo",
                  garantia: "Prendaria/Prenda",
                });
                setDisplayMonto("250000");
                setDisplayIngresos("6000");
                setDisplayEndeudamiento("15");
                setDisplayEdad("32");
                setDisplayAntiguedad("4");
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
                <th><p className="text-white">Variable</p></th>
                <th><p className="text-white">Valor</p></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(f).map(([k, v]) => (
                <tr key={k}>
                  <td className="capitalize">{k === "buro" ? "Record crediticio" : k}</td>
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
