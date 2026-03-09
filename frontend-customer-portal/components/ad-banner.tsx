'use client';

/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useActiveAds } from '@/hooks/useAdvertisements';
import advertisementService from '@/services/advertisementService';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Advertisement } from '@/types/api';

type AdVariant = 'grid' | 'marquee' | 'horizontal' | 'vertical' | 'carousel';

interface AdBannerProps {
  placement: string;
  className?: string;
  variant?: AdVariant;
}

interface AdItemProps {
  ad: Advertisement;
  onImpression: (id: number) => void;
  onClickAd: (id: number) => void;
  size?: 'default' | 'compact' | 'leaderboard' | 'tower';
}

function AdItem({ ad, onImpression, onClickAd, size = 'default' }: AdItemProps) {
  const impressionFired = useRef(false);

  useEffect(() => {
    if (impressionFired.current) return;
    impressionFired.current = true;
    onImpression(ad.id);
  }, [ad.id, onImpression]);

  const handleClick = () => {
    onClickAd(ad.id);
  };

  const hasImage = ad.image !== null;
  const hasLink = Boolean(ad.link_url);

  const imageHeight = {
    default: 'aspect-[3/1]',
    compact: 'h-48',
    leaderboard: 'h-48 sm:h-56 lg:h-64',
    tower: 'aspect-[4/3]',
  }[size];

  const content = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'transition-all duration-300',
        hasLink && 'cursor-pointer',
        size === 'compact' && 'w-[calc(100vw-2rem)] flex-shrink-0 max-h-48',
        // Card styling per variant
        size === 'tower'
          ? 'border border-border/30 bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5'
          : size === 'leaderboard'
            ? 'shadow-lg hover:shadow-xl'
            : 'border border-border/30 bg-card shadow-sm hover:shadow-lg',
      )}
    >
      {hasImage && (
        <div className={cn('relative w-full overflow-hidden', imageHeight)}>
          {/* Image with zoom on hover */}
          <img
            src={ad.image!.url}
            alt={ad.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Gradient overlays */}
          {size === 'leaderboard' ? (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          )}

          {/* Content overlay */}
          {size === 'leaderboard' ? (
            /* Leaderboard: left-aligned hero layout */
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 sm:px-10 lg:px-14 max-w-2xl">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg leading-tight font-[family-name:var(--font-display)]">
                  {ad.title}
                </p>
                {ad.description && (
                  <p className="mt-2 text-sm sm:text-base text-white/80 drop-shadow line-clamp-2 max-w-lg">
                    {ad.description}
                  </p>
                )}
                {ad.link_text && (
                  <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow-md transition-transform duration-200 group-hover:scale-105">
                    {ad.link_text}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>
            </div>
          ) : size === 'tower' ? (
            /* Tower: compact bottom overlay */
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-sm font-semibold text-white drop-shadow-md leading-snug">{ad.title}</p>
              {ad.link_text && (
                <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-white/90 group-hover:text-white transition-colors">
                  {ad.link_text}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              )}
            </div>
          ) : (
            /* Default / Compact: centered bottom overlay */
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <p className={cn(
                'font-bold text-white drop-shadow-lg',
                size === 'compact' ? 'text-sm' : 'text-base sm:text-lg',
              )}>{ad.title}</p>
              {ad.description && (
                <p className={cn(
                  'mt-1 text-white/80 drop-shadow line-clamp-2',
                  size === 'compact' ? 'text-xs' : 'text-sm',
                )}>{ad.description}</p>
              )}
              {ad.link_text && (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-white border border-white/30 transition-colors group-hover:bg-white/30">
                  {ad.link_text}
                  <ArrowRight className="h-3 w-3" />
                </span>
              )}
            </div>
          )}

          {/* Subtle "Ad" badge */}
          <div className="absolute top-3 right-3">
            <span className="rounded-md bg-black/30 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-medium text-white/70 uppercase tracking-wider">
              Ad
            </span>
          </div>
        </div>
      )}

      {/* Text-only fallback (no image) */}
      {!hasImage && (
        <div className={cn(
          'relative overflow-hidden',
          size === 'leaderboard'
            ? 'px-6 sm:px-10 py-8 sm:py-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70'
            : size === 'tower'
              ? 'p-4 bg-gradient-to-br from-primary/5 to-primary/10'
              : 'p-5 bg-gradient-to-br from-primary/5 to-primary/10',
        )}>
          {/* Decorative shapes for leaderboard text-only */}
          {size === 'leaderboard' && (
            <>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
            </>
          )}

          <div className="relative">
            <p className={cn(
              'font-bold font-[family-name:var(--font-display)]',
              size === 'leaderboard' ? 'text-xl sm:text-2xl text-white' : size === 'tower' ? 'text-sm text-foreground' : 'text-base text-foreground',
            )}>{ad.title}</p>
            {ad.description && (
              <p className={cn(
                'mt-1.5 line-clamp-2',
                size === 'leaderboard' ? 'text-sm text-white/80 max-w-lg' : 'text-xs text-muted-foreground',
              )}>{ad.description}</p>
            )}
            {ad.link_text && (
              <span className={cn(
                'mt-3 inline-flex items-center gap-1.5 font-semibold',
                size === 'leaderboard'
                  ? 'rounded-full bg-white px-5 py-2 text-sm text-gray-900 shadow-md'
                  : 'text-xs text-primary group-hover:underline',
              )}>
                {ad.link_text}
                <ArrowRight className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (!hasLink) {
    return <div onClick={handleClick}>{content}</div>;
  }

  return (
    <a
      href={ad.link_url!}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      aria-label={ad.link_text ?? ad.title}
    >
      {content}
    </a>
  );
}

function AdMarquee({
  ads,
  onImpression,
  onClick,
  className,
}: {
  ads: Advertisement[];
  onImpression: (id: number) => void;
  onClick: (id: number) => void;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const isPaused = useRef(false);
  const scrollPos = useRef(0);
  const speed = 0.5;

  const animate = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    if (!isPaused.current) {
      scrollPos.current += speed;
      const halfWidth = el.scrollWidth / 2;
      if (scrollPos.current >= halfWidth) {
        scrollPos.current -= halfWidth;
      }
      el.style.transform = `translateX(-${scrollPos.current}px)`;
    }
    animationRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  const handleMouseEnter = () => { isPaused.current = true; };
  const handleMouseLeave = () => { isPaused.current = false; };

  const doubled = [...ads, ...ads];

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      aria-label="Sponsored content"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      <div
        ref={scrollRef}
        className="flex gap-4 will-change-transform"
        style={{ width: 'max-content' }}
      >
        {doubled.map((ad, i) => (
          <AdItem
            key={`${ad.id}-${i}`}
            ad={ad}
            onImpression={onImpression}
            onClickAd={onClick}
            size="compact"
          />
        ))}
      </div>
    </div>
  );
}

function AdCarousel({
  ads,
  onImpression,
  onClick,
  className,
}: {
  ads: Advertisement[];
  onImpression: (id: number) => void;
  onClick: (id: number) => void;
  className?: string;
}) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const isPaused = useRef(false);
  const total = ads.length;

  const goTo = useCallback((index: number) => {
    setCurrent(((index % total) + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance every 5s
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused.current) {
        setCurrent((c) => (c + 1) % total);
      }
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [total]);

  return (
    <div
      className={cn('relative group overflow-hidden rounded-2xl', className)}
      aria-label="Sponsored content"
      onMouseEnter={() => { isPaused.current = true; }}
      onMouseLeave={() => { isPaused.current = false; }}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {ads.map((ad) => (
          <div key={ad.id} className="w-full flex-shrink-0">
            <AdItem
              ad={ad}
              onImpression={onImpression}
              onClickAd={onClick}
              size="leaderboard"
            />
          </div>
        ))}
      </div>

      {/* Left / Right arrows */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Previous ad"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
            aria-label="Next ad"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to ad ${i + 1}`}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
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

export function AdBanner({ placement, className, variant = 'grid' }: AdBannerProps) {
  const { data: ads, isLoading } = useActiveAds(placement);

  const handleImpression = useCallback((id: number) => {
    advertisementService.trackImpression(id).catch(() => undefined);
  }, []);

  const handleClick = useCallback((id: number) => {
    advertisementService.trackClick(id).catch(() => undefined);
  }, []);

  if (isLoading || !ads || ads.length === 0) {
    return null;
  }

  if (variant === 'marquee') {
    return (
      <AdMarquee
        ads={ads}
        onImpression={handleImpression}
        onClick={handleClick}
        className={className}
      />
    );
  }

  if (variant === 'carousel') {
    return (
      <AdCarousel
        ads={ads}
        onImpression={handleImpression}
        onClick={handleClick}
        className={className}
      />
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={cn('w-full', className)} aria-label="Sponsored content">
        <AdItem
          ad={ads[0]}
          onImpression={handleImpression}
          onClickAd={handleClick}
          size="leaderboard"
        />
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={cn('flex flex-col gap-3', className)} aria-label="Sponsored content">
        {ads.map((ad) => (
          <AdItem
            key={ad.id}
            ad={ad}
            onImpression={handleImpression}
            onClickAd={handleClick}
            size="tower"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        ads.length === 1 ? 'w-full' : 'grid gap-4 sm:grid-cols-2',
        className,
      )}
      aria-label="Sponsored content"
    >
      {ads.map((ad) => (
        <AdItem
          key={ad.id}
          ad={ad}
          onImpression={handleImpression}
          onClickAd={handleClick}
        />
      ))}
    </div>
  );
}
