import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { isConfigured, ping } from "@/lib/kv";

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DS_KV_URL;
  const token = process.env.DS_KV_TOKEN;
  const configured = isConfigured();
  const pingOk = configured ? await ping() : false;

  return NextResponse.json({
    DS_KV_URL_set: !!url,
    DS_KV_URL_preview: url ? url.slice(0, 35) + "..." : null,
    DS_KV_TOKEN_set: !!token,
    configured,
    pingOk,
  });
}
