import { createClient } from "@vercel/kv";

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

export async function getSystemPrompt(): Promise<string> {
  // 1. KV
  const kv = getKv();
  if (kv) {
    try {
      const stored = await kv.get<string>(PROMPT_KEY);
      if (stored) return stored;
    } catch {}
  }
  // 2. Cookie (only if under 3000 chars to stay within limits)
  try {
    const { cookies } = await import("next/headers");
    const c = cookies().get("ds_prompt");
    if (c?.value) return c.value;
  } catch {}
  // 3. Memory / env
  return memoryPrompt || getDefaultPrompt();
}

export async function setSystemPrompt(prompt: string): Promise<void> {
  memoryPrompt = prompt;
  const kv = getKv();
  if (kv) {
    try { await kv.set(PROMPT_KEY, prompt); } catch {}
  }
}
