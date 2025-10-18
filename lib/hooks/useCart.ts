"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { BookSummary, CartBook, CartItem } from "@/lib/types";

const STORAGE_KEY = "maktab-muhammadiya-cart";
const formatLocalCurrency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

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
    return parsed
      .filter((item) => typeof item.book?.id === "string" && typeof item.quantity === "number")
      .map((item) => {
        const legacyPrice = (item.book as unknown as { priceLocalGbp?: number }).priceLocalGbp;
        const priceLocalInr =
          typeof item.book?.priceLocalInr === "number"
            ? item.book.priceLocalInr
            : typeof legacyPrice === "number"
              ? legacyPrice
              : 0;

        return {
          ...item,
          book: {
            ...item.book,
            priceLocalInr,
            priceFormattedLocal:
              typeof item.book?.priceFormattedLocal === "string"
                ? item.book.priceFormattedLocal
                : formatLocalCurrency.format(priceLocalInr)
          }
        } satisfies CartItem;
      });
  } catch (error) {
    console.warn("Failed to parse cart from storage", error);
    return [];
  }
}

function toCartBook(book: BookSummary): CartBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    priceLocalInr: book.priceLocalInr,
    priceFormattedLocal: book.priceFormattedLocal ?? formatLocalCurrency.format(book.priceLocalInr)
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
      const existing = prev.find((item: CartItem) => item.book.id === book.id);
      if (existing) {
        return prev.map((item: CartItem) =>
          item.book.id === book.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { book: toCartBook(book), quantity }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev: CartItem[]) => prev.filter((item: CartItem) => item.book.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalValue = useMemo(() => {
    return items.reduce((total: number, item: CartItem) => total + item.book.priceLocalInr * item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return formatLocalCurrency.format(subtotalValue);
  }, [subtotalValue]);

  return {
    items,
    addItem,
    removeItem,
    clear,
    subtotal,
    subtotalValue
  };
}
