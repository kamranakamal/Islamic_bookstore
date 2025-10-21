"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { SearchResult } from "@/lib/types";

const schema = z.object({
  query: z.string().min(2, "Enter at least two characters")
});

type SearchFormValues = z.infer<typeof schema>;

type SearchApiResponse = {
  books: SearchResult[];
  total: number;
  totalPages: number;
};

export function SearchForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<SearchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { query: "" }
  });

  const { ref: queryRef, onChange: onQueryChange, onBlur: onQueryBlur, name: queryName } = register("query");

  const inputId = useId();
  const listboxId = `${inputId}-suggestions`;
  const statusId = `${inputId}-status`;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurTimeoutRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const queryValue = watch("query")?.trim() ?? "";

  const closeSuggestions = useCallback(() => {
    setSuggestionsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  const selectSuggestion = useCallback(
    (bookId: string) => {
      closeSuggestions();
      router.push(`/books/${bookId}`);
    },
    [closeSuggestions, router]
  );

  const submitSearch = useCallback(
    (value: string) => {
      closeSuggestions();
      router.push(`/search?query=${encodeURIComponent(value)}`);
    },
    [closeSuggestions, router]
  );

  const fetchSuggestions = useCallback(
    async (value: string) => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        closeSuggestions();
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsFetching(true);
      setFetchError(null);

      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(value)}&page=1`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

  const data = (await response.json()) as SearchApiResponse;
  const items = data.books.slice(0, 6);
  setSuggestions(items);
  const shouldOpen = items.length > 0 && document.activeElement === inputRef.current;
  setSuggestionsOpen(shouldOpen);
  setHighlightedIndex(shouldOpen ? 0 : -1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Search suggestions error", error);
        setFetchError("Unable to load suggestions right now.");
        setSuggestions([]);
        closeSuggestions();
      } finally {
        setIsFetching(false);
      }
    },
    [closeSuggestions]
  );

  useEffect(() => {
    if (!queryValue || queryValue.length < 2) {
      setSuggestions([]);
      closeSuggestions();
      return;
    }

    const handle = window.setTimeout(() => {
      fetchSuggestions(queryValue);
    }, 220);

    return () => window.clearTimeout(handle);
  }, [queryValue, fetchSuggestions, closeSuggestions]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const onSubmit = (values: SearchFormValues) => {
    submitSearch(values.query.trim());
  };

  const handleInputFocus = () => {
    if (suggestions.length) {
      setSuggestionsOpen(true);
    }
  };

  const scheduleBlurClose = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = window.setTimeout(() => {
      closeSuggestions();
    }, 120);
  };

  const cancelBlurClose = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
  };

  const totalOptions = suggestions.length + (queryValue.length >= 2 ? 1 : 0);
  const viewAllIndex = suggestions.length;

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!totalOptions) return;

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setSuggestionsOpen(true);
        setHighlightedIndex((index) => {
          const next = index + 1;
          return next >= totalOptions ? 0 : next;
        });
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setSuggestionsOpen(true);
        setHighlightedIndex((index) => {
          if (index <= 0) {
            return totalOptions - 1;
          }
          return index - 1;
        });
        break;
      }
      case "Enter": {
        if (highlightedIndex >= 0) {
          event.preventDefault();
          if (highlightedIndex === viewAllIndex) {
            submitSearch(queryValue);
          } else {
            const item = suggestions[highlightedIndex];
            if (item) {
              selectSuggestion(item.id);
            }
          }
        }
        break;
      }
      case "Escape": {
        closeSuggestions();
        break;
      }
      default:
        break;
    }
  };

  const handleSuggestionMouseEnter = (index: number) => {
    setHighlightedIndex(index);
  };

  const handleSuggestionClick = (bookId: string) => {
    selectSuggestion(bookId);
  };

  const assistiveStatus = suggestionsOpen
    ? highlightedIndex === viewAllIndex
      ? `Press enter to view all results for ${queryValue}.`
      : highlightedIndex >= 0 && suggestions[highlightedIndex]
        ? `Go to ${suggestions[highlightedIndex].title}.`
        : `${suggestions.length} suggestions available.`
    : fetchError
      ? fetchError
      : isFetching && queryValue.length >= 2
        ? "Loading suggestions…"
        : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2" role="search" aria-label="Book search">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        Search the catalog
      </label>
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            id={inputId}
            type="search"
            name={queryName}
            ref={(node) => {
              queryRef(node);
              inputRef.current = node;
            }}
            placeholder="Search by title, author, or topic"
            className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-describedby={errors.query ? "search-error" : statusId}
            aria-autocomplete="list"
            aria-controls={suggestionsOpen ? listboxId : undefined}
            aria-expanded={suggestionsOpen}
            aria-activedescendant={
              highlightedIndex >= 0 && highlightedIndex < suggestions.length
                ? `${inputId}-option-${highlightedIndex}`
                : highlightedIndex === viewAllIndex
                  ? `${inputId}-option-view-all`
                  : undefined
            }
            role="combobox"
            autoComplete="off"
            onFocus={handleInputFocus}
            onBlur={(event) => {
              onQueryBlur(event);
              scheduleBlurClose();
            }}
            onChange={(event) => {
              onQueryChange(event);
            }}
            onKeyDown={handleInputKeyDown}
          />
          <button
            type="submit"
            className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Search
          </button>
        </div>
        {suggestionsOpen ? (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Search suggestions"
            className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-30 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
            onMouseDown={cancelBlurClose}
            onPointerDown={cancelBlurClose}
            onMouseLeave={() => setHighlightedIndex(-1)}
          >
            {suggestions.map((item, index) => (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${inputId}-option-${index}`}
                  aria-selected={highlightedIndex === index}
                  onMouseEnter={() => handleSuggestionMouseEnter(index)}
                  onFocus={() => setHighlightedIndex(index)}
                  onClick={() => handleSuggestionClick(item.id)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition hover:bg-primary/5 focus:bg-primary/10 ${
                    highlightedIndex === index ? "bg-primary/5" : "bg-white"
                  }`}
                >
                  <span className="flex-1">
                    <span className="block font-semibold text-gray-900">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-gray-500">{item.author}</span>
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">View</span>
                </button>
              </li>
            ))}
            {queryValue.length >= 2 ? (
              <li role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`${inputId}-option-view-all`}
                  aria-selected={highlightedIndex === viewAllIndex}
                  onMouseEnter={() => handleSuggestionMouseEnter(viewAllIndex)}
                  onFocus={() => setHighlightedIndex(viewAllIndex)}
                  onClick={() => submitSearch(queryValue)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm font-semibold transition hover:bg-primary/5 focus:bg-primary/10 ${
                    highlightedIndex === viewAllIndex ? "bg-primary/5" : "bg-white"
                  }`}
                >
                  <span>View all results for “{queryValue}”</span>
                  <span className="text-xs uppercase tracking-wide text-primary">↵</span>
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
      <div id={statusId} role="status" aria-live="polite" className="sr-only">
        {assistiveStatus}
      </div>
      {errors.query ? (
        <p id="search-error" className="text-xs text-red-600">
          {errors.query.message}
        </p>
      ) : null}
    </form>
  );
}
