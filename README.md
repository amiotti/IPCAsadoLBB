# IPC Asados LBB

Aplicacion Next.js + Prisma para seguimiento mensual del costo de una canasta de asado para 10 personas.

## Stack
- Next.js App Router + React + TypeScript
- Prisma (SQLite por defecto local)
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
3. `npx prisma migrate dev --name init`
4. `npm run prisma:seed`
5. `npm run dev`

## Endpoints
- `GET /api/dashboard`
- `POST /api/prices/refresh`
- `POST /api/snapshots/monthly`
- `GET /api/products`
- `GET /api/history`
- `GET /api/history/product/:codigo`

## Regla historica
- Los reportes historicos salen solo de `monthly_snapshots`.
- No se estiman meses futuros.
- Enero 2025 se carga por seed.

## Nota de fuentes
- La Gallega por codigo: `https://www.lagallega.com.ar/productosdet.asp?Pr={CODIGO}`
- Referencia Coto: ver `docs/fuentes.md`
