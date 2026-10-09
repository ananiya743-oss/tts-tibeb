import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "TT's Tibeb — Authentic Habesha Traditional Clothing",
  description:
    "Handwoven Ethiopian Habesha traditional wear. Premium Kemis, Netela, Kuta & wedding collections — heritage craftsmanship, delivered nationwide across Ethiopia.",
  keywords: [
    "Habesha", "Ethiopian clothing", "Habesha Kemis", "Netela", "Tibeb",
    "Ethiopian wedding dress", "TT's Tibeb", "African fashion"
  ],
  authors: [{ name: "TT's Tibeb" }],
  openGraph: {
    title: "TT's Tibeb — Authentic Habesha Traditional Clothing",
    description: "Handwoven Ethiopian Habesha wear. Heritage craftsmanship, modern elegance.",
    siteName: "TT's Tibeb",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TT's Tibeb — Authentic Habesha Traditional Clothing",
    description: "Handwoven Ethiopian Habesha wear. Heritage craftsmanship, modern elegance.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
