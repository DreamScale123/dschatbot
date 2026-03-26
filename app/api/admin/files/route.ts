import { NextResponse } from "next/server";
import { isAdminFromCookies } from "@/lib/auth";

export async function GET(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey || !vectorStoreId) {
    return NextResponse.json({ files: [] });
  }

  // ?id=fileId → return that file's text content
  const fileId = new URL(req.url).searchParams.get("id");
  if (fileId) {
    const contentRes = await fetch(`https://api.openai.com/v1/files/${fileId}/content`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!contentRes.ok) {
      return NextResponse.json({ error: "Could not retrieve file content" }, { status: 500 });
    }
    const contentType = contentRes.headers.get("content-type") || "";
    if (!contentType.includes("text") && !contentType.includes("json")) {
      return NextResponse.json({ content: "[Binary file — content cannot be displayed as text]" });
    }
    const content = await contentRes.text();
    return NextResponse.json({ content });
  }

  const res = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2"
    }
  });

  if (!res.ok) {
    return NextResponse.json({ files: [] });
  }

  const data = await res.json();
  return NextResponse.json({ files: data.data || [] });
}

export async function POST(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey || !vectorStoreId) {
    return NextResponse.json({ error: "Vector store not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("purpose", "assistants");

  const uploadRes = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: uploadForm
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    return NextResponse.json({ error: (err as { error?: { message?: string } }).error?.message || "Upload failed" }, { status: 500 });
  }

  const uploadData = await uploadRes.json() as { id: string };
  const fileId = uploadData.id;

  const addRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2"
    },
    body: JSON.stringify({ file_id: fileId })
  });

  if (!addRes.ok) {
    const err = await addRes.json().catch(() => ({}));
    return NextResponse.json({ error: (err as { error?: { message?: string } }).error?.message || "Failed to add to vector store" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, fileId });
}

export async function DELETE(req: Request) {
  if (!isAdminFromCookies()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

  if (!apiKey || !vectorStoreId) {
    return NextResponse.json({ error: "Vector store not configured" }, { status: 500 });
  }

  const { fileId } = await req.json().catch(() => ({})) as { fileId?: string };
  if (!fileId) {
    return NextResponse.json({ error: "fileId required" }, { status: 400 });
  }

  // Remove from vector store
  const vsRes = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreId}/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}`, "OpenAI-Beta": "assistants=v2" }
  });

  if (!vsRes.ok) {
    const err = await vsRes.json().catch(() => ({}));
    return NextResponse.json({ error: (err as { error?: { message?: string } }).error?.message || "Failed to remove from vector store" }, { status: 500 });
  }

  // Delete the underlying file object
  await fetch(`https://api.openai.com/v1/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  return NextResponse.json({ ok: true });
}
