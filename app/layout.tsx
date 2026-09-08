import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA — Search Algorithms & Hash Tables",
  description: "An interactive web presentation on search algorithms and hash tables.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
