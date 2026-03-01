'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Sofa, TreePine, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Merchant } from '@/types/api';

type GalleryTab = 'all' | 'photos' | 'interiors' | 'exteriors';

interface MerchantGalleryProps {
  merchant: Merchant;
}

export function MerchantGallery({ merchant }: MerchantGalleryProps) {
  const [activeTab, setActiveTab] = useState<GalleryTab>('all');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const photos = merchant.gallery_photos || [];
  const interiors = merchant.gallery_interiors || [];
  const exteriors = merchant.gallery_exteriors || [];

  const allImages = [
    ...photos.map(img => ({ ...img, type: 'photos' as const })),
    ...interiors.map(img => ({ ...img, type: 'interiors' as const })),
    ...exteriors.map(img => ({ ...img, type: 'exteriors' as const })),
  ];

  const filteredImages = activeTab === 'all'
    ? allImages
    : allImages.filter(img => img.type === activeTab);

  const tabs: { key: GalleryTab; label: string; icon: typeof Camera; count: number }[] = [
    { key: 'all', label: 'All', icon: Camera, count: allImages.length },
    { key: 'photos', label: 'Photos', icon: Camera, count: photos.length },
    { key: 'interiors', label: 'Interiors', icon: Sofa, count: interiors.length },
    { key: 'exteriors', label: 'Exteriors', icon: TreePine, count: exteriors.length },
  ];

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  // Check scroll state after images change or on initial render
  useEffect(() => {
    updateScrollButtons();
  }, [filteredImages.length, updateScrollButtons]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  if (allImages.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Gallery</h2>

      {/* Tab filters */}
      <div className="flex gap-2 flex-wrap">
        {tabs.filter(t => t.count > 0 || t.key === 'all').map(tab => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              if (scrollRef.current) {
                scrollRef.current.scrollLeft = 0;
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-primary/30'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            <span className="text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Horizontal scroll row */}
      <div className="relative">
        {/* Left scroll button — inside container */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md border border-warm-200/40 backdrop-blur-sm hover:bg-background transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Scroll container */}
        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="scrollbar-none flex gap-3 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="relative flex-shrink-0 w-52 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group/img"
              onClick={() => setSelectedImage(img.url)}
            >
              <img
                src={img.preview}
                alt={img.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
              />
            </div>
          ))}
        </div>

        {/* Right scroll button — inside container */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-md border border-warm-200/40 backdrop-blur-sm hover:bg-background transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lightbox — rendered via portal to avoid stacking context issues */}
      {selectedImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Gallery"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
