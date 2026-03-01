'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Store, Calendar, Home, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MerchantHeader } from '@/components/storefront/merchant-header';
import { MerchantGallery } from '@/components/storefront/merchant-gallery';
import { MerchantSidebar } from '@/components/storefront/merchant-sidebar';
import { ServiceCard } from '@/components/storefront/service-card';
import { SearchFilters } from '@/components/storefront/search-filters';
import { useMerchantBySlug, useMerchantServices } from '@/hooks/useStorefront';
import { useDebounce } from '@/hooks/useDebounce';


export default function MerchantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const ctaSentinelRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: merchantData, isLoading: merchantLoading } = useMerchantBySlug(slug);
  const merchant = merchantData?.data;

  const serviceParams: Record<string, unknown> = {
    page,
    per_page: 12,
  };
  if (debouncedSearch) serviceParams['filter[search]'] = debouncedSearch;
  if (selectedCategoryId) serviceParams['filter[service_category_id]'] = selectedCategoryId;

  const { data: servicesData, isLoading: servicesLoading } = useMerchantServices(slug, serviceParams);
  const services = servicesData?.data || [];
  const pagination = servicesData?.meta;

  // Extract categories from merchant data for filter chips
  const categories = merchant?.service_categories || [];

  // Mobile sticky CTA: show when the sidebar CTA section scrolls out of view
  useEffect(() => {
    if (!ctaSentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileCTA(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ctaSentinelRef.current);
    return () => observer.disconnect();
  }, [merchant]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
    setPage(1);
  };

  // Loading state
  if (merchantLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse">
          <div className="h-48 md:h-64 rounded-2xl bg-muted mb-6" />
          <div className="h-8 bg-muted rounded w-1/3 mb-4" />
          <div className="h-4 bg-muted rounded w-2/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  // Not found
  if (!merchant) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Store className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Merchant not found</h1>
        <p className="text-muted-foreground mb-4">This merchant may no longer be available</p>
        <Button asChild variant="outline">
          <Link href="/merchants">Browse all merchants</Link>
        </Button>
      </div>
    );
  }

  // Determine primary CTA for mobile sticky bar
  const primaryCTA = merchant.can_take_bookings
    ? { href: `/merchants/${merchant.slug}/book`, label: 'Book a Service', icon: Calendar }
    : merchant.can_rent_units
    ? { href: `/merchants/${merchant.slug}/reserve`, label: 'Make a Reservation', icon: Home }
    : merchant.can_sell_products
    ? { href: `/merchants/${merchant.slug}/order`, label: 'Place an Order', icon: ShoppingBag }
    : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Back button */}
      <div className="mb-4 animate-fade-in">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
          <Link href="/merchants">
            <ArrowLeft className="h-4 w-4" />
            Back to merchants
          </Link>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column -- Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Merchant Header (Cover Hero) */}
          <div className="animate-fade-in">
            <MerchantHeader merchant={merchant} />
          </div>

          {/* Gallery */}
          <div className="animate-fade-in delay-100">
            <MerchantGallery merchant={merchant} />
          </div>

          {/* CTA sentinel for mobile sticky detection */}
          <div ref={ctaSentinelRef} />

          {/* Sidebar content on mobile (shown below header, before services) */}
          <div className="md:hidden animate-fade-in delay-100">
            <MerchantSidebar merchant={merchant} />
          </div>

          {/* Services Section */}
          <div className="animate-fade-in delay-200">
            <h2 className="text-xl font-bold mb-4">Services & Products</h2>

            {/* Category Filter Chips */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => handleCategoryChange(undefined)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    !selectedCategoryId
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-primary/30'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                      selectedCategoryId === cat.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-primary/30'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}

            {/* Search within services */}
            <div className="mb-4">
              <SearchFilters
                search={search}
                onSearchChange={handleSearchChange}
                onClear={handleClearSearch}
                placeholder="Search services..."
              />
            </div>

            {/* Services Grid */}
            {servicesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-t-xl bg-muted" />
                    <div className="p-3 space-y-2 border border-t-0 rounded-b-xl border-warm-200/30">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-5 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No services found</p>
                {(search || selectedCategoryId) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setSearch('');
                      setSelectedCategoryId(undefined);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {services.map((service, i) => (
                  <div
                    key={service.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(i % 6) * 80}ms` }}
                  >
                    <ServiceCard service={service} merchantSlug={slug} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page <= 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.current_page} of {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= pagination.last_page}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column -- Sticky Sidebar (hidden on mobile, shown on md+) */}
        <div className="hidden md:block w-80 flex-shrink-0">
          <div className="sticky top-20">
            <MerchantSidebar merchant={merchant} />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom CTA */}
      {primaryCTA && showMobileCTA && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-warm-200/30 shadow-warm-xl md:hidden z-40 animate-fade-in-up">
          <Button asChild className="w-full gap-2" size="lg">
            <Link href={primaryCTA.href}>
              <primaryCTA.icon className="h-4 w-4" />
              {primaryCTA.label}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
