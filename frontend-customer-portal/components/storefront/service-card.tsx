'use client';

import Link from 'next/link';
import { Calendar, ShoppingBag, Home } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/storefront-utils';
import type { Service } from '@/types/api';

const SERVICE_TYPE_CONFIG: Record<string, { label: string; className: string; icon: typeof Calendar; actionLabel: string; actionPath: string }> = {
  bookable: {
    label: 'Bookable',
    className: 'bg-primary/80 text-white',
    icon: Calendar,
    actionLabel: 'Book',
    actionPath: 'book',
  },
  sellable: {
    label: 'Product',
    className: 'bg-accent text-accent-foreground',
    icon: ShoppingBag,
    actionLabel: 'Place Order',
    actionPath: 'order',
  },
  reservation: {
    label: 'Rental',
    className: 'bg-emerald-600/80 text-white',
    icon: Home,
    actionLabel: 'Reserve',
    actionPath: 'reserve',
  },
};

interface ServiceCardProps {
  service: Service;
  merchantSlug: string;
}

export function ServiceCard({ service, merchantSlug }: ServiceCardProps) {
  const typeConfig = SERVICE_TYPE_CONFIG[service.service_type] || SERVICE_TYPE_CONFIG.bookable;
  const TypeIcon = typeConfig.icon;
  const actionHref = `/merchants/${merchantSlug}/${typeConfig.actionPath}?service=${service.id}`;

  return (
    <Link href={actionHref} className="block">
      <Card
        className="group overflow-hidden hover-lift transition-all duration-300 border-warm-200/30 shadow-warm cursor-pointer p-0"
      >
        {/* Image area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {service.image?.preview ? (
            <img
              src={service.image.preview}
              alt={service.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <TypeIcon className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}

          {/* Service type pill — top left, compact */}
          <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm ${typeConfig.className}`}>
            {typeConfig.label}
          </span>

          {/* Hover action label overlay (desktop) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="rounded-full bg-white text-foreground font-semibold text-xs px-5 py-2 shadow-lg">
              {typeConfig.actionLabel}
            </span>
          </div>
        </div>

        {/* Info — compact */}
        <div className="px-2.5 py-2">
          <h3 className="font-semibold text-xs text-foreground line-clamp-1">{service.name}</h3>
          <p className="text-sm font-bold text-primary mt-0.5">
            {formatPrice(service.price)}
            {service.service_type === 'reservation' && service.price_per_night && (
              <span className="text-[10px] font-normal text-muted-foreground"> /night</span>
            )}
          </p>
        </div>
      </Card>
    </Link>
  );
}
