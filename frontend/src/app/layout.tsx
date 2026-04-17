import type { Metadata } from "next";
import { Geist_Mono, Montserrat, Noto_Sans_Ethiopic } from "next/font/google";
import "./globals.css";

import RootChrome from "@/components/ui/RootChrome";
import { ToastNotification } from "@/components/ui/ToastNotification";
import { Providers } from "./providers";

const montserrat = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
        className={`${montserrat.variable} ${geistMono.variable} ${notoSansEthiopic.variable} bg-background text-foreground antialiased`}
      >
        <Providers>
          <RootChrome>{children}</RootChrome>
          <ToastNotification />
        </Providers>
      </body>
    </html>
  );
}
