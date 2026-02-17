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

import { Viewport } from "next";

export const metadata: Metadata = {
  title: `Wanderly ${isDev() ? "(Development)" : ""}`,
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
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch maintenance mode from DB
  const maintenanceConfig = await prisma.appConfig.findUnique({
    where: { key: "maintenance-mode" },
  });

  let isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  let maintenanceEstimate = "30-60 Minutes";

  if (maintenanceConfig) {
    if (typeof maintenanceConfig.value === "boolean") {
      isMaintenanceMode = maintenanceConfig.value;
    } else if (
      typeof maintenanceConfig.value === "object" &&
      maintenanceConfig.value !== null
    ) {
      const val = maintenanceConfig.value as any;
      isMaintenanceMode = val.enabled ?? isMaintenanceMode;
      maintenanceEstimate = val.estimate || maintenanceEstimate;
    }
  }

  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <MaintenanceProvider
          isEnabled={isMaintenanceMode}
          estimate={maintenanceEstimate}
        >
          <QueryProvider>
            <SocketProvider>
              <AuthLayout>{children}</AuthLayout>
              <Toaster position='bottom-right' richColors closeButton />
            </SocketProvider>
          </QueryProvider>
        </MaintenanceProvider>
        <Analytics />
      </body>
    </html>
  );
}
