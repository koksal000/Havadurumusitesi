'use client';

import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites';
import type { FavoriteLocation } from '@/types/weather';
import { Heart, HeartCrack } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FavoriteButtonProps {
  location: FavoriteLocation;
}

export function FavoriteButton({ location }: FavoriteButtonProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [isCurrentlyFavorite, setIsCurrentlyFavorite] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsCurrentlyFavorite(isFavorite(location.province, location.district));
  }, [isFavorite, location.province, location.district]);
  
  // Update button state if favorites list changes elsewhere
  useEffect(() => {
    if(mounted) { // only run after initial mount
      setIsCurrentlyFavorite(isFavorite(location.province, location.district));
    }
  }, [isFavorite, location.province, location.district, mounted]);


  if (!mounted) {
    return <Button variant="outline" className="w-full" disabled><Heart className="mr-2 h-4 w-4" /> Yükleniyor...</Button>;
  }

  const handleToggleFavorite = () => {
    if (isCurrentlyFavorite) {
      removeFavorite(location.province, location.district);
      setIsCurrentlyFavorite(false);
    } else {
      addFavorite(location);
      setIsCurrentlyFavorite(true);
    }
  };

  return (
    <Button onClick={handleToggleFavorite} variant={isCurrentlyFavorite ? "destructive" : "default"} className="w-full">
      {isCurrentlyFavorite ? (
        <HeartCrack className="mr-2 h-4 w-4" />
      ) : (
        <Heart className="mr-2 h-4 w-4" />
      )}
      {isCurrentlyFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
    </Button>
  );
}
