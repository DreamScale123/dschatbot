import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getAppTheme, setAppTheme } from "@/lib/theme-store";
import { isConfigured } from "@/lib/kv";

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const theme = await getAppTheme();
  return NextResponse.json({ ...theme, kvAvailable: isConfigured() });
}

export async function POST(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const updated = await setAppTheme(body);
  return NextResponse.json({ ok: true, kvAvailable: isConfigured(), hue: updated.hue });
}
