import { Shield, Zap, Globe, Users } from 'lucide-react';

const highlights = [
  {
    icon: Globe,
    title: 'Multi-Vendor Platform',
    description: 'List any type of business — from services to products, food to rentals.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Register your business and start accepting bookings within minutes.',
  },
  {
    icon: Shield,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with role-based access and data protection.',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Built-in CRM to track customers, interactions, and preferences.',
  },
];

export function LandingAbout() {
  return (
    <section id="about" className="relative bg-[#faf8f5] py-28 lg:py-36">
      {/* Top separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8956c]/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8956c]">
            About the Platform
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-[#1a1a2e] sm:text-5xl">
            Everything you need to run
            <br />
            your business online
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-[#6b6560]">
            Our marketplace connects merchants with customers through a powerful,
            all-in-one platform. Whether you offer services, sell products, or manage
            rentals — we provide the tools to help you succeed.
          </p>
        </div>

        {/* Highlights grid */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-[#e8e2db]/60 bg-white p-8 transition-all duration-300 hover:border-[#c8956c]/20 hover:shadow-xl hover:shadow-[#c8956c]/5 hover:-translate-y-1"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#c8956c]/8 text-[#c8956c] transition-colors group-hover:bg-[#c8956c]/15">
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-semibold text-[#1a1a2e]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b6560]">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mission statement */}
        <div className="mt-24 rounded-3xl bg-[#080b14] p-12 sm:p-16 lg:p-20 relative overflow-hidden">
          {/* Decorative accent */}
          <div
            className="absolute right-0 top-0 h-64 w-64 opacity-10"
            style={{
              background: 'radial-gradient(circle at top right, #c8956c, transparent 70%)',
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8956c]">
              Our Mission
            </span>
            <p className="mt-6 font-[family-name:var(--font-cormorant)] text-2xl leading-relaxed text-[#e8e2db] italic sm:text-3xl">
              &ldquo;To empower local businesses by providing a modern, accessible
              marketplace that connects them with their community and helps them thrive
              in the digital economy.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
