import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getAppTheme, setAppTheme } from "@/lib/theme-store";

const COOKIE_OPTS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

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
  const updated = await setAppTheme(body);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ds_theme", JSON.stringify(updated), COOKIE_OPTS);
  return res;
}
