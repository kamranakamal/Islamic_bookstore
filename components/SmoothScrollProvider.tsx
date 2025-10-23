"use client";

import { useSmoothScroll } from "@/lib/hooks/useSmoothScroll";

/**
 * SmoothScrollProvider component
 * Enables smooth scrolling across the entire website
 * Optimized for touch devices (mobile, tablet, touchscreen laptops)
 */
export function SmoothScrollProvider() {
  useSmoothScroll();
  return null;
}
