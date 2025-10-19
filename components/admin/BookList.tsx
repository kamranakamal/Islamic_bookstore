"use client";

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

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Current catalog</h2>
          <p className="text-sm text-gray-600">
            {sortedBooks.length} published titles
            {isRefreshing ? <span className="ml-2 text-xs text-gray-400">Refreshing…</span> : null}
          </p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Author</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Formats</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Languages</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Stock</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Prices</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedBooks.map((book: AdminBook) => (
              <tr key={book.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={`${book.title} cover`} className="h-12 w-8 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-8 rounded bg-gray-200" aria-hidden />
                    )}
                    <div>
                      <p>{book.title}</p>
                      <p className="text-xs text-gray-500">{book.priceFormattedLocal}</p>
                      <p className="text-[11px] text-gray-400">
                        {book.galleryPaths.length ? `${book.galleryPaths.length} gallery image${
                          book.galleryPaths.length > 1 ? "s" : ""
                        }` : "No gallery images"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{book.author}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{book.categoryName}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {book.availableFormats.length ? book.availableFormats.join(", ") : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {book.availableLanguages.length
                    ? book.availableLanguages.map((language) => getBookLanguageLabel(language)).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">{book.stockQuantity}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-700">
                  <div className="inline-flex flex-col items-end text-xs text-gray-600">
                    <span>Local (INR): {book.priceFormattedLocal}</span>
                    <span>International (USD): {book.priceFormattedInternational}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">
                  {new Date(book.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
                      onClick={() => {
                        setSelectedBookId(null);
                        onEdit?.(book);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      onClick={() => setSelectedBookId(book.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sortedBooks.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-gray-500">
                  No books yet. Use the form above to add your first title.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {selectedBookId ? (
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">Permanently remove this book from the catalog?</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
                onClick={() => setSelectedBookId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => void deleteMutation.mutateAsync(selectedBookId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Confirm"}
              </button>
            </div>
          </div>
          {deleteMutation.isError ? (
            <p className="mt-2 text-sm text-red-600">{(deleteMutation.error as Error).message}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
