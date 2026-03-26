import { NextResponse } from "next/server";
import { getRoleFromCookies } from "@/lib/auth";

export async function GET() {
  const role = getRoleFromCookies();
  if (!role) {
    return NextResponse.json({ authed: false });
  }
  return NextResponse.json({ authed: true, role });
}
