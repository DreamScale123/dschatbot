import type { Metadata } from "next";
import "./globals.css";
import { getAppTheme } from "@/lib/theme-store";

export const metadata: Metadata = {
  title: "Beardie Care Guide",
  description: "Private bearded dragon care assistant"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const theme = await getAppTheme();
  return (
    <html lang="en" style={{ "--hue": String(theme.hue) } as React.CSSProperties}>
      <body>{children}</body>
    </html>
  );
}
