"use client";

import {
  calculateEdadCOEF,
  calculateIncomeCOEF,
  evaluateAntiguedadRangeCOEF,
} from "./utils";

export const mapBuro = { A: 0, B: 1, C: 2, D: 3, E: 4 } as const;
export const mapSexo = { Masculino: 0, Femenino: 1 } as const;
export const mapEmpleo = {
  "Formal dependiente": 0,
  "Formal Independiente": 1,
  Informal: 2,
} as const;
export const mapUso = {
  Productivos: 1,
  Educación: 2,
  Consumo: 3,
  Consolidación: 4,
} as const; // ya viene codificado
export const mapGarantia = {
  Hipoteca: 0,
  "Prendaria/Prenda": 1,
  "Sin garantía": 6,
} as const; // según tu especificación

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

const COEF = {
  intercepto: -3.97,
  monto: 0.36 / 100000, // a mayor monto (Q), menor PD (de ejemplo)
  buro: 0.1, // peores letras aumentan PD
  endeudamiento: 5.46 / 100, // % 0..100
  ingresos: -0.038, // más ingresos, menor PD
  edad: calculateEdadCOEF, // will be the funcion calculateEdadCOEF
  sexo: -0.1, // Masculino=1, Femenino=0 (ejemplo, ajusta o elimina si no procede)
  antiguedad: evaluateAntiguedadRangeCOEF, // años en empleo actual
  empleo: 0.474, // Formal>Indep>Informal (mayor valor -> menor riesgo)
  uso: 0.1, // Productivos(1) mejor que Consumo(3), etc.
  garantia: 0.1, // hipoteca mejor que sin garantía (3)
} as const;

function calculateValue(m15: number): number {
  return 1 - 1 / (1 + Math.exp(m15));
}

export function computePD(input: FormState) {
  const x =
    COEF.intercepto +
    COEF.monto * (input.monto || 0) +
    COEF.buro * mapBuro[input.buro] +
    COEF.endeudamiento * (input.endeudamiento || 0) +
    (input.endeudamiento <= 70
      ? input.ingresos > 5000
        ? 1 / (COEF.ingresos * (input.monto / input.ingresos))
        : calculateIncomeCOEF(input.ingresos)
      : 0) +
    (typeof COEF.edad === "function"
      ? COEF.edad(input.edad || 0)
      : (COEF.edad as number) * (input.edad || 0)) + //change into to function
    COEF.sexo * mapSexo[input.sexo] +
    (typeof COEF.antiguedad === "function"
      ? COEF.antiguedad(input.antiguedad || 0)
      : (COEF.antiguedad as number) * (input.antiguedad || 0)) + //change into to a range
    COEF.empleo * mapEmpleo[input.empleo] +
    COEF.uso * mapUso[input.uso] +
    COEF.garantia * mapGarantia[input.garantia];

  // Escalamos a 0..100 y limitamos. Ajusta a tu ecuación real.
  const raw = x;
  const pd = Math.max(0, Math.min(100, calculateValue(raw)));
  return pd * 100;
}
