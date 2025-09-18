"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FormState, computePD } from "../helpers/pd/model";

const DEFAULT_FORM: FormState = {
  monto: 250000,
  buro: "B",
  endeudamiento: 15,
  ingresos: 6000,
  edad: 32,
  sexo: "Masculino",
  antiguedad: 4,
  empleo: "Formal dependiente",
  uso: "Consumo",
  garantia: "Prendaria/Prenda",
};

const STORAGE_KEY = "pdFormV1";

type PdContextValue = {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  pd: number;
  reset: () => void;
};

const PdContext = createContext<PdContextValue | undefined>(undefined);

export function PdProvider({ children }: { children: React.ReactNode }) {
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window === "undefined") return DEFAULT_FORM;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_FORM, ...parsed } as FormState;
      }
    } catch {}
    return DEFAULT_FORM;
  });

  // Persist to localStorage when form changes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const pd = useMemo(() => computePD(form), [form]);

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const reset = () => setForm(DEFAULT_FORM);

  const value: PdContextValue = { form, setForm, setField, pd, reset };

  return <PdContext.Provider value={value}>{children}</PdContext.Provider>;
}

export function usePd() {
  const ctx = useContext(PdContext);
  if (!ctx) throw new Error("usePd must be used within PdProvider");
  return ctx;
}
