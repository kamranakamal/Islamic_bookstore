import "./globals.css";

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ReactNode } from "react";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers";
import { appUrl, organization } from "@/lib/config";
import type { Database } from "@/lib/types";

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
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  alternates: {
    canonical: appUrl
  },
  manifest: "/manifest.webmanifest",
  other: {
    "application-name": organization.name
  }
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return (
    <html lang="en" className="bg-gray-50">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Providers serverSession={session}>
          <Header />
          <main className="mx-auto min-h-[calc(100vh-180px)] max-w-6xl px-4 py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
