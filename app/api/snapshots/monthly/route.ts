import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/api-auth";
import { getOrCreateMonthlySnapshot } from "@/lib/services";

export async function POST(request: NextRequest) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await getOrCreateMonthlySnapshot("manual");
  return NextResponse.json({ ok: true, ...result });
}

