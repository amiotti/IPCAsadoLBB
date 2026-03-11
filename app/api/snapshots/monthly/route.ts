import { NextResponse } from "next/server";
import { getOrCreateMonthlySnapshot } from "@/lib/services";

export async function POST() {
  const result = await getOrCreateMonthlySnapshot("manual");
  return NextResponse.json({ ok: true, ...result });
}
