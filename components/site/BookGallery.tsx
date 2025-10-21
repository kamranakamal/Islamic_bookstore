"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface BookGalleryProps {
  title: string;
  images: string[];
}

export function BookGallery({ title, images }: BookGalleryProps) {
  const galleryImages = useMemo(() => (images.length ? images : ["/logo.svg"]), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollRef = useRef(false);
  const releaseScrollRef = useRef<number | null>(null);
  const scrollAnimationRef = useRef<number | null>(null);

  const activeImage = galleryImages[Math.min(activeIndex, galleryImages.length - 1)] ?? galleryImages[0];

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track) return;

      const slides = Array.from(track.children) as HTMLElement[];
      const target = slides[index];
      if (!target) return;

      const offset = target.offsetLeft - (track.clientWidth - target.clientWidth) / 2;
      programmaticScrollRef.current = true;
      track.scrollTo({ left: offset, behavior });

      if (releaseScrollRef.current) {
        window.clearTimeout(releaseScrollRef.current);
      }
      releaseScrollRef.current = window.setTimeout(() => {
        programmaticScrollRef.current = false;
      }, behavior === "smooth" ? 360 : 0);
    },
    []
  );

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => {
      const nextIndex = (current - 1 + galleryImages.length) % galleryImages.length;
      scrollToIndex(nextIndex);
      return nextIndex;
    });
  }, [galleryImages.length, scrollToIndex]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => {
      const nextIndex = (current + 1) % galleryImages.length;
      scrollToIndex(nextIndex);
      return nextIndex;
    });
  }, [galleryImages.length, scrollToIndex]);

  const openFullscreen = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setIsFullscreen(true);
    },
    []
  );

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const goToImage = useCallback(
    (index: number) => {
      setActiveIndex(index);
      scrollToIndex(index);
    },
    [scrollToIndex]
  );

  useEffect(() => {
    return () => {
      if (releaseScrollRef.current) {
        window.clearTimeout(releaseScrollRef.current);
      }
      if (scrollAnimationRef.current) {
        window.cancelAnimationFrame(scrollAnimationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
      if (event.key === "ArrowRight") {
        showNext();
      }
      if (event.key === "ArrowLeft") {
        showPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, showNext, showPrevious]);

  useEffect(() => {
    if (programmaticScrollRef.current) return;
    scrollToIndex(activeIndex, "auto");
  }, [activeIndex, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current) return;

    if (scrollAnimationRef.current) {
      window.cancelAnimationFrame(scrollAnimationRef.current);
    }

    scrollAnimationRef.current = window.requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track) return;
      const slides = Array.from(track.children) as HTMLElement[];
      if (!slides.length) return;

      const trackRect = track.getBoundingClientRect();
      const trackCenter = trackRect.left + trackRect.width / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      slides.forEach((slide, index) => {
        const rect = slide.getBoundingClientRect();
        const slideCenter = rect.left + rect.width / 2;
        const distance = Math.abs(slideCenter - trackCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveIndex(closestIndex);
    });
  }, []);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm shadow-primary/5 scroll-smooth focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={`Image gallery for ${title}`}
          aria-live="polite"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault();
              showNext();
            } else if (event.key === "ArrowLeft") {
              event.preventDefault();
              showPrevious();
            } else if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFullscreen(activeIndex);
            }
          }}
          onScroll={handleScroll}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {galleryImages.map((src, index) => (
            <button
              type="button"
              key={src + index}
              onClick={() => openFullscreen(index)}
              className="group relative aspect-[4/5] w-full flex-shrink-0 snap-center overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:aspect-[3/4]"
              aria-label={`View image ${index + 1} of ${galleryImages.length} in fullscreen`}
            >
              <Image
                src={src}
                alt={`${title} - image ${index + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                priority={index === 0}
              />
            </button>
          ))}
        </div>
        {galleryImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:inline-flex"
              aria-label="Show previous image"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow-md transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:inline-flex"
              aria-label="Show next image"
            >
              ›
            </button>
          </>
        ) : null}
        <span className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/90">
            {activeIndex + 1}/{galleryImages.length}
          </span>
        </span>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white via-white/80 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white via-white/80 to-transparent" aria-hidden="true" />
        <div
          className="flex gap-3 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-pl-6 pr-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {galleryImages.map((src, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                type="button"
                key={src + index}
                onClick={() => goToImage(index)}
                className={`relative h-20 w-16 flex-shrink-0 snap-center overflow-hidden rounded-xl border bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-24 sm:w-18 ${
                  isActive ? "border-primary ring-2 ring-primary" : "border-gray-200 hover:border-primary/60"
                }`}
                aria-label={`Go to image ${index + 1} of ${galleryImages.length}`}
              >
                <Image src={src} alt={`Thumbnail ${index + 1} for ${title}`} fill sizes="96px" className="object-cover" />
              </button>
            );
          })}
        </div>
      </div>

      {isFullscreen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6">
          <button
            type="button"
            onClick={closeFullscreen}
            className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close fullscreen gallery"
          >
            ×
          </button>

          {galleryImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Show previous image"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Show next image"
              >
                ›
              </button>
            </>
          ) : null}

          <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl items-center justify-center">
            <Image src={activeImage} alt={`${title} fullscreen`} fill sizes="(min-width: 1024px) 1024px" className="object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
