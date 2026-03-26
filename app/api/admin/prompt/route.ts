import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getSystemPrompt, setSystemPrompt, isKvAvailable } from "@/lib/prompt-store";

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
  return NextResponse.json({ ok: true, kvAvailable: kvOk });
}
