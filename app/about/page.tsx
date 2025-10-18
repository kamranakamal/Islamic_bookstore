import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { getSitePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "About · Maktab Muhammadiya",
  description:
    "Learn about Maktab Muhammadiya’s mission to curate reliable Islamic scholarship and support seekers of knowledge."
};

export const revalidate = 60;

export default async function AboutPage() {
  const page = await getSitePage("about");

  if (!page) {
    notFound();
  }

  const cards = page.sections.filter((section) => section.type === "card").sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      <PageHero
        eyebrow={page.heroEyebrow ?? undefined}
        title={page.heroTitle ?? page.title}
        description={page.heroDescription ?? undefined}
      />
      {cards.length ? (
        <section className="grid gap-6 text-gray-700 md:grid-cols-2">
          {cards.map((section) => (
            <article key={section.id} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{section.heading}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
