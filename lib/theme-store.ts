import * as kv from "./kv";

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

const KEY = "app_theme";
let memory: AppTheme | null = null;

export async function getAppTheme(): Promise<AppTheme> {
  const stored = await kv.get<AppTheme>(KEY);
  if (stored) return { ...DEFAULT_THEME, ...stored };
  return memory ?? DEFAULT_THEME;
}

export async function setAppTheme(theme: Partial<AppTheme>): Promise<AppTheme> {
  const current = memory ?? DEFAULT_THEME;
  const updated = { ...current, ...theme };
  memory = updated;
  await kv.set(KEY, updated);
  return updated;
}
