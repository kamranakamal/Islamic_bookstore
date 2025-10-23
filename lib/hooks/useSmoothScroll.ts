"use client";

import { useEffect } from "react";

/**
 * Custom hook to enable smooth scrolling across the website
 * Provides polyfill for browsers that don't support native smooth scrolling
 * Optimized for touch devices and respects user's motion preferences
 */
export function useSmoothScroll() {
  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (prefersReducedMotion) {
      // Respect user preferences - don't apply smooth scrolling
      return;
    }

    // Check if browser supports smooth scrolling
    const supportsNativeSmoothScroll = "scrollBehavior" in document.documentElement.style;

    if (!supportsNativeSmoothScroll) {
      // Polyfill for browsers that don't support smooth scrolling
      const smoothScrollPolyfill = (targetPosition: number, duration: number = 500) => {
        const startPosition = window.pageYOffset || document.documentElement.scrollTop;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();

        const easeInOutCubic = (t: number): number => {
          return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };

        const scroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = easeInOutCubic(progress);

          window.scrollTo(0, startPosition + distance * ease);

          if (progress < 1) {
            requestAnimationFrame(scroll);
          }
        };

        requestAnimationFrame(scroll);
      };

      // Override scrollIntoView for anchor links
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      
      Element.prototype.scrollIntoView = function (arg?: boolean | ScrollIntoViewOptions) {
        if (typeof arg === "object" && arg?.behavior === "smooth") {
          const rect = this.getBoundingClientRect();
          const targetPosition = window.pageYOffset + rect.top;
          smoothScrollPolyfill(targetPosition);
        } else {
          originalScrollIntoView.call(this, arg);
        }
      };

      // Handle anchor link clicks
      const handleAnchorClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest("a");

        if (anchor?.hash && anchor.hash.startsWith("#")) {
          const targetId = anchor.hash.substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            event.preventDefault();
            const rect = targetElement.getBoundingClientRect();
            const targetPosition = window.pageYOffset + rect.top;
            smoothScrollPolyfill(targetPosition);
            
            // Update URL without jumping
            if (window.history && window.history.pushState) {
              window.history.pushState(null, "", anchor.hash);
            }
          }
        }
      };

      document.addEventListener("click", handleAnchorClick);

      return () => {
        document.removeEventListener("click", handleAnchorClick);
        Element.prototype.scrollIntoView = originalScrollIntoView;
      };
    } else {
      // Browser supports native smooth scrolling, just handle anchor links
      const handleAnchorClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest("a");

        if (anchor?.hash && anchor.hash.startsWith("#")) {
          const targetId = anchor.hash.substring(1);
          const targetElement = document.getElementById(targetId);

          if (targetElement) {
            event.preventDefault();
            targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
            
            // Update URL without jumping
            if (window.history && window.history.pushState) {
              window.history.pushState(null, "", anchor.hash);
            }
          }
        }
      };

      document.addEventListener("click", handleAnchorClick);

      return () => {
        document.removeEventListener("click", handleAnchorClick);
      };
    }
  }, []);
}
