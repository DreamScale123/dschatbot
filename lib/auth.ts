import { cookies } from "next/headers";

const SESSION_COOKIE = "session";

export function isAuthedFromCookies(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  return session?.value === "member" || session?.value === "admin";
}

export function getRoleFromCookies(): "member" | "admin" | null {
  const cookieStore = cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (session?.value === "admin") return "admin";
  if (session?.value === "member") return "member";
  return null;
}

export function isAdminFromCookies(): boolean {
  return getRoleFromCookies() === "admin";
}

export function validatePassword(password: string): "member" | "admin" | null {
  const memberPassword = process.env.MEMBER_PASSWORD || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (adminPassword && password === adminPassword) return "admin";
  if (memberPassword && password === memberPassword) return "member";
  return null;
}
