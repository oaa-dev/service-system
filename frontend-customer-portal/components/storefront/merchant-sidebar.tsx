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
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { isOpenNow, formatTime, formatFullAddress, getSocialIcon } from '@/lib/storefront-utils';
import type { Merchant } from '@/types/api';

const MerchantMiniMap = dynamic(() => import('./merchant-mini-map'), { ssr: false });

interface MerchantSidebarProps {
  merchant: Merchant;
}

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MerchantSidebar({ merchant }: MerchantSidebarProps) {
  const [showAllHours, setShowAllHours] = useState(false);
  const openStatus = merchant.business_hours ? isOpenNow(merchant.business_hours) : null;
  const today = new Date().getDay();
  const fullAddress = formatFullAddress(merchant.address);
  const todayHours = merchant.business_hours?.find((h) => h.day_of_week === today);

  const hasContact = merchant.contact_phone || merchant.contact_email || merchant.website;
  const hasSocial = merchant.social_links && merchant.social_links.length > 0;
  const hasPayments = merchant.payment_methods && merchant.payment_methods.length > 0;
  const hasHours = merchant.business_hours && merchant.business_hours.length > 0;
  const hasMap = merchant.address?.latitude != null && merchant.address?.longitude != null;

  return (
    <div className="space-y-4">
      {/* Mini Map */}
      {hasMap && (
        <div className="overflow-hidden rounded-xl border border-warm-200/30 shadow-warm">
          <MerchantMiniMap
            latitude={merchant.address!.latitude!}
            longitude={merchant.address!.longitude!}
            merchantName={merchant.name}
          />
        </div>
      )}

      {/* ── Unified Info Panel ── */}
      <div className="rounded-xl border border-warm-200/30 bg-card shadow-warm overflow-hidden divide-y divide-warm-200/20">

        {/* ── Business Hours ── */}
        {hasHours && (
          <div className="px-3.5 py-3">
            <button
              onClick={() => setShowAllHours(!showAllHours)}
              className="w-full flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-2 min-w-0 text-sm">
                  {openStatus && (
                    <span
                      className={`inline-flex items-center gap-1 font-semibold text-xs flex-shrink-0 ${
                        openStatus.isOpen ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${openStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      {openStatus.label}
                    </span>
                  )}
                  {todayHours && !todayHours.is_closed && (
                    <span className="text-muted-foreground text-xs truncate">
                      {formatTime(todayHours.open_time)}&ndash;{formatTime(todayHours.close_time)}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 flex-shrink-0 ${showAllHours ? 'rotate-180' : ''}`} />
            </button>

            {/* Expanded schedule */}
            <div
              className={`grid transition-all duration-200 ease-out ${
                showAllHours ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-0.5">
                  {[...merchant.business_hours!]
                    .sort((a, b) => a.day_of_week - b.day_of_week)
                    .map((hours) => (
                      <div
                        key={hours.id}
                        className={`flex justify-between text-xs py-1 px-2 rounded-md ${
                          hours.day_of_week === today
                            ? 'bg-primary/5 font-semibold text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span className="w-10">{DAY_ABBR[hours.day_of_week]}</span>
                        <span>
                          {hours.is_closed
                            ? 'Closed'
                            : `${formatTime(hours.open_time)} \u2013 ${formatTime(hours.close_time)}`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Contact + Social (merged row) ── */}
        {(hasContact || hasSocial) && (
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Contact actions */}
              {merchant.contact_phone && (
                <a
                  href={`tel:${merchant.contact_phone}`}
                  title={merchant.contact_phone}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg px-2 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{merchant.contact_phone}</span>
                </a>
              )}
              {merchant.contact_email && (
                <a
                  href={`mailto:${merchant.contact_email}`}
                  title={merchant.contact_email}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg px-2 py-1.5 hover:bg-primary/5 transition-colors min-w-0"
                >
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate hidden sm:inline">{merchant.contact_email}</span>
                </a>
              )}
              {merchant.website && (
                <a
                  href={merchant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={merchant.website}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary rounded-lg px-2 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}

              {/* Separator dot if both contact & social exist */}
              {hasContact && hasSocial && (
                <span className="w-px h-4 bg-warm-200/40 mx-0.5" />
              )}

              {/* Social icons */}
              {merchant.social_links?.map((link) => {
                const Icon = getSocialIcon(link.social_platform?.slug || '');
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.social_platform?.name || 'Social Link'}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Payment Methods ── */}
        {hasPayments && (
          <div className="px-3.5 py-2.5 flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {merchant.payment_methods!.map((pm) => pm.name).join(' · ')}
            </p>
          </div>
        )}

        {/* ── Location ── */}
        {fullAddress && (
          <div className="px-3.5 py-2.5 flex items-start gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{fullAddress}</p>
          </div>
        )}
      </div>
    </div>
  );
}
