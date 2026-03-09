'use client';

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveAds } from '@/hooks/useAdvertisements';
import advertisementService from '@/services/advertisementService';
import type { Advertisement } from '@/types/api';

interface AdPopupProps {
  placement: string;
}

function AdCard({
  ad,
  size,
  onClickAd,
}: {
  ad: Advertisement;
  size: 'small' | 'large';
  onClickAd: (id: number) => void;
}) {
  const hasImage = ad.image !== null;
  const hasLink = Boolean(ad.link_url);
  const isLarge = size === 'large';

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden bg-card border border-border/40 transition-all duration-500 ease-out flex-shrink-0',
        isLarge ? 'w-[300px] sm:w-[340px] shadow-2xl' : 'w-[220px] sm:w-[240px] shadow-lg opacity-75',
      )}
    >
      {/* Ad badge */}
      <div className="absolute top-2.5 left-2.5 z-10">
        <span className="rounded-md bg-black/30 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white/70 uppercase tracking-wider">
          Ad
        </span>
      </div>

      {/* Image */}
      {hasImage && (
        <div className={cn('relative w-full overflow-hidden', isLarge ? 'aspect-[3/2]' : 'aspect-[4/3]')}>
          <img
            src={ad.image!.preview || ad.image!.url}
            alt={ad.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <p className={cn(
              'font-bold text-white drop-shadow-lg leading-snug font-[family-name:var(--font-display)]',
              isLarge ? 'text-base' : 'text-xs',
            )}>
              {ad.title}
            </p>
          </div>
        </div>
      )}

      {/* Text-only fallback */}
      {!hasImage && (
        <div className={cn(
          'relative w-full overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex flex-col justify-end',
          isLarge ? 'aspect-[3/2] p-5' : 'aspect-[4/3] p-3.5',
        )}>
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/5" />
          <p className={cn(
            'relative font-bold text-white drop-shadow-lg leading-snug font-[family-name:var(--font-display)]',
            isLarge ? 'text-base' : 'text-xs',
          )}>
            {ad.title}
          </p>
        </div>
      )}

      {/* Body — full details on large, minimal on small */}
      <div className={cn('space-y-2.5', isLarge ? 'p-4' : 'p-2.5')}>
        {ad.description && (
          <p className={cn(
            'text-muted-foreground leading-relaxed',
            isLarge ? 'text-sm line-clamp-3' : 'text-[11px] line-clamp-1',
          )}>
            {ad.description}
          </p>
        )}

        {isLarge && hasLink ? (
          <a
            href={ad.link_url!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onClickAd(ad.id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {ad.link_text || 'Learn More'}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        ) : isLarge && ad.link_text ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {ad.link_text}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        ) : !isLarge && ad.link_text ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
            {ad.link_text}
            <ArrowRight className="h-2.5 w-2.5" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AdPopup({ placement }: AdPopupProps) {
  const { data: allAds } = useActiveAds(placement);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const impressionsFired = useRef<Set<number>>(new Set());

  const popupAds = allAds?.slice(0, 10) ?? [];
  const total = popupAds.length;

  // Show after delay if not already dismissed this session
  useEffect(() => {
    if (popupAds.length === 0) return;
    const key = `ad-popup-dismissed-${placement}`;
    if (sessionStorage.getItem(key)) return;

    const timer = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [popupAds.length, placement]);

  // Track impressions for visible ads
  useEffect(() => {
    if (!open || popupAds.length === 0) return;
    const visible = getVisibleIndices(activeIndex, total);
    visible.forEach((idx) => {
      const ad = popupAds[idx];
      if (ad && !impressionsFired.current.has(ad.id)) {
        impressionsFired.current.add(ad.id);
        advertisementService.trackImpression(ad.id).catch(() => undefined);
      }
    });
  }, [open, popupAds, activeIndex, total]);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    sessionStorage.setItem(`ad-popup-dismissed-${placement}`, '1');
  }, [placement]);

  const handleClickAd = useCallback((id: number) => {
    advertisementService.trackClick(id).catch(() => undefined);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((c) => (c - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setActiveIndex((c) => (c + 1) % total);
  }, [total]);

  if (!open || popupAds.length === 0) return null;

  const leftIndex = total > 1 ? (activeIndex - 1 + total) % total : -1;
  const rightIndex = total > 2 ? (activeIndex + 1) % total : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={handleDismiss}
      />

      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-opacity hover:bg-black/60"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Cards: left (small tilted) + center (big) + right (small tilted) */}
      <div className="relative z-10 flex items-center gap-3 sm:gap-4 px-4">
        {/* Left card — small, tilted */}
        {leftIndex >= 0 && (
          <div
            className="hidden sm:block -rotate-3 cursor-pointer hover:opacity-90 transition-all animate-in slide-in-from-left-4 fade-in duration-500"
            onClick={prev}
          >
            <AdCard ad={popupAds[leftIndex]} size="small" onClickAd={handleClickAd} />
          </div>
        )}

        {/* Center card — large, prominent */}
        <div className="animate-in zoom-in-95 fade-in duration-400" style={{ animationDelay: '100ms' }}>
          <AdCard ad={popupAds[activeIndex]} size="large" onClickAd={handleClickAd} />
        </div>

        {/* Right card — small, tilted */}
        {rightIndex >= 0 && (
          <div
            className="hidden sm:block rotate-3 cursor-pointer hover:opacity-90 transition-all animate-in slide-in-from-right-4 fade-in duration-500"
            onClick={next}
          >
            <AdCard ad={popupAds[rightIndex]} size="small" onClickAd={handleClickAd} />
          </div>
        )}
      </div>

      {/* Prev / Next arrows (visible on mobile, also on desktop) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors sm:hidden"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60 transition-colors sm:hidden"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {popupAds.map((_: Advertisement, i: number) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Go to ad ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-300',
                i === activeIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Get indices of visible cards (center + left + right) */
function getVisibleIndices(active: number, total: number): number[] {
  if (total === 0) return [];
  if (total === 1) return [active];
  if (total === 2) return [active, (active - 1 + total) % total];
  return [
    (active - 1 + total) % total,
    active,
    (active + 1) % total,
  ];
}
