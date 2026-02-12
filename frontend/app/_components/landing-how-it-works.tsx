import { UserPlus, Settings2, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Register Your Business',
    description:
      'Create your account and fill in your business details. Choose your business type and set up your merchant profile.',
  },
  {
    number: '02',
    icon: Settings2,
    title: 'Set Up Your Services',
    description:
      'Add your services, products, or rental units. Configure pricing, availability, schedules, and business hours.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Start Growing',
    description:
      'Go live and start accepting bookings, orders, and reservations. Manage everything from your merchant dashboard.',
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-[#080b14] py-28 lg:py-36 overflow-hidden"
    >
      {/* Background accents */}
      <div
        className="pointer-events-none absolute -left-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full opacity-8"
        style={{
          background: 'radial-gradient(circle, #c8956c, transparent 70%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#c8956c]">
            How It Works
          </span>
          <h2 className="mt-4 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-[#f5f0eb] sm:text-5xl">
            Get started in three
            <br />
            simple steps
          </h2>
        </div>

        {/* Steps */}
        <div className="mt-20 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="group relative">
              {/* Connector line (between cards) */}
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-16 hidden h-px w-8 translate-x-full bg-gradient-to-r from-[#c8956c]/30 to-transparent md:block" />
              )}

              <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-10 transition-all duration-300 hover:border-[#c8956c]/15 hover:bg-white/[0.04]">
                {/* Step number */}
                <span className="font-[family-name:var(--font-cormorant)] text-5xl font-bold text-[#c8956c]/15">
                  {step.number}
                </span>

                <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#c8956c]/15 bg-[#c8956c]/5 text-[#c8956c]">
                  <step.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>

                <h3 className="mt-6 text-xl font-semibold text-[#f5f0eb]">
                  {step.title}
                </h3>

                <p className="mt-3 text-base leading-relaxed text-[#8a837a]">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
