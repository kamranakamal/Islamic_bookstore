"use client";

import { useEffect, useRef, useState } from "react";

import { useCart } from "@/lib/hooks/useCart";
import type { BookSummary } from "@/lib/types";

interface BookCardAddToCartButtonProps {
  book: BookSummary;
}

export function BookCardAddToCartButton({ book }: BookCardAddToCartButtonProps) {
  const { addItem } = useCart({ hydrate: false });
  const [feedback, setFeedback] = useState<"idle" | "added">("idle");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (book.stockQuantity <= 0) {
    return (
      <span className="inline-flex w-full items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-600">
        Out of stock
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem(book);
        setFeedback("added");
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          setFeedback("idle");
          timerRef.current = null;
        }, 2000);
      }}
      className="inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 disabled:cursor-not-allowed disabled:opacity-75 sm:py-2.5"
      disabled={feedback === "added"}
    >
      {feedback === "added" ? "Added to cart" : "Add to cart"}
    </button>
  );
}
