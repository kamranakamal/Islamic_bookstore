import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";

import { getBookById } from "@/lib/data/books";
import { appUrl, organization } from "@/lib/config";
import { getBookLanguageLabel } from "@/lib/types";
import { BookGallery } from "@/components/site/BookGallery";

interface BookPageParams {
  params: {
    bookId: string;
  };
}

export const revalidate = 60;

export async function generateMetadata({ params }: BookPageParams) {
  const book = await getBookById(params.bookId);
  if (!book) return { title: "Book not found" };

  const canonical = `${appUrl}/books/${params.bookId}`;
  const description = book.description.slice(0, 180);
  const metadataImages = book.galleryUrls.length
    ? book.galleryUrls
    : book.coverUrl
      ? [book.coverUrl]
      : [];

  return {
    title: book.title,
    description,
    openGraph: {
      title: book.title,
      description,
      images: metadataImages
    },
    alternates: {
      canonical
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
      images: metadataImages.length ? metadataImages : undefined
    }
  };
}

export default async function BookPage({ params }: BookPageParams) {
  const book = await getBookById(params.bookId);
  if (!book) {
    notFound();
  }

  const canonical = `${appUrl}/books/${book.id}`;
  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: appUrl
      },
      {
        "@type": "ListItem",
        position: 2,
        name: book.categoryName,
        item: book.categorySlug ? `${appUrl}/shop?category=${book.categorySlug}` : undefined
      },
      {
        "@type": "ListItem",
        position: 3,
        name: book.title,
        item: canonical
      }
    ]
  };

  const structuredImage = book.galleryUrls.length
    ? book.galleryUrls
    : book.coverUrl
      ? [book.coverUrl]
      : undefined;

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: book.author,
    inLanguage: book.availableLanguages.map((language) => getBookLanguageLabel(language)).join(", ") || undefined,
    numberOfPages: book.pageCount,
    image: structuredImage,
    description: book.description,
    offers: [
      {
        "@type": "Offer",
        priceCurrency: "INR",
        price: book.priceLocalInr.toFixed(2),
        url: canonical,
        availability: "https://schema.org/InStock"
      },
      {
        "@type": "Offer",
        priceCurrency: "USD",
        price: book.priceInternationalUsd.toFixed(2),
        url: canonical,
        availability: "https://schema.org/InStock",
        description: "International customers"
      }
    ],
    publisher: {
      "@type": "Organization",
      name: organization.name
    }
  };

  const formatList = book.availableFormats.length ? book.availableFormats.join(", ") : "Contact us";
  const languageList = book.availableLanguages.length
    ? book.availableLanguages.map((language) => getBookLanguageLabel(language)).join(", ")
    : "Contact us";
  const isInStock = book.stockQuantity > 0;
  const highlightCards = [
    {
      label: "Pages",
      value: book.pageCount.toLocaleString(),
      helper: "Printed length"
    },
    {
      label: "Formats",
      value: formatList,
      helper: "Available editions"
    },
    {
      label: "Languages",
      value: languageList,
      helper: "Supported translations"
    },
    {
      label: "Stock",
      value: isInStock ? `${book.stockQuantity} ready` : "Currently unavailable",
      helper: "Inventory status"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-6 sm:px-4 md:px-6 lg:px-8 lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
      <div className="mb-6 flex items-center gap-3 text-sm text-gray-500">
        <Link href="/shop" className="inline-flex items-center gap-1 text-primary hover:text-primary/80">
          <span aria-hidden="true">←</span> Back to catalog
        </Link>
        <span aria-hidden="true" className="hidden text-gray-300 sm:inline">
          |
        </span>
        <span className="hidden sm:inline">{book.categoryName}</span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] xl:gap-12">
        <article className="space-y-6 lg:space-y-8">
          <BookGallery title={book.title} images={book.galleryUrls} />

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{book.categoryName}</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">By {book.author}</span>
              <span
                className={clsx(
                  "rounded-full px-3 py-1",
                  isInStock ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                )}
              >
                {isInStock ? "In stock" : "Out of stock"}
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">{book.title}</h1>
              <p className="text-base text-gray-600 sm:text-lg">
                Discover this carefully curated volume from the Maktab Muhammadiya shelves, complete with authentic sourcing and scholarly notes.
              </p>
            </div>
          </section>

          <section aria-label="Key book information" className="relative">
            <div className="pointer-events-none absolute -left-3 top-0 h-full w-6 bg-gradient-to-r from-white to-transparent sm:hidden" aria-hidden="true" />
            <div className="pointer-events-none absolute -right-3 top-0 h-full w-6 bg-gradient-to-l from-white to-transparent sm:hidden" aria-hidden="true" />
            <div
              className="flex gap-4 overflow-x-auto rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-6"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {highlightCards.map(({ label, value, helper }) => (
                <div
                  key={label}
                  className="min-w-[160px] shrink-0 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600 sm:min-w-0 sm:bg-transparent sm:text-gray-700"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{helper}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-gray-700 md:text-lg">
              {book.description}
            </p>
          </section>

          <section className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-5 text-sm text-primary/80 sm:px-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">ℹ️</span>
              <p className="flex-1 leading-relaxed text-primary/80">
                Planning a bulk order or international shipment? Reach out through our contact form and we&apos;ll arrange personalised support for your institution.
              </p>
            </div>
          </section>
        </article>

        <aside className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white/90 p-6 shadow-lg shadow-primary/10 lg:sticky lg:top-28">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500">Local price (INR)</p>
              <span
                className={clsx(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                  isInStock ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                )}
              >
                {isInStock ? "Available" : "Waitlist"}
              </span>
            </div>
            <p className="text-3xl font-semibold text-primary">{book.priceFormattedLocal}</p>
            <p className="text-xs text-gray-500">
              International customers: <span className="font-medium text-gray-600">{book.priceFormattedInternational}</span>
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link
              href={`/cart?add=${encodeURIComponent(book.id)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              <span aria-hidden="true">🛒</span>
              Add to cart
            </Link>
            <Link
              href={`/contact?book=${encodeURIComponent(book.id)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:bg-primary/10"
            >
              <span aria-hidden="true">✉️</span>
              Contact us about this title
            </Link>
          </div>

          <section className="space-y-4 text-sm text-gray-600">
            <h3 className="text-base font-semibold text-gray-900">Book details</h3>
            <dl className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Formats</dt>
                <dd className="max-w-[60%] text-right text-gray-700 sm:max-w-[70%]">{formatList}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Pages</dt>
                <dd className="text-gray-700">{book.pageCount}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Languages</dt>
                <dd className="max-w-[60%] text-right text-gray-700 sm:max-w-[70%]">{languageList}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-500">Stock</dt>
                <dd className="text-gray-700">{book.stockQuantity}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-primary">•</span>
                <span>Secure packaging keeps every copy protected during delivery.</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-primary">•</span>
                <span>Ask about tailored bundles and pricing for schools or institutions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-0.5 text-primary">•</span>
                <span>Have questions? Our team typically responds within one business day.</span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
