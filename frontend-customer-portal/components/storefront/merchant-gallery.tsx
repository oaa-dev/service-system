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
    { key: 'interiors', label: 'Interior', icon: Sofa, count: interiors.length },
    { key: 'exteriors', label: 'Exterior', icon: TreePine, count: exteriors.length },
  ];

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollButtons();
  }, [filteredImages.length, updateScrollButtons]);

  if (allImages.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Header row: title + tabs inline */}
      <div className="flex items-center gap-3 justify-between">
        <h2 className="text-base font-bold font-[family-name:var(--font-display)] flex-shrink-0">Gallery</h2>
        <div className="flex gap-1 flex-wrap justify-end">
          {tabs.filter(t => t.count > 0 || t.key === 'all').map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (scrollRef.current) scrollRef.current.scrollLeft = 0;
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-warm-50/50 text-muted-foreground border-warm-200/30 hover:border-primary/30'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
              <span className="opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal scroll row */}
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-md border border-warm-200/40 backdrop-blur-sm hover:bg-background transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateScrollButtons}
          className="scrollbar-none flex gap-2 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="relative flex-shrink-0 w-44 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group/img"
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

        {canScrollRight && (
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 shadow-md border border-warm-200/40 backdrop-blur-sm hover:bg-background transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Lightbox */}
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
