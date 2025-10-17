"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  query: z.string().min(2, "Enter at least two characters")
});

type SearchFormValues = z.infer<typeof schema>;

export function SearchForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SearchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { query: "" }
  });

  const onSubmit = (values: SearchFormValues) => {
    router.push(`/search?query=${encodeURIComponent(values.query)}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2" role="search" aria-label="Book search">
      <label htmlFor="search" className="text-sm font-medium text-gray-700">
        Search the catalog
      </label>
      <div className="flex items-center gap-2">
        <input
          id="search"
          type="search"
          {...register("query")}
          placeholder="Search by title, author, or topic"
          className="w-full rounded border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-describedby={errors.query ? "search-error" : undefined}
        />
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Search
        </button>
      </div>
      {errors.query ? (
        <p id="search-error" className="text-xs text-red-600">
          {errors.query.message}
        </p>
      ) : null}
    </form>
  );
}
