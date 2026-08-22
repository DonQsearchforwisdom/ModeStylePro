import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "ModeStyle Pro | 헤어 시뮬레이터 & 업셀링",
  description: "실제 고객의 사진으로 다양한 헤어 스타일을 시뮬레이션하고 프리미엄 시술을 제안하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

