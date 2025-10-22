import "./globals.css";

import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { ReactNode } from "react";

import { Inter } from "next/font/google";

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Providers } from "@/components/providers";
import { appUrl, organization } from "@/lib/config";
import { getSessionUser } from "@/lib/authHelpers";
import {
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  detectCurrencyFromHeaders,
  isSupportedCurrency,
  type SupportedCurrency
} from "@/lib/currency";
import type { Database, SessionTokens } from "@/lib/types";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-inter" });

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
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "android-chrome", url: "/android-chrome-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/android-chrome-512x512.png", sizes: "512x512" }
    ]
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
  const headerList = headers();
  const cookieStore = cookies();

  let initialCurrency: SupportedCurrency | null = null;
  const cookieCurrency = cookieStore.get(CURRENCY_COOKIE_NAME)?.value;
  if (isSupportedCurrency(cookieCurrency)) {
    initialCurrency = (cookieCurrency as string).toUpperCase() as SupportedCurrency;
  }

  if (!initialCurrency) {
    initialCurrency = detectCurrencyFromHeaders(headerList) ?? DEFAULT_CURRENCY;
  }

  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let sessionTokens: SessionTokens | null = null;
  if (user) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session?.access_token && session?.refresh_token) {
      sessionTokens = {
        access_token: session.access_token,
        refresh_token: session.refresh_token
      };
    }
  }
  const sessionUser = await getSessionUser();

  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} relative min-h-screen bg-transparent text-gray-900`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-[-18rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]" />
          <div className="absolute right-[-12rem] top-[35%] h-[28rem] w-[28rem] rounded-full bg-amber-200/40 blur-[160px]" />
          <div className="absolute bottom-[-14rem] left-[-8rem] h-[24rem] w-[26rem] rounded-full bg-sky-200/35 blur-[160px]" />
    </div>
    <Providers serverSession={sessionTokens} initialCurrency={initialCurrency}>
          <div className="flex min-h-screen flex-col">
            <Header sessionUser={sessionUser} />
            <main
              id="main-content"
              className="relative mx-auto mt-8 w-full max-w-7xl flex-1 rounded-[2.5rem] border border-white/70 bg-white/80 px-4 py-8 shadow-xl shadow-amber-100/40 backdrop-blur-sm sm:px-6 sm:py-10 lg:px-10"
            >
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
