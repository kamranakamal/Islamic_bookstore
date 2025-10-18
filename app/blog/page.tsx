import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";

export const metadata: Metadata = {
  title: "Blog · Maktab Muhammadiya",
  description: "Insights, reading guides, and reflections on cultivating a life anchored in knowledge."
};

const placeholders = [
  {
    title: "Reading Qur’anic Commentary with Intention",
    summary: "A practical roadmap for approaching tafsir works with structure and humility."
  },
  {
    title: "Inside the Maktab: How We Vet Each Title",
    summary: "Peek into our review process and the scholarly advisors who help us maintain trust."
  },
  {
    title: "Building a Home Library",
    summary: "Suggestions for families designing learning spaces nourished by sacred knowledge."
  }
];

export default function BlogPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <PageHero
        eyebrow="Knowledge Notes"
        title="Articles and reflections from the Maktab team."
        description="Stay connected with curated reading plans, event recaps, and guidance from our editorial board."
      />
      <section className="grid gap-6 md:grid-cols-3">
        {placeholders.map((post) => (
          <article key={post.title} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
            <p className="text-gray-700">{post.summary}</p>
            <p className="text-sm text-gray-500">Publishing calendar coming soon.</p>
          </article>
        ))}
      </section>
    </div>
  );
}
