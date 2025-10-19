import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { BulkOrderForm } from "@/components/site/BulkOrderForm";
import { PageHero } from "@/components/site/PageHero";
import { organization } from "@/lib/config";
import { getSitePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Bulk Orders · Maktab Muhammadiya",
  description: "Request curated book bundles, institutional supply, or wholesale support from the Maktab Muhammadiya team."
};

export const revalidate = 60;

export default async function BulkOrderPage() {
  const page = await getSitePage("bulk-order");

  if (!page) {
    notFound();
  }

  const metadata = (page.metadata ?? {}) as Record<string, unknown>;
  const primaryActionLabel =
    typeof metadata["primaryActionLabel"] === "string" ? (metadata["primaryActionLabel"] as string) : undefined;
  const primaryActionHref =
    typeof metadata["primaryActionHref"] === "string" ? (metadata["primaryActionHref"] as string) : undefined;
  const supportCards = page.sections
    .filter((section) => section.type === "card")
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bulk orders" }]} />
      <PageHero
        eyebrow={page.heroEyebrow ?? undefined}
        title={page.heroTitle ?? page.title}
        description={page.heroDescription ?? page.body ?? undefined}
        actions={
          primaryActionLabel && primaryActionHref ? (
            <a
              href={primaryActionHref}
              className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              {primaryActionLabel}
            </a>
          ) : (
            <a
              href={`mailto:${organization.contact.email}?subject=Bulk%20order%20enquiry`}
              className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
            >
              Email the team directly
            </a>
          )
        }
      />
      <section className="grid gap-8 lg:grid-cols-[1fr,1.2fr]">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">How we help</h2>
          {supportCards.length ? (
            <div className="space-y-4">
              {supportCards.map((section) => (
                <article key={section.id} className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900">{section.heading}</h3>
                  <p className="text-sm text-gray-600">{section.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
              Bulk order highlights will appear here once published.
            </div>
          )}
          <p className="text-sm text-gray-600">
            Looking for smaller personal orders? Explore the {" "}
            <a href="/shop" className="text-primary underline">
              shop
            </a>{" "}
            or connect via the {" "}
            <a href="/contact" className="text-primary underline">
              contact form
            </a>
            .
          </p>
        </div>
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Submit a request</h2>
            <p className="text-sm text-gray-600">
              Complete the form and we will prepare a tailored recommendation and quotation within two working days, in shaa Allah.
            </p>
          </div>
          <BulkOrderForm />
        </div>
      </section>
    </div>
  );
}
