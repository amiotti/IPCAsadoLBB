# IPC Asados LBB

Aplicacion Next.js + Prisma para seguimiento mensual del costo de una canasta de asado para 10 personas.

## Stack
- Next.js App Router + React + TypeScript
- Prisma (MongoDB)
- Tailwind CSS
- Recharts
- Framer Motion (disponible para animaciones)
- Scraping HTML con fetch + cheerio

## Requisitos
- Node 20+
- npm

## Arranque local
1. `npm install`
2. `copy .env.example .env`
3. `npm run prisma:push`
4. `npm run prisma:seed`
5. `npm run dev`

## Produccion (MongoDB + Prisma)
1. Configurar `DATABASE_URL` de MongoDB Atlas (o equivalente).
2. Ejecutar `npm run prisma:push` en el entorno de deploy.
3. (Opcional) Ejecutar `npm run prisma:seed` una sola vez para cargar catalogo base.
4. Definir `CRON_SECRET` y usarlo para proteger endpoints de escritura.

## Endpoints
- `GET /api/dashboard`
- `POST /api/prices/refresh`
- `POST /api/snapshots/monthly`
- `GET /api/products`
- `GET /api/history`
- `GET /api/history/product/:codigo`

### Seguridad de endpoints criticos
Los endpoints `POST /api/prices/refresh` y `POST /api/snapshots/monthly` requieren autenticacion por secreto:
- `Authorization: Bearer <CRON_SECRET>` o
- `x-api-key: <CRON_SECRET>` o
- `x-cron-secret: <CRON_SECRET>`

## Regla historica
- Los reportes historicos salen solo de `monthly_snapshots`.
- No se estiman meses futuros.
- Enero 2025 se carga por seed.

## Nota de fuentes
- La Gallega por codigo: `https://www.lagallega.com.ar/productosdet.asp?Pr={CODIGO}`
- Referencia Coto: ver `docs/fuentes.md`
