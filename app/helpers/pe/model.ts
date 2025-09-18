import { mapGarantia } from "../pd/model";

export const PE_SCHEMA = [
  {
    Categoria: "pd",
  },
  {
    Categoria: "lgd",
    variable: {
      Rangos: [
        { Rango: mapGarantia.Hipoteca, Ponderador: 15 },
        { Rango: mapGarantia["Prendaria/Prenda"], Ponderador: 30 },
        { Rango: mapGarantia["Sin garantía"], Ponderador: 80 },
      ],
    },
  },
  {
    Categoria: "ead",
  },
];

type RangoDef = { Rango: string; Ponderador: string };
type SchemaItem = {
  Categoria: string;
  variable?: { Rangos: RangoDef[] };
};

function getSchemaByCategoria(key: string): SchemaItem | undefined {
  return PE_SCHEMA.find(
    (c) => (c as SchemaItem).Categoria.toLowerCase() === key.toLowerCase()
  ) as SchemaItem | undefined;
}

type GarantiaKey = keyof typeof mapGarantia;        // "Hipoteca" | "Prendaria/Prenda" | "Sin garantía"
type GarantiaValue = typeof mapGarantia[GarantiaKey]; // 0 | 1 | 6
export const evalLGD = (key: GarantiaKey): number => {
    const value: GarantiaValue = mapGarantia[key];

    const schema = getSchemaByCategoria("lgd");
    const rangos = schema?.variable?.Rangos ?? [];
    const rango = rangos.find((r) => Number(r.Rango) === value);
  
    return rango?.Ponderador ? Number(rango.Ponderador) : 0;
};
