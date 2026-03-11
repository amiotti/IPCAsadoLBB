# Agente / Especificación para Codex — IPC Asados LBB

## Objetivo
Construir una aplicación web llamada **IPC Asados LBB** para seguir mes a mes la evolución del precio de una **canasta básica para un asado de 10 personas**, usando como fuente de precios el sitio **lagallega.com.ar**.

La app debe:
- mostrar **precios actuales** cada vez que alguien ingrese;
- mantener un **histórico mensual persistente** de precios por producto;
- calcular el **valor total de la canasta** y el **costo por comensal**;
- mostrar estadísticas, gráficos e insights automáticos sobre la evolución del índice;
- permitir consultar **precios históricos** aunque la web de La Gallega solo muestre precios actuales.

---

## Aclaración clave sobre la fuente de precios
Para consultar el precio actual **no es necesario iniciar sesión**.

La obtención del precio puede resolverse de forma simple por HTML estático, de manera similar a esta lógica usada en Google Sheets:

```gs
=VALUE(REPLACE(IMPORTXML("https://www.lagallega.com.ar/productosdet.asp?Pr="&$C2;"//div[@class='izq']");1;1;""))
```

Eso implica que el sistema debe:
- consultar la URL del producto por código;
- parsear el precio visible en el HTML;
- convertir correctamente el valor argentino a número;
- guardar el precio actual en una estructura persistente para construir la serie mensual.

No depender de login ni de scraping con navegador salvo que el sitio cambie en el futuro.

---

## Stack y lineamientos técnicos

### Stack preferido
- **Frontend:** Next.js (App Router) + React + TypeScript
- **Backend:** Node.js dentro de Next.js (Route Handlers / Server Actions)
- **Base de datos:** Supabase Postgres con Prisma, o alternativa equivalente estable
- **UI:** Tailwind CSS
- **Gráficos:** Recharts
- **Animaciones:** Framer Motion
- **Obtención de precios:** `fetch + cheerio` o parser HTML equivalente
- **Tareas programadas:** cron de Vercel, cron interno o scheduler equivalente para snapshots mensuales

### Requisitos generales
- Todo el proyecto debe estar en **español**.
- Usar **UTF-8** en toda la app.
- Diseño limpio, premium y claro.
- La marca principal visible debe ser: **IPC Asados LBB**.
- Debe verse bien en desktop y mobile.
- Arquitectura SPA/híbrida, con datos servidos desde backend.

---

## Fuente de datos

### Sitio fuente
- Fuente principal: `https://www.lagallega.com.ar`
- Consulta por producto: `https://www.lagallega.com.ar/productosdet.asp?Pr={CODIGO}`
- El precio actual se obtiene directamente desde el HTML del producto.
- Cada vez que alguien entra, la app debe intentar mostrar el **precio actual más reciente disponible**.

### Regla funcional crítica
La web de La Gallega muestra **solo el precio actual**, por lo tanto:
- los precios históricos **no pueden recalcularse después**;
- cada precio mensual debe **almacenarse al momento de ser relevado**;
- tanto los informes como la consulta de precios pasados deben salir **de la base propia de la app**, no de la web externa.

### Estrategia correcta de persistencia
La aplicación debe manejar **dos niveles de datos**:

1. **Precio actual / cache reciente**
   - sirve para mostrar el valor vigente al entrar a la app;
   - se puede refrescar varias veces por día;
   - no reemplaza el histórico mensual.

2. **Snapshot histórico mensual**
   - una foto persistida del precio de cada producto para cada mes;
   - se usa para informes, gráficos, comparaciones e históricos;
   - no debe sobrescribirse una vez guardada, salvo corrección administrativa explícita.

---

## Canasta base

La canasta representa un asado para **10 personas**.

### Datos iniciales (enero ya cargado)

```ts
export const PRODUCTOS_BASE = [
  { producto: "Coca", codigo: "54637", categoria: "Bebida", qty: 4, um: "Un", enero: 2032.00 },
  { producto: "Soda", codigo: "22814", categoria: "Bebida", qty: 2, um: "Un", enero: 1180.00 },
  { producto: "Fernet", codigo: "10191", categoria: "Bebida", qty: 1, um: "Un", enero: 12377.00 },
  { producto: "Vino", codigo: "33516", categoria: "Bebida", qty: 4, um: "Un", enero: 4988.00 },
  { producto: "Matambre Cerdo", codigo: "2816", categoria: "Carne", qty: 1, um: "Kg", enero: 17021.00 },
  { producto: "Vacio Ternera", codigo: "2581", categoria: "Carne", qty: 2, um: "Kg", enero: 12900.00 },
  { producto: "Costilla Ternera", codigo: "2485", categoria: "Carne", qty: 2, um: "Kg", enero: 11900.00 },
  { producto: "Carbón", codigo: "32506", categoria: "Carne", qty: 2, um: "Un", enero: 2194.00 },
  { producto: "Papa", codigo: "2150", categoria: "Guarnición", qty: 4, um: "Kg", enero: 790.00 },
  { producto: "Lechuga", codigo: "2091", categoria: "Guarnición", qty: 1, um: "Kg", enero: 2990.00 },
  { producto: "Tomate", codigo: "2221", categoria: "Guarnición", qty: 2, um: "Kg", enero: 2990.00 },
  { producto: "Queso", codigo: "1604", categoria: "Picada", qty: 0.5, um: "Kg", enero: 19193.00 },
  { producto: "Maní", codigo: "10699", categoria: "Picada", qty: 1, um: "Un", enero: 2991.00 },
  { producto: "Salame", codigo: "1553", categoria: "Picada", qty: 0.5, um: "Kg", enero: 18633.00 },
  { producto: "Pan", codigo: "1230", categoria: "Picada", qty: 1, um: "Kg", enero: 1900.00 }
] as const
```

### Reglas de cálculo
- El precio obtenido del sitio debe interpretarse como **precio unitario de venta** del producto.
- El costo de cada línea es: `precio_actual * qty`.
- El total de la canasta es la suma de todas las líneas.
- El costo por comensal es: `total_canasta / 10`.

---

## Modelo de datos sugerido

### Tabla `products`
```ts
{
  id: string,
  codigo: string,
  nombreBase: string,
  nombreActual?: string,
  categoria: "Bebida" | "Carne" | "Guarnición" | "Picada",
  qty: number,
  um: string,
  activo: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Tabla `current_prices`
Guarda el último precio conocido y sirve para carga rápida del dashboard.

```ts
{
  id: string,
  productId: string,
  precioUnitario: number,
  moneda: "ARS",
  scrapedAt: Date,
  sourceUrl: string,
  status: "ok" | "no_encontrado" | "error" | "parse_error",
  rawText?: string,
  rawHtmlSnippet?: string,
  createdAt: Date,
  updatedAt: Date
}
```

### Tabla `monthly_snapshots`
Un snapshot por producto por mes. Esta tabla es la base del histórico.

```ts
{
  id: string,
  productId: string,
  anio: number,
  mes: number, // 1-12
  precioUnitario: number,
  moneda: "ARS",
  fuente: "lagallega",
  origin: "seed" | "manual" | "scheduled" | "on_demand",
  capturedAt: Date,
  sourceUrl: string,
  status: "ok" | "no_encontrado" | "error" | "parse_error",
  rawText?: string,
  rawHtmlSnippet?: string,
  notes?: string,
  uniqueKey: string // `${productId}-${anio}-${mes}`
}
```

### Tabla `scrape_runs`
```ts
{
  id: string,
  startedAt: Date,
  endedAt?: Date,
  status: "running" | "ok" | "partial" | "error",
  trigger: "visit" | "manual" | "scheduled",
  itemsOk: number,
  itemsError: number,
  log?: string
}
```

### Restricciones de negocio importantes
- Debe existir **como máximo un snapshot mensual por producto por mes**.
- El snapshot de enero debe venir **precargado desde seed**.
- Los snapshots históricos no deben perderse aunque el precio actual cambie.
- Para informes históricos, la fuente de verdad es **monthly_snapshots**.

---

## Estrategia de obtención y guardado de precios

### Obtención del precio actual
Implementar una función del tipo:

```ts
async function scrapeProductByCode(codigo: string) {
  const url = `https://www.lagallega.com.ar/productosdet.asp?Pr=${codigo}`
  // fetch del HTML
  // parseo del precio desde el selector visible
  // sanitización del string "$2.032,00" -> 2032.00
  // devolver nombre, precio, estado, fecha y evidencia mínima
}
```

### Parseo del precio
El sistema debe soportar valores con formato argentino, por ejemplo:
- `$2.032,00`
- `$12.377,00`

Implementar helper robusto:

```ts
function parseArPrice(input: string): number {
  // quitar $ y espacios
  // quitar separador de miles '.'
  // reemplazar decimal ',' por '.'
  // convertir a number
}
```

### Flujo al entrar un usuario
Cuando alguien entra a la home:
1. cargar el dashboard desde base con el último `current_prices`;
2. si el cache de precios actuales está vencido, disparar una actualización server-side;
3. actualizar `current_prices`;
4. si todavía no existe snapshot para el mes actual, permitir generarlo automáticamente o mediante tarea programada segura.

### Regla de snapshot mensual
- El snapshot mensual debe guardar **el primer precio consolidado del mes** o el valor capturado por la tarea mensual definida.
- No debe recrearse en cada visita.
- Debe existir un job mensual, por ejemplo el día 1 o el primer día hábil, que capture todos los precios y los persista.
- También debe existir un endpoint/admin para forzarlo manualmente si hace falta.

### Fallback si falla la captura actual
Si el scraping actual falla:
- mostrar el último precio actual válido;
- conservar el histórico existente;
- marcar advertencia visual en la UI;
- registrar el fallo en `scrape_runs`.

---

## Lógica funcional

### 1) Actualización de precios al ingresar
- no disparar múltiples scrapes simultáneos si entran varios usuarios;
- usar lock simple en DB o estrategia anti-concurrencia;
- cache sugerido: 6 horas para precios actuales;
- los gráficos e informes deben seguir funcionando aunque el refresh del día falle.

### 2) Histórico mensual persistente
- enero ya está cargado manualmente;
- los meses futuros deben quedar en blanco hasta tener snapshot real;
- nunca estimar ni interpolar precios históricos;
- permitir ver tabla histórica por producto y por mes.

### 3) Informes y analítica
Todos los informes deben tomar datos desde `monthly_snapshots`, porque la web externa solo tiene precio actual.

### 4) Comentarios automáticos
La app debe generar insights como:
- qué producto más subió vs el mes anterior;
- qué categoría explicó la mayor parte del aumento;
- cuánto subió el asado desde enero;
- si el costo por comensal rompió un máximo histórico;
- si hubo productos sin captura válida en el mes actual.

---

## Pantallas

### Home / Dashboard principal
Debe incluir:

#### Header
- Logo/título: **IPC Asados LBB**
- Favicon: un icono de carne
- subtítulo: “Seguimiento mensual del costo de un asado para 10 personas”
- badge con “Última actualización”
- badge adicional con “Snapshot histórico vigente: Mes/Año”

#### KPI cards
Mostrar al menos:
- **Total actual de la canasta**
- **Variación vs mes anterior**
- **Variación acumulada vs enero**
- **Costo por comensal**
- **Producto que más subió este mes**
- **Categoría con mayor incidencia actual**

#### Tabla de productos
Columnas sugeridas:
- Producto
- Código
- Categoría
- Cantidad
- Unidad
- Precio actual
- Subtotal actual
- Variación vs mes anterior
- Variación acumulada vs enero
- Último precio histórico disponible
- Estado del scraping

Agregar:
- búsqueda;
- filtros por categoría;
- orden por precio, variación, incidencia;
- resaltado de subas y bajas.

### Pantalla / sección de histórico
Debe existir una vista específica para ver precios históricos:
- matriz producto x mes;
- detalle por producto con evolución mensual;
- posibilidad de cambiar de año;
- indicación de meses sin dato real.

---

## Gráficos y estadísticas obligatorias

### 1) Variación mensual del índice general
- gráfico principal de barras animado con todos los meses del año;
- usar como fuente los snapshots mensuales;
- dejar meses futuros vacíos;
- tooltip con total canasta, variación mensual y variación acumulada;
- comentario automático debajo del gráfico.

### 2) Cuánto necesita un comensal para comer un asado
- KPI destacado;
- mini gráfico sparkline con evolución mensual del costo por comensal.

### 3) Incidencia por categoría del mes actual
- gráfico donut o barra apilada;
- mostrar participación de:
  - Bebida
  - Carne
  - Guarnición
  - Picada
- incluir comentario sobre qué categoría pesa más en el total actual.

### 4) Variación mensual de cada producto
- gráfico de barras ordenado de mayor suba a mayor baja;
- comparar el último snapshot vs el anterior;
- comentario automático mencionando ganadores y rezagados.

### 5) Evolución del total de la canasta
- gráfico de línea mes a mes;
- mostrar total ARS por mes;
- destacar enero como base.

### 6) Ranking de incidencia en pesos
- barras horizontales con subtotal actual por producto;
- identificar qué productos explican más el costo total.

### 7) Heatmap mensual por producto
- filas = productos;
- columnas = meses;
- color según nivel de variación o precio;
- meses futuros vacíos.

### 8) Índice base 100
- enero = 100;
- meses siguientes muestran índice relativo del “IPC Asados”.

### 9) Comparativa precio actual vs último snapshot
- gráfico o tabla que muestre si el precio de hoy ya se apartó del valor guardado del mes.
- útil para anticipar cómo podría venir el próximo cierre mensual.

---

## Fórmulas de negocio

### Total por producto
```ts
subtotal = precioUnitario * qty
```

### Total canasta
```ts
totalCanasta = sum(subtotal de todos los productos)
```

### Costo por comensal
```ts
costoPorComensal = totalCanasta / 10
```

### Variación mensual
```ts
variacionMensualPct = ((valorActual - valorMesAnterior) / valorMesAnterior) * 100
```

### Variación acumulada vs enero
```ts
variacionAcumuladaEneroPct = ((valorActual - valorEnero) / valorEnero) * 100
```

### Incidencia por categoría
```ts
incidenciaCategoriaPct = (totalCategoria / totalCanasta) * 100
```

### Índice base 100
```ts
indiceBase100 = (totalMes / totalEnero) * 100
```

---

## UX/UI

### Estilo visual
- dashboard moderno, limpio y premium;
- tarjetas con bordes suaves;
- visual clara y económica;
- verde/rojo solo para suba/baja;
- animaciones suaves con Framer Motion.

### Experiencia
- skeletons de carga;
- mensajes claros si falta un dato;
- mostrar “último dato válido” cuando falle scraping actual;
- distinguir visualmente entre:
  - precio actual en vivo;
  - snapshot histórico mensual.

---

## Performance
- cachear resultados recientes de scraping actual;
- evitar scrapes redundantes;
- SSR o híbrido para carga rápida;
- lazy load para gráficos pesados;
- validación server-side;
- no recalcular históricos desde la web externa.

---

## Seguridad y robustez
- nunca exponer secretos;
- rate limiting para endpoints manuales;
- sanitizar HTML obtenido;
- guardar evidencia mínima del scrapeo para auditoría;
- logs solo del lado servidor;
- si el selector cambia, registrar parse error y no romper la app.

---

## Endpoints sugeridos

### `GET /api/dashboard`
Devuelve todos los datos agregados del dashboard.

### `POST /api/prices/refresh`
Actualiza `current_prices` de todos los productos.

### `POST /api/snapshots/monthly`
Genera el snapshot mensual del período actual si todavía no existe.

### `GET /api/products`
Lista productos con precio actual y último histórico.

### `GET /api/history`
Devuelve series históricas por producto, categoría e índice general.

### `GET /api/history/product/:codigo`
Devuelve el historial completo de un producto específico.

---

## Seed inicial obligatorio
Crear un seed que:
- cargue los 15 productos base;
- cargue enero como histórico inicial en `monthly_snapshots`;
- inicialice también `current_prices` con enero si hiciera falta para primer arranque;
- deje los demás meses sin inventar valores.

---

## Helpers esperados
Implementar helpers claros y reutilizables:
- `parseArPrice()`
- `formatArs()`
- `calcMonthlyVariation()`
- `calcCategoryIncidence()`
- `buildMonthlyIndexSeries()`
- `buildProductVariationRanking()`
- `scrapeProductByCode(codigo)`
- `refreshCurrentPrices()`
- `saveMonthlySnapshot()`
- `getOrCreateMonthlySnapshot()`
- `generateDashboardInsights()`

---

## Criterios de aceptación
La app se considera terminada si:
1. Muestra correctamente la canasta base de 15 productos.
2. Usa los códigos indicados para buscar precios actuales.
3. No depende de login para obtener el precio actual.
4. Guarda históricos mensuales reales en base propia.
5. Permite ver precios pasados aunque La Gallega solo muestre el actual.
6. Calcula total de canasta y costo por comensal.
7. Muestra los gráficos solicitados.
8. Deja meses futuros vacíos.
9. Tiene insights automáticos útiles.
10. Funciona bien en mobile y desktop.
11. Tiene manejo robusto de errores de parseo/scraping.
12. El código queda limpio, modular y listo para crecer.

---

## Extras deseables
Si hay tiempo, sumar:
- selector de año;
- exportación a CSV;
- exportación a PDF del informe mensual;
- modo oscuro;
- vista comparativa mes vs mes;
- panel admin mínimo para forzar refresh y revisar logs;
- bandera de “precio actual cambió desde el último cierre mensual”.
- Tambien toma los precios de la web de Coto para tener otra fuente de precios, por ejemplo : https://www.cotodigital.com.ar/sitios/cdigi/productos/vacio-del-centro-estancias-coto-x-kg-/_/R-00047980-00047980-200 

---

## Instrucción final para Codex
Construí el proyecto completo con foco en:
- obtención simple y robusta del precio actual desde HTML público de La Gallega;
- persistencia correcta del histórico mensual;
- claridad del dashboard;
- visualización útil de la evolución de precios;
- código mantenible y modular;
- excelente experiencia de usuario.


No inventes datos para meses futuros. Enero ya está cargado. Los informes históricos deben salir de la base propia de la aplicación, porque el sitio externo solo provee el precio actual. Lee desde el siguiente link la evolucion de precios de 2025 (hoja Datos (2025)) y guardalo por si sirve para algo: https://docs.google.com/spreadsheets/d/1Zms4IJ2A2mAKLqOImRwy60Xw5lQ1ztKQ1prU4kK8Jss/edit?gid=0#gid=0 
