import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/components/providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Elrhea Clinic - Sistem Informasi Manajemen Klinik",
  description: "Elrhea Clinic - Sistem informasi manajemen klinik terpadu untuk pendaftaran, antrian, rekam medis, kasir, dan laporan.",
};

import AppConfigProvider from "@/components/providers/AppConfigProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AppConfigProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AppConfigProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
