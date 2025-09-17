export const COEF_SCHEMA = [
  {
    Categoria: "antiguedad",
    variable: {
      Rangos: [
        { Rango: "< 5", Ponderador: "0.25%" },
        { Rango: "6-10", Ponderador: "0.35%" },
        { Rango: "11-15", Ponderador: "0.3%" },
        { Rango: "16-20", Ponderador: "0.25%" },
        { Rango: "> 20", Ponderador: "0.1%" },
      ],
    },
  },
  {
    Categoria: "edad", //0.000055 * X ^2 - 0.004124 * X + 0.10692
    Variable: {
      Rangos: [
        {
          Rango: "equation",
          Ponderador:
            "0.000055*(value_i^2) - 0.004124*value_i + 0.10692",
        },
      ],
    },
  },
];

// --- helpers (mirror behavior from overlay/factors.ts) ---
const parsePctStr = (s: string): number =>
  Number(s.replace("%", "").replace(",", ".")) / 100;

const evalLinearExpr = (expr: string, value: number): number => {
  const cleaned = expr.replace(/\s+/g, "");
  const m = cleaned.match(/^([+-]?\d*\.?\d+)\*value_i([+-]\d*\.?\d+%?)$/i);
  if (!m) return 0;
  const a = parseFloat(m[1]);
  const bStr = m[2];
  const b = bStr.includes("%") ? parsePctStr(bStr) : parseFloat(bStr);
  return a * value + b;
};

const evalQuadraticExpr = (expr: string, value: number): number => {
  const cleaned = expr.replace(/\s+/g, "").toLowerCase();
  const quad = cleaned.match(
    /^([+-]?\d*\.?\d+)\*\(?value_i\^2\)?([+-]\d*\.?\d+)\*value_i([+-]\d*\.?\d+%?)$/
  );
  if (!quad) return 0;
  const a = parseFloat(quad[1]);
  const b = parseFloat(quad[2]);
  const cStr = quad[3];
  const c = cStr.includes("%") ? parsePctStr(cStr) : parseFloat(cStr);
  return a * value * value + b * value + c;
};

type RangoDef = { Rango: string; Ponderador: string };
type SchemaItem = {
  Categoria: string;
  variable?: { Rangos: RangoDef[] };
  Variable?: { Rangos: RangoDef[] };
};

function getSchemaByCategoria(key: string): SchemaItem | undefined {
  return COEF_SCHEMA.find(
    (c) => (c as SchemaItem).Categoria.toLowerCase() === key.toLowerCase()
  ) as SchemaItem | undefined;
}

export const calculateEdadCOEF = (age: number): number => {
  const edadDef = getSchemaByCategoria("edad");
  const rangos: Array<{ Rango: string; Ponderador: string }> =
    edadDef?.Variable?.Rangos ?? edadDef?.variable?.Rangos ?? [];
  const expr = rangos.find((r) => r.Rango.toLowerCase() === "equation")?.Ponderador ?? "";
  if (/value_i\^2/i.test(expr)) return evalQuadraticExpr(expr, age);
  if (/\*value_i/i.test(expr)) return evalLinearExpr(expr, age);
  return 0;
};

export const evaluateAntiguedadRangeCOEF = (yearsInCurrentJob: number): number => {
  const antiDef = getSchemaByCategoria("antiguedad");
  const rangos: Array<{ Rango: string; Ponderador: string }> =
    antiDef?.Variable?.Rangos ?? antiDef?.variable?.Rangos ?? [];

  const y = Number(yearsInCurrentJob) || 0;
  let beta = 0;
  for (const r of rangos) {
    const txt = r.Rango.toLowerCase().replaceAll(",", "").trim();
    const p = parsePctStr(r.Ponderador);
    if (txt.includes("-")) {
      const [a, b] = txt
        .split("-")
        .map((t) => Number(t.replace(/[^0-9.]/g, "").trim()));
      if (y >= a && y <= b) {
        beta = p;
        break;
      }
    } else if (txt.includes(">")) {
      const a = Number(txt.replace(/[^0-9.]/g, ""));
      if (y >= a) {
        beta = p;
        // continue loop in case there is a more specific higher range (e.g. "> 20")
      }
    } else if (txt.includes("<")) {
      const a = Number(txt.replace(/[^0-9.]/g, ""));
      if (y <= a) {
        beta = p;
        break;
      }
    }
  }
  //console.log(`${beta} * ${y} = ${beta * y}`)
  return beta * y;
};