export type SelectLevel = 'Bajo' | 'Medio' | 'Alto';

export type VariableRange = Readonly<{ Rango: string; Ponderador: string }>;
export type VariableDef = Readonly<{
  Variable: string;
  Rangos: ReadonlyArray<VariableRange>;
}>;
export type CategoryDef = Readonly<{
  Categoria: CategoryKey;
  Variables: ReadonlyArray<VariableDef>;
}>;


export type CategoryKey =
  | "Entorno Económico Nacional"
  | "Entorno Regional"
  | "Gobierno Cooperativo"
  | "Entorno Financiero";

export const FACTOR_SCHEMA = [
  {
    Categoria: "Entorno Económico Nacional",
    Variables: [
      {
        Variable: "Tasa de Inflación Anual (%)",
        Rangos: [
          { Rango: "< 3%", Ponderador: "1.0%" },
          { Rango: "3% - 5%", Ponderador: "0.5%" },
          { Rango: "> 5%", Ponderador: "2.0%" },
        ],
      },
      {
        Variable: "Tasa de Desempleo Nacional (%)",
        Rangos: [
          { Rango: "< 10%", Ponderador: "0.5%" },
          { Rango: "10% - 20%", Ponderador: "0.7%" },
          { Rango: "> 20%", Ponderador: "1.5%" },
        ],
      },
      {
        Variable: "Crecimiento del PIB Real (%)",
        Rangos: [
          { Rango: "< 2%", Ponderador: "0.3%" },
          { Rango: "2% - 3%", Ponderador: "0.4%" },
          { Rango: "> 3%", Ponderador: "0.5%" },
        ],
      },
    ],
  },
  {
    Categoria: "Entorno Regional",
    Variables: [
      {
        Variable: "Dependencia de Remesas (% de Ingresos Regionales)",
        Rangos: [
          { Rango: "< 10%", Ponderador: "1.2%" },
          { Rango: "10% - 15%", Ponderador: "0.6%" },
          { Rango: "> 15%", Ponderador: "0.4%" },
        ],
      },
      {
        Variable: "Índice de Conflictos Comunitarios (1-5)",
        Rangos: [
          { Rango: "Bajo", Ponderador: "0.3%" },
          { Rango: "Medio", Ponderador: "0.5%" },
          { Rango: "Alto", Ponderador: "1.0%" },
        ],
      },
      {
        Variable: "Diversificación de Ingresos (Índice HHI, 0-10,000)",
        Rangos: [
          { Rango: "< 1,500", Ponderador: "0.3%" },
          { Rango: "1500 - 3000", Ponderador: "0.4%" },
          { Rango: "> 3000", Ponderador: "0.8%" },
        ],
      },
    ],
  },
  {
    Categoria: "Gobierno Cooperativo",
    Variables: [
      {
        Variable: "Tasa de Cobranza Efectiva (% de Cartera Recuperada)",
        Rangos: [
          { Rango: "< 80%", Ponderador: "0.2%" },
          { Rango: "80% - 90%", Ponderador: "0.1%" },
          { Rango: "> 90%", Ponderador: "0.2%" },
        ],
      },
      {
        Variable: "Índice de Cumplimiento de Políticas (1-5)",
        Rangos: [
          { Rango: "Bajo", Ponderador: "0.3%" },
          { Rango: "Medio", Ponderador: "0.5%" },
          { Rango: "Alto", Ponderador: "1.0%" },
        ],
      },
    ],
  },
  {
    Categoria: "Entorno Financiero",
    Variables: [
      {
        Variable: "Tasa de Morosidad del Sistema (%)",
        Rangos: [
          { Rango: "< 1%", Ponderador: "1.5%" },
          { Rango: "1% - 2%", Ponderador: "0.7%" },
          { Rango: "> 2%", Ponderador: "1.5%" },
        ],
      },
      {
        Variable: "Crecimiento del Ahorro Captado (% anual)",
        Rangos: [
          { Rango: "< 5%", Ponderador: "0.4%" },
          { Rango: "5% - 7%", Ponderador: "0.2%" },
          { Rango: "> 7%", Ponderador: "0.1%" },
        ],
      },
      {
        Variable: "Concentración de Cartera (% en Top 5 Sectores)",
        Rangos: [
          { Rango: "< 20%", Ponderador: "1.0%" },
          { Rango: "20% - 30%", Ponderador: "0.5%" },
          { Rango: "> 30%", Ponderador: "1.0%" },
        ],
      },
    ],
  },
] as const;

export function inferFieldKind(v: {
  Variable: string;
  Rangos: ReadonlyArray<{ Rango: string; Ponderador: string }>;
}): "percent" | "amount" | "select" {
  const name = v.Variable.toLowerCase();
  if (name.includes("%")) return "percent";
  if (
    name.includes("hhi") ||
    name.includes("índice hhi") ||
    name.includes("quetzales")
  )
    return "amount";
  // cuando los rangos son Bajo/Medio/Alto explícitos
  const hasBMA = v.Rangos.some((r) =>
    ["bajo", "medio", "alto"].includes(r.Rango.toLowerCase())
  );
  return hasBMA ? "select" : "percent";
}

// Parsea "1.5%" -> 0.015
export const parsePctStr = (s: string) =>
  Number(s.replace("%", "").replace(",", ".")) / 100;

// Coincide el valor con el rango textual y retorna beta (decimal)
export function matchRangeGetBeta(
  v: { Variable: string; Rangos: ReadonlyArray<{ Rango: string; Ponderador: string }> },
  raw: number | string
): number {
  const kind = inferFieldKind(v);
  // Select directo por etiqueta
  if (kind === "select") {
    const found = v.Rangos.find(
      (r) => r.Rango.toLowerCase() === String(raw).toLowerCase()
    );
    return found ? parsePctStr(found.Ponderador) : 0;
  }

  // Numérico: intenta interpretar el rango
  const val = Number(raw) || 0;
  for (const r of v.Rangos) {
    const txt = r.Rango.toLowerCase().replaceAll(",", "");
    const beta = parsePctStr(r.Ponderador);
    // casos: "< 3%", "> 5%", "3% - 5%", "1500 - 3000"
    if (txt.includes("-")) {
      const [a, b] = txt
        .split("-")
        .map((t) => Number(t.replace(/[^0-9.]/g, "").trim()));
      if (val >= a && val <= b) return beta;
    } else if (txt.includes("<")) {
      const a = Number(txt.replace(/[^0-9.]/g, ""));
      if (val < a) return beta;
    } else if (txt.includes(">")) {
      const a = Number(txt.replace(/[^0-9.]/g, ""));
      if (val > a) return beta;
    } else {
      // coincidencia exacta
      const n = Number(txt.replace(/[^0-9.]/g, ""));
      if (val === n) return beta;
    }
  }
  return 0;
}
