import { NextResponse } from "next/server";
import { getHistoryData } from "@/lib/dashboard";

export async function GET() {
  const data = await getHistoryData();
  return NextResponse.json(data);
}
