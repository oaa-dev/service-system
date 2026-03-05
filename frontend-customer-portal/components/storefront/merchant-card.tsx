'use client';

import Link from 'next/link';
import { Calendar, ShoppingBag, Home, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getInitials } from '@/lib/utils';
import { isOpenNow } from '@/lib/storefront-utils';
import { FavoriteButton } from '@/components/storefront/favorite-button';
import { StarRating } from '@/components/reviews/star-rating';
import type { Merchant } from '@/types/api';

interface MerchantCardProps {
  merchant: Merchant;
}

export function MerchantCard({ merchant }: MerchantCardProps) {
  const businessHours = merchant.business_hours?.length ? merchant.business_hours : merchant.parent?.business_hours;
  const openStatus = businessHours ? isOpenNow(businessHours) : null;
  const coverImage = merchant.gallery_feature?.preview ?? merchant.parent?.gallery_feature?.preview ?? merchant.logo?.preview ?? merchant.parent?.logo?.preview;
  const logoThumb = merchant.logo?.thumb ?? merchant.parent?.logo?.thumb;
  const cityName = merchant.address?.city?.name;
  const provinceName = merchant.address?.province?.name;
  const location = [cityName, provinceName].filter(Boolean).join(', ');

  return (
    <Link href={`/merchants/${merchant.slug}`}>
      <Card className="group overflow-hidden hover-lift transition-all duration-300 border-warm-200/30 shadow-warm gap-0 py-0">
        {/* Cover Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/20 via-warm-100 to-accent/20">
          {coverImage ? (
            <img
              src={coverImage}
              alt={merchant.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-3xl font-bold text-primary/40">{getInitials(merchant.name)}</span>
            </div>
          )}

          {/* Logo overlay - bottom left */}
          {logoThumb && (
            <div className="absolute bottom-2 left-2">
              <img
                src={logoThumb}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-md"
              />
            </div>
          )}

          {/* Favorite button - top left */}
          <div className="absolute top-2 left-2 z-10">
            <FavoriteButton merchantId={merchant.id} isFavorited={merchant.is_favorited} />
          </div>

          {/* Open Now badge - top right */}
          {openStatus && (
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className={`text-xs font-medium shadow-sm ${
                  openStatus.isOpen
                    ? 'bg-emerald-500/90 text-white border-emerald-600/20'
                    : 'bg-gray-800/70 text-gray-200 border-gray-700/20'
                }`}
              >
                {openStatus.label}
              </Badge>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {merchant.name}
            </h3>
          </div>

          {merchant.review_count > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(parseFloat(merchant.average_rating ?? '0'))} size="sm" />
              <span className="text-xs text-muted-foreground">
                {parseFloat(merchant.average_rating ?? '0').toFixed(1)} ({merchant.review_count})
              </span>
            </div>
          )}

          {merchant.business_type?.name && (
            <p className="text-sm text-muted-foreground">{merchant.business_type.name}</p>
          )}

          {location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          )}

          {/* Capability badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {merchant.can_take_bookings && (
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs gap-1">
                <Calendar className="h-3 w-3" />
                Bookings
              </Badge>
            )}
            {merchant.can_sell_products && (
              <Badge variant="outline" className="bg-accent/10 text-accent-foreground border-accent/20 text-xs gap-1">
                <ShoppingBag className="h-3 w-3" />
                Products
              </Badge>
            )}
            {merchant.can_rent_units && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs gap-1">
                <Home className="h-3 w-3" />
                Rentals
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
