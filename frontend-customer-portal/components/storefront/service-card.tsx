'use client';

import Link from 'next/link';
import { Calendar, ShoppingBag, Home } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/storefront-utils';
import type { Service } from '@/types/api';

const SERVICE_TYPE_CONFIG: Record<string, { label: string; className: string; icon: typeof Calendar; actionLabel: string; actionPath: string }> = {
  bookable: {
    label: 'Bookable',
    className: 'bg-primary/10 text-primary border-primary/20',
    icon: Calendar,
    actionLabel: 'Book',
    actionPath: 'book',
  },
  sellable: {
    label: 'Product',
    className: 'bg-accent/10 text-accent-foreground border-accent/20',
    icon: ShoppingBag,
    actionLabel: 'Place Order',
    actionPath: 'order',
  },
  reservation: {
    label: 'Rental',
    className: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    icon: Home,
    actionLabel: 'Reserve',
    actionPath: 'reserve',
  },
};

interface ServiceCardProps {
  service: Service;
  merchantSlug: string;
  onClick?: () => void;
}

export function ServiceCard({ service, merchantSlug, onClick }: ServiceCardProps) {
  const typeConfig = SERVICE_TYPE_CONFIG[service.service_type] || SERVICE_TYPE_CONFIG.bookable;
  const TypeIcon = typeConfig.icon;

  return (
    <Card
      className="group overflow-hidden hover-lift transition-all duration-300 border-warm-200/30 shadow-warm cursor-pointer p-0"
      onClick={onClick}
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
            <TypeIcon className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Service type badge - top right */}
        <Badge
          variant="outline"
          className={`absolute top-2 right-2 text-xs shadow-sm backdrop-blur-sm ${typeConfig.className}`}
        >
          {typeConfig.label}
        </Badge>

        {/* Hover action overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={`/merchants/${merchantSlug}/${typeConfig.actionPath}?service=${service.id}`}
            className="rounded-lg bg-white/90 text-foreground font-medium text-sm px-4 py-2 shadow-sm hover:bg-white transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {typeConfig.actionLabel}
          </Link>
        </div>
      </div>

      {/* Info section */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">
          {service.name}
        </h3>
        <p className="text-base font-bold text-primary">
          {formatPrice(service.price)}
          {service.service_type === 'reservation' && service.price_per_night && (
            <span className="text-xs font-normal text-muted-foreground"> / night</span>
          )}
        </p>
      </div>
    </Card>
  );
}
