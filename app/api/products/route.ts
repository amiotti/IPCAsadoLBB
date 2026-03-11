import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { activo: true },
    include: { currentPrice: true, snapshots: { orderBy: [{ anio: "desc" }, { mes: "desc" }], take: 1 } },
    orderBy: [{ categoria: "asc" }, { nombreBase: "asc" }]
  });

  return NextResponse.json(
    products.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      producto: p.nombreActual ?? p.nombreBase,
      categoria: p.categoria,
      qty: p.qty,
      um: p.um,
      precioActual: p.currentPrice?.precioUnitario ?? null,
      estado: p.currentPrice?.status ?? "no_encontrado",
      ultimoHistorico: p.snapshots[0]?.precioUnitario ?? null
    }))
  );
}
