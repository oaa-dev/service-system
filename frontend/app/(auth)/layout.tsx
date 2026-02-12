import Link from 'next/link';
import { Cormorant } from 'next/font/google';

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} min-h-screen flex`}>
      {/* Left panel — Brand / Illustration */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-[#080b14] flex-col justify-between p-12">
        {/* Background layers */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-12"
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

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c8956c] transition-transform duration-300 group-hover:scale-105">
              <span className="text-sm font-bold text-[#080b14]">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-[#f5f0eb]">
              Marketplace
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-md">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-[1.15] text-[#f5f0eb] xl:text-5xl">
            Grow your business.{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #c8956c 0%, #e8c9a8 100%)',
              }}
            >
              Reach more customers.
            </span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#8a837a]">
            Join our multi-vendor marketplace platform. List your services,
            manage bookings, and grow your customer base — all from one place.
          </p>
        </div>

        {/* Trust signals */}
        <div className="relative z-10 flex items-center gap-8 text-[#5a554e]">
          {[
            { value: '500+', label: 'Merchants' },
            { value: '10K+', label: 'Customers' },
            { value: '4.8', label: 'Rating' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-cormorant)] text-xl font-bold text-[#c8956c]">
                {stat.value}
              </span>
              <span className="text-xs uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c8956c]">
              <span className="text-xs font-bold text-[#080b14]">M</span>
            </div>
            <span className="text-base font-semibold">Marketplace</span>
          </Link>
        </div>

        {/* Form container */}
        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12 lg:px-16">
          {children}
        </div>
      </div>
    </div>
  );
}
