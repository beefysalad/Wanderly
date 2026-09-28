import { isDev } from "@/lib/helper";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "./components/shared/query-provider";
import { SocketProvider } from "@/components/socket-provider";
import { Toaster } from "sonner";
import "./globals.css";
import AuthLayout from "./components/shared/auth-layout";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: `Wanderly${isDev() ? " (Development)" : ""}`,
    template: `%s | Wanderly${isDev() ? " (Development)" : ""}`,
  },
  description: "Plan and track your travel itinerary",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wanderly",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { MaintenanceProvider } from "./components/shared/maintenance-provider";
import { getMaintenanceConfigService } from "./api/admin/config/services";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isMaintenanceMode, maintenanceEstimate } = await getMaintenanceConfigService();

  return (
    <html
      lang='en'
      suppressHydrationWarning
      style={{ backgroundColor: "#020617" }}
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-200 min-h-screen`}
        style={{ backgroundColor: "#020617" }}
        suppressHydrationWarning
      >
        <MaintenanceProvider
          isEnabled={isMaintenanceMode}
          estimate={maintenanceEstimate}
        >
          <AuthProvider>
            <QueryProvider>
              <SocketProvider>
                <AuthLayout>{children}</AuthLayout>
                <Toaster position='bottom-right' richColors closeButton />
              </SocketProvider>
            </QueryProvider>
          </AuthProvider>
        </MaintenanceProvider>
        <Analytics />
      </body>
    </html>
  );
}
