import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { listPublishedFaqEntries } from "@/lib/data/faq";
import { getSitePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "FAQ · Maktab Muhammadiya",
  description: "Answers to common questions about shipping, curation, digital access, and institutional support."
};

export const revalidate = 60;

export default async function FAQPage() {
  const [page, faqs] = await Promise.all([getSitePage("faq"), listPublishedFaqEntries()] as const);

  if (!page) {
    notFound();
  }

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} />
      <PageHero
        eyebrow={page.heroEyebrow ?? "Support"}
        title={page.heroTitle ?? page.title}
        description={page.heroDescription ?? undefined}
      />
      <section className="space-y-4">
        {faqs.length ? (
          faqs.map((faq) => (
            <details
              key={faq.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm open:border-primary/40"
            >
              <summary className="cursor-pointer text-base font-semibold text-gray-900">
                {faq.question}
              </summary>
              <p className="pt-3 text-gray-700">{faq.answer}</p>
            </details>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
            FAQs will appear here as soon as they are published.
          </div>
        )}
      </section>
    </div>
  );
}
