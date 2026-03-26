import { createClient } from "@vercel/kv";

export type AppTheme = {
  hue: number;
  appName: string;
  appSubtitle: string;
  welcomeMessage: string;
  inputPlaceholder: string;
  accessLabel: string;
};

export const DEFAULT_THEME: AppTheme = {
  hue: 25,
  appName: "Beardie Care Guide",
  appSubtitle: "Members-only care assistant",
  welcomeMessage: "Ask anything about enclosure setup, lighting, feeding, or handling. I'll keep it educational and safe.",
  inputPlaceholder: "Ask about lighting, feeding, or health red flags...",
  accessLabel: "Private members-only access",
};

const THEME_KEY = "app_theme";
let memoryTheme: AppTheme | null = null;

function getKv() {
  const url = process.env.DS_KV_URL;
  const token = process.env.DS_KV_TOKEN;
  if (!url || !token) return null;
  return createClient({ url, token });
}

export async function getAppTheme(): Promise<AppTheme> {
  // 1. KV
  const kv = getKv();
  if (kv) {
    try {
      const stored = await kv.get<AppTheme>(THEME_KEY);
      if (stored) return { ...DEFAULT_THEME, ...stored };
    } catch {}
  }
  // 2. Cookie (server context only)
  try {
    const { cookies } = await import("next/headers");
    const c = cookies().get("ds_theme");
    if (c?.value) return { ...DEFAULT_THEME, ...(JSON.parse(c.value) as Partial<AppTheme>) };
  } catch {}
  // 3. Memory fallback
  return memoryTheme ? { ...DEFAULT_THEME, ...memoryTheme } : DEFAULT_THEME;
}

export async function setAppTheme(theme: Partial<AppTheme>): Promise<AppTheme> {
  const current = await getAppTheme();
  const updated = { ...current, ...theme };
  memoryTheme = updated;
  const kv = getKv();
  if (kv) {
    try { await kv.set(THEME_KEY, updated); } catch {}
  }
  return updated;
}
