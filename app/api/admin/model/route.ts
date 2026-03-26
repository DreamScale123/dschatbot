import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getModel, setModel, isKvAvailable } from "@/lib/model-store";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [model, kvOk] = await Promise.all([getModel(), isKvAvailable()]);
  return NextResponse.json({ model, kvAvailable: kvOk });
}

export async function POST(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { model } = body as { model?: string };
  if (typeof model !== "string" || !model.trim()) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await setModel(model.trim());
  const kvOk = await isKvAvailable();
  const res = NextResponse.json({ ok: true, kvAvailable: kvOk });
  res.cookies.set("ds_model", model.trim(), COOKIE_OPTS);
  return res;
}
