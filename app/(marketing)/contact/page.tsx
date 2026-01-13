import type { Metadata } from "next";
import { submitMarketingLead } from "./actions";
import { MarketingAnchor } from "../components/marketing-anchor";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://formaos.com.au";

export const metadata: Metadata = {
  title: "FormaOS | Contact",
  description: "Request a demo or contact the FormaOS team.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "FormaOS | Contact",
    description: "Request a demo or contact the FormaOS team.",
    type: "website",
    url: `${siteUrl}/contact`,
  },
};

type ContactPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <div>
      {/* Simple Hero */}
      <section className="py-20 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Contact Us
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Get in touch with our team to learn more about FormaOS
            </p>
          </div>
        </div>
      </section>

      {/* Simple Contact Form */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-background border border-border rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Request a Demo</h2>
            <form action={submitMarketingLead} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full sm:w-auto px-8 py-3"
              >
                Send Message
              </button>
            </form>
            
            {resolvedSearchParams?.success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">Thank you! We'll be in touch soon.</p>
              </div>
            )}
            
            {resolvedSearchParams?.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">Something went wrong. Please try again.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <MarketingAnchor 
        title="Start your compliance transformation"
        subtitle="14-day free trial · No credit card required"
        badge="Get Started"
      />
    </div>
  );
}
