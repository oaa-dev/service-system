'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { BusinessType, PaymentMethod } from '@/types/api';

interface SearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  // Expanded filter props (optional - only used on listing page)
  businessTypes?: BusinessType[];
  selectedBusinessType?: number | undefined;
  onBusinessTypeChange?: (id: number | undefined) => void;
  capabilities?: {
    canSellProducts?: boolean;
    canTakeBookings?: boolean;
    canRentUnits?: boolean;
  };
  onCapabilityToggle?: (key: 'canSellProducts' | 'canTakeBookings' | 'canRentUnits') => void;
  // Open Now filter
  isOpenNowFilter?: boolean;
  onOpenNowToggle?: (value: boolean) => void;
  // Payment Method filter
  paymentMethods?: PaymentMethod[];
  selectedPaymentMethod?: number;
  onPaymentMethodChange?: (id: number | undefined) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  // Radius filter
  radiusKm?: number | null;
  onRadiusChange?: (radius: number | null) => void;
  geolocationAvailable?: boolean;
}

export function SearchFilters({
  search,
  onSearchChange,
  onClear,
  placeholder = 'Search...',
  businessTypes,
  selectedBusinessType,
  onBusinessTypeChange,
  capabilities,
  onCapabilityToggle,
  isOpenNowFilter,
  onOpenNowToggle,
  paymentMethods,
  selectedPaymentMethod,
  onPaymentMethodChange,
  sort,
  onSortChange,
  radiusKm,
  onRadiusChange,
  geolocationAvailable,
}: SearchFiltersProps) {
  const hasExpandedFilters = businessTypes || capabilities || sort !== undefined || onOpenNowToggle || (paymentMethods && paymentMethods.length > 0) || onRadiusChange !== undefined;

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className={`relative ${hasExpandedFilters ? '' : 'max-w-md'}`}>
        <div className="relative shadow-warm bg-background rounded-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="pl-12 pr-12 h-12 rounded-xl border-warm-200/30 bg-warm-50/30 focus-visible:ring-primary"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/80 rounded-lg"
              onClick={onClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Filters Row */}
      {hasExpandedFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Business Type Select */}
          {businessTypes && onBusinessTypeChange && (
            <Select
              value={selectedBusinessType?.toString() ?? 'all'}
              onValueChange={(val) => onBusinessTypeChange(val === 'all' ? undefined : Number(val))}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-warm-200/30 bg-warm-50/30">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {businessTypes.map((bt) => (
                  <SelectItem key={bt.id} value={bt.id.toString()}>
                    {bt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Payment Method Select */}
          {paymentMethods && paymentMethods.length > 0 && (
            <Select
              value={selectedPaymentMethod?.toString() || 'all'}
              onValueChange={(val) => onPaymentMethodChange?.(val === 'all' ? undefined : parseInt(val))}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-warm-200/30 bg-warm-50/30">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {paymentMethods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id.toString()}>{pm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Open Now Toggle */}
          {onOpenNowToggle && (
            <button
              onClick={() => onOpenNowToggle(!isOpenNowFilter)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                isOpenNowFilter
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-green-300/50'
              }`}
            >
              Open Now
            </button>
          )}

          {/* Capability Chip Toggles */}
          {capabilities && onCapabilityToggle && (
            <>
              <button
                onClick={() => onCapabilityToggle('canTakeBookings')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  capabilities.canTakeBookings
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-primary/30'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => onCapabilityToggle('canSellProducts')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  capabilities.canSellProducts
                    ? 'bg-accent/10 text-accent-foreground border-accent/30'
                    : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-accent/30'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => onCapabilityToggle('canRentUnits')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  capabilities.canRentUnits
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                    : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-emerald-500/30'
                }`}
              >
                Rentals
              </button>
            </>
          )}

          {/* Radius Filter */}
          {onRadiusChange && (
            <div className="relative" title={!geolocationAvailable ? 'Enable location access to filter by radius' : undefined}>
              <Select
                value={radiusKm != null ? radiusKm.toString() : 'none'}
                onValueChange={(val) => onRadiusChange(val === 'none' ? null : Number(val))}
                disabled={!geolocationAvailable}
              >
                <SelectTrigger
                  className={`w-[150px] h-9 text-sm rounded-lg border-warm-200/30 bg-warm-50/30 ${
                    !geolocationAvailable ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <SelectValue placeholder="No radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No radius</SelectItem>
                  <SelectItem value="1">Within 1 km</SelectItem>
                  <SelectItem value="3">Within 3 km</SelectItem>
                  <SelectItem value="5">Within 5 km</SelectItem>
                  <SelectItem value="10">Within 10 km</SelectItem>
                  <SelectItem value="25">Within 25 km</SelectItem>
                  <SelectItem value="50">Within 50 km</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sort Select */}
          {sort !== undefined && onSortChange && (
            <Select value={sort} onValueChange={onSortChange}>
              <SelectTrigger className="w-[150px] h-9 text-sm rounded-lg border-warm-200/30 bg-warm-50/30">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="-name">Name Z-A</SelectItem>
                <SelectItem value="-created_at">Newest</SelectItem>
                <SelectItem value="created_at">Oldest</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
