import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Authors · Maktab Muhammadiya",
  description: "Discover the scholars and contemporary authors featured in the Maktab Muhammadiya collection."
};

const authorCategories = [
  {
    title: "Classical Scholarship",
    description: "Foundational works from early imams whose writings continue to illuminate timeless truths."
  },
  {
    title: "Contemporary Research",
    description: "Rigorous studies and translations produced by living scholars and trusted institutes."
  },
  {
    title: "Educators & Storytellers",
    description: "Voices crafting faith-centered narratives for families, youth, and classrooms."
  }
];

export default function AuthorsPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Authors" }]} />
      <PageHero
        eyebrow="Featured Scholars"
        title="Meet the voices shaping our shelves."
        description="Browse authors by era, specialization, or language to discover texts that resonate with your journey."
      />
      <section className="grid gap-6 md:grid-cols-3">
        {authorCategories.map((item) => (
          <article key={item.title} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
            <p className="text-gray-700">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
