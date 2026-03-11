import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isAuthorizedRequest } from "@/lib/api-auth";
import { refreshCurrentPrices } from "@/lib/services";

export async function POST(request: NextRequest) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await refreshCurrentPrices("manual");
  return NextResponse.json({ ok: true });
}

