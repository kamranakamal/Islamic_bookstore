import dynamic from "next/dynamic";
import type { Metadata } from "next";
import Link from "next/link";

import { BookCard } from "@/components/site/BookCard";
import { getHomepageData } from "@/lib/data/home";
import { appUrl, organization } from "@/lib/config";
import { Skeleton } from "@/components/ui/Skeleton";

const SearchForm = dynamic(() => import("@/components/site/SearchForm").then((mod) => ({ default: mod.SearchForm })), {
  ssr: false,
  loading: () => <Skeleton className="h-14 w-full" />
});

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const title = "Maktab Muhammadiya";
  const description = organization.description;

  return {
    title,
    description,
    alternates: {
      canonical: appUrl
    },
    openGraph: {
      title,
      description,
      url: appUrl,
      siteName: title
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    }
  };
}

export default async function HomePage() {
  const { featuredBooks, latestBooks, categories } = await getHomepageData();
  const heroFeatured = featuredBooks[0];
  const heroArrival = latestBooks[0];
  const heroHighlights = [
    heroFeatured && {
      id: "featured",
      label: "Featured pick",
      badgeClass: "bg-primary/10 text-primary",
      book: heroFeatured,
      description: "Curated for depth and reliability"
    },
    heroArrival && {
      id: "arrival",
      label: "New arrival",
      badgeClass: "bg-emerald-100 text-emerald-700",
      book: heroArrival,
      description: "Freshly added to our shelves"
    }
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    badgeClass: string;
    description: string;
    book: (typeof featuredBooks)[number];
  }>;

  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: organization.name,
            url: organization.url,
            logo: organization.logo,
            description: organization.description,
            contactPoint: [
              {
                "@type": "ContactPoint",
                telephone: organization.contact.phone,
                contactType: "customer service",
                email: organization.contact.email
              }
            ],
            address: {
              "@type": "PostalAddress",
              streetAddress: organization.address.streetAddress,
              addressLocality: organization.address.addressLocality,
              addressRegion: organization.address.addressRegion,
              postalCode: organization.address.postalCode,
              addressCountry: organization.address.addressCountry
            }
          })
        }}
      />
  <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 via-amber-50 to-white p-6 shadow-sm sm:p-10">
        <figure
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 rotate-6 text-[220px] font-extrabold leading-none text-primary/5 xl:block"
        >
          العلم
        </figure>
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:gap-10">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">Preserving knowledge</p>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
              Primary sources. Reliable scholarship. A curated bookstore for seekers of authentic knowledge.
            </h1>
            <p className="text-base text-gray-600 sm:text-lg">
              Explore classical and contemporary works vetted by students of knowledge. Build libraries that honour the
              Qur’an and authentic Sunnah with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Explore catalog
              </Link>
              <Link
                href="/shop?sort=newest"
                className="rounded border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                See latest arrivals
              </Link>
              <Link
                href="/contact"
                className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
              >
                Talk to the team
              </Link>
            </div>
            <div className="rounded-xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur">
              <label htmlFor="hero-search" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                Search the catalogue
              </label>
              <div className="mt-2">
                <SearchForm />
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            {heroHighlights.length > 0 ? (
              heroHighlights.map((highlight) => (
                <article
                  key={highlight.id}
                  className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-lg shadow-primary/5"
                >
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${highlight.badgeClass}`}
                  >
                    {highlight.label}
                  </span>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold text-gray-900">{highlight.book.title}</h2>
                    <p className="text-sm text-gray-600">
                      {highlight.book.author} · {highlight.book.categoryName}
                    </p>
                    <p className="text-sm text-gray-500">{highlight.description}</p>
                  </div>
                  <Link
                    href={`/books/${highlight.book.id}`}
                    className="inline-flex items-center text-sm font-semibold text-primary transition hover:text-primary/80"
                  >
                    View details →
                  </Link>
                </article>
              ))
            ) : (
              <article className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-lg shadow-primary/5">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Curated selection
                </span>
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">Catalog highlights</h2>
                  <p className="text-sm text-gray-600">
                    Stay tuned — featured titles and new arrivals appear here as soon as they’re published.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="inline-flex items-center text-sm font-semibold text-primary transition hover:text-primary/80"
                >
                  Browse all books →
                </Link>
              </article>
            )}
          </aside>
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Featured titles</h2>
          <Link className="text-sm font-semibold text-primary" href="/shop?sort=popularity">
            View all
          </Link>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">Latest arrivals</h2>
          <Link className="text-sm font-semibold text-primary" href="/shop?sort=newest">
            Browse more
          </Link>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Browse by category</h2>
        <ul className="flex flex-wrap gap-3" aria-label="Book categories">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/shop?category=${category.slug}`}
                className="inline-flex items-center rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:border-primary hover:text-primary"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
