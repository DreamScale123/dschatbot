import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";
import { setMemberPassword, setAdminPassword } from "@/lib/password-store";

export async function POST(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { type, password } = body as { type?: string; password?: string };

  if (!type || typeof password !== "string" || password.trim().length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
  }

  if (type === "member") {
    await setMemberPassword(password.trim());
  } else if (type === "admin") {
    await setAdminPassword(password.trim());
  } else {
    return NextResponse.json({ error: "type must be 'member' or 'admin'" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
