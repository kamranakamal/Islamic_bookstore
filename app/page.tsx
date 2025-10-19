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
      <section
        className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-gradient-to-r from-primary/10 via-white/95 to-amber-50/60 p-6 shadow-xl shadow-primary/10 backdrop-blur-sm sm:p-10"
        role="region"
        aria-labelledby="hero-heading"
      >
        <figure
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-1/2 hidden -translate-y-1/2 rotate-6 text-[220px] font-extrabold leading-none text-primary/10 opacity-70 xl:block"
        >
          العلم
        </figure>
        <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:gap-10">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">Preserving knowledge</p>
            <h1 id="hero-heading" className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
              Primary sources. Reliable scholarship. A curated bookstore for seekers of authentic knowledge.
            </h1>
            <p className="text-base text-gray-600 sm:text-lg">
              Explore classical and contemporary works vetted by students of knowledge. Build libraries that honour the
              Qur’an and authentic Sunnah with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Explore catalog
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/shop?sort=newest"
                className="inline-flex items-center gap-2 rounded-full border border-primary/70 px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                See latest arrivals
                <span aria-hidden="true">↗</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/60 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-primary/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Talk to the team
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/90 p-4 shadow-lg shadow-primary/5 ring-1 ring-white/60 backdrop-blur-sm">
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
                  className="space-y-3 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-md shadow-primary/10 backdrop-blur-sm"
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
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span>View details</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              ))
            ) : (
              <article className="space-y-3 rounded-2xl border border-white/70 bg-white/85 p-6 shadow-md shadow-primary/10 backdrop-blur-sm">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
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
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span>Browse all books</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            )}
          </aside>
        </div>
      </section>

      <section
        className="space-y-6 rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-md shadow-amber-100/40 backdrop-blur-sm sm:p-8"
        role="region"
        aria-labelledby="featured-heading"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="featured-heading" className="text-2xl font-semibold text-gray-900">
            Featured titles
          </h2>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="/shop?sort=popularity"
          >
            <span className="inline-flex items-center gap-2">
              View all
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section
        className="space-y-6 rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-md shadow-amber-100/40 backdrop-blur-sm sm:p-8"
        role="region"
        aria-labelledby="latest-heading"
      >
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="latest-heading" className="text-2xl font-semibold text-gray-900">
            Latest arrivals
          </h2>
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="/shop?sort=newest"
          >
            <span className="inline-flex items-center gap-2">
              Browse more
              <span aria-hidden="true">↗</span>
            </span>
          </Link>
        </header>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {latestBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      <section
        className="space-y-4 rounded-[2.25rem] border border-white/70 bg-white/85 p-6 shadow-md shadow-amber-100/40 backdrop-blur-sm sm:p-8"
        role="region"
        aria-labelledby="categories-heading"
      >
        <h2 id="categories-heading" className="text-2xl font-semibold text-gray-900">
          Browse by category
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Book categories">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/shop?category=${category.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span>{category.name}</span>
                <span aria-hidden="true" className="text-xs text-primary/70">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
