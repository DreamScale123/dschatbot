// Direct Upstash REST client — no SDK, just fetch.
// Set DS_KV_URL and DS_KV_TOKEN in Vercel env vars
// (copy KV_REST_API_URL and KV_REST_API_TOKEN from upstash-kv-teal-bridge).

const url = () => process.env.DS_KV_URL?.replace(/\/$/, "");
const token = () => process.env.DS_KV_TOKEN;

export function isConfigured(): boolean {
  return Boolean(url() && token());
}

export async function ping(): Promise<boolean> {
  if (!isConfigured()) return false;
  try {
    const res = await fetch(`${url()}/ping`, {
      headers: { Authorization: `Bearer ${token()}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function get<T>(key: string): Promise<T | null> {
  if (!isConfigured()) return null;
  try {
    const res = await fetch(`${url()}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token()}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json() as { result: string | null };
    if (data.result == null) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return null;
  }
}

export async function set(key: string, value: unknown): Promise<void> {
  if (!isConfigured()) return;
  try {
    await fetch(`${url()}/set/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(JSON.stringify(value)), // Upstash stores strings; we double-serialize JSON
    });
  } catch {}
}
