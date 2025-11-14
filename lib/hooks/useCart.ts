"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCurrency } from "@/components/currency/CurrencyProvider";
import { getCurrencyInfo } from "@/lib/currency";
import { getSupabaseClient } from "@/lib/supabaseClient";

import type { BookSummary, CartBook, CartItem, ShippingAddressPayload } from "@/lib/types";

type UseCartOptions = {
  hydrate?: boolean;
};

const STORAGE_KEY = "maktab-muhammadiya-cart";
const STORAGE_ADDRESS_KEY = "maktab-muhammadiya-cart-address";
const formatLocalCurrency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const formatInternationalCurrency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

let latestItems: CartItem[] = [];
let latestShippingAddress: ShippingAddressPayload | null = null;
let latestHydrated = false;
let latestRemoteSynced = false;

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
  const inrRate = getCurrencyInfo("INR").usdRate;
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
      const rawUsd = (item.book as unknown as { priceInternationalUsd?: number }).priceInternationalUsd;
      const priceInternationalUsd =
        typeof item.book?.priceInternationalUsd === "number"
          ? item.book.priceInternationalUsd
          : typeof rawUsd === "number"
            ? rawUsd
            : priceLocalInr > 0
              ? priceLocalInr / inrRate
              : 0;

      return {
        ...item,
        book: {
          ...item.book,
          priceLocalInr,
          priceFormattedLocal:
            typeof item.book?.priceFormattedLocal === "string"
              ? item.book.priceFormattedLocal
              : formatLocalCurrency.format(priceLocalInr),
          priceInternationalUsd,
          priceFormattedInternational:
            typeof item.book?.priceFormattedInternational === "string"
              ? item.book.priceFormattedInternational
              : formatInternationalCurrency.format(priceInternationalUsd)
        }
      } satisfies CartItem;
    });
}

function readCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    return deserialize(storedValue);
  } catch (error) {
    console.warn("Failed to access cart storage", error);
    return [];
  }
}

function mergeCartSources(prev: CartItem[], stored: CartItem[]): CartItem[] {
  if (!prev.length && !stored.length) {
    return [];
  }

  if (!stored.length) {
    return [...prev];
  }

  if (!prev.length) {
    return [...stored];
  }

  const map = new Map<string, CartItem>();
  for (const item of stored) {
    map.set(item.book.id, item);
  }
  for (const item of prev) {
    map.set(item.book.id, item);
  }

  return Array.from(map.values());
}

function persistCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, serialize(items));
  } catch (error) {
    console.warn("Failed to store cart", error);
  }
}

function persistShippingAddress(address: ShippingAddressPayload | null) {
  if (typeof window === "undefined") return;
  try {
    if (address) {
      window.localStorage.setItem(STORAGE_ADDRESS_KEY, JSON.stringify(address));
    } else {
      window.localStorage.removeItem(STORAGE_ADDRESS_KEY);
    }
  } catch (error) {
    console.warn("Failed to persist cart address", error);
  }
}

function toCartBook(book: BookSummary): CartBook {
  const inrRate = getCurrencyInfo("INR").usdRate;
  const priceInternationalUsd =
    book.priceInternationalUsd > 0
      ? book.priceInternationalUsd
      : book.priceLocalInr > 0
        ? book.priceLocalInr / inrRate
        : 0;
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    priceLocalInr: book.priceLocalInr,
    priceInternationalUsd,
    priceFormattedLocal: book.priceFormattedLocal ?? formatLocalCurrency.format(book.priceLocalInr),
    priceFormattedInternational:
      book.priceFormattedInternational ?? formatInternationalCurrency.format(priceInternationalUsd)
  };
}

function normalizeShippingAddress(address: ShippingAddressPayload): ShippingAddressPayload {
  const landmark = typeof address.landmark === "string" ? address.landmark.trim() : "";

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
    country: address.country ?? "India",
    landmark
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
      country: typeof parsed.country === "string" ? parsed.country : "India",
      landmark: typeof parsed.landmark === "string" ? parsed.landmark.trim() : ""
    });
  } catch (error) {
    console.warn("Failed to parse cart address from storage", error);
    return null;
  }
}

export function useCart(options: UseCartOptions = {}) {
  const { hydrate = true } = options;
  const [itemsState, setItemsState] = useState<CartItem[]>(() => (latestItems.length ? latestItems : []));
  const [isHydratedState, setIsHydratedState] = useState(() => (!hydrate ? true : latestHydrated));
  const [isRemoteSyncedState, setIsRemoteSyncedState] = useState(() => latestRemoteSynced);
  const [shippingAddressState, setShippingAddressState] = useState<ShippingAddressPayload | null>(() => latestShippingAddress);
  const { getBookPrice, formatAmount } = useCurrency();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const initialFetchRef = useRef(false);

  const commitIsHydrated = useCallback((value: boolean) => {
    latestHydrated = value;
    setIsHydratedState(value);
  }, []);

  const commitIsRemoteSynced = useCallback((value: boolean) => {
    latestRemoteSynced = value;
    setIsRemoteSyncedState(value);
  }, []);

  const commitItems = useCallback(
    (next: CartItem[], persist = true) => {
      latestItems = next;
      setItemsState(next);
      if (persist) {
        persistCartItems(next);
      }
      if (!latestHydrated) {
        commitIsHydrated(true);
      }
    },
    [commitIsHydrated]
  );

  const commitShippingAddress = useCallback((address: ShippingAddressPayload | null, persist = true) => {
    latestShippingAddress = address;
    setShippingAddressState(address);
    if (persist) {
      persistShippingAddress(address);
    }
  }, []);

  const items = itemsState;
  const isHydrated = isHydratedState;
  const isRemoteSynced = isRemoteSyncedState;
  const shippingAddress = shippingAddressState;

  const getBaselineItems = useCallback(() => {
    return mergeCartSources(latestItems, readCartFromStorage());
  }, []);

  const applyItemsUpdate = useCallback(
    (updater: (current: CartItem[]) => CartItem[]) => {
      const baseline = getBaselineItems();
      const next = updater(baseline);
      commitItems(next);
    },
    [commitItems, getBaselineItems]
  );

  useEffect(() => {
    let storedValue: string | null = null;
    try {
      storedValue = window.localStorage.getItem(STORAGE_ADDRESS_KEY);
    } catch (error) {
      console.warn("Failed to read cart address from storage", error);
    }
    const address = deserializeShippingAddress(storedValue);
    if (address) {
      commitShippingAddress(address, false);
    }
  }, [commitShippingAddress]);

  useEffect(() => {
    if (!hydrate) return;
    if (initialFetchRef.current) return;
    initialFetchRef.current = true;

    let cancelled = false;

    const hydrateFromLocal = () => {
      let storedValue: string | null = null;
      try {
        storedValue = window.localStorage.getItem(STORAGE_KEY);
      } catch (storageError) {
        console.warn("Failed to read cart from storage", storageError);
      }
      const localItems = deserialize(storedValue);

      if (!cancelled) {
        if (localItems.length || !latestItems.length) {
          commitItems(localItems);
        }
        commitIsRemoteSynced(false);
      }
    };

    const loadCart = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session) {
          hydrateFromLocal();
          commitIsHydrated(true);
          return;
        }

        const response = await fetch("/api/profile/cart", { credentials: "include" });

        if (!response.ok || response.status === 401) {
          throw new Error("Cart not available for current session");
        }

        const data = (await response.json()) as { items?: CartItem[] };
        const normalized = normalizeCartItems(data.items ?? []);

        if (!cancelled) {
          commitItems(normalized);
          commitIsRemoteSynced(true);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("session")) {
          console.info("Cart sync skipped: no active session");
        } else {
          console.warn("Falling back to local cart", error);
        }
        hydrateFromLocal();
        commitIsHydrated(true);
      }
    };

    hydrateFromLocal();
    void loadCart();

    return () => {
      cancelled = true;
    };
  }, [commitIsHydrated, commitIsRemoteSynced, commitItems, hydrate, supabase]);

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
      applyItemsUpdate((current: CartItem[]) => {
        const existingIndex = current.findIndex((item) => item.book.id === book.id);

        if (existingIndex >= 0) {
          return current.map((item, index) =>
            index === existingIndex ? ({ ...item, quantity: item.quantity + quantity } as CartItem) : item
          );
        }

        return [...current, { book: toCartBook(book), quantity } as CartItem];
      });
      syncAdd(book.id, quantity);
    },
    [applyItemsUpdate, syncAdd]
  );

  const removeItem = useCallback((id: string) => {
    applyItemsUpdate((current: CartItem[]) => current.filter((item) => item.book.id !== id));
    syncRemove(id);
  }, [applyItemsUpdate, syncRemove]);

  const clear = useCallback(() => {
    commitItems([]);
    syncClear();
  }, [commitItems, syncClear]);

  const updateShippingAddress = useCallback(
    (address: ShippingAddressPayload | null) => {
      if (!address) {
        commitShippingAddress(null);
        return;
      }

      const normalized = normalizeShippingAddress(address);
      if (JSON.stringify(latestShippingAddress) === JSON.stringify(normalized)) {
        return;
      }

      commitShippingAddress(normalized);
    },
    [commitShippingAddress]
  );

  const setItemQuantity = useCallback(
    (bookId: string, quantity: number) => {
      const safeQuantity = Math.max(0, Math.min(99, Math.floor(quantity)));

      applyItemsUpdate((current: CartItem[]) => {
        if (safeQuantity <= 0) {
          return current.filter((item) => item.book.id !== bookId);
        }

        let found = false;
        const next = current.map((item) => {
          if (item.book.id === bookId) {
            found = true;
            return { ...item, quantity: safeQuantity } as CartItem;
          }
          return item;
        });

        return found ? next : current;
      });

      syncSetQuantity(bookId, safeQuantity);
    },
    [applyItemsUpdate, syncSetQuantity]
  );

  const subtotalValue = useMemo(() => {
    return items.reduce((total: number, item: CartItem) => total + item.book.priceLocalInr * item.quantity, 0);
  }, [items]);

  const subtotalUsdValue = useMemo(() => {
    return items.reduce((total: number, item: CartItem) => total + item.book.priceInternationalUsd * item.quantity, 0);
  }, [items]);

  const subtotalConvertedValue = useMemo(() => {
    return items.reduce((total: number, item: CartItem) => total + getBookPrice(item.book, item.quantity).amount, 0);
  }, [getBookPrice, items]);

  const subtotal = useMemo(() => {
    return formatAmount(subtotalConvertedValue);
  }, [formatAmount, subtotalConvertedValue]);

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
    subtotalUsdValue,
    subtotalConvertedValue,
    isHydrated,
    isRemoteSynced
  };
}
