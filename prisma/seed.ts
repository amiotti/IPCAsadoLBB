import { PrismaClient } from "@prisma/client";
import { ENE_ANIO, ENE_MES, PRODUCTOS_BASE } from "../lib/constants";

const DEC_ANIO = 2025;
const DEC_MES = 12;

const prisma = new PrismaClient();

async function run() {
  await prisma.monthlySnapshot.deleteMany({
    where: {
      OR: [
        { anio: DEC_ANIO, mes: DEC_MES, origin: "seed" },
        { anio: ENE_ANIO, mes: ENE_MES, origin: "seed" }
      ]
    }
  });

  for (const item of PRODUCTOS_BASE) {
    const product = await prisma.product.upsert({
      where: { codigo: item.codigo },
      update: {
        nombreBase: item.producto,
        categoria: item.categoria,
        qty: item.qty,
        um: item.um,
        activo: true
      },
      create: {
        codigo: item.codigo,
        nombreBase: item.producto,
        categoria: item.categoria,
        qty: item.qty,
        um: item.um,
        activo: true
      }
    });

    await prisma.currentPrice.upsert({
      where: { productId: product.id },
      update: {
        precioUnitario: item.ene,
        scrapedAt: new Date(`${ENE_ANIO}-01-02T10:00:00.000Z`),
        sourceUrl: `https://www.lagallega.com.ar/productosdet.asp?Pr=${item.codigo}`,
        status: "ok"
      },
      create: {
        productId: product.id,
        precioUnitario: item.ene,
        scrapedAt: new Date(`${ENE_ANIO}-01-02T10:00:00.000Z`),
        sourceUrl: `https://www.lagallega.com.ar/productosdet.asp?Pr=${item.codigo}`,
        status: "ok"
      }
    });

    await prisma.monthlySnapshot.upsert({
      where: {
        productId_anio_mes: {
          productId: product.id,
          anio: DEC_ANIO,
          mes: DEC_MES
        }
      },
      update: {
        precioUnitario: item.diciembre,
        origin: "seed",
        fuente: "lagallega",
        status: "ok",
        sourceUrl: `https://www.lagallega.com.ar/productosdet.asp?Pr=${item.codigo}`,
        capturedAt: new Date(`${DEC_ANIO}-12-02T10:00:00.000Z`)
      },
      create: {
        productId: product.id,
        anio: DEC_ANIO,
        mes: DEC_MES,
        precioUnitario: item.diciembre,
        origin: "seed",
        fuente: "lagallega",
        status: "ok",
        sourceUrl: `https://www.lagallega.com.ar/productosdet.asp?Pr=${item.codigo}`,
        capturedAt: new Date(`${DEC_ANIO}-12-02T10:00:00.000Z`)
      }
    });

    await prisma.monthlySnapshot.upsert({
      where: {
        productId_anio_mes: {
          productId: product.id,
          anio: ENE_ANIO,
          mes: ENE_MES
        }
      },
      update: {
        precioUnitario: item.ene,
        origin: "seed",
        fuente: "lagallega",
        status: "ok",
        sourceUrl: `https://www.lagallega.com.ar/productosdet.asp?Pr=${item.codigo}`,
        capturedAt: new Date(`${ENE_ANIO}-01-02T10:00:00.000Z`)
      },
      create: {
        productId: product.id,
        anio: ENE_ANIO,
        mes: ENE_MES,
        precioUnitario: item.ene,
        origin: "seed",
        fuente: "lagallega",
        status: "ok",
        sourceUrl: `https://www.lagallega.com.ar/productosdet.asp?Pr=${item.codigo}`,
        capturedAt: new Date(`${ENE_ANIO}-01-02T10:00:00.000Z`)
      }
    });
  }
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
