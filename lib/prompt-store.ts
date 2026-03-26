import * as kv from "./kv";

const KEY = "system_prompt";
const DEFAULT = () =>
  process.env.SYSTEM_PROMPT ||
  "You are a knowledgeable and caring bearded dragon care assistant. " +
  "Help members with enclosure setup, lighting schedules, feeding, hydration, handling, " +
  "and recognizing health red flags. Always encourage consulting a reptile vet for emergencies. " +
  "Be friendly, concise, and accurate.";

let memory: string | null = null;

export async function isKvAvailable(): Promise<boolean> {
  return kv.ping();
}

export async function getSystemPrompt(): Promise<string> {
  const stored = await kv.get<string>(KEY);
  if (stored) return stored;
  return memory ?? DEFAULT();
}

export async function setSystemPrompt(prompt: string): Promise<void> {
  memory = prompt;
  await kv.set(KEY, prompt);
}
