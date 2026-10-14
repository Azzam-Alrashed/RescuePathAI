import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RescuePath AI – مسار الإنقاذ الذكي",
  description:
    "منصة ذكية لإدارة الكوارث وإنقاذ الأرواح – AI-powered disaster management and rescue platform (prototype).",
};

export const viewport: Viewport = {
  themeColor: "#0e2238",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${plexArabic.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
