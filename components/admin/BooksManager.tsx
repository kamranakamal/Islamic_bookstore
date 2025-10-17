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

  return (
    <div className="space-y-8">
      <BookEditor
        categories={categoriesData}
        book={selectedBook}
        onCancel={() => setSelectedBook(null)}
        onSuccess={(updated) =>
          setSelectedBook((previous) => {
            if (!previous) {
              return null;
            }
            return updated;
          })
        }
      />
      <BookList books={booksData} onEdit={setSelectedBook} isRefreshing={booksQuery.isFetching} />
    </div>
  );
}
