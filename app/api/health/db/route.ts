import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [products, currentPrices, snapshots] = await Promise.all([
      prisma.product.count(),
      prisma.currentPrice.count(),
      prisma.monthlySnapshot.count()
    ]);

    const latestCurrent = await prisma.currentPrice.findFirst({
      orderBy: { scrapedAt: "desc" },
      select: { scrapedAt: true }
    });

    return NextResponse.json({
      ok: true,
      products,
      currentPrices,
      snapshots,
      latestCurrent: latestCurrent?.scrapedAt?.toISOString() ?? null
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

