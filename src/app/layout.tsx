import { isDev } from "@/lib/helper";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "./components/shared/query-provider";
import { SocketProvider } from "@/components/socket-provider";
import { Toaster } from "sonner";
import "./globals.css";
import AuthLayout from "./components/shared/auth-layout";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `Wanderly ${isDev() ? "(Development)" : ""}`,
  description: "Plan and track your travel itinerary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <SocketProvider>
            <AuthLayout>{children}</AuthLayout>
            <Toaster position='bottom-right' richColors closeButton />
          </SocketProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
