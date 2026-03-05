'use client';

import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Store, Calendar, Home, ShoppingBag, ArrowLeft, MessageCircle, GitBranch, Info, Gift, Stamp, Award, UserPlus, Copy, Check, Star, User } from 'lucide-react';
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
    <div className="animate-fade-in delay-300 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reviews</h2>
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

function ReferralSection({ merchantId }: { merchantId: number }) {
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
    <div className="animate-fade-in delay-100 rounded-xl border border-indigo-200/60 bg-indigo-50/50 p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
          <UserPlus className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-indigo-900">Refer a Friend</h3>
          <p className="text-sm text-indigo-700 mt-0.5">
            Share your referral code and earn rewards when friends transact here.
          </p>
        </div>
      </div>

      {code ? (
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono font-bold tracking-widest text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg flex-1">
            {code}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 flex-shrink-0 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            onClick={handleShare}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-600" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
          onClick={handleShare}
          disabled={isGenerating}
        >
          {isGenerating ? (
            'Generating...'
          ) : copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-600" />
              Copied
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" />
              Get My Referral Code
            </>
          )}
        </Button>
      )}
    </div>
  );
}

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

  const isOrganization = merchant.type === 'organization';

  // Apply parent inheritance fallbacks for display
  // Branches may inherit these from their parent org when not set on the branch itself
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

  // Determine primary CTA for mobile sticky bar (not shown for organizations)
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
            <MerchantHeader merchant={displayMerchant} isOnline={isOnline} />
          </div>

          {/* Message Merchant button — only shown to authenticated users */}
          {isAuthenticated && (
            <div className="animate-fade-in delay-50">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsChatOpen(true)}
              >
                <MessageCircle className="h-4 w-4" />
                Message Merchant
              </Button>
            </div>
          )}

          {/* Gallery */}
          <div className="animate-fade-in delay-100">
            <MerchantGallery merchant={displayMerchant} />
          </div>

          {/* Loyalty Program Section (inherits from parent org for branches) */}
          {merchant.enable_loyalty_program && displayMerchant.loyalty_program && (
            <div className="animate-fade-in delay-100 rounded-xl border border-amber-200/60 bg-amber-50/50 p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Gift className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-900">
                    {displayMerchant.loyalty_program.name}
                  </h3>
                  {displayMerchant.loyalty_program.description && (
                    <p className="text-sm text-amber-700 mt-0.5">
                      {displayMerchant.loyalty_program.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-amber-800">
                  <Stamp className="h-4 w-4 text-amber-600" />
                  <span>
                    Collect <strong>{displayMerchant.loyalty_program.required_stamps}</strong> stamps
                  </span>
                </div>
                {displayMerchant.loyalty_program.tiers && displayMerchant.loyalty_program.tiers.length > 0 && (
                  <div className="flex items-center gap-1.5 text-amber-800">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>
                      {displayMerchant.loyalty_program.tiers
                        .map((t) => t.reward_description || (t.reward_type === 'free_product' ? 'Free product' : `${t.reward_value ?? '?'}${t.reward_type === 'discount_percentage' ? '% off' : ' off'}`))
                        .join(', ')}
                    </span>
                  </div>
                )}
                {displayMerchant.loyalty_program.stamp_expiry_days && (
                  <div className="text-amber-600 text-xs">
                    Stamps expire after {displayMerchant.loyalty_program.stamp_expiry_days} days
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Referral Program Section (inherits from parent org for branches) */}
          {isAuthenticated && merchant.enable_referral_program && displayMerchant.referral_program && (
            <ReferralSection merchantId={merchant.id} />
          )}

          {/* Organization gate: info callout + View Branches CTA */}
          {isOrganization && (
            <div className="animate-fade-in delay-150 rounded-xl border border-violet-200/60 bg-violet-50/50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex gap-3 items-start flex-1">
                <Info className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-violet-900">
                    This is an organization with {merchant.children_count ?? 0}{' '}
                    {(merchant.children_count ?? 0) === 1 ? 'branch' : 'branches'}.
                  </p>
                  <p className="text-sm text-violet-700 mt-0.5">
                    Select a branch to book, reserve, or place an order.
                  </p>
                </div>
              </div>
              <Button asChild className="gap-2 bg-violet-600 hover:bg-violet-700 text-white flex-shrink-0">
                <Link href={`/merchants/${merchant.slug}/branches`}>
                  <GitBranch className="h-4 w-4" />
                  View Branches
                </Link>
              </Button>
            </div>
          )}

          {/* CTA sentinel for mobile sticky detection */}
          <div ref={ctaSentinelRef} />

          {/* Sidebar content on mobile (shown below header, before services) */}
          {!isOrganization && (
            <div className="md:hidden animate-fade-in delay-100">
              <MerchantSidebar merchant={displayMerchant} />
            </div>
          )}

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

          {/* Reviews Section */}
          <ReviewsSection slug={slug} averageRating={merchant.average_rating} reviewCount={merchant.review_count} />

        </div>

        {/* Right Column -- Sticky Sidebar (hidden on mobile, shown on md+; hidden for organizations) */}
        {!isOrganization && (
          <div className="hidden md:block w-80 flex-shrink-0">
            <div className="sticky top-20">
              <MerchantSidebar merchant={displayMerchant} />
            </div>
          </div>
        )}
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

      {/* Chat Sheet — slides in from the right when "Message Merchant" is clicked */}
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
