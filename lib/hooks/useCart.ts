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
    return normalizeCartItems(parsed);
  } catch (error) {
    console.warn("Failed to parse cart from storage", error);
    return [];
  }
}

function normalizeCartItems(items: CartItem[]): CartItem[] {
  return items
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteSynced, setIsRemoteSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      try {
        const response = await fetch("/api/profile/cart", { credentials: "include" });

        if (!response.ok || response.status === 401) {
          throw new Error("Cart not available for current session");
        }

        const data = (await response.json()) as { items?: CartItem[] };
        const normalized = normalizeCartItems(data.items ?? []);

        if (!cancelled) {
          setItems(normalized);
          setIsRemoteSynced(true);
          setIsHydrated(true);
          try {
            window.localStorage.setItem(STORAGE_KEY, serialize(normalized));
          } catch (storageError) {
            console.warn("Failed to persist cart locally", storageError);
          }
        }
      } catch (error) {
        console.warn("Falling back to local cart", error);
        let storedValue: string | null = null;
        try {
          storedValue = window.localStorage.getItem(STORAGE_KEY);
        } catch (storageError) {
          console.warn("Failed to read cart from storage", storageError);
        }
        const localItems = deserialize(storedValue);

        if (!cancelled) {
          setItems(localItems);
          setIsRemoteSynced(false);
          setIsHydrated(true);
        }
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    try {
      window.localStorage.setItem(STORAGE_KEY, serialize(items));
    } catch (storageError) {
      console.warn("Failed to store cart", storageError);
    }
  }, [items, isHydrated]);

  const syncAdd = useCallback(
    (bookId: string, quantity: number) => {
      if (!isRemoteSynced) return;
      void fetch("/api/profile/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, quantity })
      }).catch((error) => console.warn("Failed to sync cart add", error));
    },
    [isRemoteSynced]
  );

  const syncRemove = useCallback(
    (bookId: string) => {
      if (!isRemoteSynced) return;
      void fetch(`/api/profile/cart/${bookId}`, {
        method: "DELETE",
        credentials: "include"
      }).catch((error) => console.warn("Failed to sync cart remove", error));
    },
    [isRemoteSynced]
  );

  const syncClear = useCallback(() => {
    if (!isRemoteSynced) return;
    void fetch("/api/profile/cart", {
      method: "DELETE",
      credentials: "include"
    }).catch((error) => console.warn("Failed to sync cart clear", error));
  }, [isRemoteSynced]);

  const addItem = useCallback(
    (book: BookSummary, quantity = 1) => {
      setItems((prev: CartItem[]) => {
        const existing = prev.find((item: CartItem) => item.book.id === book.id);
        if (existing) {
          return prev.map((item: CartItem) =>
            item.book.id === book.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        }
        return [...prev, { book: toCartBook(book), quantity }];
      });
      syncAdd(book.id, quantity);
    },
    [syncAdd]
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev: CartItem[]) => prev.filter((item: CartItem) => item.book.id !== id));
    syncRemove(id);
  }, [syncRemove]);

  const clear = useCallback(() => {
    setItems([]);
    syncClear();
  }, [syncClear]);

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
    subtotalValue,
    isHydrated,
    isRemoteSynced
  };
}
