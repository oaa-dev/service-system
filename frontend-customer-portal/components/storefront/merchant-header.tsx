'use client';

import { Calendar, Home, ShoppingBag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { isOpenNow } from '@/lib/storefront-utils';
import type { Merchant } from '@/types/api';

interface MerchantHeaderProps {
  merchant: Merchant;
}

export function MerchantHeader({ merchant }: MerchantHeaderProps) {
  const openStatus = merchant.business_hours ? isOpenNow(merchant.business_hours) : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-warm-200/30 shadow-warm bg-card">
      {/* Cover Image Section */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        {(merchant.gallery_feature?.preview || merchant.logo?.preview) ? (
          <>
            {/* Cover image: prefer gallery_feature, fall back to blurred logo */}
            <img
              src={merchant.gallery_feature?.preview || merchant.logo?.preview}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover ${merchant.gallery_feature ? '' : 'scale-110 blur-sm'}`}
            />
            {/* Dark gradient overlay for legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
          </>
        ) : (
          /* Fallback gradient when no images */
          <div className="absolute inset-0 gradient-mesh" />
        )}
      </div>

      {/* Content Section */}
      <div className="relative px-6 pb-6">
        {/* Logo overlapping the cover/content boundary */}
        <div className="-mt-12 mb-4 flex items-end gap-4">
          <Avatar className="h-24 w-24 rounded-xl ring-4 ring-white shadow-lg flex-shrink-0">
            <AvatarImage src={merchant.logo?.preview} alt={merchant.name} className="object-cover" />
            <AvatarFallback className="rounded-xl text-2xl font-bold bg-primary/10 text-primary">
              {getInitials(merchant.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground truncate">
              {merchant.name}
            </h1>
            {merchant.business_type?.name && (
              <p className="text-muted-foreground">{merchant.business_type.name}</p>
            )}
          </div>
        </div>

        {/* Status and Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {openStatus && (
            <Badge
              variant="secondary"
              className={`text-sm ${
                openStatus.isOpen
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {openStatus.label}
            </Badge>
          )}
          {merchant.can_take_bookings && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1">
              <Calendar className="h-3 w-3" />
              Bookings
            </Badge>
          )}
          {merchant.can_sell_products && (
            <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 gap-1">
              <ShoppingBag className="h-3 w-3" />
              Products
            </Badge>
          )}
          {merchant.can_rent_units && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 gap-1">
              <Home className="h-3 w-3" />
              Rentals
            </Badge>
          )}
        </div>

        {/* Description */}
        {merchant.description && (
          <p className="text-muted-foreground leading-relaxed">
            {merchant.description}
          </p>
        )}
      </div>
    </div>
  );
}
