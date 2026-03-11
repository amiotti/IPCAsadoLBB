import { PERSONAS_CANASTA } from "./constants";

export function parseArPrice(input: string): number {
  const clean = input
    .replace(/\s+/g, "")
    .replace(/\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const value = Number(clean);
  if (!Number.isFinite(value)) {
    throw new Error(`No se pudo parsear precio: ${input}`);
  }
  return value;
}

export function formatArs(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
  }).format(value);
}

export function calcMonthlyVariation(actual: number, anterior: number | null): number | null {
  if (anterior === null || anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}

export function calcCategoryIncidence(rows: Array<{ categoria: string; subtotal: number }>) {
  const total = rows.reduce((acc, row) => acc + row.subtotal, 0);
  const byCategory = new Map<string, number>();
  rows.forEach((row) => {
    const prev = byCategory.get(row.categoria) ?? 0;
    byCategory.set(row.categoria, prev + row.subtotal);
  });
  return Array.from(byCategory.entries()).map(([categoria, subtotal]) => ({
    categoria,
    subtotal,
    incidenciaPct: total > 0 ? (subtotal / total) * 100 : 0
  }));
}

export function buildMonthlyIndexSeries(
  rows: Array<{ anio: number; mes: number; total: number }>
) {
  if (rows.length === 0) return [];
  const base = rows[0].total;
  return rows.map((row) => ({
    ...row,
    indiceBase100: base > 0 ? (row.total / base) * 100 : 0
  }));
}

export function buildProductVariationRanking(
  rows: Array<{ producto: string; actual: number; anterior: number | null }>
) {
  return rows
    .map((row) => ({
      ...row,
      variacionPct: calcMonthlyVariation(row.actual, row.anterior)
    }))
    .sort((a, b) => (b.variacionPct ?? -999) - (a.variacionPct ?? -999));
}

export function calcBasketTotals(subtotals: number[]) {
  const totalCanasta = subtotals.reduce((acc, n) => acc + n, 0);
  return {
    totalCanasta,
    costoPorComensal: totalCanasta / PERSONAS_CANASTA
  };
}
