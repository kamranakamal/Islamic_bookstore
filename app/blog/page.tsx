import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/site/PageHero";
import { listPublishedBlogPosts } from "@/lib/data/blog";
import { getSitePage } from "@/lib/data/pages";
import { formatDateLong } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog · Maktab Muhammadiya",
  description: "Insights, reading guides, and reflections on cultivating a life anchored in knowledge."
};

export const revalidate = 60;

export default async function BlogPage() {
  const [page, posts] = await Promise.all([getSitePage("blog"), listPublishedBlogPosts()]);

  if (!page) {
    notFound();
  }

  const legacyArticles = page.sections
    .filter((section) => section.type === "article")
    .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <PageHero
        eyebrow={page.heroEyebrow ?? undefined}
        title={page.heroTitle ?? page.title}
        description={page.heroDescription ?? undefined}
      />

      <section className="space-y-6">
        {posts.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => {
              const publishedDate = formatDateLong(post.publishedAt);
              return (
                <article key={post.id} className="flex h-full flex-col justify-between rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="space-y-3">
                    {publishedDate ? (
                      <time dateTime={post.publishedAt ?? undefined} className="text-xs font-semibold uppercase tracking-widest text-primary">
                        {publishedDate}
                      </time>
                    ) : null}
                    <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
                    {post.excerpt ? <p className="text-sm text-gray-600">{post.excerpt}</p> : null}
                    {post.tags.length ? (
                      <ul className="flex flex-wrap gap-2 pt-2">
                        {post.tags.map((tag) => (
                          <li key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {tag}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
                    {post.authorName ? <span>By {post.authorName}</span> : <span />}
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-semibold text-primary transition hover:text-primary/80"
                    >
                      Read more →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : legacyArticles.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {legacyArticles.map((section) => (
              <article key={section.id} className="space-y-3 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">{section.heading}</h2>
                <p className="text-gray-700">{section.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
            Published articles will appear here soon.
          </div>
        )}
      </section>
    </div>
  );
}
