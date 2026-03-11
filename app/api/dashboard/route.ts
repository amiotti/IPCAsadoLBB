import { NextResponse } from "next/server";
import { getDashboardDataSafe } from "@/lib/dashboard";

export async function GET() {
  const data = await getDashboardDataSafe();
  return NextResponse.json(data);
}
