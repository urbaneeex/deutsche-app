import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import NavBar from "@/components/NavBar";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deutschlernen — Aprende alemán de verdad",
  description:
    "Flashcards con SRS, gramática, alemán coloquial de WhatsApp, situaciones reales y práctica de pronunciación.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deutschlernen",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0a09",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-950 text-stone-100">
        <AuthProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 pb-24 sm:pb-10">
            {children}
          </main>
          <ServiceWorkerRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
