'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gift, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StampCard } from '@/components/loyalty/stamp-card';
import { useMyLoyaltyCards } from '@/hooks/useLoyalty';

export default function LoyaltyCardsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyLoyaltyCards({ page, per_page: 12 });

  const cards = data?.data ?? [];
  const pagination = data?.meta;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-[family-name:var(--font-display)]">My Loyalty Cards</h1>
          <p className="text-sm text-muted-foreground">Stamps and rewards from your favourite merchants</p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cards.length === 0 && (
        <div className="py-16 text-center space-y-3">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No loyalty cards yet</p>
          <p className="text-sm text-muted-foreground">
            Scan a merchant&apos;s QR code or complete a transaction to start collecting stamps.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/merchants">Browse merchants</Link>
          </Button>
        </div>
      )}

      {/* Cards list */}
      {!isLoading && cards.length > 0 && (
        <>
          <div className="space-y-4">
            {cards.map((card) => (
              <Link key={card.id} href={`/loyalty/${card.id}`} className="block group">
                <div className="relative">
                  <StampCard card={card} />
                  {/* Overlay arrow on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.last_page > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pagination.total} {pagination.total === 1 ? 'card' : 'cards'}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  {page} / {pagination.last_page}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= pagination.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick-action footer */}
      {!isLoading && cards.length > 0 && (
        <Card className="border-dashed border-border/60 shadow-none bg-muted/20">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium">Have a QR code?</p>
              <p className="text-xs text-muted-foreground">Ask your merchant for a scan link to earn stamps.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
