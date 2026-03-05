'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToggleFavorite } from '@/hooks/useFavorites';
import { useAuthStore } from '@/stores/authStore';

interface FavoriteButtonProps {
  merchantId: number;
  isFavorited?: boolean;
  size?: 'sm' | 'default';
}

export function FavoriteButton({ merchantId, isFavorited = false, size = 'sm' }: FavoriteButtonProps) {
  const { isAuthenticated } = useAuthStore();
  const toggleFavorite = useToggleFavorite();

  if (!isAuthenticated) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate(merchantId);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full ${size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'} bg-white/80 hover:bg-white shadow-sm`}
      onClick={handleClick}
      disabled={toggleFavorite.isPending}
    >
      <Heart
        className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} transition-colors ${
          isFavorited
            ? 'fill-red-500 text-red-500'
            : 'text-gray-600 hover:text-red-400'
        }`}
      />
    </Button>
  );
}
