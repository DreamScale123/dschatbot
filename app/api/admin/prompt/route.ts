import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getSystemPrompt, setSystemPrompt, isKvAvailable } from "@/lib/prompt-store";

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
  const [prompt, kvOk] = await Promise.all([getSystemPrompt(), isKvAvailable()]);
  return NextResponse.json({ prompt, kvAvailable: kvOk });
}

export async function POST(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { prompt } = body as { prompt?: string };
  if (typeof prompt !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  await setSystemPrompt(prompt);
  const kvOk = await isKvAvailable();
  const res = NextResponse.json({ ok: true, kvAvailable: kvOk });
  // Only store in cookie if under 3000 chars (cookie size limit)
  if (prompt.length <= 3000) {
    res.cookies.set("ds_prompt", prompt, COOKIE_OPTS);
  }
  return res;
}
