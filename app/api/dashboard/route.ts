import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/dashboard";
import { maybeRefreshCurrentPrices } from "@/lib/services";

export async function GET() {
  await maybeRefreshCurrentPrices("visit");
  const data = await getDashboardData();
  return NextResponse.json(data);
}
