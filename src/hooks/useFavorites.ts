
'use client'; // Ensure this hook is treated as client-side

import type { FavoriteLocation } from '@/types/weather';
import { useLocalStorage } from './useLocalStorage'; // Changed to named import
import { useToast } from '@/components/ui/use-toast';

const FAVORITES_KEY = 'havadurumux-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<FavoriteLocation[]>(FAVORITES_KEY, []);
  const { toast } = useToast();

  const addFavorite = (location: FavoriteLocation) => {
    if (!favorites.find(fav => fav.province === location.province && fav.district === location.district)) {
      setFavorites(prevFavorites => [...prevFavorites, location]);
      toast({
        title: "Favorilere Eklendi",
        description: `${location.province} / ${location.district} favorilerinize eklendi.`,
      });
    } else {
       toast({
        title: "Zaten Favorilerde",
        description: `${location.province} / ${location.district} zaten favorilerinizde.`,
        variant: "default",
      });
    }
  };

  const removeFavorite = (province: string, district: string) => {
    setFavorites(prevFavorites => prevFavorites.filter(fav => !(fav.province === province && fav.district === district)));
    toast({
      title: "Favorilerden Çıkarıldı",
      description: `${province} / ${district} favorilerinizden çıkarıldı.`,
    });
  };

  const isFavorite = (province: string, district: string): boolean => {
    return favorites.some(fav => fav.province === province && fav.district === district);
  };

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
