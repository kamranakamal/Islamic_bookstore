"use client";

import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { getBookLanguageLabel, type AdminBook } from "@/lib/types";

interface BookListProps {
  books: AdminBook[];
  isRefreshing?: boolean;
  onEdit?: (book: AdminBook) => void;
}

export function BookList({ books, onEdit, isRefreshing = false }: BookListProps) {
  const queryClient = useQueryClient();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (!selectedBookId) return;
    const exists = books.some((item: AdminBook) => item.id === selectedBookId);
    if (!exists) {
      setSelectedBookId(null);
    }
  }, [books, selectedBookId]);

  const deleteMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await fetch(`/api/admin/books?id=${bookId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error ?? "Unable to delete book");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      setSelectedBookId(null);
    }
  });

  const sortedBooks = useMemo(() => {
    return books.slice().sort((a: AdminBook, b: AdminBook) => a.title.localeCompare(b.title));
  }, [books]);

  const totalBooks = sortedBooks.length;
  const totalPages = Math.max(1, Math.ceil(totalBooks / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalBooks);
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [totalBooks]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Current catalog</h2>
          <p className="text-sm text-gray-600">
            {totalBooks} published title{totalBooks === 1 ? "" : "s"}
            {isRefreshing ? <span className="ml-2 text-xs text-gray-400">Refreshing…</span> : null}
          </p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-4">Title</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 md:table-cell">Author</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 lg:table-cell">Category</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 xl:table-cell">Formats</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 xl:table-cell">Languages</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 lg:table-cell">Stock</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 lg:table-cell">Prices</th>
              <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 md:table-cell">Updated</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600 sm:px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedBooks.map((book: AdminBook) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 text-sm font-medium text-gray-900 sm:px-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded">
                      <Image
                        src={book.coverUrl && book.coverUrl !== "/book_cover.svg" ? book.coverUrl : "/book_cover.svg"}
                        alt={book.coverUrl && book.coverUrl !== "/book_cover.svg" ? `${book.title} cover` : "Default book cover"}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{book.title}</p>
                      <p className="truncate text-xs text-gray-500 md:hidden">{book.author}</p>
                      <p className="text-xs text-gray-500">{book.priceFormattedLocal}</p>
                      <p className="text-[11px] text-gray-400">
                        {book.galleryPaths.length ? `${book.galleryPaths.length} gallery image${
                          book.galleryPaths.length > 1 ? "s" : ""
                        }` : "No gallery images"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-700 md:table-cell">{book.author}</td>
                <td className="hidden px-4 py-3 text-sm text-gray-700 lg:table-cell">{book.categoryName}</td>
                <td className="hidden px-4 py-3 text-sm text-gray-700 xl:table-cell">
                  {book.availableFormats.length ? book.availableFormats.join(", ") : "—"}
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-700 xl:table-cell">
                  {book.availableLanguages.length
                    ? book.availableLanguages.map((language) => getBookLanguageLabel(language)).join(", ")
                    : "—"}
                </td>
                <td className="hidden px-4 py-3 text-right text-sm text-gray-700 lg:table-cell">{book.stockQuantity}</td>
                <td className="hidden px-4 py-3 text-right text-sm text-gray-700 lg:table-cell">
                  <div className="inline-flex flex-col items-end text-xs text-gray-600">
                    <span>Local (INR): {book.priceFormattedLocal}</span>
                    <span>International (USD): {book.priceFormattedInternational}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-right text-sm text-gray-500 md:table-cell">
                  {new Date(book.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-3 text-right text-sm sm:px-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-end sm:gap-2">
                    <button
                      type="button"
                      className="whitespace-nowrap rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 sm:py-1"
                      onClick={() => {
                        setSelectedBookId(null);
                        onEdit?.(book);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="whitespace-nowrap rounded border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 sm:py-1"
                      onClick={() => setSelectedBookId(book.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedBooks.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">
                  No books yet. Switch to the compose tab to add your first title.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {totalBooks > 0 ? (
        <div className="flex flex-col items-start gap-3 border-t border-gray-200 px-4 py-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs sm:text-sm">
            Showing {startIndex + 1}–{endIndex} of {totalBooks} books
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <button
              type="button"
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:py-1"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="whitespace-nowrap text-center text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="flex-1 rounded border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:py-1"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
      {selectedBookId ? (
        <div className="sticky bottom-0 z-10 border-t-2 border-red-200 bg-red-50 px-4 py-4 shadow-lg sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-red-900">
              ⚠️ Permanently remove this book from the catalog?
            </p>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                className="flex-1 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:flex-none sm:px-3 sm:py-1"
                onClick={() => setSelectedBookId(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:px-3 sm:py-1"
                onClick={() => void deleteMutation.mutateAsync(selectedBookId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Confirm Delete"}
              </button>
            </div>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-2 text-sm font-semibold text-red-700">{(deleteMutation.error as Error).message}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
