import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { DEFAULT_THEME } from "@/lib/theme-store";

export const metadata: Metadata = {
  title: "Beardie Care Guide",
  description: "Private bearded dragon care assistant"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  let hue = DEFAULT_THEME.hue;
  try {
    const c = cookies().get("ds_theme");
    if (c?.value) {
      const parsed = JSON.parse(c.value);
      if (typeof parsed.hue === "number") hue = parsed.hue;
    }
  } catch {}

  return (
    <html lang="en" style={{ "--hue": String(hue) } as React.CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
