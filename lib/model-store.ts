import { createClient } from "@vercel/kv";

const MODEL_KEY = "openai_model";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";
let memoryModel: string | null = null;

function getKv() {
  const url = process.env.DS_KV_URL;
  const token = process.env.DS_KV_TOKEN;
  if (!url || !token) return null;
  return createClient({ url, token });
}

export async function isKvAvailable(): Promise<boolean> {
  const kv = getKv();
  if (!kv) return false;
  try { await kv.ping(); return true; } catch { return false; }
}

export async function getModel(): Promise<string> {
  // 1. KV
  const kv = getKv();
  if (kv) {
    try {
      const stored = await kv.get<string>(MODEL_KEY);
      if (stored) return stored;
    } catch {}
  }
  // 2. Cookie
  try {
    const { cookies } = await import("next/headers");
    const c = cookies().get("ds_model");
    if (c?.value) return c.value;
  } catch {}
  // 3. Memory / env
  return memoryModel || DEFAULT_MODEL;
}

export async function setModel(model: string): Promise<void> {
  memoryModel = model;
  const kv = getKv();
  if (kv) {
    try { await kv.set(MODEL_KEY, model); } catch {}
  }
}
