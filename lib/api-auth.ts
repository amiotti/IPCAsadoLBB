import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

function safeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function readTokenFromRequest(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return (
    request.headers.get("x-api-key")?.trim() ??
    request.headers.get("x-cron-secret")?.trim() ??
    null
  );
}

export function isAuthorizedRequest(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";

  const token = readTokenFromRequest(request);
  if (!token) return false;
  return safeEq(token, secret);
}

