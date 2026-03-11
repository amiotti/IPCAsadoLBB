import { NextResponse } from "next/server";
import { refreshCurrentPrices } from "@/lib/services";

export async function POST() {
  await refreshCurrentPrices("manual");
  return NextResponse.json({ ok: true });
}
