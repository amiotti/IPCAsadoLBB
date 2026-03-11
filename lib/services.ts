import { SnapshotOrigin, RunTrigger } from "@prisma/client";
import { prisma } from "./db";
import { scrapeProductByCode } from "./scrape";

let refreshInFlight: Promise<void> | null = null;

function nowYearMonth(date = new Date()) {
  return { anio: date.getUTCFullYear(), mes: date.getUTCMonth() + 1 };
}

function prevMonth(anio: number, mes: number) {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

function cacheHours(): number {
  const raw = Number(process.env.SCRAPE_CACHE_HOURS ?? "6");
  return Number.isFinite(raw) && raw > 0 ? raw : 6;
}

export async function refreshCurrentPrices(trigger: RunTrigger = "visit"): Promise<void> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const run = await prisma.scrapeRun.create({
      data: { trigger, status: "running" }
    });
    let itemsOk = 0;
    let itemsError = 0;
    const logs: string[] = [];

    try {
      const products = await prisma.product.findMany({
        where: { activo: true },
        orderBy: { nombreBase: "asc" }
      });

      for (const product of products) {
        const scrape = await scrapeProductByCode(product.codigo);
        const status = scrape.status;
        if (status === "ok" && scrape.precioUnitario !== null) {
          itemsOk += 1;
        } else {
          itemsError += 1;
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { nombreActual: scrape.nombre ?? null }
        });

        await prisma.currentPrice.upsert({
          where: { productId: product.id },
          update: {
            precioUnitario: scrape.precioUnitario ?? 0,
            scrapedAt: new Date(),
            sourceUrl: scrape.sourceUrl,
            status,
            rawText: scrape.rawText,
            rawHtmlSnippet: scrape.rawHtmlSnippet
          },
          create: {
            productId: product.id,
            precioUnitario: scrape.precioUnitario ?? 0,
            scrapedAt: new Date(),
            sourceUrl: scrape.sourceUrl,
            status,
            rawText: scrape.rawText,
            rawHtmlSnippet: scrape.rawHtmlSnippet
          }
        });

        logs.push(`${product.codigo}:${status}`);
      }

      await prisma.scrapeRun.update({
        where: { id: run.id },
        data: {
          endedAt: new Date(),
          status: itemsError === 0 ? "ok" : itemsOk === 0 ? "error" : "partial",
          itemsOk,
          itemsError,
          log: logs.join("|")
        }
      });
    } catch (error) {
      await prisma.scrapeRun.update({
        where: { id: run.id },
        data: {
          endedAt: new Date(),
          status: "error",
          itemsOk,
          itemsError,
          log: `${logs.join("|")}::${String(error)}`
        }
      });
      throw error;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function maybeRefreshCurrentPrices(trigger: RunTrigger = "visit") {
  const latest = await prisma.currentPrice.findFirst({
    orderBy: { scrapedAt: "desc" }
  });
  if (!latest) {
    await refreshCurrentPrices(trigger);
  } else {
    const ageMs = Date.now() - latest.scrapedAt.getTime();
    if (ageMs > cacheHours() * 60 * 60 * 1000) {
      await refreshCurrentPrices(trigger);
    }
  }

  await getOrCreateMonthlySnapshot("scheduled");
}

export async function saveMonthlySnapshot(
  anio: number,
  mes: number,
  origin: SnapshotOrigin = "on_demand",
  capturedAt = new Date()
) {
  const prices = await prisma.currentPrice.findMany({
    where: {
      product: { activo: true }
    },
    include: { product: true }
  });

  for (const row of prices) {
    await prisma.monthlySnapshot.upsert({
      where: {
        productId_anio_mes: {
          productId: row.productId,
          anio,
          mes
        }
      },
      update: {},
      create: {
        productId: row.productId,
        anio,
        mes,
        precioUnitario: row.precioUnitario,
        moneda: "ARS",
        fuente: "lagallega",
        origin,
        capturedAt,
        sourceUrl: row.sourceUrl,
        status: row.status,
        rawText: row.rawText,
        rawHtmlSnippet: row.rawHtmlSnippet
      }
    });
  }
}

export async function getOrCreateMonthlySnapshot(origin: SnapshotOrigin = "on_demand") {
  const now = nowYearMonth();
  const target = prevMonth(now.anio, now.mes);

  const [activeProducts, existing] = await Promise.all([
    prisma.product.count({ where: { activo: true } }),
    prisma.monthlySnapshot.count({
      where: {
        anio: target.anio,
        mes: target.mes,
        product: { activo: true }
      }
    })
  ]);

  if (activeProducts > 0 && existing >= activeProducts) {
    return { created: false, anio: target.anio, mes: target.mes };
  }

  const priceCount = await prisma.currentPrice.count({
    where: { product: { activo: true } }
  });
  if (priceCount === 0) {
    await refreshCurrentPrices("scheduled");
  }

  await saveMonthlySnapshot(target.anio, target.mes, origin, new Date());
  return { created: true, anio: target.anio, mes: target.mes };
}

