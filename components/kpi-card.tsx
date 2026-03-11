"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: number | null;
};

function trendLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  const arrow = value >= 0 ? "↗" : "↘";
  const cls = value >= 0 ? "metric-trend-positive" : "metric-trend-negative";
  return <span className={cls}>{`${arrow} ${Math.abs(value).toFixed(2)}%`}</span>;
}

export function KpiCard({ label, value, hint, trend }: Props) {
  const valueClass =
    trend === null || trend === undefined
      ? "metric-value"
      : trend >= 0
        ? "metric-value metric-value-positive"
        : "metric-value metric-value-negative";

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      viewport={{ once: true }}
      className="glass-kpi reveal"
    >
      <p className="metric-label">{label}</p>
      <p className={valueClass}>{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {trendLabel(trend)}
        {hint ? <span className="metric-sub">{hint}</span> : null}
      </div>
    </motion.article>
  );
}
