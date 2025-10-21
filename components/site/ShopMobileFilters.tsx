"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";

import type { CatalogSort } from "@/lib/data/catalog";
import type { BookLanguage, CategorySummary } from "@/lib/types";

interface ShopMobileFiltersProps {
  filters: {
    search: string;
    categories: string[];
    languages: BookLanguage[];
    sort: CatalogSort;
  };
  categories: CategorySummary[];
  languages: Array<{ value: BookLanguage; label: string }>;
  isFiltered: boolean;
  className?: string;
}

type Panel = "sort" | "category" | "language" | null;

const SORT_OPTIONS: Array<{ value: CatalogSort; label: string }> = [
  { value: "newest", label: "Newest arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popularity", label: "Featured first" }
];

export function ShopMobileFilters({ filters, categories, languages, isFiltered, className }: ShopMobileFiltersProps) {
  const [openPanel, setOpenPanel] = useState<Panel>(null);

  const togglePanel = (panel: Panel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <form
      method="get"
      className={clsx(
        "space-y-4 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm shadow-primary/5",
        className
      )}
      aria-label="Mobile catalogue filters"
    >
      <input type="hidden" name="page" value="1" />

      <div className="space-y-2">
        <label htmlFor="mobile-shop-search" className="text-sm font-semibold text-gray-900">
          Search the catalog
        </label>
        <input
          id="mobile-shop-search"
          name="search"
          type="search"
          defaultValue={filters.search}
          placeholder="Search by title or author"
          className="w-full rounded-full border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => togglePanel("sort")}
          className={clsx(
            "inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
            openPanel === "sort"
              ? "border-primary/70 bg-primary/10 text-primary"
              : "border-gray-300 bg-white text-gray-600 hover:border-primary/60 hover:text-primary"
          )}
          aria-expanded={openPanel === "sort"}
          aria-controls="mobile-sort-panel"
        >
          Sort
        </button>
        <button
          type="button"
          onClick={() => togglePanel("category")}
          className={clsx(
            "inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
            openPanel === "category"
              ? "border-primary/70 bg-primary/10 text-primary"
              : "border-gray-300 bg-white text-gray-600 hover:border-primary/60 hover:text-primary"
          )}
          aria-expanded={openPanel === "category"}
          aria-controls="mobile-category-panel"
        >
          Categories
        </button>
        <button
          type="button"
          onClick={() => togglePanel("language")}
          className={clsx(
            "inline-flex items-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition",
            openPanel === "language"
              ? "border-primary/70 bg-primary/10 text-primary"
              : "border-gray-300 bg-white text-gray-600 hover:border-primary/60 hover:text-primary"
          )}
          aria-expanded={openPanel === "language"}
          aria-controls="mobile-language-panel"
        >
          Language
        </button>
      </div>

      <div className="space-y-3 text-sm text-gray-700">
        <div
          id="mobile-sort-panel"
          className={clsx(
            "rounded-2xl border border-gray-200 bg-gray-50/80 p-4",
            openPanel === "sort" ? "block" : "hidden"
          )}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Sort by</p>
          <div className="space-y-2">
            {SORT_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-primary/30 hover:bg-white">
                <input
                  type="radio"
                  name="sort"
                  value={option.value}
                  defaultChecked={filters.sort === option.value}
                  className="h-4 w-4 text-primary focus:ring-primary/60"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div
          id="mobile-category-panel"
          className={clsx(
            "rounded-2xl border border-gray-200 bg-gray-50/80 p-4",
            openPanel === "category" ? "block" : "hidden"
          )}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Categories</p>
          <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 text-sm">
            {categories.map((category) => {
              const id = `mobile-category-${category.slug}`;
              return (
                <label key={category.slug} htmlFor={id} className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-primary/30 hover:bg-white">
                  <input
                    id={id}
                    type="checkbox"
                    name="category"
                    value={category.slug}
                    defaultChecked={filters.categories.includes(category.slug)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
                  />
                  <span>{category.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div
          id="mobile-language-panel"
          className={clsx(
            "rounded-2xl border border-gray-200 bg-gray-50/80 p-4",
            openPanel === "language" ? "block" : "hidden"
          )}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Languages</p>
          <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1 text-sm">
            {languages.map((language) => {
              const id = `mobile-language-${language.value}`;
              return (
                <label key={language.value} htmlFor={id} className="flex items-center gap-2 rounded-full border border-transparent px-3 py-2 transition hover:border-primary/30 hover:bg-white">
                  <input
                    id={id}
                    type="checkbox"
                    name="language"
                    value={language.value}
                    defaultChecked={filters.languages.includes(language.value)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/60"
                  />
                  <span>{language.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1">
        <button
          type="submit"
          className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
        >
          Apply filters
        </button>
        {isFiltered ? (
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary hover:text-primary"
          >
            Reset
          </Link>
        ) : null}
      </div>
    </form>
  );
}
