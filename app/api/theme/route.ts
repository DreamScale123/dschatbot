import { NextResponse } from "next/server";
import { getAppTheme } from "@/lib/theme-store";

export async function GET() {
  const theme = await getAppTheme();
  return NextResponse.json(theme);
}
