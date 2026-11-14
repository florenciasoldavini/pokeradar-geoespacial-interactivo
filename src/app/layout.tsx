import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Only a fallback behind the LCD font: don't spend first-load bandwidth on it.
  preload: false,
});

export const metadata: Metadata = {
  title: "PokéRadar · Argentina",
  description:
    "Explorá los biomas de Argentina y descubrí qué Pokémon habitan cada rincón del mapa.",
};

export const viewport: Viewport = {
  themeColor: "#b81f29",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
