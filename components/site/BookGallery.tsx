"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface BookGalleryProps {
  title: string;
  images: string[];
}

export function BookGallery({ title, images }: BookGalleryProps) {
  const galleryImages = useMemo(() => (images.length ? images : ["/logo.svg"]), [images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const activeImage = galleryImages[Math.min(activeIndex, galleryImages.length - 1)] ?? galleryImages[0];

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % galleryImages.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryImages.length, isFullscreen]);

  const openFullscreen = useCallback(() => {
    setIsFullscreen(true);
  }, []);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const goToImage = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % galleryImages.length);
  }, [galleryImages.length]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={openFullscreen}
        className="group relative block aspect-[3/4] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Open fullscreen view for ${title}`}
      >
        <Image
          src={activeImage}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 400px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </button>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {galleryImages.map((src, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              type="button"
              key={src + index}
              onClick={() => goToImage(index)}
              className={`relative h-20 w-16 flex-shrink-0 overflow-hidden rounded border transition ${
                isActive ? "border-primary ring-2 ring-primary" : "border-gray-200 hover:border-primary/60"
              }`}
              aria-label={`View image ${index + 1} of ${galleryImages.length}`}
            >
              <Image src={src} alt={`Thumbnail ${index + 1} for ${title}`} fill sizes="80px" className="object-cover" />
            </button>
          );
        })}
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
