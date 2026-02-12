import {
  CalendarCheck,
  BedDouble,
  ShoppingBag,
  ClipboardList,
} from 'lucide-react';

const services = [
  {
    icon: CalendarCheck,
    title: 'Bookings & Appointments',
    description:
      'Let customers book time-slot appointments for consultations, repairs, classes, and more. Set schedules, manage capacity, and track attendance.',
    features: ['Time-slot scheduling', 'Capacity management', 'Status tracking'],
    accent: '#c8956c',
  },
  {
    icon: BedDouble,
    title: 'Reservations & Rentals',
    description:
      'Offer date-range reservations for accommodations, equipment, venues, and rental units. Manage check-ins, check-outs, and availability.',
    features: ['Date-range booking', 'Unit management', 'Check-in/out workflow'],
    accent: '#7ca89a',
  },
  {
    icon: ShoppingBag,
    title: 'Products & Inventory',
    description:
      'Sell physical or digital products with full inventory tracking, SKU management, and stock alerts. Support for product variants and pricing.',
    features: ['Stock tracking', 'SKU management', 'Product catalog'],
    accent: '#8a7caa',
  },
  {
    icon: ClipboardList,
    title: 'Service Orders',
    description:
      'Accept and manage job-based service orders with automated order numbers, multi-step status workflows, and customer communication.',
    features: ['Order tracking', 'Status workflows', 'Auto-numbering'],
    accent: '#aa7c7c',
  },
];

export function LandingServices() {
  return (
    <section id="services" className="relative bg-white py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8956c]">
            What We Offer
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-[#1a1a2e] sm:text-5xl">
            Services tailored for
            <br />
            every business type
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#6b6560]">
            No matter what you sell or offer, our platform adapts to your business
            model with purpose-built tools.
          </p>
        </div>

        {/* Service cards — 2×2 grid */}
        <div className="mt-20 grid gap-8 md:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.title}
              className="group relative overflow-hidden rounded-2xl border border-[#e8e2db]/60 bg-[#faf8f5] p-10 transition-all duration-300 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1"
            >
              {/* Accent bar */}
              <div
                className="absolute top-0 left-0 h-1 w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: service.accent }}
              />

              <div
                className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${service.accent}12` }}
              >
                <service.icon
                  className="h-7 w-7"
                  strokeWidth={1.5}
                  style={{ color: service.accent }}
                />
              </div>

              <h3 className="text-xl font-semibold text-[#1a1a2e]">
                {service.title}
              </h3>

              <p className="mt-3 text-base leading-relaxed text-[#6b6560]">
                {service.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {service.features.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-[#e8e2db] bg-white px-3 py-1 text-xs font-medium text-[#6b6560]"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
