import * as kv from "./kv";

const MEMBER_KEY = "member_password";
const ADMIN_KEY = "admin_password";
let memMember: string | null = null;
let memAdmin: string | null = null;

export async function getMemberPassword(): Promise<string> {
  const stored = await kv.get<string>(MEMBER_KEY);
  return stored ?? memMember ?? process.env.MEMBER_PASSWORD ?? "";
}

export async function getAdminPassword(): Promise<string> {
  const stored = await kv.get<string>(ADMIN_KEY);
  return stored ?? memAdmin ?? process.env.ADMIN_PASSWORD ?? "";
}

export async function setMemberPassword(pw: string): Promise<void> {
  memMember = pw;
  await kv.set(MEMBER_KEY, pw);
}

export async function setAdminPassword(pw: string): Promise<void> {
  memAdmin = pw;
  await kv.set(ADMIN_KEY, pw);
}
