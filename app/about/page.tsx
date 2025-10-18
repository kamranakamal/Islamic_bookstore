import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "About · Maktab Muhammadiya",
  description:
    "Learn about Maktab Muhammadiya’s mission to curate reliable Islamic scholarship and support seekers of knowledge."
};

export default function AboutPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <PageHero
        eyebrow="Our Story"
        title="Grounded in authentic scholarship and service to the ummah."
        description="Maktab Muhammadiya exists to surface rigorously reviewed publications, facilitate access to classical and contemporary works, and honour the legacy of traditional learning circles."
      />
      <section className="grid gap-6 text-gray-700 md:grid-cols-2">
        <article className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Our Mission</h2>
          <p>
            We connect students, teachers, and communities to reliable resources rooted in the Qur’an and Sunnah. Every
            title on our shelves is vetted for authenticity, relevance, and benefit.
          </p>
        </article>
        <article className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">What We Do</h2>
          <p>
            From curated book bundles to institution-friendly order fulfillment, we craft experiences that make acquiring
            knowledge simple, dignified, and accessible across the globe.
          </p>
        </article>
      </section>
    </div>
  );
}
