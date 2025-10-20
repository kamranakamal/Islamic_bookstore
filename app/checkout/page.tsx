import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutContent } from "@/components/site/checkout/CheckoutContent";
import { getSessionUser } from "@/lib/authHelpers";

export const metadata: Metadata = {
  title: "Checkout | Maktab Muhammadiya",
  description: "Confirm payment preferences and delivery details to complete your Maktab Muhammadiya order."
};

export default async function CheckoutPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect(`/login?redirect=${encodeURIComponent("/checkout")}`);
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <CheckoutContent sessionUser={sessionUser} />
    </div>
  );
}
