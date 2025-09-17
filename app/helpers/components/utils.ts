export const fmtQ = (n: number) =>
    new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ", maximumFractionDigits: 2 }).format(n);