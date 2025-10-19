import type { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHero({ title, description, eyebrow, actions }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-amber-50 to-white p-6 shadow-sm sm:p-10">
      <figure
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-6 -right-10 hidden rotate-6 text-[150px] font-extrabold leading-none text-primary/5 md:block"
      >
        الخط
      </figure>
      <div className="relative z-10 max-w-3xl space-y-4">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary sm:text-sm">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">{title}</h1>
        {description ? <p className="text-base text-gray-600 sm:text-lg">{description}</p> : null}
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
