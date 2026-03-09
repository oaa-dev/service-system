'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Store, Calendar, Home, ShoppingBag, ArrowLeft, MessageCircle, GitBranch, Info, Gift, UserPlus, Copy, Check, Star, User, Phone, Mail, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MerchantHeader } from '@/components/storefront/merchant-header';
import { MerchantGallery } from '@/components/storefront/merchant-gallery';
import { MerchantSidebar } from '@/components/storefront/merchant-sidebar';
import { ServiceCard } from '@/components/storefront/service-card';
import { SearchFilters } from '@/components/storefront/search-filters';
import { ChatPanel } from '@/components/chat/chat-panel';
import { useMerchantBySlug, useMerchantServices } from '@/hooks/useStorefront';
import { useDebounce } from '@/hooks/useDebounce';
import { useMerchantOnline } from '@/hooks/usePresence';
import { useAuthStore } from '@/stores/authStore';
import { useMyReferralCodes, useGenerateReferralCode } from '@/hooks/useReferrals';
import { usePublicReviews } from '@/hooks/useReviews';
import { CouponsSection } from '@/components/storefront/coupons-section';
import { AdBanner } from '@/components/ad-banner';
import type { Review } from '@/types/api';


function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted'
          }`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="rounded-lg border border-warm-200/30 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {review.customer?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={review.customer.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{review.customer?.name || 'Customer'}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      {review.title && <p className="text-sm font-medium">{review.title}</p>}
      {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
      {review.merchant_reply && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-primary/20">
          <p className="text-xs font-medium text-primary">Merchant Reply</p>
          <p className="text-sm text-muted-foreground">{review.merchant_reply}</p>
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ slug, averageRating, reviewCount }: { slug: string; averageRating: string | null; reviewCount: number }) {
  const [reviewPage, setReviewPage] = useState(1);
  const { data: reviewsData, isLoading } = usePublicReviews(slug, { page: reviewPage, per_page: 5 });
  const reviews = reviewsData?.data || [];
  const reviewPagination = reviewsData?.meta;

  if (!isLoading && reviews.length === 0 && reviewCount === 0) return null;

  return (
    <div className="animate-fade-in delay-300 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold font-[family-name:var(--font-display)]">Reviews</h2>
        {averageRating && (
          <div className="flex items-center gap-2">
            <StarRating rating={Math.round(parseFloat(averageRating))} />
            <span className="text-sm font-medium">{parseFloat(averageRating).toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">({reviewCount})</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-warm-200/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <div className="h-4 bg-muted rounded w-24" />
              </div>
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No reviews yet</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {reviewPagination && reviewPagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewPage(p => p - 1)}
            disabled={reviewPage <= 1}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {reviewPagination.current_page} of {reviewPagination.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReviewPage(p => p + 1)}
            disabled={reviewPage >= reviewPagination.last_page}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ReferralBanner({ merchantId }: { merchantId: number }) {
  const [copied, setCopied] = useState(false);
  const { data: codesData } = useMyReferralCodes();
  const generateCode = useGenerateReferralCode();

  const existingCode = codesData?.data?.find(
    (c) => c.referral_program?.merchant?.id === merchantId && c.is_active
  );

  const handleShare = () => {
    if (existingCode) {
      navigator.clipboard.writeText(existingCode.code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    } else {
      generateCode.mutate(merchantId, {
        onSuccess: (newCode) => {
          navigator.clipboard.writeText(newCode.code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }).catch(() => {});
        },
      });
    }
  };

  const code = existingCode?.code;
  const isGenerating = generateCode.isPending;

  return (
    <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-indigo-200/60 bg-indigo-50/40 px-3 py-2">
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
        <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-indigo-900">Refer a Friend</p>
        {code ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <code className="text-[10px] font-mono font-bold tracking-wider text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
              {code}
            </code>
            <button
              onClick={handleShare}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5"
            >
              {copied ? <Check className="h-2.5 w-2.5 text-green-600" /> : <Copy className="h-2.5 w-2.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleShare}
            disabled={isGenerating}
            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium mt-0.5 flex items-center gap-1"
          >
            {isGenerating ? 'Generating...' : (
              <>
                <UserPlus className="h-2.5 w-2.5" />
                Get referral code
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Quick Action Bar ────────────────────────────────────────────────────────

function QuickActions({
  merchant,
  onChatOpen,
}: {
  merchant: { contact_phone?: string | null; contact_email?: string | null; address?: { latitude?: number | null; longitude?: number | null } | null };
  onChatOpen: () => void;
}) {
  const { isAuthenticated } = useAuthStore();
  const hasPhone = !!merchant.contact_phone;
  const hasEmail = !!merchant.contact_email;
  const hasLocation = merchant.address?.latitude != null && merchant.address?.longitude != null;

  const actions = [
    ...(hasPhone ? [{
      label: 'Call',
      icon: Phone,
      href: `tel:${merchant.contact_phone}`,
    }] : []),
    ...(hasEmail ? [{
      label: 'Email',
      icon: Mail,
      href: `mailto:${merchant.contact_email}`,
    }] : []),
    ...(isAuthenticated ? [{
      label: 'Message',
      icon: MessageCircle,
      onClick: onChatOpen,
    }] : []),
    ...(hasLocation ? [{
      label: 'Directions',
      icon: Navigation,
      href: `https://www.google.com/maps/dir/?api=1&destination=${merchant.address!.latitude},${merchant.address!.longitude}`,
      external: true,
    }] : []),
  ];

  if (actions.length === 0) return null;

  return (
    <div className="flex items-center gap-2 animate-fade-in delay-50">
      {actions.map((action) => {
        const Icon = action.icon;
        const className = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-warm-200/40 bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors shadow-sm";

        if ('onClick' in action && action.onClick) {
          return (
            <button key={action.label} onClick={action.onClick} className={className}>
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          );
        }

        if ('href' in action && action.href) {
          return (
            <a
              key={action.label}
              href={action.href}
              {...('external' in action && action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className={className}
            >
              <Icon className="h-3.5 w-3.5" />
              {action.label}
            </a>
          );
        }

        return null;
      })}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MerchantDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const ctaSentinelRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { isAuthenticated } = useAuthStore();

  const { data: merchantData, isLoading: merchantLoading } = useMerchantBySlug(slug);
  const merchant = merchantData?.data;

  const isOnline = useMerchantOnline(merchant?.id ?? null);

  const serviceParams: Record<string, unknown> = {
    page,
    per_page: 12,
  };
  if (debouncedSearch) serviceParams['filter[search]'] = debouncedSearch;
  if (selectedCategoryId) serviceParams['filter[service_category_id]'] = selectedCategoryId;

  const { data: servicesData, isLoading: servicesLoading } = useMerchantServices(slug, serviceParams);
  const services = servicesData?.data || [];
  const pagination = servicesData?.meta;

  const categories = merchant?.service_categories || [];

  // Mobile sticky CTA
  useEffect(() => {
    if (!ctaSentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileCTA(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ctaSentinelRef.current);
    return () => observer.disconnect();
  }, [merchant]);

  const handleSearchChange = (value: string) => { setSearch(value); setPage(1); };
  const handleClearSearch = () => { setSearch(''); setPage(1); };
  const handleCategoryChange = (categoryId: number | undefined) => { setSelectedCategoryId(categoryId); setPage(1); };

  // Loading state
  if (merchantLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse">
          <div className="h-36 md:h-48 rounded-2xl bg-muted mb-6" />
          <div className="h-7 bg-muted rounded w-1/3 mb-3" />
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

  const isOrganization = merchant.type === 'organization';

  // Apply parent inheritance fallbacks
  const displayMerchant = {
    ...merchant,
    gallery_feature: merchant.gallery_feature ?? merchant.parent?.gallery_feature ?? null,
    gallery_photos: merchant.gallery_photos?.length ? merchant.gallery_photos : (merchant.parent?.gallery_photos ?? []),
    gallery_interiors: merchant.gallery_interiors?.length ? merchant.gallery_interiors : (merchant.parent?.gallery_interiors ?? []),
    gallery_exteriors: merchant.gallery_exteriors?.length ? merchant.gallery_exteriors : (merchant.parent?.gallery_exteriors ?? []),
    address: merchant.address ?? merchant.parent?.address ?? null,
    business_hours: merchant.business_hours?.length ? merchant.business_hours : (merchant.parent?.business_hours ?? undefined),
    contact_email: merchant.contact_email ?? merchant.parent?.contact_email ?? null,
    contact_phone: merchant.contact_phone ?? merchant.parent?.contact_phone ?? null,
    social_links: merchant.social_links?.length ? merchant.social_links : (merchant.parent?.social_links ?? []),
    payment_methods: merchant.payment_methods?.length ? merchant.payment_methods : (merchant.parent?.payment_methods ?? []),
    loyalty_program: merchant.loyalty_program ?? merchant.parent?.loyalty_program ?? null,
    referral_program: merchant.referral_program ?? merchant.parent?.referral_program ?? null,
  };

  const primaryCTA = !isOrganization && (
    merchant.can_take_bookings
      ? { href: `/merchants/${merchant.slug}/book`, label: 'Book a Service', icon: Calendar }
      : merchant.can_rent_units
      ? { href: `/merchants/${merchant.slug}/reserve`, label: 'Make a Reservation', icon: Home }
      : merchant.can_sell_products
      ? { href: `/merchants/${merchant.slug}/order`, label: 'Place an Order', icon: ShoppingBag }
      : null
  );

  return (
    <div className="container mx-auto px-4 py-5 max-w-7xl">
      {/* Back button */}
      <div className="mb-3 animate-fade-in">
        <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground -ml-2">
          <Link href="/merchants">
            <ArrowLeft className="h-4 w-4" />
            Back to merchants
          </Link>
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Left Column — Main Content ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Hero Header */}
          <div className="animate-fade-in">
            <MerchantHeader merchant={displayMerchant} isOnline={isOnline} />
          </div>

          {/* Quick Action Bar — Call · Email · Message · Directions */}
          <QuickActions
            merchant={displayMerchant}
            onChatOpen={() => setIsChatOpen(true)}
          />

          {/* Gallery */}
          <div className="animate-fade-in delay-100">
            <MerchantGallery merchant={displayMerchant} />
          </div>

          {/* Loyalty & Referral — compact inline */}
          {(merchant.enable_loyalty_program && displayMerchant.loyalty_program) || (isAuthenticated && merchant.enable_referral_program && displayMerchant.referral_program) ? (
            <div className="animate-fade-in delay-100 flex flex-col sm:flex-row gap-2">
              {merchant.enable_loyalty_program && displayMerchant.loyalty_program && (
                <div className="flex-1 flex items-center gap-2.5 rounded-lg border border-amber-200/60 bg-amber-50/40 px-3 py-2">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Gift className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-900 truncate">{displayMerchant.loyalty_program.name}</p>
                    <p className="text-[10px] text-amber-700">
                      Collect {displayMerchant.loyalty_program.required_stamps} stamps
                      {displayMerchant.loyalty_program.tiers && displayMerchant.loyalty_program.tiers.length > 0 && (
                        <span> &middot; {displayMerchant.loyalty_program.tiers
                          .map((t) => t.reward_description || (t.reward_type === 'free_product' ? 'Free product' : `${t.reward_value ?? '?'}${t.reward_type === 'discount_percentage' ? '% off' : ' off'}`))
                          .join(', ')}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {isAuthenticated && merchant.enable_referral_program && displayMerchant.referral_program && (
                <ReferralBanner merchantId={merchant.id} />
              )}
            </div>
          ) : null}

          {/* Coupons */}
          <CouponsSection slug={slug} />

          {/* Organization gate */}
          {isOrganization && (
            <div className="animate-fade-in delay-150 rounded-xl border border-violet-200/60 bg-violet-50/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex gap-2.5 items-start flex-1">
                <Info className="h-4 w-4 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-violet-900">
                    Organization with {merchant.children_count ?? 0}{' '}
                    {(merchant.children_count ?? 0) === 1 ? 'branch' : 'branches'}
                  </p>
                  <p className="text-xs text-violet-700 mt-0.5">
                    Select a branch to book, reserve, or place an order.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white flex-shrink-0">
                <Link href={`/merchants/${merchant.slug}/branches`}>
                  <GitBranch className="h-3.5 w-3.5" />
                  View Branches
                </Link>
              </Button>
            </div>
          )}

          {/* CTA sentinel for mobile sticky detection */}
          <div ref={ctaSentinelRef} />

          {/* Sidebar on mobile (below header, before services) */}
          {!isOrganization && (
            <div className="md:hidden animate-fade-in delay-100">
              <MerchantSidebar merchant={displayMerchant} />
            </div>
          )}

          {/* ── Services Section ── */}
          <div className="animate-fade-in delay-200 space-y-3">
            {/* Title + search on same row */}
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold font-[family-name:var(--font-display)] flex-shrink-0">
                Services & Products
              </h2>
            </div>

            {/* Category chips + search */}
            <div className="flex flex-col gap-2">
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => handleCategoryChange(undefined)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
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
                      className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
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

              <SearchFilters
                search={search}
                onSearchChange={handleSearchChange}
                onClear={handleClearSearch}
                placeholder="Search services..."
              />
            </div>

            {/* Services Grid */}
            {servicesLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[4/3] rounded-t-xl bg-muted" />
                    <div className="p-2.5 space-y-1.5 border border-t-0 rounded-b-xl border-warm-200/30">
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-10">
                <Store className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No services found</p>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {services.map((service, i) => (
                  <div
                    key={service.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${(i % 6) * 60}ms` }}
                  >
                    <ServiceCard service={service} merchantSlug={slug} />
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
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

          {/* Reviews */}
          <ReviewsSection slug={slug} averageRating={merchant.average_rating} reviewCount={merchant.review_count} />
        </div>

        {/* ── Right Column — Sticky Sidebar (md+, not for organizations) ── */}
        {!isOrganization && (
          <div className="hidden md:block w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <MerchantSidebar merchant={displayMerchant} />
              <AdBanner placement="merchant_detail" variant="vertical" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom CTA */}
      {primaryCTA && showMobileCTA && (
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-sm border-t border-warm-200/30 shadow-warm-xl md:hidden z-40 animate-fade-in-up">
          <Button asChild className="w-full gap-2" size="lg">
            <Link href={primaryCTA.href}>
              <primaryCTA.icon className="h-4 w-4" />
              {primaryCTA.label}
            </Link>
          </Button>
        </div>
      )}

      {/* Chat Sheet */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 py-3 border-b">
            <SheetTitle className="text-base">
              Message {merchant.name}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden p-4">
            <ChatPanel type="inquiries" id={merchant.slug} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
