// Falls back to SYSTEM_PROMPT env var, then a hardcoded default
function getDefaultPrompt(): string {
  return (
    process.env.SYSTEM_PROMPT ||
    "You are a knowledgeable and caring bearded dragon care assistant. " +
    "Help members with enclosure setup, lighting schedules, feeding, hydration, handling, " +
    "and recognizing health red flags. Always encourage consulting a reptile vet for emergencies. " +
    "Be friendly, concise, and accurate."
  );
}

const PROMPT_KEY = "system_prompt";

let memoryPrompt: string | null = null;

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

export async function getSystemPrompt(): Promise<string> {
  if (await kvAvailable()) {
    try {
      const { kv } = await import("@vercel/kv");
      const stored = await kv.get<string>(PROMPT_KEY);
      return stored || getDefaultPrompt();
    } catch {}
  }
  return memoryPrompt || getDefaultPrompt();
}

export async function setSystemPrompt(prompt: string): Promise<void> {
  memoryPrompt = prompt;
  if (await kvAvailable()) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(PROMPT_KEY, prompt);
    } catch {}
  }
}

export async function isKvAvailable(): Promise<boolean> {
  return kvAvailable();
}
