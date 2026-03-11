import * as cheerio from "cheerio";
import { parseArPrice } from "./helpers";

export type ScrapeResult = {
  nombre: string | null;
  precioUnitario: number | null;
  status: "ok" | "no_encontrado" | "error" | "parse_error";
  sourceUrl: string;
  rawText?: string;
  rawHtmlSnippet?: string;
};

function normalizeProductName(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const lower = value.toLowerCase();
  const blocked = [
    "la gallega online - supermercados la gallega",
    "supermercados la gallega",
    "la gallega online"
  ];
  if (blocked.some((token) => lower.includes(token))) {
    return null;
  }
  return value;
}

function findPriceLikeText(text: string): string | null {
  const match = text.match(/\$\s?\d{1,3}(?:\.\d{3})*,\d{2}/);
  return match?.[0] ?? null;
}

async function scrapeUrl(url: string): Promise<ScrapeResult> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 IPC-Asados-LBB" },
      next: { revalidate: 0 }
    });
    const html = await response.text();
    if (!response.ok || !html) {
      return { nombre: null, precioUnitario: null, status: "error", sourceUrl: url };
    }

    const $ = cheerio.load(html);
    const rawName =
      $("h1").first().text().trim() ||
      $("title").first().text().trim() ||
      $(".titulo").first().text().trim() ||
      null;
    const name = normalizeProductName(rawName);

    const priceContainer =
      $(".izq").first().text().trim() ||
      $(".precio").first().text().trim() ||
      $("body").text();
    const rawPrice = findPriceLikeText(priceContainer);

    if (!rawPrice) {
      return {
        nombre: name,
        precioUnitario: null,
        status: "no_encontrado",
        sourceUrl: url,
        rawText: priceContainer.slice(0, 500),
        rawHtmlSnippet: html.slice(0, 1000)
      };
    }

    try {
      const precioUnitario = parseArPrice(rawPrice);
      return {
        nombre: name,
        precioUnitario,
        status: "ok",
        sourceUrl: url,
        rawText: rawPrice,
        rawHtmlSnippet: html.slice(0, 1000)
      };
    } catch {
      return {
        nombre: name,
        precioUnitario: null,
        status: "parse_error",
        sourceUrl: url,
        rawText: rawPrice,
        rawHtmlSnippet: html.slice(0, 1000)
      };
    }
  } catch {
    return { nombre: null, precioUnitario: null, status: "error", sourceUrl: url };
  }
}

export async function scrapeProductByCode(codigo: string): Promise<ScrapeResult> {
  const url = `https://www.lagallega.com.ar/productosdet.asp?Pr=${codigo}`;
  return scrapeUrl(url);
}

export async function scrapeCotoByPath(path: string): Promise<ScrapeResult> {
  const url = path.startsWith("http")
    ? path
    : `https://www.cotodigital.com.ar${path.startsWith("/") ? path : `/${path}`}`;
  return scrapeUrl(url);
}
