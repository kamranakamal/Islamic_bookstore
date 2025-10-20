"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { BookSummary, CartBook, CartItem, ShippingAddressPayload } from "@/lib/types";

const STORAGE_KEY = "maktab-muhammadiya-cart";
const STORAGE_ADDRESS_KEY = "maktab-muhammadiya-cart-address";
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

function normalizeShippingAddress(address: ShippingAddressPayload): ShippingAddressPayload {
  return {
    id: address.id ?? undefined,
    label: address.label ?? null,
    fullName: address.fullName,
    phone: address.phone ?? null,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state ?? null,
    postalCode: address.postalCode ?? null,
    country: address.country ?? "India"
  } satisfies ShippingAddressPayload;
}

function deserializeShippingAddress(value: string | null): ShippingAddressPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ShippingAddressPayload> | null;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    if (typeof parsed.fullName !== "string" || typeof parsed.line1 !== "string" || typeof parsed.city !== "string") {
      return null;
    }
    return normalizeShippingAddress({
      id: typeof parsed.id === "string" ? parsed.id : undefined,
      label: typeof parsed.label === "string" ? parsed.label : null,
      fullName: parsed.fullName,
      phone: typeof parsed.phone === "string" ? parsed.phone : null,
      line1: parsed.line1,
      line2: typeof parsed.line2 === "string" ? parsed.line2 : null,
      city: parsed.city,
      state: typeof parsed.state === "string" ? parsed.state : null,
      postalCode: typeof parsed.postalCode === "string" ? parsed.postalCode : null,
      country: typeof parsed.country === "string" ? parsed.country : "India"
    });
  } catch (error) {
    console.warn("Failed to parse cart address from storage", error);
    return null;
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRemoteSynced, setIsRemoteSynced] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddressPayload | null>(null);

  useEffect(() => {
    let storedValue: string | null = null;
    try {
      storedValue = window.localStorage.getItem(STORAGE_ADDRESS_KEY);
    } catch (error) {
      console.warn("Failed to read cart address from storage", error);
    }
    const address = deserializeShippingAddress(storedValue);
    if (address) {
      setShippingAddress(address);
    }
  }, []);

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

  useEffect(() => {
    try {
      if (shippingAddress) {
        window.localStorage.setItem(STORAGE_ADDRESS_KEY, JSON.stringify(shippingAddress));
      } else {
        window.localStorage.removeItem(STORAGE_ADDRESS_KEY);
      }
    } catch (storageError) {
      console.warn("Failed to persist cart address", storageError);
    }
  }, [shippingAddress]);

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

  const syncSetQuantity = useCallback(
    (bookId: string, quantity: number) => {
      if (!isRemoteSynced) return;

      if (quantity <= 0) {
        void fetch(`/api/profile/cart/${bookId}`, {
          method: "DELETE",
          credentials: "include"
        }).catch((error) => console.warn("Failed to sync cart remove", error));
        return;
      }

      void fetch(`/api/profile/cart/${bookId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      }).catch((error) => console.warn("Failed to sync cart quantity", error));
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

  const updateShippingAddress = useCallback((address: ShippingAddressPayload | null) => {
    setShippingAddress((prev) => {
      if (!address) return null;
      const normalized = normalizeShippingAddress(address);
      return JSON.stringify(prev) === JSON.stringify(normalized) ? prev : normalized;
    });
  }, []);

  const setItemQuantity = useCallback(
    (bookId: string, quantity: number) => {
      const safeQuantity = Math.max(0, Math.min(99, Math.floor(quantity)));

      setItems((prev: CartItem[]) => {
        if (safeQuantity <= 0) {
          return prev.filter((item) => item.book.id !== bookId);
        }

        let found = false;
        const next = prev.map((item) => {
          if (item.book.id === bookId) {
            found = true;
            return { ...item, quantity: safeQuantity } satisfies CartItem;
          }
          return item;
        });

        return found ? next : prev;
      });

      syncSetQuantity(bookId, safeQuantity);
    },
    [syncSetQuantity]
  );

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
    setItemQuantity,
    shippingAddress,
    setShippingAddress: updateShippingAddress,
    subtotal,
    subtotalValue,
    isHydrated,
    isRemoteSynced
  };
}
