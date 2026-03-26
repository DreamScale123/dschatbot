import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { getModel, setModel } from "@/lib/model-store";

export async function GET() {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const model = await getModel();
  return NextResponse.json({ model });
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
  return NextResponse.json({ ok: true });
}
