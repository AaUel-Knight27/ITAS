import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "video.js/dist/video-js.css";
import "./globals.css";

import RootChrome from "@/components/ui/RootChrome";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ITAS Learning Management System",
    template: "%s | ITAS Portal",
  },
  description: "Online education and training platform for taxpayers and tax professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 text-slate-900 antialiased`}
      >
        <Providers>
          <RootChrome>{children}</RootChrome>
          <ToastNotification />
        </Providers>
      </body>
    </html>
  );
}
