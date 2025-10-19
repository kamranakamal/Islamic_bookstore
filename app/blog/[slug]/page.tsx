import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { getBlogPostBySlug } from "@/lib/data/blog";
import { formatDateLong } from "@/lib/utils";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export const revalidate = 60;

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Blog · Maktab Muhammadiya",
      description: "Insights, reading guides, and reflections on cultivating a life anchored in knowledge."
    } satisfies Metadata;
  }

  const description = post.excerpt ?? post.body.slice(0, 160);

  return {
    title: `${post.title} · Maktab Muhammadiya`,
    description,
    openGraph: {
      type: "article",
      title: post.title,
      description,
      publishedTime: post.publishedAt ?? undefined,
      authors: post.authorName ? [post.authorName] : undefined,
      tags: post.tags
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description
    }
  } satisfies Metadata;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const publishedDate = formatDateLong(post.publishedAt);
  const hasCustomCover = post.coverUrl && post.coverUrl !== "/logo.svg";

  return (
    <article className="space-y-10">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: post.title }
        ]}
      />
      <header className="space-y-4">
        {publishedDate ? (
          <time
            dateTime={post.publishedAt ?? undefined}
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            {publishedDate}
          </time>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">{post.title}</h1>
        {post.authorName ? <p className="text-sm text-gray-600">By {post.authorName}</p> : null}
        {post.tags.length ? (
          <ul className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {hasCustomCover ? (
          <figure className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <img src={post.coverUrl} alt="" className="h-64 w-full object-cover" />
          </figure>
        ) : null}
      </header>
      <div className="space-y-6 whitespace-pre-line text-lg leading-relaxed text-gray-700">{post.body}</div>
    </article>
  );
}
