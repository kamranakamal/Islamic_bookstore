"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { UserAddress } from "@/lib/types";

const QUERY_KEY = ["profile-addresses"] as const;

async function fetchSavedAddresses() {
  const response = await fetch("/api/profile/addresses", {
    method: "GET",
    credentials: "include"
  });

  if (response.status === 401) {
    return { addresses: [] as UserAddress[], isAuthenticated: false as const };
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error((payload as { error?: string }).error ?? "Unable to load addresses");
  }

  const data = (await response.json()) as { addresses: UserAddress[] };
  return { addresses: data.addresses, isAuthenticated: true as const };
}

export function SavedAddressesQuickSelect() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSavedAddresses,
    staleTime: 30_000,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
        Loading saved addresses...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
        <p>We could not load your saved addresses right now.</p>
        <Link
          href="/account/addresses"
          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
        >
          Manage addresses
        </Link>
      </div>
    );
  }

  if (!data?.isAuthenticated) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
        <p>Sign in to manage saved addresses and reuse them during checkout.</p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/login?redirect=/account/addresses"
            className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
          >
            Sign in
          </Link>
          <Link
            href="/account/addresses"
            className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
          >
            Manage addresses
          </Link>
        </div>
      </div>
    );
  }

  if (!data.addresses.length) {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
        <p>Save an address on your account to reuse it here.</p>
        <Link
          href="/account/addresses"
          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
        >
          Manage addresses
        </Link>
      </div>
    );
  }

  const handleCopy = async (address: UserAddress) => {
    const lines = [
      address.fullName,
      address.line1,
      address.line2,
      `${address.city}${address.state ? `, ${address.state}` : ""}${address.postalCode ? ` ${address.postalCode}` : ""}`,
      address.country,
      address.phone ? `Phone: ${address.phone}` : null
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedId(address.id);
      setTimeout(() => setCopiedId((current) => (current === address.id ? null : current)), 2500);
    } catch (error) {
      console.error("Failed to copy address", error);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-900">Saved addresses</h2>
        <Link
          href="/account/addresses"
          className="inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
        >
          Manage addresses
        </Link>
      </div>
      <ul className="space-y-2">
        {data.addresses.map((address) => (
          <li key={address.id} className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">
              {address.label}
              {address.isDefault ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Default
                </span>
              ) : null}
            </p>
            <p>{address.fullName}</p>
            <p>{address.line1}</p>
            {address.line2 ? <p>{address.line2}</p> : null}
            <p>
              {address.city}
              {address.state ? `, ${address.state}` : ""}
              {address.postalCode ? ` ${address.postalCode}` : ""}
            </p>
            <p>{address.country}</p>
            {address.phone ? <p className="text-xs text-gray-500">Phone: {address.phone}</p> : null}
            <button
              type="button"
              onClick={() => handleCopy(address)}
              className="mt-3 inline-flex items-center rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
            >
              {copiedId === address.id ? "Copied" : "Copy details"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
