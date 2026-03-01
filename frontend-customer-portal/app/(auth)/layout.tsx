import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-primary gradient-mesh grain flex-col justify-between p-12">
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-warm transition-transform group-hover:scale-105">
              <span className="text-sm font-bold text-white">M</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white font-[family-name:var(--font-display)]">Marketplace</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-semibold leading-tight text-white font-[family-name:var(--font-display)]">
            Discover local services.{' '}
            <span className="text-white/80">Book with ease.</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            Browse merchants, book appointments, make reservations, and manage everything in one place.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-8 text-white/50">
          {[
            { value: '500+', label: 'Services' },
            { value: '100+', label: 'Merchants' },
            { value: '4.9', label: 'Rating' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-xl font-bold text-white/80 font-[family-name:var(--font-display)]">{stat.value}</span>
              <span className="text-xs uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Right panel — Form */}
      <div className="flex flex-1 flex-col bg-warm/30">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-warm">
              <span className="text-xs font-bold text-primary-foreground">M</span>
            </div>
            <span className="text-base font-semibold font-[family-name:var(--font-display)]">Marketplace</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12 lg:px-16">
          {children}
        </div>
      </div>
    </div>
  );
}
