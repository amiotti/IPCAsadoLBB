import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const product = await prisma.product.findUnique({
    where: { codigo },
    include: {
      snapshots: { orderBy: [{ anio: "asc" }, { mes: "asc" }] },
      currentPrice: true
    }
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    codigo: product.codigo,
    producto: product.nombreActual ?? product.nombreBase,
    categoria: product.categoria,
    qty: product.qty,
    um: product.um,
    current: product.currentPrice,
    snapshots: product.snapshots
  });
}
