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

// In-memory fallback when KV is not configured
let memoryPrompt: string | null = null;

export async function getSystemPrompt(): Promise<string> {
  try {
    const { kv } = await import("@vercel/kv");
    const stored = await kv.get<string>(PROMPT_KEY);
    return stored || getDefaultPrompt();
  } catch {
    return memoryPrompt || getDefaultPrompt();
  }
}

export async function setSystemPrompt(prompt: string): Promise<void> {
  memoryPrompt = prompt;
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(PROMPT_KEY, prompt);
  } catch {
    // KV not configured — prompt saved in memory only for this instance
  }
}

