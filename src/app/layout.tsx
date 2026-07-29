import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ModeStyle Pro | AI 헤어 시뮬레이터 & 업셀링 도구",
  description: "고객 사진 한 장으로 10초 만에 다양한 프리미엄 헤어 시뮬레이션을 제안하고 시술을 유치하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">{children}</body>
    </html>
  );
}

