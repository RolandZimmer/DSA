import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA — Thuật toán tìm kiếm & Bảng băm",
  description: "Bài trình chiếu web tương tác về thuật toán tìm kiếm và bảng băm.",
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
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
