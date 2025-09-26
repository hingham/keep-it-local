import type { Metadata } from "next";
import { Geist, Geist_Mono, Stick } from "next/font/google";
import "./globals.css";
import Footer, { StickyFooter } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Local Board",
  description: "Helping communities come together, and discover local events and services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>
          <div className="min-h-screen flex flex-col bg-background text-text-primary">
            <div className="container mx-auto px-4 flex-1 flex flex-col items-center sm:items-start gap-16 max-w-4xl">
              {children}
            </div>
          </div>
        </main>
        <StickyFooter />
        <Footer />
      </body>
    </html>
  );
}
