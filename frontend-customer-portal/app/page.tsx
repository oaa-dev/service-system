import { Button } from '@/components/ui/button';
import { Store, Calendar, ShoppingBag, Home, ArrowRight, MapPin, Star, Search, Sparkles, Heart } from 'lucide-react';
import Link from 'next/link';
import { AdPopup } from '@/components/ad-popup';

const capabilities = [
  {
    icon: Calendar,
    title: 'Book Services',
    description: 'Appointments, salon visits, consultations',
    color: 'bg-primary/10 text-primary border-primary/20',
    href: '/merchants?cap=bookings',
  },
  {
    icon: Home,
    title: 'Reserve Spaces',
    description: 'Hotels, venues, rentals & accommodations',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
    href: '/merchants?cap=rentals',
  },
  {
    icon: ShoppingBag,
    title: 'Order Products',
    description: 'Local goods, food, crafts & more',
    color: 'bg-amber-50 text-amber-700 border-amber-200/50',
    href: '/merchants?cap=products',
  },
  {
    icon: Heart,
    title: 'Save Favorites',
    description: 'Collect and revisit your top picks',
    color: 'bg-rose-50 text-rose-600 border-rose-200/50',
    href: '/merchants',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-warm">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-bold tracking-tight font-[family-name:var(--font-display)]">Marketplace</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href="/merchants">
              <Button variant="ghost" size="sm" className="text-xs">Browse</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-xs">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-4 text-xs h-8 shadow-warm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 gradient-mesh grain" />

        {/* Decorative elements */}
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-[15%] w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Pill badge */}
            <div className="animate-fade-in-down">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 ring-1 ring-primary/15 px-3 py-1 text-[11px] font-medium text-primary mb-5">
                <Sparkles className="h-3 w-3" />
                Your local marketplace
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] animate-fade-in-up font-[family-name:var(--font-display)]">
              Discover, Book &{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">Experience</span>
                <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-accent/40 -z-0 rounded-sm" />
              </span>
              <br />
              Local Services
            </h1>

            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed animate-fade-in-up delay-200">
              Browse trusted merchants near you, book appointments, reserve spaces, and shop local — all in one place.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 animate-fade-in-up delay-400">
              <Button asChild size="lg" className="rounded-full px-7 h-11 text-sm shadow-warm-lg font-semibold">
                <Link href="/merchants">
                  <Search className="mr-2 h-4 w-4" />
                  Explore Merchants
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-7 h-11 text-sm font-semibold">
                <Link href="/register">Create Free Account</Link>
              </Button>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-14 max-w-xl mx-auto animate-fade-in-up delay-600">
            <div className="flex items-center justify-center divide-x divide-border/50">
              {[
                { value: '500+', label: 'Services', icon: Sparkles },
                { value: '100+', label: 'Merchants', icon: Store },
                { value: '4.9', label: 'Rating', icon: Star },
                { value: '50+', label: 'Locations', icon: MapPin },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 px-5 py-1">
                  <stat.icon className="h-3.5 w-3.5 text-primary/50" />
                  <div>
                    <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-display)]">{stat.value}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider ml-1">{stat.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Capabilities Grid ── */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Everything you need,{' '}
              <span className="text-primary">one place</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              From discovery to checkout — connect with local businesses effortlessly.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {capabilities.map((cap, i) => (
              <Link
                key={cap.title}
                href={cap.href}
                className={`group relative flex flex-col items-center text-center p-5 rounded-2xl border bg-card shadow-warm hover-lift animate-fade-in-up ${cap.color}`}
                style={{ animationDelay: `${(i + 1) * 80}ms` }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 shadow-sm mb-3 transition-transform group-hover:scale-110">
                  <cap.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1 font-[family-name:var(--font-display)] text-foreground">{cap.title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{cap.description}</p>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 mt-2 transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-40" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-display)] max-w-md mx-auto">
            Ready to discover your next{' '}
            <span className="text-primary">local experience?</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
            Join thousands of customers who trust our marketplace.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Button asChild size="lg" className="rounded-full px-7 h-11 text-sm shadow-warm-lg font-semibold">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-7 h-11 text-sm font-semibold">
              <Link href="/merchants">Browse Merchants</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Popup Ad (once per session, non-intrusive) ── */}
      <AdPopup placement="homepage_hero" />

      {/* ── Footer ── */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Store className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold font-[family-name:var(--font-display)]">Marketplace</span>
            </div>
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <Link href="/merchants" className="hover:text-foreground transition-colors">Browse</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Marketplace
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
