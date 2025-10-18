import type { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHero({ title, description, eyebrow, actions }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-amber-50 to-white p-10 shadow-sm">
      <figure
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-6 -right-10 hidden rotate-6 text-[150px] font-extrabold leading-none text-primary/5 md:block"
      >
        الخط
      </figure>
      <div className="relative z-10 max-w-3xl space-y-4">
        {eyebrow ? <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">{title}</h1>
        {description ? <p className="text-lg text-gray-600">{description}</p> : null}
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
