"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { BookEditor } from "@/components/admin/BookEditor";
import { BookList } from "@/components/admin/BookList";
import type { AdminBook, AdminBooksData, CategorySummary } from "@/lib/types";

interface BooksManagerProps {
  books: AdminBook[];
  categories: CategorySummary[];
}

export function BooksManager({ books, categories }: BooksManagerProps) {
  const [selectedBook, setSelectedBook] = useState<AdminBook | null>(null);
  const [activeTab, setActiveTab] = useState<"compose" | "manage">("compose");

  const booksQuery = useQuery({
    queryKey: ["admin-books"],
    queryFn: async (): Promise<AdminBooksData> => {
      const response = await fetch("/api/admin/books");
      const data = await response.json();
      if (!response.ok) {
        throw new Error((data as { error?: string })?.error ?? "Failed to load books");
      }
      return data as AdminBooksData;
    },
    initialData: { books, categories }
  });

  const booksData = booksQuery.data?.books ?? books;
  const categoriesData = booksQuery.data?.categories ?? categories;

  useEffect(() => {
    if (!selectedBook) return;
    const fresh = booksData.find((item: AdminBook) => item.id === selectedBook.id);
    if (!fresh) {
      setSelectedBook(null);
    } else if (fresh !== selectedBook) {
      setSelectedBook(fresh);
    }
  }, [booksData, selectedBook]);

  const handleEditBook = (book: AdminBook) => {
    setSelectedBook(book);
    setActiveTab("compose");
  };

  const handleCreateBook = () => {
    setSelectedBook(null);
    setActiveTab("compose");
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-full border border-gray-200 bg-gray-100 p-1 text-xs font-semibold text-gray-600 shadow-sm sm:text-sm">
        <button
          type="button"
          className={`flex-1 rounded-full px-3 py-2 text-center transition sm:px-4 ${
            activeTab === "compose" ? "bg-white text-primary shadow" : "hover:text-primary"
          }`}
          onClick={() => setActiveTab("compose")}
        >
          Compose
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-3 py-2 text-center transition sm:px-4 ${
            activeTab === "manage" ? "bg-white text-primary shadow" : "hover:text-primary"
          }`}
          onClick={() => setActiveTab("manage")}
        >
          Manage catalog
        </button>
      </div>

      {activeTab === "compose" ? (
        <BookEditor
          categories={categoriesData}
          book={selectedBook}
          onCancel={() => setSelectedBook(null)}
          onSuccess={(updated) => {
            setSelectedBook(updated);
            setActiveTab("manage");
          }}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Existing books</h2>
              <p className="text-sm text-gray-600">
                Review and curate the catalog
                {booksQuery.isFetching ? <span className="ml-2 text-xs text-gray-400">Refreshing…</span> : null}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateBook}
              className="w-full rounded border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 sm:w-auto"
            >
              + New book
            </button>
          </div>
          <BookList books={booksData} onEdit={handleEditBook} isRefreshing={booksQuery.isFetching} />
        </div>
      )}
    </div>
  );
}
