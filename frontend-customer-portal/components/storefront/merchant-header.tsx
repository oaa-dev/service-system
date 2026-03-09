'use client';

import { Star, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { isOpenNow } from '@/lib/storefront-utils';
import { FavoriteButton } from '@/components/storefront/favorite-button';
import type { Merchant } from '@/types/api';

interface MerchantHeaderProps {
  merchant: Merchant;
  isOnline?: boolean;
}

export function MerchantHeader({ merchant, isOnline = false }: MerchantHeaderProps) {
  const businessHours = merchant.business_hours?.length ? merchant.business_hours : merchant.parent?.business_hours;
  const openStatus = businessHours ? isOpenNow(businessHours) : null;
  const address = merchant.address ?? merchant.parent?.address;
  const cityName = address?.city?.name || null;
  const hasRating = merchant.average_rating && merchant.review_count > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-warm-200/30 shadow-warm bg-card">
      {/* Cover Image — compact */}
      <div className="relative h-36 md:h-48 overflow-hidden">
        {(merchant.gallery_feature?.preview || merchant.parent?.gallery_feature?.preview || merchant.logo?.preview || merchant.parent?.logo?.preview) ? (
          <>
            <img
              src={merchant.gallery_feature?.preview || merchant.parent?.gallery_feature?.preview || merchant.logo?.preview || merchant.parent?.logo?.preview}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover ${(merchant.gallery_feature || merchant.parent?.gallery_feature) ? '' : 'scale-110 blur-sm'}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-black/5" />
          </>
        ) : (
          <div className="absolute inset-0 gradient-mesh" />
        )}

        {/* Favorite button — top right */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton merchantId={merchant.id} isFavorited={merchant.is_favorited} size="default" />
        </div>
      </div>

      {/* Content — compact */}
      <div className="relative px-5 pb-5">
        {/* Logo + Name row */}
        <div className="-mt-10 mb-3 flex items-end gap-3.5">
          <Avatar className="h-20 w-20 rounded-xl ring-[3px] ring-white shadow-lg flex-shrink-0">
            <AvatarImage src={merchant.logo?.preview ?? merchant.parent?.logo?.preview} alt={merchant.name} className="object-cover" />
            <AvatarFallback className="rounded-xl text-xl font-bold bg-primary/10 text-primary">
              {getInitials(merchant.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pb-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate font-[family-name:var(--font-display)]">
                {merchant.name}
              </h1>
              {isOnline && (
                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              )}
            </div>

            {/* Meta line: type · status · location · rating */}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5 flex-wrap">
              {merchant.business_type?.name && (
                <span>{merchant.business_type.name}</span>
              )}
              {openStatus && (
                <>
                  <span className="text-warm-200">·</span>
                  <span className={openStatus.isOpen ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}>
                    {openStatus.label}
                  </span>
                </>
              )}
              {cityName && (
                <>
                  <span className="text-warm-200">·</span>
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3" />
                    {cityName}
                  </span>
                </>
              )}
              {hasRating && (
                <>
                  <span className="text-warm-200">·</span>
                  <span className="inline-flex items-center gap-0.5 text-foreground font-medium">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {parseFloat(merchant.average_rating!).toFixed(1)}
                    <span className="text-muted-foreground font-normal">({merchant.review_count})</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description — compact */}
        {(merchant.description ?? merchant.parent?.description) && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
            {merchant.description ?? merchant.parent?.description}
          </p>
        )}
      </div>
    </div>
  );
}
