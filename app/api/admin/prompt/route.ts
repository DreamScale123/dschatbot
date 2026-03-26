import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getSystemPrompt, setSystemPrompt } from "@/lib/prompt-store";

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const prompt = await getSystemPrompt();
  return NextResponse.json({ prompt });
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
  return NextResponse.json({ ok: true });
}
