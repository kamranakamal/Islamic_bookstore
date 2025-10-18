import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { BulkOrderForm } from "@/components/site/BulkOrderForm";
import { PageHero } from "@/components/site/PageHero";
import { organization } from "@/lib/config";

export const metadata: Metadata = {
  title: "Bulk Orders · Maktab Muhammadiya",
  description: "Request curated book bundles, institutional supply, or wholesale support from the Maktab Muhammadiya team."
};

const supportPoints = [
  {
    title: "Curated collections",
    description: "We assemble libraries for masajid, schools, and community centres with classical and contemporary works."
  },
  {
    title: "Global fulfilment",
    description: "Our logistics partners help deliver large shipments across the UK and internationally with care."
  },
  {
    title: "Scholarly vetting",
    description: "Every recommendation is reviewed by our advisory circle to ensure reliability and benefit."
  }
];

export default function BulkOrderPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Bulk orders" }]} />
      <PageHero
        eyebrow="Institutions & communities"
        title="Wholesale support for learning spaces."
        description="Share your requirements and our team will craft a bulk order proposal rooted in authentic scholarship."
        actions={
          <a
            href={`mailto:${organization.contact.email}?subject=Bulk%20order%20enquiry`}
            className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
          >
            Email the team directly
          </a>
        }
      />
      <section className="grid gap-8 lg:grid-cols-[1fr,1.2fr]">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">How we help</h2>
          <div className="space-y-4">
            {supportPoints.map((point) => (
              <article key={point.title} className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">{point.title}</h3>
                <p className="text-sm text-gray-600">{point.description}</p>
              </article>
            ))}
          </div>
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
