import Image from "next/image";
import { notFound } from "next/navigation";

import { getBookBySlug } from "@/lib/data/books";
import type { PageParams } from "@/lib/types";
import { appUrl, organization } from "@/lib/config";

export const revalidate = 60;

export async function generateMetadata({ params }: PageParams) {
  const book = await getBookBySlug(params.slug);
  if (!book) return { title: "Book not found" };

  const canonical = `${appUrl}/books/${params.slug}`;

  return {
    title: book.title,
    description: book.summary,
    openGraph: {
      title: book.title,
      description: book.summary,
      images: book.coverUrl ? [book.coverUrl] : []
    },
    alternates: {
      canonical
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description: book.summary
    }
  };
}

export default async function BookPage({ params }: PageParams) {
  const book = await getBookBySlug(params.slug);
  if (!book) {
    notFound();
  }

  const canonical = `${appUrl}/books/${book.slug}`;
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
        item: book.categorySlug ? `${appUrl}/categories/${book.categorySlug}` : undefined
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
    inLanguage: book.language,
    numberOfPages: book.pageCount,
    isbn: book.isbn ?? undefined,
    image: book.coverUrl ?? undefined,
    description: book.summary,
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: (book.priceCents / 100).toFixed(2),
      url: canonical,
      availability: "https://schema.org/InStock"
    },
    publisher: {
      "@type": "Organization",
      name: organization.name
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
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
          <p className="text-sm text-gray-500">{book.publisher}</p>
          <p className="rounded-full bg-gray-100 px-3 py-1 text-xs uppercase tracking-wide text-gray-600">
            {book.categoryName}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Synopsis</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{book.description}</p>
        </section>

        {book.highlights.length ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Highlights</h2>
            <ul className="list-disc space-y-2 pl-5 text-gray-700">
              {book.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      <aside className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Price</p>
          <p className="text-2xl font-semibold text-primary">{book.priceFormatted}</p>
          <p className="text-xs text-gray-500">Contact us for institutional discounts and bulk orders.</p>
        </div>
        <div className="space-y-3">
          <a
            href={`/order-request?book=${encodeURIComponent(book.slug)}`}
            className="block rounded bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Request this book
          </a>
          <a
            href={`/cart?add=${encodeURIComponent(book.slug)}`}
            className="block rounded border border-primary px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10"
          >
            Add to cart
          </a>
        </div>
        <section className="space-y-2 text-sm text-gray-600">
          <h3 className="font-semibold text-gray-800">Book details</h3>
          <dl className="space-y-1">
            <div className="flex justify-between">
              <dt>Format</dt>
              <dd>{book.format}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Pages</dt>
              <dd>{book.pageCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Language</dt>
              <dd>{book.language}</dd>
            </div>
            <div className="flex justify-between">
              <dt>ISBN</dt>
              <dd>{book.isbn}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  );
}
