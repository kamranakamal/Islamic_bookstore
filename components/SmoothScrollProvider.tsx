"use client";

import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";

/**
 * Client component that initializes smooth scroll behavior on the page.
 * Must be placed inside layout.tsx within the Providers to ensure it runs in the client.
 * Call this component once near the top of your layout.
 */
export function SmoothScrollProvider(): null {
  useSmoothScroll();
  return null;
}
