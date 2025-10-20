"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { userAddressInputSchema } from "@/lib/validators/address";

export type AddressFormValues = z.infer<typeof userAddressInputSchema>;

interface AddressFormProps {
  mode: "create" | "edit";
  defaultValues: AddressFormValues;
  onSubmit: (values: AddressFormValues) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AddressForm({ mode, defaultValues, onSubmit, onCancel, isSubmitting }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<AddressFormValues>({
    resolver: zodResolver(userAddressInputSchema),
    defaultValues
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const submitHandler = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form className="space-y-4" onSubmit={submitHandler}>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${mode}-label`} className="mb-1 block text-sm font-medium text-gray-700">
            Label
          </label>
          <input
            id={`${mode}-label`}
            type="text"
            {...register("label")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.label ? <p className="mt-1 text-xs text-red-600">{errors.label.message}</p> : null}
        </div>
        <div>
          <label htmlFor={`${mode}-fullName`} className="mb-1 block text-sm font-medium text-gray-700">
            Recipient name
          </label>
          <input
            id={`${mode}-fullName`}
            type="text"
            autoComplete="name"
            {...register("fullName")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor={`${mode}-phone`} className="mb-1 block text-sm font-medium text-gray-700">
            Phone (optional)
          </label>
          <input
            id={`${mode}-phone`}
            type="tel"
            autoComplete="tel"
            {...register("phone")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>
        <div>
          <label htmlFor={`${mode}-city`} className="mb-1 block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            id={`${mode}-city`}
            type="text"
            autoComplete="address-level2"
            {...register("city")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.city ? <p className="mt-1 text-xs text-red-600">{errors.city.message}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor={`${mode}-line1`} className="mb-1 block text-sm font-medium text-gray-700">
          Address line 1
        </label>
        <input
          id={`${mode}-line1`}
          type="text"
          autoComplete="address-line1"
          {...register("line1")}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {errors.line1 ? <p className="mt-1 text-xs text-red-600">{errors.line1.message}</p> : null}
      </div>

      <div>
        <label htmlFor={`${mode}-line2`} className="mb-1 block text-sm font-medium text-gray-700">
          Address line 2 (optional)
        </label>
        <input
          id={`${mode}-line2`}
          type="text"
          autoComplete="address-line2"
          {...register("line2")}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {errors.line2 ? <p className="mt-1 text-xs text-red-600">{errors.line2.message}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label htmlFor={`${mode}-state`} className="mb-1 block text-sm font-medium text-gray-700">
            State / Province (optional)
          </label>
          <input
            id={`${mode}-state`}
            type="text"
            autoComplete="address-level1"
            {...register("state")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.state ? <p className="mt-1 text-xs text-red-600">{errors.state.message}</p> : null}
        </div>
        <div>
          <label htmlFor={`${mode}-postalCode`} className="mb-1 block text-sm font-medium text-gray-700">
            Postal code (optional)
          </label>
          <input
            id={`${mode}-postalCode`}
            type="text"
            autoComplete="postal-code"
            {...register("postalCode")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.postalCode ? <p className="mt-1 text-xs text-red-600">{errors.postalCode.message}</p> : null}
        </div>
        <div>
          <label htmlFor={`${mode}-country`} className="mb-1 block text-sm font-medium text-gray-700">
            Country
          </label>
          <input
            id={`${mode}-country`}
            type="text"
            autoComplete="country-name"
            {...register("country")}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {errors.country ? <p className="mt-1 text-xs text-red-600">{errors.country.message}</p> : null}
        </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60" {...register("isDefault")} />
        <span>Set as default address</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mode === "create" ? (isSubmitting ? "Saving..." : "Save address") : isSubmitting ? "Updating..." : "Update address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-gray-500 underline-offset-4 hover:underline"
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
