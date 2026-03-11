"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DashboardCharts } from "@/components/dashboard-charts";
import { KpiCard } from "@/components/kpi-card";
import { ProductsTable } from "@/components/products-table";
import { formatArs } from "@/lib/helpers";
import { getProductIconByCode, getUiIcon } from "@/lib/product-icons";
import type { DashboardData } from "@/lib/types";

type Props = {
  data: DashboardData;
};

function pct(value: number | null) {
  return value === null ? "-" : `${value.toFixed(2)}%`;
}

export function DashboardClient({ data }: Props) {
  const [selectedSnapshotKey, setSelectedSnapshotKey] = useState(data.selectedSnapshotKey);

  const selectedOption = useMemo(
    () => data.snapshotOptions.find((opt) => opt.key === selectedSnapshotKey) ?? data.snapshotOptions[data.snapshotOptions.length - 1],
    [data.snapshotOptions, selectedSnapshotKey]
  );

  const selectedView = data.viewsBySnapshot[selectedOption.key] ?? data.viewsBySnapshot.actual;
  const beerIcon = getUiIcon("beer");
  const moneyIcon = getUiIcon("money");
  const rowMayorSuba = selectedView.rows.find((row) => row.producto === selectedView.resumen.productoMayorSuba);
  const mayorSubaIcon = rowMayorSuba ? getProductIconByCode(rowMayorSuba.codigo) : null;

  return (
    <main className="ipc-shell space-y-6 py-6">
      <header className="panel reveal">
        <div className="panel-inner p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="hero-tag">IPC Asados LBB</span>
              <h1 className="hero-title mt-3">
                <span>Evolucion del Indice de </span>
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span>Asados LBB</span>
                  {beerIcon ? <img src={beerIcon} alt="Cerveza" className="icon-inline icon-hero" /> : null}
                </span>
              </h1>
              <p className="page-subtle mt-3 text-base">
                Seguimiento mensual del costo de una canasta para 10 personas, con captura historica y precio actual por scraping.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="chip">
                Ultima actualizacion: {data.actualizadoAt ? new Date(data.actualizadoAt).toLocaleString("es-AR") : "-"}
              </span>
              <div className="chip flex items-center gap-2">
                <span>Periodo:</span>
                <select
                  value={selectedSnapshotKey}
                  onChange={(e) => setSelectedSnapshotKey(e.target.value)}
                  className="rounded-lg border border-black/20 bg-white/90 px-2 py-1 text-sm"
                >
                  {data.snapshotOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <Link href="/historico" className="chip hover:bg-white/95">
                Ver historico
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Total canasta periodo"
          value={
            <span className="inline-flex items-center gap-2">
              {formatArs(selectedView.resumen.totalCanasta)}
              {moneyIcon ? <img src={moneyIcon} alt="Dinero" className="icon-inline" /> : null}
            </span>
          }
        />
        <KpiCard
          label="Variacion vs mes anterior"
          value={pct(selectedView.resumen.variacionVsMesAnteriorPct)}
          trend={selectedView.resumen.variacionVsMesAnteriorPct}
        />
        <KpiCard
          label="Variacion acumulada vs enero"
          value={pct(selectedView.resumen.variacionVsEneroPct)}
          trend={selectedView.resumen.variacionVsEneroPct}
        />
        <KpiCard
          label="Costo por comensal"
          value={
            <span className="inline-flex items-center gap-2">
              {formatArs(selectedView.resumen.costoPorComensal)}
              {moneyIcon ? <img src={moneyIcon} alt="Dinero" className="icon-inline" /> : null}
            </span>
          }
        />
        <KpiCard
          label="Producto con mayor suba"
          value={
            <span className="inline-flex items-center gap-2">
              <span>{selectedView.resumen.productoMayorSuba ?? "-"}</span>
              {mayorSubaIcon ? <img src={mayorSubaIcon} alt="Producto" className="icon-inline" /> : null}
            </span>
          }
        />
        <KpiCard label="Categoria con mayor incidencia" value={selectedView.resumen.categoriaMayorIncidencia ?? "-"} />
      </section>

      <DashboardCharts
        rows={selectedView.rows}
        categoriaIncidencia={selectedView.categoriaIncidencia}
        serieMensual={data.serieMensual}
        serieVariacionMensual={data.serieVariacionMensual}
        selectedSnapshotKey={selectedOption.key}
      />

      <section className="panel reveal" style={{ animationDelay: "220ms" }}>
        <div className="panel-inner p-5 sm:p-6">
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display), serif" }}>
            Insights automaticos
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {selectedView.insights.map((insight, index) => (
              <article key={insight} className="rounded-2xl border border-black/10 bg-white/65 p-4 reveal" style={{ animationDelay: `${280 + index * 40}ms` }}>
                <p className="text-sm text-black/75">{insight}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ProductsTable rows={selectedView.rows} periodLabel={selectedOption.label} />
    </main>
  );
}
