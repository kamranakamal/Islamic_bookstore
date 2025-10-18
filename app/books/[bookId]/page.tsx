import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getBookById } from "@/lib/data/books";
import { appUrl, organization } from "@/lib/config";
import { getBookLanguageLabel } from "@/lib/types";

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

  return {
    title: book.title,
    description,
    openGraph: {
      title: book.title,
      description,
      images: book.coverUrl ? [book.coverUrl] : []
    },
    alternates: {
      canonical
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description
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

  const bookJsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: book.author,
    inLanguage: book.availableLanguages.map((language) => getBookLanguageLabel(language)).join(", ") || undefined,
    numberOfPages: book.pageCount,
    image: book.coverUrl ?? undefined,
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

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }} />
      <article className="space-y-6">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm lg:max-w-sm">
          {book.coverUrl ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              sizes="(max-width: 1024px) 100vw, 400px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500">
              Cover coming soon
            </div>
          )}
        </div>

        <section className="space-y-3">
          <h1 className="text-3xl font-semibold text-gray-900">{book.title}</h1>
          <p className="text-lg text-gray-600">{book.author}</p>
          <p className="rounded-full bg-gray-100 px-3 py-1 text-xs uppercase tracking-wide text-gray-600">
            {book.categoryName}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{book.description}</p>
        </section>
      </article>

      <aside className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Local price (INR)</p>
          <p className="text-2xl font-semibold text-primary">{book.priceFormattedLocal}</p>
          <p className="text-xs text-gray-500">International customers: {book.priceFormattedInternational}</p>
        </div>
        <div className="space-y-3">
          <Link
            href={`/contact?book=${encodeURIComponent(book.id)}`}
            className="block rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Contact us about this book
          </Link>
          <Link
            href={`/cart?add=${encodeURIComponent(book.id)}`}
            className="block rounded border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Add to cart
          </Link>
        </div>
        <section className="space-y-2 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-800">Book details</h3>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt>Formats</dt>
              <dd>{formatList}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pages</dt>
              <dd>{book.pageCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Languages</dt>
              <dd>{languageList}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Stock</dt>
              <dd>{book.stockQuantity}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
