import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy · Maktab Muhammadiya",
  description: "Understand how Maktab Muhammadiya collects, uses, and protects your personal information."
};

const policySections = [
  {
    heading: "Data We Collect",
    body:
      "We store only the details required to process orders, deliver updates, and improve the browsing experience. This may include your name, contact information, and browsing analytics."
  },
  {
    heading: "How Information is Used",
    body:
      "Personal data is used to fulfill purchases, respond to inquiries, and share relevant product updates. We never sell your information to third parties."
  },
  {
    heading: "Your Choices",
    body:
      "You can request data removal or update your communication preferences at any time by emailing our support team."
  }
];

export default function PrivacyPolicyPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
      <PageHero
        eyebrow="Trust & Compliance"
        title="Privacy commitments you can rely on."
        description="We handle customer information with amanah (trust) by keeping data collection minimal and transparent."
      />
      <section className="space-y-6">
        {policySections.map((section) => (
          <article key={section.heading} className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{section.heading}</h2>
            <p className="text-gray-700">{section.body}</p>
          </article>
        ))}
        <p className="text-sm text-gray-500">
          Last updated {new Date().getFullYear()} · For legal inquiries please contact privacy@maktabmuhammadiya.com.
        </p>
      </section>
    </div>
  );
}
