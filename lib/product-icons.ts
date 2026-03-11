const PRODUCT_ICON_BY_CODE: Record<string, string> = {
  "54637": "\u{1F964}", // Coca
  "22814": "\u{1F4A7}", // Soda
  "10191": "\u{1F943}", // Fernet
  "33516": "\u{1F377}", // Vino
  "11201": "\u{1F37A}", // Cerveza
  "2816": "\u{1F969}", // Matambre
  "2581": "\u{1F356}", // Vacio
  "2485": "\u{1F356}", // Costilla
  "32506": "\u{1F525}", // Carbon
  "2150": "\u{1F954}", // Papa
  "2091": "\u{1F96C}", // Lechuga
  "2221": "\u{1F345}", // Tomate
  "1604": "\u{1F9C0}", // Queso
  "10699": "\u{1F95C}", // Mani
  "1553": "\u{1F356}", // Salame
  "1230": "\u{1F956}" // Pan
};

const UI_ICONS = {
  beer: "\u{1F37A}",
  money: "$"
} as const;

const iconCache = new Map<string, string>();

function buildSvgDataUri(icon: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <text x="16" y="24" text-anchor="middle" font-size="22" font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji">${icon}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildMoneySvgDataUri() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect x="2" y="6" width="28" height="20" rx="4" fill="#22c55e" stroke="#166534" stroke-width="1.5"/>
  <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="700" fill="#052e16" font-family="Arial, sans-serif">$</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getUiIconCacheKey(key: keyof typeof UI_ICONS) {
  return `ui:${key}`;
}

export function getProductIconByCode(codigo: string | number | undefined | null) {
  if (codigo === undefined || codigo === null) return null;
  const normalizedCode = String(codigo).trim();
  const icon = PRODUCT_ICON_BY_CODE[normalizedCode];
  if (!icon) return null;
  if (!iconCache.has(normalizedCode)) {
    iconCache.set(normalizedCode, buildSvgDataUri(icon));
  }
  return iconCache.get(normalizedCode) ?? null;
}

export function getUiIcon(key: keyof typeof UI_ICONS) {
  const cacheKey = getUiIconCacheKey(key);
  if (!iconCache.has(cacheKey)) {
    if (key === "money") {
      iconCache.set(cacheKey, buildMoneySvgDataUri());
    } else {
      iconCache.set(cacheKey, buildSvgDataUri(UI_ICONS[key]));
    }
  }
  return iconCache.get(cacheKey) ?? null;
}
