import { NextResponse } from "next/server";
import { getDashboardDataSafe } from "@/lib/dashboard";
import { maybeRefreshCurrentPrices } from "@/lib/services";

export async function GET() {
  try {
    await maybeRefreshCurrentPrices("visit");
  } catch (error) {
    console.error("api/dashboard maybeRefreshCurrentPrices error", error);
  }

  const data = await getDashboardDataSafe();
  return NextResponse.json(data);
}

