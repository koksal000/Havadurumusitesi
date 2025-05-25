
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProvinces, getDistricts, findDistrict } from '@/lib/locationData';
import type { District } from '@/types/location';
import { MapPin, Search } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [provinces, setProvinces] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [districts, setDistricts] = useState<District[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  useEffect(() => {
    setProvinces(getProvinces());
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      setDistricts(getDistricts(selectedProvince));
      setSearchTerm(''); // Reset search term when province changes
      setSelectedDistrict(''); // Reset selected district
    } else {
      setDistricts([]);
    }
  }, [selectedProvince]);

  const filteredDistricts = useMemo(() => {
    if (!searchTerm) return districts;
    return districts.filter(district =>
      district.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, districts]);

  const handleShowWeather = () => {
    if (selectedProvince && selectedDistrict) {
       const districtData = findDistrict(selectedProvince, selectedDistrict);
       if (districtData) {
        router.push(`/konum/${encodeURIComponent(selectedProvince)}/${encodeURIComponent(selectedDistrict)}`);
       } else {
        // Handle case where district is selected but not found (e.g. typed manually and invalid)
        alert("Lütfen geçerli bir ilçe seçin.");
       }
    } else if (selectedProvince && searchTerm && filteredDistricts.length === 1) {
      // If only one district matches search, auto-select it
      const districtToNavigate = filteredDistricts[0].name;
      router.push(`/konum/${encodeURIComponent(selectedProvince)}/${encodeURIComponent(districtToNavigate)}`);
    } else {
      alert("Lütfen bir il ve ilçe seçin veya arayın.");
    }
  };

  return (
    <div className="space-y-12">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">Hava Durumunu Keşfet</CardTitle>
          <CardDescription className="text-center">
            Türkiye'deki tüm il ve ilçelerin anlık hava durumu bilgilerine ulaşın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="province-select" className="block text-sm font-medium mb-1">İl Seçin</label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger id="province-select" aria-label="İl Seçimi">
                  <SelectValue placeholder="Bir il seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map(province => (
                    <SelectItem key={province} value={province}>{province}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="district-search" className="block text-sm font-medium mb-1">İlçe Ara veya Seç</label>
              <div className="relative">
                <Input
                  id="district-search"
                  type="text"
                  placeholder={selectedProvince ? "İlçe adı yazın veya listeden seçin..." : "Önce il seçin..."}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    const matchedDistrict = districts.find(d => d.name.toLowerCase() === e.target.value.toLowerCase());
                    if (matchedDistrict) setSelectedDistrict(matchedDistrict.name); else setSelectedDistrict('');
                  }}
                  disabled={!selectedProvince}
                  className="pr-10"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
              {selectedProvince && searchTerm && filteredDistricts.length > 0 && (
                 <div className="absolute z-10 mt-1 w-full bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
                   {filteredDistricts.map(district => (
                     <Button
                       key={district.name}
                       variant="ghost"
                       className="w-full justify-start p-2 hover:bg-accent"
                       onClick={() => {
                         setSearchTerm(district.name);
                         setSelectedDistrict(district.name);
                       }}
                     >
                       {district.name}
                     </Button>
                   ))}
                 </div>
              )}
            </div>
          </div>
          <Button 
            onClick={handleShowWeather} 
            className="w-full text-lg py-3 mt-4" 
            size="lg" 
            disabled={!selectedProvince || (!selectedDistrict && !searchTerm) || (searchTerm && filteredDistricts.length === 0 && !selectedDistrict) || (searchTerm && filteredDistricts.length > 1 && !selectedDistrict && !districts.find(d => d.name.toLowerCase() === searchTerm.toLowerCase()))}
          >
            <MapPin className="mr-2 h-5 w-5" />
            İlçeyi Göster
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
