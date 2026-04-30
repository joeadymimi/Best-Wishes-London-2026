import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "伦敦 2026 乒乓世锦赛追踪",
  description: "支持比分追踪、祈福互动、留言点赞的移动端 H5 原型。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
