"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SessionUser } from "@/lib/authHelpers";
import type { UserAddress } from "@/lib/types";
import { userAddressInputSchema, userAddressUpdateSchema } from "@/lib/validators/address";

import { AddressForm, type AddressFormValues } from "./AddressForm";

const QUERY_KEY = ["profile-addresses"] as const;
type AddressesQueryData = { addresses: UserAddress[]; isAuthenticated: boolean };

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

interface SavedAddressesManagerProps {
  initialAddresses: UserAddress[];
  sessionUser: SessionUser;
}

type FormMode =
  | { type: "create" }
  | { type: "edit"; address: UserAddress };

export function SavedAddressesManager({ initialAddresses, sessionUser }: SavedAddressesManagerProps) {
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchSavedAddresses,
    initialData: { addresses: initialAddresses, isAuthenticated: true as const },
    staleTime: 30_000
  });

  const addresses = query.data?.addresses ?? [];
  const isLoading = query.isLoading;

  const defaultFormValues = useMemo(() => {
    if (!formMode) {
      return {
        label: "Home",
        fullName: sessionUser.displayName ?? sessionUser.email,
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        landmark: "",
        isDefault: addresses.length === 0
      };
    }

    if (formMode.type === "create") {
      return {
        label: "Home",
        fullName: sessionUser.displayName ?? sessionUser.email,
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "India",
        landmark: "",
        isDefault: addresses.length === 0
      };
    }

    const address = formMode.address;
    return {
      label: address.label,
      fullName: address.fullName,
      phone: address.phone ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state ?? "",
      postalCode: address.postalCode ?? "",
      country: address.country,
      landmark: address.landmark ?? "",
      isDefault: address.isDefault
    };
  }, [formMode, sessionUser.displayName, sessionUser.email, addresses.length]);

  const closeForm = () => {
    setFormMode(null);
    setError(null);
  };

  const createMutation = useMutation({
    mutationFn: async (values: unknown) => {
      const parsed = userAddressInputSchema.safeParse(values);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid address");
      }

      const response = await fetch("/api/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed.data)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to save address");
      }

      return (await response.json()) as { address: UserAddress };
    },
    onSuccess: ({ address }) => {
      queryClient.setQueryData<AddressesQueryData | undefined>(QUERY_KEY, (current) => {
        if (!current) return current;
        return { ...current, addresses: [...current.addresses, address] };
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: unknown }) => {
      const parsed = userAddressUpdateSchema.safeParse(values);
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid address");
      }

      const response = await fetch(`/api/profile/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(parsed.data)
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to update address");
      }

      return (await response.json()) as { address: UserAddress };
    },
    onSuccess: ({ address }) => {
      queryClient.setQueryData<AddressesQueryData | undefined>(QUERY_KEY, (current) => {
        if (!current) return current;
        const updated = current.addresses.map((item) => (item.id === address.id ? address : item));
        return { ...current, addresses: updated };
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/profile/addresses/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to remove address");
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<AddressesQueryData | undefined>(QUERY_KEY, (current) => {
        if (!current) return current;
        const updated = current.addresses.filter((item) => item.id !== id);
        return { ...current, addresses: updated };
      });
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (address: UserAddress) => {
      const response = await fetch(`/api/profile/addresses/${address.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDefault: true })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? "Unable to update default");
      }

      return (await response.json()) as { address: UserAddress };
    },
    onMutate: async (address) => {
      setError(null);
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });

      const previous = queryClient.getQueryData<AddressesQueryData>(QUERY_KEY);

      queryClient.setQueryData<AddressesQueryData | undefined>(QUERY_KEY, (current) => {
        if (!current) return current;

        const updated = current.addresses.map((item) =>
          item.id === address.id ? { ...item, isDefault: true } : { ...item, isDefault: false }
        );

        return { ...current, addresses: updated };
      });

      return { previous };
    },
    onError: (err, _address, context) => {
      if (context?.previous) {
        queryClient.setQueryData<AddressesQueryData>(QUERY_KEY, context.previous);
      }
      setError(err instanceof Error ? err.message : "Unable to update default");
    },
    onSuccess: ({ address }) => {
      queryClient.setQueryData<AddressesQueryData | undefined>(QUERY_KEY, (current) => {
        if (!current) return current;

        const updated = current.addresses.map((item) =>
          item.id === address.id ? address : { ...item, isDefault: false }
        );

        return { ...current, addresses: updated };
      });
    }
  });

  const handleCreate = async (values: AddressFormValues) => {
    setError(null);
    try {
      await createMutation.mutateAsync(values);
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save address");
    }
  };

  const handleUpdate = async (values: AddressFormValues) => {
    if (formMode?.type !== "edit") return;
    setError(null);
    try {
      await updateMutation.mutateAsync({ id: formMode.address.id, values });
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update address");
    }
  };

  const handleSetDefault = (address: UserAddress) => {
    if (address.isDefault) return;
    setError(null);
    setDefaultMutation.mutate(address);
  };

  const handleRemove = async (address: UserAddress) => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(address.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove address");
    }
  };

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || setDefaultMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Saved addresses</h1>
        <p className="text-sm text-gray-600">
          Store frequently used delivery details to speed up future orders and inquiries.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-600">Loading your addresses...</p>
        ) : addresses.length ? (
          <ul className="space-y-4">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="text-base font-semibold text-gray-900">
                      {address.label}
                      {address.isDefault ? (
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
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
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setFormMode({ type: "edit", address })}
                      className="rounded border border-gray-300 px-3 py-1 font-semibold text-gray-600 transition hover:border-primary hover:text-primary"
                      disabled={isSubmitting}
                    >
                      Edit
                    </button>
                    {!address.isDefault ? (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(address)}
                        className="rounded border border-primary px-3 py-1 font-semibold text-primary transition hover:bg-primary/10"
                        disabled={isSubmitting}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => handleRemove(address)}
                      className="rounded border border-red-200 px-3 py-1 font-semibold text-red-600 transition hover:bg-red-50"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
            You have not saved any addresses yet.
          </div>
        )}
      </section>

      <div className="space-y-4">
        {formMode ? (
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              {formMode.type === "create" ? "Add a new address" : "Edit address"}
            </h2>
            <p className="text-sm text-gray-600">
              Provide full delivery details so the team can process your request without delays.
            </p>
            <div className="mt-4">
              <AddressForm
                mode={formMode.type}
                defaultValues={defaultFormValues}
                onSubmit={formMode.type === "create" ? handleCreate : handleUpdate}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFormMode({ type: "create" })}
            className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Add new address
          </button>
        )}
      </div>
    </div>
  );
}
