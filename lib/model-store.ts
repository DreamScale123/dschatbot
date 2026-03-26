const MODEL_KEY = "openai_model";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5.4-mini";

let memoryModel: string | null = null;

export async function getModel(): Promise<string> {
  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<string>(MODEL_KEY);
    return stored || DEFAULT_MODEL;
  } catch {
    return memoryModel || DEFAULT_MODEL;
  }
}

export async function setModel(model: string): Promise<void> {
  memoryModel = model;
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(MODEL_KEY, model);
  } catch {
    // KV not configured — saved in memory only
  }
}
