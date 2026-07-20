import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/tab-bar";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sunday Sweets",
  description: "Emma's gluten-free baking lab notebook",
  appleWebApp: {
    capable: true,
    title: "Sunday Sweets",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f4ff",
  width: "device-width",
  initialScale: 1,
  // Extend under the notch/home indicator so env(safe-area-inset-*) is nonzero,
  // letting the tab bar clear the iPhone home indicator.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="mx-auto w-full max-w-md flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
        <TabBar />
      </body>
    </html>
  );
}
