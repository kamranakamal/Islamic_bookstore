"use client";

import { useEffect } from "react";

/**
 * Smooth scroll polyfill for older browsers that don't support CSS scroll-behavior: smooth
 * or the Element.scrollIntoView({ behavior: "smooth" }) API.
 *
 * Detects browser support and uses native implementation if available,
 * falls back to easing animation for unsupported browsers.
 * Respects prefers-reduced-motion for accessibility.
 */

function supportsNativeSmoothScroll(): boolean {
  // Test if the browser supports smooth scroll behavior
  let supports = false;
  try {
    const div = document.createElement("div");
    div.scrollIntoView({ behavior: "smooth" });
    supports = true;
  } catch {
    supports = false;
  }
  return supports;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Easing function for smooth scroll animation (ease-in-out cubic)
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

/**
 * Polyfill smooth scroll behavior for browsers that don't support it.
 * Uses requestAnimationFrame to animate scrolling over ~1 second.
 */
async function smoothScrollPolyfill(
  element: Element,
  options?: ScrollIntoViewOptions & { duration?: number }
): Promise<void> {
  const duration = options?.duration ?? 1000; // Default 1 second
  const block = options?.block ?? "start";
  const inline = options?.inline ?? "nearest";

  // Get target position
  const targetRect = element.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  let targetScrollY = 0;
  let targetScrollX = 0;

  // Calculate target scroll position based on block/inline options
  if (block === "start") {
    targetScrollY = window.scrollY + targetRect.top;
  } else if (block === "center") {
    targetScrollY = window.scrollY + targetRect.top - viewport.height / 2 + targetRect.height / 2;
  } else if (block === "end") {
    targetScrollY = window.scrollY + targetRect.top - viewport.height + targetRect.height;
  }

  if (inline === "start") {
    targetScrollX = window.scrollX + targetRect.left;
  } else if (inline === "center") {
    targetScrollX = window.scrollX + targetRect.left - viewport.width / 2 + targetRect.width / 2;
  } else if (inline === "end") {
    targetScrollX = window.scrollX + targetRect.left - viewport.width + targetRect.width;
  }

  const startScrollY = window.scrollY;
  const startScrollX = window.scrollX;

  const diffY = targetScrollY - startScrollY;
  const diffX = targetScrollX - startScrollX;

  const startTime = performance.now();

  return new Promise((resolve) => {
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      window.scrollTo(startScrollX + diffX * easeProgress, startScrollY + diffY * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(animateScroll);
  });
}

/**
 * Custom hook to enable smooth scrolling via anchor links.
 * Handles anchor clicks and scrolls to the target element smoothly.
 * Respects prefers-reduced-motion accessibility setting.
 * Polyfills smooth behavior if the browser doesn't support it natively.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    const supportsSmooth = supportsNativeSmoothScroll();
    const reducedMotion = prefersReducedMotion();

    const handleAnchorClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Only handle anchor links
      if (target.tagName !== "A") return;

      const href = target.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);

      if (!targetElement) return;

      event.preventDefault();

      // If user prefers reduced motion, use instant scroll
      if (reducedMotion) {
        targetElement.scrollIntoView({ behavior: "auto" });
        return;
      }

      // Use native smooth scroll if supported, otherwise use polyfill
      if (supportsSmooth) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      } else {
        await smoothScrollPolyfill(targetElement, {
          behavior: "smooth",
          block: "start"
        });
      }
    };

    // Use passive event listener for better scroll performance
    document.addEventListener("click", handleAnchorClick, { passive: false });

    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);
}
