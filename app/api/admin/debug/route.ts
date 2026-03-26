import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.DS_KV_URL;
  const token = process.env.DS_KV_TOKEN;

  const result: Record<string, unknown> = {
    DS_KV_URL_set: !!url,
    DS_KV_URL_preview: url ? url.slice(0, 30) + "..." : null,
    DS_KV_TOKEN_set: !!token,
    pingResult: null,
    pingError: null,
  };

  if (url && token) {
    try {
      const { createClient } = await import("@vercel/kv");
      const kv = createClient({ url, token });
      await kv.ping();
      result.pingResult = "OK";
    } catch (e) {
      result.pingError = String(e);
    }
  }

  return NextResponse.json(result);
}
