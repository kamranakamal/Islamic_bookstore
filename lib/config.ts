const DEFAULT_APP_URL = "http://localhost:3000";

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;

export const organization = {
  name: "Maktab Muhammadiya",
  legalName: "Maktab Muhammadiya",
  description:
    "Books curated from the Qur’an, authentic Sunnah, and the Salaf — verified sources, accessible knowledge.",
  url: appUrl,
  logo: `${appUrl}/logo.svg`,
  contact: {
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "maktabamuhammadiya@gmail.com",
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+91 93155 80623"
  },
  address: {
    streetAddress: "Azad Market Mohalla Sheesh mehel house no. 830 fourth floor front side",
    addressLocality: "Old Delhi",
    addressRegion: "Delhi",
    postalCode: "110006",
    addressCountry: "IN"
  }
};
