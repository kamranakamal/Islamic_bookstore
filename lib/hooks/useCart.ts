"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { BookSummary, CartBook, CartItem } from "@/lib/types";

const STORAGE_KEY = "maktab-muhammadiya-cart";

function serialize(items: CartItem[]): string {
  return JSON.stringify(items);
}

function deserialize(value: string | null): CartItem[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item.book?.slug === "string" && typeof item.quantity === "number");
  } catch (error) {
    console.warn("Failed to parse cart from storage", error);
    return [];
  }
}

function toCartBook(book: BookSummary): CartBook {
  return {
    slug: book.slug,
    title: book.title,
    author: book.author,
    priceCents: book.priceCents,
    priceFormatted: book.priceFormatted
  };
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(deserialize(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, serialize(items));
  }, [items]);

  const addItem = useCallback((book: BookSummary, quantity = 1) => {
    setItems((prev: CartItem[]) => {
      const existing = prev.find((item: CartItem) => item.book.slug === book.slug);
      if (existing) {
        return prev.map((item: CartItem) =>
          item.book.slug === book.slug ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { book: toCartBook(book), quantity }];
    });
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev: CartItem[]) => prev.filter((item: CartItem) => item.book.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalCents = useMemo(() => {
    return items.reduce((total: number, item: CartItem) => total + item.book.priceCents * item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(subtotalCents / 100);
  }, [subtotalCents]);

  return {
    items,
    addItem,
    removeItem,
    clear,
    subtotal
  };
}
