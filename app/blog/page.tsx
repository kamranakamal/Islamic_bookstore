import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { getSitePage } from "@/lib/data/pages";

export const metadata: Metadata = {
  title: "Blog · Maktab Muhammadiya",
  description: "Insights, reading guides, and reflections on cultivating a life anchored in knowledge."
};

export const revalidate = 60;

export default async function BlogPage() {
  const page = await getSitePage("blog");

  if (!page) {
    notFound();
  }

  const articles = page.sections.filter((section) => section.type === "article").sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <PageHero
        eyebrow={page.heroEyebrow ?? undefined}
        title={page.heroTitle ?? page.title}
        description={page.heroDescription ?? undefined}
      />
      {articles.length ? (
        <section className="grid gap-6 md:grid-cols-3">
          {articles.map((section) => (
            <article key={section.id} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">{section.heading}</h2>
              <p className="text-gray-700">{section.body}</p>
              <p className="text-sm text-gray-500">Publishing calendar coming soon.</p>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
