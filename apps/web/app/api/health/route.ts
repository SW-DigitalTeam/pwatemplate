import { NextResponse } from "next/server";

/** Public health endpoint for uptime checks. Never returns sensitive detail. */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "sw-pwa-platform",
    time: new Date().toISOString(),
  });
}
