"use client";
import { useEffect, useState } from "react";
import { Info, Sparkles } from "lucide-react";
import { Gauge } from "../components/Gauge";
import Image from "next/image";
import { toast } from "react-toastify";
import { fmtQ } from "../helpers/components/utils";
import { usePd } from "../context/PdProvider";
import {
  mapBuro,
  mapSexo,
  mapEmpleo,
  mapUso,
  mapGarantia,
  type FormState,
} from "../helpers/pd/model";

// === Estado de formulario ===
export default function PDPage() {
  const { form: f, setField, pd, reset } = usePd();

  // display strings for numeric inputs so users can clear and see placeholders
  const [displayMonto, setDisplayMonto] = useState<string>(String(f.monto ?? ""));
  const [displayIngresos, setDisplayIngresos] = useState<string>(String(f.ingresos ?? ""));
  const [displayEndeudamiento, setDisplayEndeudamiento] =
    useState<string>(String(f.endeudamiento ?? ""));
  const [displayEdad, setDisplayEdad] = useState<string>(String(f.edad ?? ""));
  const [displayAntiguedad, setDisplayAntiguedad] = useState<string>(String(f.antiguedad ?? ""));

  // Sync displays whenever form changes (e.g., restored from storage)
  useEffect(() => {
    setDisplayMonto(String(f.monto ?? ""));
    setDisplayIngresos(String(f.ingresos ?? ""));
    setDisplayEndeudamiento(String(f.endeudamiento ?? ""));
    setDisplayEdad(String(f.edad ?? ""));
    setDisplayAntiguedad(String(f.antiguedad ?? ""));
  }, [f.monto, f.ingresos, f.endeudamiento, f.edad, f.antiguedad]);
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
      setField(k, v);

  // Text-input friendly numeric handler with clamping and display sync
  type NumericKeys = "monto" | "endeudamiento" | "ingresos" | "edad" | "antiguedad";
  const handleNumericChange = (
    key: NumericKeys,
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
      toast.info(
        `${label} ajustado a ${clamped} (rango permitido ${min}-${max})`
      );
    }
    setDisplay(clamped.toString());
    setField(key, clamped as unknown as FormState[NumericKeys]);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Scoring crediticio
        </h1>
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
                    <span className="label">Optimizado:</span> Utilizando las 10
                    características más importantes
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
            Ingrese la información del asociado
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="label mb-1">Monto (Q)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayMonto}
                onChange={(e) =>
                  handleNumericChange(
                    "monto",
                    "Monto",
                    e.target.value,
                    0,
                    1000000
                  )
                }
                placeholder="0.00"
              />
              <div
                className="text-xs mt-1"
                style={{ color: "var(--fg-muted)" }}
              >
                {fmtQ(Number(displayMonto))}
              </div>
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
                onChange={(e) =>
                  handleNumericChange(
                    "endeudamiento",
                    "Endeudamiento (%)",
                    e.target.value,
                    0,
                    100
                  )
                }
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
                onChange={(e) =>
                  handleNumericChange(
                    "ingresos",
                    "Ingresos",
                    e.target.value,
                    1,
                    100000000
                  )
                }
                placeholder="0.00"
              />
              <div
                className="text-xs mt-1"
                style={{ color: "var(--fg-muted)" }}
              >
                {fmtQ(Number(displayIngresos))}
              </div>
            </div>

            <div>
              <div className="label mb-1">Edad</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayEdad}
                onChange={(e) =>
                  handleNumericChange("edad", "Edad", e.target.value, 0, 101)
                }
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
              <div className="label mb-1">Antigüedad laboral (años)</div>
              <input
                className="input"
                type="text"
                inputMode="decimal"
                value={displayAntiguedad}
                onChange={(e) =>
                  handleNumericChange(
                    "antiguedad",
                    "Antigüedad",
                    e.target.value,
                    0,
                    30
                  )
                }
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
                reset();
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
                <th>
                  <p className="text-white">Variable</p>
                </th>
                <th>
                  <p className="text-white">Valor</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(f).map(([k, v]) => (
                <tr key={k}>
                  <td className="capitalize">
                    {k === "buro" ? "Record crediticio" : k}
                  </td>
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
