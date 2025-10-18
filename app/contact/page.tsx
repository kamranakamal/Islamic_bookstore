import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ContactForm } from "@/components/site/ContactForm";
import { PageHero } from "@/components/site/PageHero";
import { organization } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact · Maktab Muhammadiya",
  description: "Reach out to the Maktab Muhammadiya team for inquiries, institutional orders, or community collaborations."
};

const contactChannels = [
  {
    label: "Email",
    value: organization.contact.email,
    description: "General inquiries, manuscript reviews, and collaboration requests."
  },
  {
    label: "Phone",
    value: organization.contact.phone,
    description: "Reach us directly during working hours for order assistance."
  },
  {
    label: "Address",
    value: organization.address.streetAddress,
    description: `${organization.address.addressLocality}, ${organization.address.addressRegion} ${organization.address.postalCode}`
  }
];

export default function ContactPage() {
  return (
    <div className="space-y-10">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} />
      <PageHero
        eyebrow="Let’s connect"
        title="We’re here to support your learning journey."
        description="Whether you’re building a library, hosting a halaqa, or searching for specific titles, the Maktab team is ready to help."
      />
      <section className="grid gap-8 lg:grid-cols-[2fr,3fr]">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Contact details</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
            {contactChannels.map((channel) => (
              <article key={channel.label} className="space-y-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-gray-900">{channel.label}</h3>
                <p className="font-medium text-primary">{channel.value}</p>
                <p className="text-sm text-gray-600">{channel.description}</p>
              </article>
            ))}
          </div>
          <p className="text-sm text-gray-600">
            Prefer direct outreach? Call or email us using the channels above. For bulk and institutional orders, please include your organization details so we can tailor our response.
          </p>
        </div>
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">Send us a message</h2>
            <p className="text-sm text-gray-600">
              Share a few details below and someone from the Maktab team will respond within one working day in shaa Allah.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
