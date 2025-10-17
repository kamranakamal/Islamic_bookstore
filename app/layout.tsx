import "./globals.css";

import type { Metadata } from "next";
import { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://maktab-muhammadiya.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Maktab Muhammadiya",
    template: "%s · Maktab Muhammadiya"
  },
  description:
    "Books curated from the Qur’an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge.",
  openGraph: {
    title: "Maktab Muhammadiya",
    description:
      "Books curated from the Qur’an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge.",
    url: appUrl,
    siteName: "Maktab Muhammadiya",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Maktab Muhammadiya",
    description:
      "Books curated from the Qur’an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge."
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-gray-50">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers>
          <Header />
          <main className="mx-auto min-h-[calc(100vh-180px)] max-w-6xl px-4 py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
