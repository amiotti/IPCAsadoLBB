import { prisma } from "./db";
import { BASE_ANIO, BASE_LABEL, BASE_MES } from "./constants";
import {
  buildMonthlyIndexSeries,
  buildProductVariationRanking,
  calcBasketTotals,
  calcCategoryIncidence,
  calcMonthlyVariation
} from "./helpers";
import type {
  DashboardData,
  DashboardRow,
  DashboardSnapshotView,
  SnapshotOption
} from "./types";

type ProductWithData = {
  id: string;
  codigo: string;
  nombreBase: string;
  nombreActual: string | null;
  categoria: string;
  qty: number;
  um: string;
  currentPrice: {
    precioUnitario: number;
    status: string;
    scrapedAt: Date;
  } | null;
  snapshots: Array<{
    anio: number;
    mes: number;
    precioUnitario: number;
    status: string;
  }>;
};

function ymNow() {
  const d = new Date();
  return { anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
}

function prevMonth(anio: number, mes: number) {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

function monthKey(anio: number, mes: number) {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

function monthLabel(anio: number, mes: number) {
  const fullMonths = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  return `${fullMonths[mes - 1]} ${anio}`;
}

function monthDiff(anioA: number, mesA: number, anioB: number, mesB: number) {
  return (anioA - anioB) * 12 + (mesA - mesB);
}

function computeCumulativeVariationFromBase(
  endAnio: number,
  endMes: number,
  getMonthValue: (anio: number, mes: number) => number | null
) {
  if (monthDiff(endAnio, endMes, BASE_ANIO, BASE_MES) < 0) return null;

  let sum = 0;
  let hasAny = false;
  let y = BASE_ANIO;
  let m = BASE_MES;

  while (monthDiff(y, m, endAnio, endMes) <= 0) {
    const prevYm = prevMonth(y, m);
    const curr = getMonthValue(y, m);
    const prev = getMonthValue(prevYm.anio, prevYm.mes);
    if (curr != null && prev != null && prev !== 0) {
      sum += ((curr - prev) / prev) * 100;
      hasAny = true;
    }
    if (m === 12) {
      y += 1;
      m = 1;
    } else {
      m += 1;
    }
  }

  return hasAny ? sum : null;
}

function generateDashboardInsights(view: DashboardSnapshotView): string[] {
  const insights: string[] = [];
  if (view.resumen.productoMayorSuba) {
    insights.push(`Mayor suba mensual: ${view.resumen.productoMayorSuba}.`);
  }
  if (view.resumen.categoriaMayorIncidencia) {
    insights.push(`Categoria con mayor peso actual: ${view.resumen.categoriaMayorIncidencia}.`);
  }
  if (view.resumen.variacionVsEneroPct !== null) {
    insights.push(`Suba acumulada vs ${BASE_LABEL}: ${view.resumen.variacionVsEneroPct.toFixed(2)}%.`);
  }
  const invalidCount = view.rows.filter((r) => r.scrapingStatus !== "ok").length;
  if (invalidCount > 0) {
    insights.push(`Hay ${invalidCount} productos con scraping no valido en precio del periodo.`);
  }
  return insights;
}

function buildSnapshotView(
  products: ProductWithData[],
  selected: SnapshotOption,
  baseKey: string,
  actualPrevKey: string | null,
  currentYm: { anio: number; mes: number }
): DashboardSnapshotView {
  const selectedKey = selected.isActual
    ? "actual"
    : monthKey(selected.anio as number, selected.mes as number);

  const previousForSelected = selected.isActual
    ? actualPrevKey
    : (() => {
        const p = prevMonth(selected.anio as number, selected.mes as number);
        return monthKey(p.anio, p.mes);
      })();

  const rows: DashboardRow[] = products.map((p) => {
    const snapshotsByKey = new Map(
      p.snapshots.map((s) => [monthKey(s.anio, s.mes), s])
    );

    const selectedSnapshot = snapshotsByKey.get(selectedKey);
    const prevSnapshot = selected.isActual
      ? (previousForSelected ? (snapshotsByKey.get(previousForSelected) ?? null) : null)
      : (previousForSelected ? (snapshotsByKey.get(previousForSelected) ?? null) : null);
    const baseSnapshot = snapshotsByKey.get(baseKey) ?? null;
    const fallbackActualSnapshot = previousForSelected ? (snapshotsByKey.get(previousForSelected) ?? null) : null;
    const currentScrapedAt = p.currentPrice?.scrapedAt ?? null;
    const hasCurrentMonthPrice = Boolean(
      currentScrapedAt &&
      currentScrapedAt.getUTCFullYear() === currentYm.anio &&
      currentScrapedAt.getUTCMonth() + 1 === currentYm.mes
    );

    const effectiveActualPrice =
      hasCurrentMonthPrice
        ? (p.currentPrice?.precioUnitario ?? null)
        : (fallbackActualSnapshot?.precioUnitario ?? p.currentPrice?.precioUnitario ?? null);

    const effectiveActualStatus =
      hasCurrentMonthPrice
        ? (p.currentPrice?.status ?? "no_encontrado")
        : (fallbackActualSnapshot?.status ?? p.currentPrice?.status ?? "no_encontrado");

    const selectedPrice = selected.isActual
      ? (effectiveActualPrice ?? 0)
      : (selectedSnapshot?.precioUnitario ?? 0);

    const selectedStatus = selected.isActual
      ? effectiveActualStatus
      : (selectedSnapshot?.status ?? "no_encontrado");

    const subtotal = selectedPrice * p.qty;
    const variacionMensualPct = calcMonthlyVariation(selectedPrice, prevSnapshot?.precioUnitario ?? null);

    const getProductValueByMonth = (anio: number, mes: number) => {
      if (
        selected.isActual &&
        anio === currentYm.anio &&
        mes === currentYm.mes
      ) {
        return effectiveActualPrice;
      }
      return snapshotsByKey.get(monthKey(anio, mes))?.precioUnitario ?? null;
    };
    const endYm = selected.isActual
      ? currentYm
      : { anio: selected.anio as number, mes: selected.mes as number };
    const variacionAcumuladaPct = computeCumulativeVariationFromBase(
      endYm.anio,
      endYm.mes,
      getProductValueByMonth
    );

    const ultimoHistorico = p.snapshots
      .slice()
      .sort((a, b) => (b.anio - a.anio) || (b.mes - a.mes))[0]?.precioUnitario ?? null;

    return {
      productId: p.id,
      codigo: p.codigo,
      producto: p.nombreActual ?? p.nombreBase,
      categoria: p.categoria,
      qty: p.qty,
      um: p.um,
      precioActual: selectedPrice,
      subtotalActual: subtotal,
      precioMesAnterior: prevSnapshot?.precioUnitario ?? null,
      precioEnero: baseSnapshot?.precioUnitario ?? null,
      variacionMensualPct,
      variacionAcumuladaPct,
      ultimoHistorico,
      scrapingStatus: selectedStatus
    };
  });

  const totals = calcBasketTotals(rows.map((r) => r.subtotalActual));
  const totalMesAnterior = rows.reduce((acc, row) => {
    if (row.precioMesAnterior === null) return acc;
    return acc + row.precioMesAnterior * row.qty;
  }, 0);
  const totalEnero = rows.reduce((acc, row) => {
    if (row.precioEnero === null) return acc;
    return acc + row.precioEnero * row.qty;
  }, 0);

  const ranking = buildProductVariationRanking(
    rows.map((row) => ({
      producto: row.producto,
      actual: row.precioActual,
      anterior: row.precioMesAnterior
    }))
  );

  const categoriaIncidencia = calcCategoryIncidence(
    rows.map((row) => ({ categoria: row.categoria, subtotal: row.subtotalActual }))
  );

  const categoriaMayorIncidencia =
    categoriaIncidencia.slice().sort((a, b) => b.incidenciaPct - a.incidenciaPct)[0]?.categoria ?? null;

  const view: DashboardSnapshotView = {
    resumen: {
      totalCanasta: totals.totalCanasta,
      totalMesAnterior: totalMesAnterior > 0 ? totalMesAnterior : null,
      totalEnero: totalEnero > 0 ? totalEnero : null,
      variacionVsMesAnteriorPct: totalMesAnterior
        ? calcMonthlyVariation(totals.totalCanasta, totalMesAnterior)
        : null,
      variacionVsEneroPct: null,
      costoPorComensal: totals.costoPorComensal,
      productoMayorSuba: ranking[0]?.producto ?? null,
      categoriaMayorIncidencia
    },
    categoriaIncidencia,
    rows,
    insights: []
  };

  view.insights = generateDashboardInsights(view);
  return view;
}

export async function getDashboardData(): Promise<DashboardData> {
  const { anio, mes } = ymNow();
  const prev = prevMonth(anio, mes);
  const basePrev = prevMonth(BASE_ANIO, BASE_MES);

  const products = (await prisma.product.findMany({
    where: { activo: true },
    include: {
      currentPrice: true,
      snapshots: {
        where: {
          OR: [
            { anio: { gt: basePrev.anio } },
            { anio: basePrev.anio, mes: { gte: basePrev.mes } }
          ]
        }
      }
    },
    orderBy: [{ categoria: "asc" }, { nombreBase: "asc" }]
  })) as ProductWithData[];

  const availableMonths = new Map<string, { anio: number; mes: number }>();
  for (const product of products) {
    for (const s of product.snapshots) {
      availableMonths.set(monthKey(s.anio, s.mes), { anio: s.anio, mes: s.mes });
    }
  }

  const monthOptions = Array.from(availableMonths.values())
    .filter((m) => m.anio > BASE_ANIO || (m.anio === BASE_ANIO && m.mes >= BASE_MES))
    .sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));

  const snapshotOptions: SnapshotOption[] = [
    ...monthOptions.map((m) => ({
      key: monthKey(m.anio, m.mes),
      label: monthLabel(m.anio, m.mes),
      anio: m.anio,
      mes: m.mes,
      isActual: false
    })),
    {
      key: "actual",
      label: "Actual",
      anio: null,
      mes: null,
      isActual: true
    }
  ];

  const baseKey = monthKey(BASE_ANIO, BASE_MES);
  const latestClosedBeforeCurrent = monthOptions
    .filter((m) => (m.anio < anio) || (m.anio === anio && m.mes < mes))
    .at(-1);
  const actualPrevKey = latestClosedBeforeCurrent
    ? monthKey(latestClosedBeforeCurrent.anio, latestClosedBeforeCurrent.mes)
    : null;
  const fallbackClosedMonthKey =
    monthOptions.length > 0
      ? monthKey(monthOptions[monthOptions.length - 1].anio, monthOptions[monthOptions.length - 1].mes)
      : "actual";
  const defaultSnapshotKey =
    actualPrevKey && snapshotOptions.some((opt) => opt.key === actualPrevKey)
      ? actualPrevKey
      : fallbackClosedMonthKey;

  const viewsBySnapshot = Object.fromEntries(
    snapshotOptions.map((opt) => [
      opt.key,
      buildSnapshotView(products, opt, baseKey, actualPrevKey, { anio, mes })
    ])
  );

  const actualView = viewsBySnapshot.actual;
  const initialView = viewsBySnapshot[defaultSnapshotKey] ?? actualView;

  const qtyMap = new Map(products.map((p) => [p.id, p.qty]));
  const grouped = new Map<string, number>();
  for (const p of products) {
    for (const s of p.snapshots) {
      const key = monthKey(s.anio, s.mes);
      const prevValue = grouped.get(key) ?? 0;
      grouped.set(key, prevValue + s.precioUnitario * (qtyMap.get(p.id) ?? 0));
    }
  }

  const monthlyTotals = Array.from(grouped.entries())
    .map(([key, total]) => {
      const [y, m] = key.split("-");
      return { anio: Number(y), mes: Number(m), total };
    })
    .sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));

  const monthlyTotalsForCharts = monthlyTotals.filter((row) =>
    row.anio > BASE_ANIO || (row.anio === BASE_ANIO && row.mes >= BASE_MES)
  );

  const serieMensual = buildMonthlyIndexSeries(monthlyTotalsForCharts);

  const totalByKey = new Map<string, number>(
    monthlyTotals.map((row) => [monthKey(row.anio, row.mes), row.total])
  );

  const totalsForVariation = monthlyTotalsForCharts.slice();
  const currentTotal = actualView?.resumen.totalCanasta ?? 0;
  const currentIdx = totalsForVariation.findIndex((r) => r.anio === anio && r.mes === mes);
  if (currentIdx >= 0) {
    totalsForVariation[currentIdx] = { anio, mes, total: currentTotal };
  } else {
    totalsForVariation.push({ anio, mes, total: currentTotal });
    totalsForVariation.sort((a, b) => (a.anio - b.anio) || (a.mes - b.mes));
  }

  const serieVariacionMensual = totalsForVariation.map((row) => {
    const prevYm = prevMonth(row.anio, row.mes);
    const prevTotal = totalByKey.get(monthKey(prevYm.anio, prevYm.mes));
    return {
      anio: row.anio,
      mes: row.mes,
      variacionPct: prevTotal == null ? null : calcMonthlyVariation(row.total, prevTotal),
      isActual: row.anio === anio && row.mes === mes
    };
  });

  const cumulativeByKey = new Map<string, number | null>();
  let running = 0;
  let hasAny = false;
  for (const row of serieVariacionMensual) {
    if (row.variacionPct != null) {
      running += row.variacionPct;
      hasAny = true;
    }
    cumulativeByKey.set(
      monthKey(row.anio, row.mes),
      hasAny ? running : null
    );
  }

  for (const option of snapshotOptions) {
    const view = viewsBySnapshot[option.key];
    if (!view) continue;
    if (option.isActual) {
      view.resumen.variacionVsEneroPct =
        cumulativeByKey.get(monthKey(anio, mes)) ?? null;
    } else {
      view.resumen.variacionVsEneroPct =
        cumulativeByKey.get(monthKey(option.anio as number, option.mes as number)) ?? null;
    }
  }

  const snapshotVigente = monthlyTotalsForCharts.length
    ? monthlyTotalsForCharts[monthlyTotalsForCharts.length - 1]
    : null;

  const latestUpdate = await prisma.currentPrice.findFirst({
    orderBy: { scrapedAt: "desc" },
    select: { scrapedAt: true }
  });

  return {
    actualizadoAt: latestUpdate?.scrapedAt.toISOString() ?? null,
    snapshotVigente: snapshotVigente ? `${snapshotVigente.mes}/${snapshotVigente.anio}` : null,
    resumen: initialView.resumen,
    categoriaIncidencia: initialView.categoriaIncidencia,
    rows: initialView.rows,
    serieMensual,
    serieVariacionMensual,
    snapshotOptions,
    selectedSnapshotKey: defaultSnapshotKey,
    viewsBySnapshot,
    insights: initialView.insights
  };
}

export async function getHistoryData() {
  const rows = await prisma.monthlySnapshot.findMany({
    include: { product: true },
    orderBy: [{ anio: "asc" }, { mes: "asc" }]
  });

  return rows.map((row) => ({
    codigo: row.product.codigo,
    producto: row.product.nombreBase,
    categoria: row.product.categoria,
    anio: row.anio,
    mes: row.mes,
    precioUnitario: row.precioUnitario,
    status: row.status
  }));
}

export function getEmptyDashboardData(): DashboardData {
  const emptyView: DashboardSnapshotView = {
    resumen: {
      totalCanasta: 0,
      totalMesAnterior: null,
      totalEnero: null,
      variacionVsMesAnteriorPct: null,
      variacionVsEneroPct: null,
      costoPorComensal: 0,
      productoMayorSuba: null,
      categoriaMayorIncidencia: null
    },
    categoriaIncidencia: [],
    rows: [],
    insights: ["No hay datos disponibles. Verifica la conexion de base de datos o el scraping."]
  };

  return {
    actualizadoAt: null,
    snapshotVigente: null,
    resumen: emptyView.resumen,
    categoriaIncidencia: emptyView.categoriaIncidencia,
    rows: emptyView.rows,
    serieMensual: [],
    serieVariacionMensual: [],
    snapshotOptions: [
      {
        key: "actual",
        label: "Actual",
        anio: null,
        mes: null,
        isActual: true
      }
    ],
    selectedSnapshotKey: "actual",
    viewsBySnapshot: { actual: emptyView },
    insights: emptyView.insights
  };
}

export async function getDashboardDataSafe(): Promise<DashboardData> {
  try {
    return await getDashboardData();
  } catch (error) {
    console.error("getDashboardDataSafe error", error);
    return getEmptyDashboardData();
  }
}


