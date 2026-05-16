import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "부부 금융 대시보드 v0.1",
  description: "내부용 부부 금융 대시보드 MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
