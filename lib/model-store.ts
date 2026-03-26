import * as kv from "./kv";

const KEY = "openai_model";
const DEFAULT = () => process.env.OPENAI_MODEL || "gpt-5.4-mini";
let memory: string | null = null;

export async function isKvAvailable(): Promise<boolean> {
  return kv.ping();
}

export async function getModel(): Promise<string> {
  const stored = await kv.get<string>(KEY);
  if (stored) return stored;
  return memory ?? DEFAULT();
}

export async function setModel(model: string): Promise<void> {
  memory = model;
  await kv.set(KEY, model);
}
