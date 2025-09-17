export type SelectLevel = "Bajo" | "Medio" | "Alto";

export type VariableRange = Readonly<{ Rango: string; Ponderador: string }>;
export type VariableDef = Readonly<{
  Variable: string;
  Rangos: ReadonlyArray<VariableRange>;
  Default?: string | number;
  spanLabel?: string;
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
        Variable: "Tasa de remesas nacional (0-100)", //-0.1125 * X  + 0.0306
        Default: 20,
        Rangos: [{ Rango: "equation", Ponderador: "-0.1125*value_i+0.0306" }],
        spanLabel: undefined,
      },
      {
        Variable: "Crecimiento del PIB Real (0-100)", //- 0.6244 * X  +  0.05
        Default: 3.5,
        Rangos: [{ Rango: "equation", Ponderador: "-0.6244*value_i+0.05" }],
        spanLabel: undefined,
      },
    ],
  },
  {
    Categoria: "Entorno Regional",
    Variables: [
      {
        Variable: "Tasa de Inflación regional (0-100)", //26.086 * (X^2)   - 1.6287 * X    + 0.0308
        Default: 2,
        Rangos: [
          {
            Rango: "equation",
            Ponderador: "26.086*(value_i^2) - 1.6287*value_i + 0.0308",
          },
        ],
        spanLabel: undefined,
      },
    ],
  },
  {
    Categoria: "Gobierno Cooperativo",
    Variables: [
      {
        Variable: "Calificación de gobierno cooperativo (0-100)", //agregar restriccion de 0-100
        Default: 60,
        Rangos: [{ Rango: "equation", Ponderador: "-0.012*value_i+0.023" }],
        spanLabel: "Pts.",
      },
      {
        Variable: "Riesgo legal (0-100)", //agregar restriccion de 0-100
        Default: 80,
        Rangos: [{ Rango: "equation", Ponderador: "-0.012*value_i+0.023" }],
        spanLabel: "Pts.",
      },
    ],
  },
  {
    Categoria: "Entorno Financiero",
    Variables: [
      {
        Variable: "Tasa de Morosidad del Sistema (%)", //value_i/100 * 0.7436
        Default: 2.8,
        Rangos: [
          { Rango: "< 1%", Ponderador: "0.7436%" },
          { Rango: "> 1%", Ponderador: "0.7436%" },
        ],
        spanLabel: undefined,
      },
    ],
  },
] as const;

export function inferFieldKind(
  v: Readonly<VariableDef>
): "percent" | "amount" | "select" | "equation" {
  // si tiene un rango 'equation' → tratamos como ecuación
  if (v.Rangos.some((r) => r.Rango.toLowerCase() === "equation"))
    return "equation";

  const name = v.Variable.toLowerCase();
  if (name.includes("%")) return "percent";
  if (
    name.includes("hhi") ||
    name.includes("índice hhi") ||
    name.includes("quetzales")
  )
    return "amount";
  const hasBMA = v.Rangos.some((r) =>
    ["bajo", "medio", "alto"].includes(r.Rango.toLowerCase())
  );
  return hasBMA ? "select" : "percent";
}

// Parsea "1.5%" -> 0.015
export const parsePctStr = (s: string) =>
  Number(s.replace("%", "").replace(",", ".")) / 100;

// Normaliza el valor de entrada según si la variable es porcentaje
function normalizeValueFor(
  v: Readonly<VariableDef>,
  raw: number | string
): number {
  const val = typeof raw === "number" ? raw : Number(raw) || 0;
  const isPercentVar = v.Variable.toLowerCase().includes("%");
  // Si la variable es %, interpretamos el input como 0..100 y lo pasamos a 0..1
  return isPercentVar ? val / 100 : val / 100;
}

// -------------- evaluar ecuación 'a*value_i + b' --------------
function evalLinearExpr(expr: string, value: number): number {
  // acepta: "-0.012*value_i+0.023"  ó  "-0.012*value_i+2.3%"
  const cleaned = expr.replace(/\s+/g, "");
  const m = cleaned.match(/^([+-]?\d*\.?\d+)\*value_i([+-]\d*\.?\d+%?)$/i);
  if (!m) return 0;
  const a = parseFloat(m[1]); // -0.012
  const bStr = m[2]; // +0.023  ó +2.3%
  const b = bStr.includes("%") ? parsePctStr(bStr) : parseFloat(bStr);
  return a * value + b; // devuelve decimal (p.ej 0.011)
}

// Evalúa ecuación cuadrática:  a*(value_i^2) + b*value_i + c   (c puede venir en %)
function evalQuadraticExpr(expr: string, value: number): number {
  const cleaned = expr.replace(/\s+/g, "").toLowerCase();
  // Soportar paréntesis opcionales alrededor de value_i^2
  // Formato esperado: a*(value_i^2)+b*value_i+c
  const quad = cleaned.match(
    /^([+-]?\d*\.?\d+)\*\(?value_i\^2\)?([+-]\d*\.?\d+)\*value_i([+-]\d*\.?\d+%?)$/
  );
  if (!quad) return 0;
  const a = parseFloat(quad[1]);
  const b = parseFloat(quad[2]);
  const cStr = quad[3];
  const c = cStr.includes("%") ? parsePctStr(cStr) : parseFloat(cStr);
  return a * value * value + b * value + c;
}

// Coincide el valor con el rango textual y retorna beta (decimal)
export function matchRangeGetBeta(
  v: {
    Variable: string;
    Rangos: ReadonlyArray<{ Rango: string; Ponderador: string }>;
  },
  raw: number | string
): number {
  const kind = inferFieldKind(v);

  if (kind === "equation") {
    const expr =
      v.Rangos.find((r) => r.Rango.toLowerCase() === "equation")?.Ponderador ??
      "";
    const x = normalizeValueFor(v, raw);
    // si incluye value_i^2 → cuadrática; si no → lineal
    return /value_i\^2/i.test(expr)
      ? evalQuadraticExpr(expr, x)
      : evalLinearExpr(expr, x);
  }

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
