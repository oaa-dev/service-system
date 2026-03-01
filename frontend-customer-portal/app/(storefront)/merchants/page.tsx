'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Store, List, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MerchantCard } from '@/components/storefront/merchant-card';
import { SearchFilters } from '@/components/storefront/search-filters';
import { useStorefrontMerchants, useStorefrontBusinessTypes, useStorefrontPaymentMethods, useStorefrontMapMerchants } from '@/hooks/useStorefront';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { isOpenNow } from '@/lib/storefront-utils';
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
      {/* Page Header */}
      <div className="mb-8 animate-fade-in flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Browse Merchants</h1>
          <p className="text-muted-foreground">Discover local businesses, services, and products</p>
        </div>

        {/* Map / List toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-warm-200/30 bg-warm-50/30 p-1 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            aria-label="Map view"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Map className="h-4 w-4" />
            Map
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 animate-fade-in delay-100">
        <SearchFilters
          search={search}
          onSearchChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search merchants by name..."
          businessTypes={businessTypes}
          selectedBusinessType={businessTypeId}
          onBusinessTypeChange={handleBusinessTypeChange}
          capabilities={capabilities}
          onCapabilityToggle={handleCapabilityToggle}
          isOpenNowFilter={isOpenNowFilter}
          onOpenNowToggle={handleOpenNowToggle}
          paymentMethods={paymentMethods}
          selectedPaymentMethod={selectedPaymentMethodId}
          onPaymentMethodChange={handlePaymentMethodChange}
          sort={sort}
          onSortChange={handleSortChange}
          radiusKm={radiusKm}
          onRadiusChange={setRadiusKm}
          geolocationAvailable={geolocationAvailable}
        />
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
    </div>
  );
}
