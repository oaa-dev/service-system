'use client';

import { useState, type FormEvent } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'hello@marketplace.com',
    href: 'mailto:hello@marketplace.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+1 (555) 000-1234',
    href: 'tel:+15550001234',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'Manila, Philippines',
    href: undefined,
  },
];

export function LandingContact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    // Simulate form submission (frontend only — no backend endpoint)
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <section id="contact" className="relative bg-[#faf8f5] py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8956c]">
            Get in Touch
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-[#1a1a2e] sm:text-5xl">
            Have questions?
            <br />
            We&apos;d love to hear from you.
          </h2>
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-5">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-8">
            <p className="text-lg leading-relaxed text-[#6b6560]">
              Whether you&apos;re a merchant looking to join our platform or a
              customer with questions, reach out and our team will get back to
              you within 24 hours.
            </p>

            <div className="space-y-6">
              {contactInfo.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c8956c]/8 text-[#c8956c]">
                    <item.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#a8a096]">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-0.5 text-base font-medium text-[#1a1a2e] transition-colors hover:text-[#c8956c]"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-base font-medium text-[#1a1a2e]">
                        {item.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-[#e8e2db]/60 bg-white p-8 sm:p-10 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-[#1a1a2e]">
                    Message sent!
                  </h3>
                  <p className="mt-2 text-base text-[#6b6560]">
                    Thank you for reaching out. We&apos;ll get back to you
                    shortly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-sm font-medium text-[#c8956c] underline underline-offset-4 hover:no-underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#1a1a2e]">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full rounded-xl border border-[#e8e2db] bg-[#faf8f5] px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#a8a096] outline-none transition-all focus:border-[#c8956c]/40 focus:ring-2 focus:ring-[#c8956c]/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#1a1a2e]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="w-full rounded-xl border border-[#e8e2db] bg-[#faf8f5] px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#a8a096] outline-none transition-all focus:border-[#c8956c]/40 focus:ring-2 focus:ring-[#c8956c]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1a1a2e]">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="How can we help?"
                      className="w-full rounded-xl border border-[#e8e2db] bg-[#faf8f5] px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#a8a096] outline-none transition-all focus:border-[#c8956c]/40 focus:ring-2 focus:ring-[#c8956c]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#1a1a2e]">
                      Message
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tell us more about what you need..."
                      className="w-full resize-none rounded-xl border border-[#e8e2db] bg-[#faf8f5] px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#a8a096] outline-none transition-all focus:border-[#c8956c]/40 focus:ring-2 focus:ring-[#c8956c]/10"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#c8956c] px-8 py-3.5 text-sm font-semibold text-[#080b14] shadow-lg shadow-[#c8956c]/15 transition-all duration-300 hover:bg-[#d4a67d] hover:shadow-xl hover:shadow-[#c8956c]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#080b14]/20 border-t-[#080b14]" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
