
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProvinces, getDistricts } from '@/lib/locationData';
import { MapPin, Search } from 'lucide-react';

interface SearchableLocation {
  province: string;
  district: string;
  lat: number;
  lon: number;
  displayText: string;
}

export default function KesfetPage() {
  const router = useRouter();
  const [allLocations, setAllLocations] = useState<SearchableLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<SearchableLocation | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const provincesData = getProvinces();
    const locations: SearchableLocation[] = [];
    provincesData.forEach(province => {
      const districtsData = getDistricts(province);
      districtsData.forEach(district => {
        locations.push({
          province,
          district: district.name,
          lat: district.lat,
          lon: district.lon,
          displayText: `${province} / ${district.name}`
        });
      });
    });
    setAllLocations(locations);
  }, []);

  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (selectedLocationInfo && selectedLocationInfo.displayText.toLowerCase() === lowerSearchTerm) {
        return [];
    }
    return allLocations.filter(location =>
      location.displayText.toLowerCase().includes(lowerSearchTerm)
    ).slice(0, 10);
  }, [searchTerm, allLocations, selectedLocationInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    if (selectedLocationInfo && selectedLocationInfo.displayText !== newSearchTerm) {
        setSelectedLocationInfo(null);
    }
    setShowSuggestions(newSearchTerm.trim() !== "");
  };

  const handleSuggestionClick = (location: SearchableLocation) => {
    setSelectedLocationInfo(location);
    setSearchTerm(location.displayText);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (searchTerm.trim() && filteredResults.length > 0 && (!selectedLocationInfo || selectedLocationInfo.displayText !== searchTerm)) {
        setShowSuggestions(true);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchContainerRef]);

  const canShowWeather = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return false;
    return allLocations.some(loc => loc.displayText.toLowerCase() === term);
  }, [searchTerm, allLocations]);

  const handleShowWeather = () => {
    const term = searchTerm.trim().toLowerCase();
    const locationToNavigate = allLocations.find(loc => loc.displayText.toLowerCase() === term);

    if (locationToNavigate) {
      router.push(`/konum/${encodeURIComponent(locationToNavigate.province)}/${encodeURIComponent(locationToNavigate.district)}`);
    } else {
      // This case should ideally not be reached if button is disabled correctly
      alert("Lütfen geçerli bir konum seçin veya tam adını girin (örn: İstanbul / Kadıköy).");
    }
  };

  return (
    <div className="space-y-12">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Hava Durumunu Keşfet</CardTitle>
          <CardDescription className="text-center">
            Türkiye'deki tüm il ve ilçelerin anlık hava durumu bilgilerine ulaşın.
            Konum adını (örn: Ankara / Çankaya veya sadece Çankaya) yazarak arama yapabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div ref={searchContainerRef} className="relative">
            <label htmlFor="location-search" className="block text-sm font-medium mb-1">Konum Ara (Örn: İstanbul / Kadıköy)</label>
            <div className="relative">
              <Input
                id="location-search"
                type="text"
                placeholder="İl / İlçe adı yazın..."
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                className="pr-10"
                autoComplete="off"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            {showSuggestions && filteredResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredResults.map(location => (
                  <Button
                    key={`${location.province}-${location.district}`}
                    variant="ghost"
                    className="w-full justify-start p-2 hover:bg-accent text-left h-auto"
                    onClick={() => handleSuggestionClick(location)}
                  >
                    {location.displayText}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={handleShowWeather}
            className="w-full text-lg py-3 mt-4"
            size="lg"
            disabled={!canShowWeather}
          >
            <MapPin className="mr-2 h-5 w-5" />
            Hava Durumunu Göster
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
