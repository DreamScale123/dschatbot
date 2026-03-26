const MODEL_KEY = "openai_model";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

let memoryModel: string | null = null;

async function kvAvailable(): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false;
  try {
    const { kv } = await import("@vercel/kv");
    await kv.ping();
    return true;
  } catch {
    return false;
  }
}

export async function getModel(): Promise<string> {
  if (await kvAvailable()) {
    try {
      const { kv } = await import("@vercel/kv");
      const stored = await kv.get<string>(MODEL_KEY);
      return stored || DEFAULT_MODEL;
    } catch {}
  }
  return memoryModel || DEFAULT_MODEL;
}

export async function setModel(model: string): Promise<void> {
  memoryModel = model;
  if (await kvAvailable()) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(MODEL_KEY, model);
    } catch {}
  }
}

export async function isKvAvailable(): Promise<boolean> {
  return kvAvailable();
}
