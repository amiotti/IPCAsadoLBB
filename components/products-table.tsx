"use client";

import { useMemo, useState } from "react";
import { formatArs } from "@/lib/helpers";
import type { DashboardRow } from "@/lib/types";

type Props = {
  rows: DashboardRow[];
  periodLabel: string;
};

function statusClass(status: string) {
  if (status === "ok") return "status-ok";
  return "status-alert";
}

export function ProductsTable({ rows, periodLabel }: Props) {
  const [query, setQuery] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  const categorias = useMemo(
    () => ["Todos", ...Array.from(new Set(rows.map((r) => r.categoria)))],
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchQuery =
          query.length === 0 ||
          r.producto.toLowerCase().includes(query.toLowerCase()) ||
          r.codigo.includes(query);
        const matchCat = categoria === "Todos" || r.categoria === categoria;
        return matchQuery && matchCat;
      }),
    [rows, query, categoria]
  );

  return (
    <section className="table-shell reveal">
      <div className="panel-inner p-4">
        <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display), serif" }}>
            Productos y comparativas ({periodLabel})
          </h2>
          <div className="flex flex-col gap-2 md:flex-row">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o codigo"
              className="rounded-xl border border-black/20 bg-white/75 px-3 py-2 text-sm"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="rounded-xl border border-black/20 bg-white/75 px-3 py-2 text-sm"
            >
              {categorias.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-2">Producto</th>
                <th className="px-4 py-2">Codigo</th>
                <th className="px-4 py-2">Categoria</th>
                <th className="px-4 py-2">Cantidad</th>
                <th className="px-4 py-2">Precio periodo</th>
                <th className="px-4 py-2">Mes anterior</th>
                <th className="px-4 py-2">Subtotal</th>
                <th className="px-4 py-2">Var. mensual</th>
                <th className="px-4 py-2">Var. vs base</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="table-body bg-white/40">
              {filtered.map((row) => (
                <tr key={row.productId}>
                  <td className="px-4 py-3 font-medium">{row.producto}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://www.lagallega.com.ar/productosdet.asp?Pr=${row.codigo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                    >
                      {row.codigo}
                    </a>
                  </td>
                  <td className="px-4 py-3">{row.categoria}</td>
                  <td className="px-4 py-3">
                    {row.qty} {row.um}
                  </td>
                  <td className="px-4 py-3">{formatArs(row.precioActual)}</td>
                  <td className="px-4 py-3">
                    {row.precioMesAnterior === null ? "-" : formatArs(row.precioMesAnterior)}
                  </td>
                  <td className="px-4 py-3">{formatArs(row.subtotalActual)}</td>
                  <td
                    className={`px-4 py-3 ${
                      (row.variacionMensualPct ?? 0) >= 0 ? "text-bad" : "text-ok"
                    }`}
                  >
                    {row.variacionMensualPct === null ? "-" : `${row.variacionMensualPct.toFixed(2)}%`}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      (row.variacionAcumuladaPct ?? 0) >= 0 ? "text-bad" : "text-ok"
                    }`}
                  >
                    {row.variacionAcumuladaPct === null ? "-" : `${row.variacionAcumuladaPct.toFixed(2)}%`}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-pill ${statusClass(row.scrapingStatus)}`}>{row.scrapingStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
