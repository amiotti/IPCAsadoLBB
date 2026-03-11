export type DashboardRow = {
  productId: string;
  codigo: string;
  producto: string;
  categoria: string;
  qty: number;
  um: string;
  precioActual: number;
  subtotalActual: number;
  precioMesAnterior: number | null;
  precioEnero: number | null;
  variacionMensualPct: number | null;
  variacionAcumuladaPct: number | null;
  ultimoHistorico: number | null;
  scrapingStatus: string;
};

export type DashboardSummary = {
  totalCanasta: number;
  totalMesAnterior: number | null;
  totalEnero: number | null;
  variacionVsMesAnteriorPct: number | null;
  variacionVsEneroPct: number | null;
  costoPorComensal: number;
  productoMayorSuba: string | null;
  categoriaMayorIncidencia: string | null;
};

export type DashboardSnapshotView = {
  resumen: DashboardSummary;
  categoriaIncidencia: Array<{
    categoria: string;
    subtotal: number;
    incidenciaPct: number;
  }>;
  rows: DashboardRow[];
  insights: string[];
};

export type SnapshotOption = {
  key: string;
  label: string;
  anio: number | null;
  mes: number | null;
  isActual: boolean;
};

export type DashboardData = {
  actualizadoAt: string | null;
  snapshotVigente: string | null;
  resumen: DashboardSummary;
  categoriaIncidencia: Array<{
    categoria: string;
    subtotal: number;
    incidenciaPct: number;
  }>;
  rows: DashboardRow[];
  serieMensual: Array<{
    anio: number;
    mes: number;
    total: number;
    indiceBase100: number;
  }>;
  serieVariacionMensual: Array<{
    anio: number;
    mes: number;
    variacionPct: number | null;
    isActual: boolean;
  }>;
  snapshotOptions: SnapshotOption[];
  selectedSnapshotKey: string;
  viewsBySnapshot: Record<string, DashboardSnapshotView>;
  insights: string[];
};
