import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Store, Calendar, ShoppingBag, Home, ArrowRight, MapPin, Star, Search, Sparkles } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Search,
    title: 'Discover Locally',
    description: 'Find the best merchants, services, and experiences in your area with powerful search and filters.',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Calendar,
    title: 'Book Instantly',
    description: 'Schedule appointments and reserve time slots with real-time availability — no phone calls needed.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Home,
    title: 'Reserve Spaces',
    description: 'Browse accommodations and rental units, check availability, and lock in your dates instantly.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: ShoppingBag,
    title: 'Order Products',
    description: 'Shop from local merchants and track your orders from placement to delivery.',
    color: 'bg-rose-100 text-rose-700',
  },
];

const stats = [
  { value: '500+', label: 'Services', icon: Sparkles },
  { value: '100+', label: 'Merchants', icon: Store },
  { value: '4.9', label: 'Avg Rating', icon: Star },
  { value: '50+', label: 'Locations', icon: MapPin },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-warm">
              <Store className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight font-[family-name:var(--font-display)]">Marketplace</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/merchants">
              <Button variant="ghost" size="sm">Browse</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="rounded-full px-5">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh grain" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="animate-fade-in-down">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                Your local marketplace
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] animate-fade-in-up font-[family-name:var(--font-display)]">
              Discover, Book &{' '}
              <span className="relative">
                <span className="relative z-10 text-primary">Experience</span>
                <span className="absolute bottom-2 left-0 right-0 h-3 bg-accent/40 -z-0 rounded-sm" />
              </span>{' '}
              Local Services
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed animate-fade-in-up delay-200">
              Browse trusted merchants near you, book appointments, reserve spaces, and shop local products — all from one seamless platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up delay-400">
              <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-warm-lg">
                <Link href="/merchants">
                  Explore Merchants
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
                <Link href="/register">Create Free Account</Link>
              </Button>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 max-w-2xl mx-auto animate-fade-in-up delay-600">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-4 w-4 text-primary/60 mr-1.5" />
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight font-[family-name:var(--font-display)]">{stat.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              Everything you need,{' '}
              <span className="text-primary">one place</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-md mx-auto">
              From discovery to checkout, we make it easy to connect with local businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <Card key={feature.title} className="group border-0 shadow-warm hover-lift animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
                <CardContent className="p-6">
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl ${feature.color} mb-4 transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 font-[family-name:var(--font-display)]">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[family-name:var(--font-display)]">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to get started</p>
          </div>

          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Browse', description: 'Search and discover merchants in your area by category, service type, or location.' },
              { step: '02', title: 'Choose', description: 'Pick the service you need — booking, reservation, or product — and select your preferences.' },
              { step: '03', title: 'Enjoy', description: 'Confirm your booking and manage everything from your personal dashboard.' },
            ].map((item, i) => (
              <div key={item.step} className="text-center animate-fade-in-up" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground text-lg font-bold font-[family-name:var(--font-display)] mb-4 shadow-warm">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2 font-[family-name:var(--font-display)]">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-[family-name:var(--font-display)] max-w-lg mx-auto">
            Ready to discover your next{' '}
            <span className="text-primary">local experience?</span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Join thousands of customers who trust our marketplace to find the best services near them.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="rounded-full px-8 h-12 text-base shadow-warm-lg">
              <Link href="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 h-12 text-base">
              <Link href="/merchants">Browse Merchants</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold font-[family-name:var(--font-display)]">Marketplace</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/merchants" className="hover:text-foreground transition-colors">Browse</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Marketplace
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
