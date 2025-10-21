import type { Metadata } from "next";

import { PaymentInstructionsContent } from "@/components/site/checkout/PaymentInstructionsContent";

export const metadata: Metadata = {
  title: "Complete Your Payment | Maktab Muhammadiya",
  description: "Choose UPI or bank transfer to complete your Maktab Muhammadiya order and share your payment receipt instantly."
};

export default function CheckoutPaymentPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <PaymentInstructionsContent />
    </div>
  );
}
