"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { MESES } from "@/lib/constants";
import { formatArs } from "@/lib/helpers";
import { getProductIconByCode } from "@/lib/product-icons";
import type { DashboardRow, DashboardData } from "@/lib/types";

type Props = {
  rows: DashboardRow[];
  categoriaIncidencia: DashboardData["categoriaIncidencia"];
  serieMensual: DashboardData["serieMensual"];
  serieVariacionMensual: DashboardData["serieVariacionMensual"];
  selectedSnapshotKey: string;
};

type MonthPoint = {
  label: string;
  total: number;
};

function formatArsAxis(value: number) {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(0)}k`;
  }
  return `$${value.toFixed(0)}`;
}

const CAT_COLORS: Record<string, string> = {
  Bebida: "#fb923c",
  Carne: "#ef4444",
  Guarnicion: "#10b981",
  Picada: "#6366f1"
};
const MESES_COMPLETOS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

function monthLabel(anio: number, mes: number) {
  return `${MESES[mes - 1]} ${anio}`;
}

function parseSnapshotKey(snapshotKey: string) {
  if (snapshotKey === "actual") return null;
  const [anioRaw, mesRaw] = snapshotKey.split("-");
  return { anio: Number(anioRaw), mes: Number(mesRaw) };
}

function isBeforeOrEqual(anio: number, mes: number, target: { anio: number; mes: number } | null) {
  if (!target) return true;
  if (anio < target.anio) return true;
  if (anio > target.anio) return false;
  return mes <= target.mes;
}

function ProductBarShape(props: any) {
  const { x, y, width, height, payload, iconSize = 28 } = props;
  const href = getProductIconByCode(payload?.codigo);
  const value = Number(payload?.variacionPct ?? 0);
  let color = "#a1a1aa";
  if (value > 0) color = "#ef4444";
  if (value < 0) color = "#16a34a";

  const rectY = height >= 0 ? y : y + height;
  const rectH = Math.abs(height);
  const centerX = x + width / 2;
  const endY = value >= 0 ? rectY + 2 : rectY + rectH - (iconSize + 2);
  return (
    <g>
      <rect x={x} y={rectY} width={width} height={rectH} rx={8} ry={8} fill={color} />
      {href ? (
        <image
          href={href}
          xlinkHref={href}
          x={centerX - iconSize / 2}
          y={endY}
          width={iconSize}
          height={iconSize}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
    </g>
  );
}

export function DashboardCharts({
  rows,
  categoriaIncidencia,
  serieMensual,
  serieVariacionMensual,
  selectedSnapshotKey
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 768);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const selectedMonth = parseSnapshotKey(selectedSnapshotKey);
  const now = new Date();

  const serieTotal: MonthPoint[] = serieMensual
    .filter((row) => isBeforeOrEqual(row.anio, row.mes, selectedMonth))
    .map((row) => ({
    label: monthLabel(row.anio, row.mes),
    total: row.total
  }));

  const axisYear = selectedMonth?.anio ?? now.getFullYear();
  const lastMonthToShow = selectedMonth?.mes ?? (now.getMonth() + 1);
  const variationMap = new Map<number, number | null>();
  for (const row of serieVariacionMensual) {
    if (row.anio !== axisYear) continue;
    if (row.mes > lastMonthToShow) continue;
    variationMap.set(row.mes, row.variacionPct);
  }
  const serieVariacion = MESES_COMPLETOS.map((label, idx) => {
    const mes = idx + 1;
    return {
      label,
      variacionPct: mes > lastMonthToShow ? null : (variationMap.get(mes) ?? null),
      isActual: selectedSnapshotKey === "actual" && mes === lastMonthToShow
    };
  });

  const productBars = rows.map((r) => ({
    codigo: String(r.codigo),
    nombre: r.producto,
    variacionPct: r.variacionMensualPct ?? 0
  }));
  const iconSize = isMobile ? 16 : 28;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="chart-panel reveal">
        <div className="panel-inner">
          <h3 className="chart-title">Evolucion del total de canasta</h3>
          <div className="h-[280px] sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serieTotal} margin={{ top: 8, right: 16, left: 4, bottom: isMobile ? 22 : 8 }}>
                <defs>
                  <linearGradient id="lineTotal" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,0,0,0.15)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={isMobile ? "preserveStartEnd" : 0}
                  minTickGap={isMobile ? 28 : 8}
                />
                <YAxis
                  tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={isMobile ? 54 : 66}
                  domain={["dataMin - 5000", "dataMax + 5000"]}
                  tickFormatter={formatArsAxis}
                />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.94)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff"
                  }}
                  formatter={(v: number) => formatArs(v)}
                />
                <Line type="monotone" dataKey="total" stroke="url(#lineTotal)" strokeWidth={4} className="sparkline" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>

      <article className="chart-panel reveal" style={{ animationDelay: "80ms" }}>
        <div className="panel-inner">
          <h3 className="chart-title">Variacion mensual total (%)</h3>
          <div className="h-[300px] sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serieVariacion} margin={{ top: 8, right: 16, left: 4, bottom: isMobile ? 34 : 24 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,0,0,0.12)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }}
                  tickLine={false}
                  axisLine={false}
                  angle={isMobile ? 0 : -20}
                  textAnchor={isMobile ? "middle" : "end"}
                  interval={isMobile ? 1 : 0}
                  height={isMobile ? 36 : 56}
                />
                <YAxis tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }} tickLine={false} axisLine={false} unit="%" width={isMobile ? 36 : 48} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.94)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff"
                  }}
                  formatter={(v: unknown) => (v == null ? "-" : `${Number(v).toFixed(2)}%`)}
                />
                <Bar dataKey="variacionPct" radius={[8, 8, 0, 0]}>
                  {serieVariacion.map((entry) => {
                    let color = "#a1a1aa";
                    if ((entry.variacionPct ?? 0) > 0) color = "#ef4444";
                    if ((entry.variacionPct ?? 0) < 0) color = "#16a34a";
                    if (entry.isActual) color = "#0ea5e9";
                    return <Cell key={entry.label} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>

      <article className="chart-panel reveal" style={{ animationDelay: "120ms" }}>
        <div className="panel-inner">
          <h3 className="chart-title">Incidencia por categoria</h3>
          <div className="h-[340px] sm:h-[560px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriaIncidencia} margin={{ top: 8, right: 16, left: 8, bottom: isMobile ? 44 : 90 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,0,0,0.12)" />
                <XAxis
                  dataKey="categoria"
                  tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }}
                  tickLine={false}
                  axisLine={false}
                  angle={isMobile ? 0 : -35}
                  textAnchor={isMobile ? "middle" : "end"}
                  height={isMobile ? 44 : 100}
                />
                <YAxis tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }} tickLine={false} axisLine={false} unit="%" width={isMobile ? 36 : 48} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.94)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff"
                  }}
                  formatter={(v: number) => `${Number(v).toFixed(2)}%`}
                />
                <Bar dataKey="incidenciaPct" radius={[8, 8, 0, 0]}>
                  {categoriaIncidencia.map((item) => (
                    <Cell key={item.categoria} fill={CAT_COLORS[item.categoria] ?? "#a1a1aa"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>

      <article className="chart-panel reveal" style={{ animationDelay: "160ms" }}>
        <div className="panel-inner">
          <h3 className="chart-title">Variacion mensual por producto (%)</h3>
          <div className="h-[360px] sm:h-[560px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productBars} margin={{ top: 8, right: 16, left: 8, bottom: isMobile ? 52 : 90 }}>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(0,0,0,0.12)" />
                <XAxis
                  dataKey="nombre"
                  tick={{ fill: "#3f3f46", fontSize: isMobile ? 9 : 11 }}
                  tickFormatter={(v) => {
                    if (!isMobile) return v;
                    const text = String(v);
                    return text.length > 7 ? `${text.slice(0, 7)}…` : text;
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={isMobile ? -20 : -35}
                  textAnchor="end"
                  height={isMobile ? 58 : 100}
                />
                <YAxis tick={{ fill: "#3f3f46", fontSize: isMobile ? 10 : 11 }} tickLine={false} axisLine={false} unit="%" width={isMobile ? 36 : 48} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.94)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff"
                  }}
                  formatter={(v: number) => `${Number(v).toFixed(2)}%`}
                />
                <Bar dataKey="variacionPct" shape={(props: any) => <ProductBarShape {...props} iconSize={iconSize} />} minPointSize={4}>
                  {productBars.map((entry) => (
                    <Cell key={entry.nombre} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>
    </section>
  );
}

