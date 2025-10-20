import { z } from "zod";

export const userAddressInputSchema = z.object({
  label: z.string().trim().min(2, "Label must be at least 2 characters"),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .optional()
    .nullable(),
  line1: z.string().trim().min(3, "Address line is required"),
  line2: z.string().trim().max(160, "Address line is too long").optional().nullable(),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().max(120, "Region is too long").optional().nullable(),
  postalCode: z.string().trim().max(20, "Postal code is too long").optional().nullable(),
  country: z.string().trim().min(2, "Country is required"),
  isDefault: z.boolean().optional()
});

export const userAddressUpdateSchema = userAddressInputSchema.partial();

export type UserAddressInput = z.infer<typeof userAddressInputSchema>;
export type UserAddressUpdateInput = z.infer<typeof userAddressUpdateSchema>;
