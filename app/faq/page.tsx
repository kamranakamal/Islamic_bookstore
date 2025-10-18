import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "FAQ · Maktab Muhammadiya",
  description: "Answers to common questions about shipping, curation, digital access, and institutional support."
};

const faqs = [
  {
    question: "How are books selected?",
    answer:
      "Each title is reviewed by our advisory circle. We prioritize works grounded in sound aqeedah, reliable chains, and clear benefit for readers."
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes. We collaborate with logistics partners to reach readers worldwide. Contact us for bulk or institutional orders."
  },
  {
    question: "Can I request a specific title?",
    answer:
      "Absolutely. Reach out through the contact page or email us with details and we’ll source the edition that best matches your needs."
  }
];

export default function FAQPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <PageHero
        eyebrow="Support"
        title="Frequently asked questions."
        description="Everything you need to know about ordering, shipping, and the curation process at Maktab Muhammadiya."
      />
      <section className="space-y-4">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm open:border-primary/40"
          >
            <summary className="cursor-pointer text-base font-semibold text-gray-900">
              {faq.question}
            </summary>
            <p className="pt-3 text-gray-700">{faq.answer}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
