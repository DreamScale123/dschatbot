import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";

export async function GET(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id");
  const filename = searchParams.get("name") || "file";

  if (!fileId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const res = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } }).error?.message || `OpenAI returned ${res.status}`;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
    }
  });
}
