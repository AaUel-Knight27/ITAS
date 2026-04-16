import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Ethiopic } from "next/font/google";
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

const notoSansEthiopic = Noto_Sans_Ethiopic({
  variable: "--font-ethiopic",
  subsets: ["ethiopic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansEthiopic.variable} bg-background text-foreground antialiased`}
      >
        <Providers>
          <RootChrome>{children}</RootChrome>
          <ToastNotification />
        </Providers>
      </body>
    </html>
  );
}
