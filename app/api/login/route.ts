import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validatePassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const role = validatePassword(password);
  if (!role) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  cookies().set("session", role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/"
  });

  return NextResponse.json({ ok: true, role });
}
