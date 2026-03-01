'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isOpenNow, formatTime, formatFullAddress, getSocialIcon } from '@/lib/storefront-utils';
import type { Merchant } from '@/types/api';

const MerchantMiniMap = dynamic(() => import('./merchant-mini-map'), { ssr: false });

interface MerchantSidebarProps {
  merchant: Merchant;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function MerchantSidebar({ merchant }: MerchantSidebarProps) {
  const [showAllHours, setShowAllHours] = useState(false);
  const openStatus = merchant.business_hours ? isOpenNow(merchant.business_hours) : null;
  const today = new Date().getDay();
  const fullAddress = formatFullAddress(merchant.address);

  return (
    <div className="space-y-4">
      {/* Mini Map — top of sidebar, replaces CTA buttons */}
      {merchant.address?.latitude != null && merchant.address?.longitude != null && (
        <div className="overflow-hidden rounded-xl border border-warm-200/30 shadow-warm">
          <MerchantMiniMap
            latitude={merchant.address.latitude}
            longitude={merchant.address.longitude}
            merchantName={merchant.name}
          />
        </div>
      )}

      {/* Business Hours */}
      {merchant.business_hours && merchant.business_hours.length > 0 && (
        <Card className="border-warm-200/30 shadow-warm">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Business Hours
              </CardTitle>
              {openStatus && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${
                    openStatus.isOpen
                      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {openStatus.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {/* Today's hours prominent */}
            {(() => {
              const todayHours = merchant.business_hours!.find(h => h.day_of_week === today);
              if (todayHours) {
                return (
                  <div className="mb-2 p-2 rounded-lg bg-primary/5 text-sm">
                    <span className="font-medium">Today: </span>
                    {todayHours.is_closed ? (
                      <span className="text-muted-foreground">Closed</span>
                    ) : (
                      <span>{formatTime(todayHours.open_time)} &ndash; {formatTime(todayHours.close_time)}</span>
                    )}
                  </div>
                );
              }
              return null;
            })()}

            {/* Expand/collapse for full schedule */}
            <button
              onClick={() => setShowAllHours(!showAllHours)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              {showAllHours ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAllHours ? 'Hide schedule' : 'See full schedule'}
            </button>

            {showAllHours && (
              <div className="space-y-1">
                {[...merchant.business_hours!]
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((hours) => (
                    <div
                      key={hours.id}
                      className={`flex justify-between text-sm py-1 px-2 rounded ${
                        hours.day_of_week === today ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      <span>{DAY_NAMES[hours.day_of_week]}</span>
                      <span className={hours.is_closed ? 'text-muted-foreground' : ''}>
                        {hours.is_closed ? 'Closed' : `${formatTime(hours.open_time)} \u2013 ${formatTime(hours.close_time)}`}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {(merchant.contact_phone || merchant.contact_email || merchant.website) && (
        <Card className="border-warm-200/30 shadow-warm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Contact</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {merchant.contact_phone && (
              <a href={`tel:${merchant.contact_phone}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                {merchant.contact_phone}
              </a>
            )}
            {merchant.contact_email && (
              <a href={`mailto:${merchant.contact_email}`} className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate">{merchant.contact_email}</span>
              </a>
            )}
            {merchant.website && (
              <a href={merchant.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm hover:text-primary transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <span className="truncate">{merchant.website}</span>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Social Links */}
      {merchant.social_links && merchant.social_links.length > 0 && (
        <Card className="border-warm-200/30 shadow-warm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Follow Us</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {merchant.social_links.map((link) => {
                const Icon = getSocialIcon(link.social_platform?.slug || '');
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.social_platform?.name || 'Social Link'}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods */}
      {merchant.payment_methods && merchant.payment_methods.length > 0 && (
        <Card className="border-warm-200/30 shadow-warm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Accepted Payments</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {merchant.payment_methods.map((pm) => (
                <Badge key={pm.id} variant="secondary" className="bg-warm-100 text-warm-700 border-warm-200/30">
                  {pm.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location address */}
      {fullAddress && (
        <Card className="border-warm-200/30 shadow-warm">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground">{fullAddress}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
