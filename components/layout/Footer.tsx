import type { SVGProps } from "react";

const CONTACT_DETAILS = {
  phone: {
    label: "+91 93155 80623",
    href: "tel:+919315580623",
  },
  email: {
    label: "maktabamuhammadiya@gmail.com",
    href: "mailto:maktabamuhammadiya@gmail.com",
  },
  whatsapp: {
    label: "Chat on WhatsApp",
    href: "https://wa.me/919315580623",
    external: true,
  },
  instagram: {
    label: "@maktabamuhammadiya.__",
    href: "https://www.instagram.com/maktabamuhammadiya.__?igsh=ZDRybXFuZm9icGVj",
    external: true,
  },
};

interface ContactLink {
  title: string;
  detail: {
    label: string;
    href: string;
    external?: boolean;
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
}

const CONTACT_LINKS: ContactLink[] = [
  {
    title: "Call us",
    detail: CONTACT_DETAILS.phone,
    Icon: IconPhone,
  },
  {
    title: "WhatsApp",
    detail: CONTACT_DETAILS.whatsapp,
    Icon: IconWhatsapp,
  },
  {
    title: "Email",
    detail: CONTACT_DETAILS.email,
    Icon: IconMail,
  },
  {
    title: "Instagram",
    detail: CONTACT_DETAILS.instagram,
    Icon: IconInstagram,
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:gap-10 sm:px-6 sm:py-12 lg:px-8 xl:px-12">
        <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-lg space-y-3 sm:space-y-4">
            <p className="text-lg font-semibold tracking-tight text-white">Maktab Muhammadiya</p>
            <p className="text-sm text-slate-200">
              Books curated from the Qur’an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge for every home.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:gap-6 md:w-1/2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Stay connected</p>
              <p className="mt-2 text-sm text-slate-200">
                Reach out for orders, bulk requests, or to learn more about our latest publications.
              </p>
            </div>

            <ul className="flex flex-wrap items-center justify-start gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
              {CONTACT_LINKS.map(({ title, detail, Icon }) => (
                <li key={title}>
                  <a
                    href={detail.href}
                    target={detail.external ? "_blank" : undefined}
                    rel={detail.external ? "noopener noreferrer" : undefined}
                    className="group flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 p-3 transition hover:border-slate-200 hover:bg-slate-800/80 sm:h-auto sm:w-auto sm:justify-start sm:gap-3 sm:p-4"
                    aria-label={`${title}: ${detail.label}`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-100 shadow-inner transition group-hover:bg-slate-200 group-hover:text-slate-900">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="sr-only sm:hidden">{title}</span>
                    <span className="hidden sm:flex sm:flex-col">
                      <span className="text-sm font-medium text-white">{title}</span>
                      <span className="text-xs text-slate-300">{detail.label}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-800 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Maktab Muhammadiya. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-slate-500">
            <p>Knowledge. Character. Community.</p>
            <span className="hidden h-1 w-1 rounded-full bg-slate-600 sm:inline" aria-hidden="true" />
            <a
              href="/privacy-policy"
              className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-slate-200"
            >
              Privacy policy
            </a>
            <a
              href="/bulk-order"
              className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 transition hover:text-slate-200"
            >
              Bulk orders
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function IconPhone(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2.5 5.75c0 8.56 6.94 15.5 15.5 15.5h1.25a2 2 0 002-2v-2.06a1.2 1.2 0 00-.9-1.16l-3.9-.98a1.2 1.2 0 00-1.16.3l-.84.84a11.36 11.36 0 01-5.09-5.09l.84-.84a1.2 1.2 0 00.3-1.16l-.98-3.9a1.2 1.2 0 00-1.16-.9H4.5a2 2 0 00-2 2v1.05z" />
    </svg>
  );
}

function IconWhatsapp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3.5 20.5l1.2-4.4a8.5 8.5 0 111.6 1.6L3.5 20.5z" />
      <path d="M15.2 13.8a3.2 3.2 0 01-1.5.4 3.3 3.3 0 01-1.6-.5c-.9-.5-1.7-1.3-2.3-2.2-.5-.8-.8-1.5-.7-2 .1-.5.4-.9.8-1.2.2-.2.3-.3.4-.5.2-.3.2-.6.1-.9l-.5-1.4c-.1-.4-.4-.6-.8-.6-.3 0-.6.1-.9.3-.8.5-1.2 1.2-1.3 2.1-.1 1 .3 2.2 1.1 3.6.8 1.4 1.8 2.6 3.1 3.4 1.3.8 2.4 1.2 3.4 1.1.9-.1 1.6-.5 2.1-1.3.2-.3.3-.6.3-.9 0-.4-.2-.7-.6-.8l-1.4-.5c-.3-.1-.6-.1-.9.1-.2.1-.4.3-.5.4-.3.4-.6.7-1.1.8" />
    </svg>
  );
}

function IconMail(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5.5h16a1.5 1.5 0 011.5 1.5v10a1.5 1.5 0 01-1.5 1.5H4A1.5 1.5 0 012.5 17V7A1.5 1.5 0 014 5.5z" />
      <path d="M20.5 7L12 12.5 3.5 7" />
    </svg>
  );
}

function IconInstagram(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
