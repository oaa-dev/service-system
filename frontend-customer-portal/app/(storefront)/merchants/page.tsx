'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Store, List, Map, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MerchantCard } from '@/components/storefront/merchant-card';
import { useStorefrontMerchants, useStorefrontBusinessTypes, useStorefrontPaymentMethods, useStorefrontMapMerchants } from '@/hooks/useStorefront';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { isOpenNow } from '@/lib/storefront-utils';
import { AdBanner } from '@/components/ad-banner';
import { AdPopup } from '@/components/ad-popup';
import type { StorefrontMerchantParams } from '@/services/storefrontService';

const MerchantMapView = dynamic(
  () => import('@/components/storefront/merchant-map-view'),
  { ssr: false },
);

export default function MerchantsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [businessTypeId, setBusinessTypeId] = useState<number | undefined>();
  const [capabilities, setCapabilities] = useState<{
    canSellProducts?: boolean;
    canTakeBookings?: boolean;
    canRentUnits?: boolean;
  }>({});
  const [sort, setSort] = useState('name');
  const [isOpenNowFilter, setIsOpenNowFilter] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const geolocation = useGeolocation();
  const geolocationAvailable = !geolocation.loading && !geolocation.error && geolocation.latitude !== null;
  const userLocation =
    geolocation.latitude !== null && geolocation.longitude !== null
      ? { lat: geolocation.latitude, lng: geolocation.longitude }
      : null;

  // Build map API params: pass lat/lng/radius for server-side distance filtering
  const mapParams = radiusKm !== null && userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng, radius: radiusKm }
    : undefined;

  // Fetch map data only when the map view is active
  const { data: mapMerchantsData } = useStorefrontMapMerchants(viewMode === 'map', mapParams);

  const { data: businessTypesData } = useStorefrontBusinessTypes();
  const businessTypes = businessTypesData?.data || [];

  const { data: paymentMethodsData } = useStorefrontPaymentMethods();
  const paymentMethods = paymentMethodsData?.data || [];

  const params: StorefrontMerchantParams = {
    page,
    per_page: 16,
    sort,
    ...(debouncedSearch ? { 'filter[search]': debouncedSearch } : {}),
    ...(businessTypeId ? { 'filter[business_type_id]': businessTypeId } : {}),
    ...(capabilities.canSellProducts ? { 'filter[can_sell_products]': true } : {}),
    ...(capabilities.canTakeBookings ? { 'filter[can_take_bookings]': true } : {}),
    ...(capabilities.canRentUnits ? { 'filter[can_rent_units]': true } : {}),
  };

  const { data, isLoading } = useStorefrontMerchants(params);
  const meta = data?.meta;

  // Client-side filters applied after API data arrives (list view only, no radius filter)
  const merchants = useMemo(() => {
    let result = data?.data || [];
    if (isOpenNowFilter) {
      result = result.filter(m => m.business_hours && isOpenNow(m.business_hours).isOpen);
    }
    if (selectedPaymentMethodId) {
      result = result.filter(m =>
        m.payment_methods?.some(pm => pm.id === selectedPaymentMethodId)
      );
    }
    return result;
  }, [data?.data, isOpenNowFilter, selectedPaymentMethodId]);

  // Map view merchants: backend handles distance filtering via lat/lng/radius params
  const mapMerchants = mapMerchantsData || [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleBusinessTypeChange = (id: number | undefined) => {
    setBusinessTypeId(id);
    setPage(1);
  };

  const handleCapabilityToggle = (key: 'canSellProducts' | 'canTakeBookings' | 'canRentUnits') => {
    setCapabilities(prev => ({
      ...prev,
      [key]: prev[key] ? undefined : true,
    }));
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(1);
  };

  const handleOpenNowToggle = (value: boolean) => {
    setIsOpenNowFilter(value);
    setPage(1);
  };

  const handlePaymentMethodChange = (id: number | undefined) => {
    setSelectedPaymentMethodId(id);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Ad Carousel */}
      <AdBanner placement="merchant_listing" variant="carousel" className="mb-6 animate-fade-in" />

      {/* Header bar: title + view toggle + search */}
      <div className="mb-4 animate-fade-in flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-display)]">Browse Merchants</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Discover local businesses, services, and products</p>
        </div>

        <div className="flex-1" />

        {/* Search input — inline */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search merchants..."
            className="w-full h-9 pl-9 pr-8 text-sm rounded-lg border border-warm-200/30 bg-warm-50/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/60"
          />
          {search && (
            <button onClick={handleClearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-warm-200/30 bg-warm-50/30 p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            aria-label="Map view"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Filter chips row */}
      <div className="mb-6 animate-fade-in flex flex-wrap items-center gap-2">
        {/* Business Type */}
        <Select
          value={businessTypeId?.toString() ?? 'all'}
          onValueChange={(val) => handleBusinessTypeChange(val === 'all' ? undefined : Number(val))}
        >
          <SelectTrigger className="w-auto h-8 text-xs rounded-full border-warm-200/30 bg-warm-50/30 px-3 gap-1.5">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {businessTypes.map((bt) => (
              <SelectItem key={bt.id} value={bt.id.toString()}>{bt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Method */}
        {paymentMethods.length > 0 && (
          <Select
            value={selectedPaymentMethodId?.toString() || 'all'}
            onValueChange={(val) => handlePaymentMethodChange(val === 'all' ? undefined : parseInt(val))}
          >
            <SelectTrigger className="w-auto h-8 text-xs rounded-full border-warm-200/30 bg-warm-50/30 px-3 gap-1.5">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {paymentMethods.map((pm) => (
                <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="h-5 w-px bg-border/40 mx-0.5" />

        {/* Toggle chips */}
        <button
          onClick={() => handleOpenNowToggle(!isOpenNowFilter)}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
            isOpenNowFilter
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-green-300/50'
          }`}
        >
          Open Now
        </button>
        <button
          onClick={() => handleCapabilityToggle('canTakeBookings')}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
            capabilities.canTakeBookings
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-primary/30'
          }`}
        >
          Bookings
        </button>
        <button
          onClick={() => handleCapabilityToggle('canSellProducts')}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
            capabilities.canSellProducts
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-amber-300/50'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => handleCapabilityToggle('canRentUnits')}
          className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
            capabilities.canRentUnits
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-emerald-300/50'
          }`}
        >
          Rentals
        </button>

        <div className="h-5 w-px bg-border/40 mx-0.5" />

        {/* Radius */}
        <div title={!geolocationAvailable ? 'Enable location access' : undefined}>
          <Select
            value={radiusKm != null ? radiusKm.toString() : 'none'}
            onValueChange={(val) => setRadiusKm(val === 'none' ? null : Number(val))}
            disabled={!geolocationAvailable}
          >
            <SelectTrigger className={`w-auto h-8 text-xs rounded-full border-warm-200/30 bg-warm-50/30 px-3 gap-1.5 ${!geolocationAvailable ? 'opacity-50' : ''}`}>
              <SelectValue placeholder="No radius" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No radius</SelectItem>
              <SelectItem value="1">1 km</SelectItem>
              <SelectItem value="3">3 km</SelectItem>
              <SelectItem value="5">5 km</SelectItem>
              <SelectItem value="10">10 km</SelectItem>
              <SelectItem value="25">25 km</SelectItem>
              <SelectItem value="50">50 km</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        {/* Sort */}
        <Select value={sort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-auto h-8 text-xs rounded-full border-warm-200/30 bg-warm-50/30 px-3 gap-1.5">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="-name">Name Z-A</SelectItem>
            <SelectItem value="-created_at">Newest</SelectItem>
            <SelectItem value="created_at">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map View */}
      {viewMode === 'map' ? (
        <div className="animate-fade-in">
          <MerchantMapView
            merchants={mapMerchants}
            userLocation={userLocation}
            radiusKm={radiusKm}
          />
          {mapMerchants.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              No merchants with map coordinates found
              {radiusKm !== null ? ` within ${radiusKm} km` : ''}.
            </p>
          )}
        </div>
      ) : isLoading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] rounded-t-xl bg-muted" />
              <div className="p-4 space-y-2 border border-t-0 rounded-b-xl border-warm-200/30">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-muted rounded-full w-20" />
                  <div className="h-5 bg-muted rounded-full w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : merchants.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 animate-fade-in">
          <Store className="h-16 w-16 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No merchants found</h2>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
          {(search || businessTypeId || capabilities.canSellProducts || capabilities.canTakeBookings || capabilities.canRentUnits || isOpenNowFilter || selectedPaymentMethodId || radiusKm !== null) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setBusinessTypeId(undefined);
                setCapabilities({});
                setIsOpenNowFilter(false);
                setSelectedPaymentMethodId(undefined);
                setRadiusKm(null);
                setSort('name');
                setPage(1);
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        /* Merchant Grid */
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {merchants.map((merchant, i) => (
              <div
                key={merchant.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${(i % 8) * 80}ms` }}
              >
                <MerchantCard merchant={merchant} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in">
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
                Page {meta.current_page} of {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= meta.last_page}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <AdPopup placement="merchant_listing" />
    </div>
  );
}
