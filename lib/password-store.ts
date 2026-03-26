import { createClient } from "@vercel/kv";

const MEMBER_PW_KEY = "member_password";
const ADMIN_PW_KEY = "admin_password";

let memoryMemberPw: string | null = null;
let memoryAdminPw: string | null = null;

function getKv() {
  const url = process.env.DS_KV_URL;
  const token = process.env.DS_KV_TOKEN;
  if (!url || !token) return null;
  return createClient({ url, token });
}

export async function getMemberPassword(): Promise<string> {
  const kv = getKv();
  if (kv) {
    try {
      const stored = await kv.get<string>(MEMBER_PW_KEY);
      if (stored) return stored;
    } catch {}
  }
  return memoryMemberPw || process.env.MEMBER_PASSWORD || "";
}

export async function getAdminPassword(): Promise<string> {
  const kv = getKv();
  if (kv) {
    try {
      const stored = await kv.get<string>(ADMIN_PW_KEY);
      if (stored) return stored;
    } catch {}
  }
  return memoryAdminPw || process.env.ADMIN_PASSWORD || "";
}

export async function setMemberPassword(pw: string): Promise<void> {
  memoryMemberPw = pw;
  const kv = getKv();
  if (kv) {
    try { await kv.set(MEMBER_PW_KEY, pw); } catch {}
  }
}

export async function setAdminPassword(pw: string): Promise<void> {
  memoryAdminPw = pw;
  const kv = getKv();
  if (kv) {
    try { await kv.set(ADMIN_PW_KEY, pw); } catch {}
  }
}
