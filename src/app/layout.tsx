import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Bond Studio | Convert Audio to YouTube-Ready Videos",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },

  description:
    "Transform your podcast audio into professional YouTube videos with animated waveforms and auto-generated subtitles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased min-h-screen bg-[#f5f5f7] text-slate-900">
        {children}
      </body>
    </html>
  );
}
