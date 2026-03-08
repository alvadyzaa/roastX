import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RoastX - by Keith",
  description:
    "Dapatkan roasting sarkastik & lucu untuk profil Twitter/X lo dari AI Gemini. Masukkan username dan lihat AI nge-roast lo dengan bahasa gaul anak muda Indonesia! 🔥",
  keywords: ["roast twitter", "roast x", "AI roast", "roasting profil", "gemini ai", "hiburan"],
  openGraph: {
    title: "RoastX — Roast profil Twitter/X lo pake AI 🔥",
    description: "Dapatkan roasting sarkastik dari AI Gemini berdasarkan profil Twitter/X lo!",
    type: "website",
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔥</text></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
