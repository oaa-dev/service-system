import Link from 'next/link';
import { ArrowRight, ChevronDown, Store, CalendarCheck, ShoppingBag } from 'lucide-react';

export function LandingHero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b14]">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-1/3 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #c8956c 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#f5f0eb 1px, transparent 1px), linear-gradient(90deg, #f5f0eb 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center lg:px-8">
        {/* Tag */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#c8956c]/20 bg-[#c8956c]/5 px-5 py-2 animate-fade-in">
          <div className="h-1.5 w-1.5 rounded-full bg-[#c8956c] animate-pulse" />
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8956c]">
            Now accepting merchants
          </span>
        </div>

        {/* Heading */}
        <h1
          className="font-[family-name:var(--font-cormorant)] text-5xl font-semibold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <span className="text-[#f5f0eb]">Grow Your Business.</span>
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(135deg, #c8956c 0%, #e8c9a8 50%, #c8956c 100%)',
            }}
          >
            Reach More Customers.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#8a837a] sm:text-xl animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          Join our multi-vendor marketplace platform. List your services,
          manage bookings, and grow your customer base — all from one place.
        </p>

        {/* CTAs */}
        <div
          className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up"
          style={{ animationDelay: '350ms' }}
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#c8956c] px-8 py-4 text-base font-semibold text-[#080b14] shadow-xl shadow-[#c8956c]/20 transition-all duration-300 hover:bg-[#d4a67d] hover:shadow-2xl hover:shadow-[#c8956c]/30 hover:-translate-y-0.5"
          >
            Register Your Business
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <a
            href="#about"
            className="inline-flex items-center gap-2 rounded-xl border border-[#f5f0eb]/10 px-8 py-4 text-base font-medium text-[#a8a096] transition-all duration-300 hover:border-[#f5f0eb]/20 hover:bg-white/[0.03] hover:text-[#f5f0eb]"
          >
            Learn More
          </a>
        </div>

        {/* Quick feature highlights */}
        <div
          className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 mx-auto max-w-3xl animate-fade-in-up"
          style={{ animationDelay: '500ms' }}
        >
          {[
            { icon: Store, label: 'Manage your store', desc: 'Listings, hours, and payments' },
            { icon: CalendarCheck, label: 'Accept bookings', desc: 'Appointments and reservations' },
            { icon: ShoppingBag, label: 'Sell products', desc: 'Inventory and order tracking' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:flex-col sm:items-start sm:p-5 sm:text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#c8956c]/10 text-[#c8956c]">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-[#f5f0eb]">{item.label}</p>
                <p className="text-xs text-[#5a554e] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <a href="#about" className="text-[#5a554e] transition-colors hover:text-[#c8956c]">
          <ChevronDown className="h-6 w-6" />
        </a>
      </div>
    </section>
  );
}
