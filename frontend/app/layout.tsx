import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#07101f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ResQ AI — Autonomous Multi-Agent Disaster Intelligence Platform",
  description: "Enterprise Government Emergency Operations Command Center — real-time AI disaster coordination",
  keywords: ["disaster management", "AI emergency response", "real-time incident command"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
        style={{ background: "#07101f", color: "#e8edf5" }}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
