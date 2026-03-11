import Link from "next/link";
import { MESES } from "@/lib/constants";
import { getHistoryData } from "@/lib/dashboard";
import { formatArs } from "@/lib/helpers";

export const revalidate = 0;

export default async function HistoricoPage() {
  const rows = await getHistoryData();
  const grouped = new Map<string, Record<string, number | null>>();

  rows.forEach((row) => {
    const key = `${row.codigo} - ${row.producto}`;
    const prev = grouped.get(key) ?? {};
    prev[`${row.anio}-${row.mes}`] = row.precioUnitario;
    grouped.set(key, prev);
  });

  const meses = Array.from(new Set(rows.map((r) => `${r.anio}-${r.mes}`))).sort();

  return (
    <main className="ipc-shell space-y-6 py-6">
      <header className="panel reveal">
        <div className="panel-inner p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="hero-tag">IPC Asados LBB</span>
              <h1 className="hero-title mt-3">Historico mensual por producto</h1>
              <p className="page-subtle mt-2">Matriz real persistida en base propia, sin estimar meses futuros.</p>
            </div>
            <Link href="/" className="chip hover:bg-white/95">
              Volver al dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="table-shell reveal">
        <div className="panel-inner p-4">
          <h2 className="text-2xl font-black" style={{ fontFamily: "var(--font-display), serif" }}>
            Matriz producto x mes
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="table-head">
                <tr className="border-b border-black/10">
                  <th className="px-3 py-2 text-left">Producto</th>
                  {meses.map((ym) => {
                    const [y, m] = ym.split("-");
                    return (
                      <th key={ym} className="px-3 py-2 text-left">
                        {MESES[Number(m) - 1]} {y}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="table-body bg-white/40">
                {Array.from(grouped.entries()).map(([product, values]) => (
                  <tr key={product}>
                    <td className="px-3 py-2 font-medium">{product}</td>
                    {meses.map((ym) => (
                      <td key={ym} className="px-3 py-2">
                        {values[ym] == null ? "Sin dato" : formatArs(values[ym] as number)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
