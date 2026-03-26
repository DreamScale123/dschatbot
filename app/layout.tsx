import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beardie Care Guide",
  description: "Private bearded dragon care assistant"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
