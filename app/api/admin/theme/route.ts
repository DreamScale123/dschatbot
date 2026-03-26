import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getAppTheme, setAppTheme } from "@/lib/theme-store";

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const theme = await getAppTheme();
  return NextResponse.json(theme);
}

export async function POST(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  await setAppTheme(body);
  return NextResponse.json({ ok: true });
}
