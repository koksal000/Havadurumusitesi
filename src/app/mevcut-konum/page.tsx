
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProvinces, getDistricts, findDistrict } from '@/lib/locationData';
import type { District } from '@/types/location';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Compass, Settings, InfoIcon } from 'lucide-react';
import Link from 'next/link';

const LOCATION_SERVICES_ENABLED_KEY = 'havadurumux-location-services-enabled';
const LOCATION_PERMISSION_KEY = 'havadurumux-location-permission';

// Haversine distance function
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}


export default function MevcutKonumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Mevcut konumunuz alınıyor...');

  useEffect(() => {
    const fetchCurrentLocationWeather = async () => {
      setLoading(true);
      setError(null);

      const locationServicesEnabled = localStorage.getItem(LOCATION_SERVICES_ENABLED_KEY) === 'true';
      let locationPermission = localStorage.getItem(LOCATION_PERMISSION_KEY) as PermissionState | null;

      if (!locationServicesEnabled) {
        setError("Konum servisleri ayarlardan etkinleştirilmemiş.");
        setStatusMessage("Lütfen ayarlardan konum servislerini etkinleştirin.");
        setLoading(false);
        return;
      }
      
      // Check runtime permission if not already stored as granted or denied
      if (navigator.permissions && (!locationPermission || locationPermission === 'prompt')) {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          locationPermission = permissionStatus.state;
          localStorage.setItem(LOCATION_PERMISSION_KEY, locationPermission);
          
          permissionStatus.onchange = () => {
              localStorage.setItem(LOCATION_PERMISSION_KEY, permissionStatus.state);
              // Optionally re-trigger or notify user of permission change
          };
      }


      if (locationPermission !== 'granted') {
        setError(locationPermission === 'denied' 
            ? "Konum izni reddedilmiş. Lütfen tarayıcı ayarlarından izin verin." 
            : "Konum izni gerekiyor. Lütfen tarayıcı istemine yanıt verin veya ayarlardan kontrol edin."
        );
        setStatusMessage(locationPermission === 'denied' ? "İzin reddedildi." : "İzin bekleniyor veya gerekli.");
        setLoading(false);
        // For 'prompt', we wait for user interaction or navigator.geolocation to handle it.
        // If it's explicitly denied, we stop here.
        if (locationPermission === 'denied') return;
      }
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setStatusMessage('Konum alındı, en yakın ilçe bulunuyor...');

            const provinces = getProvinces();
            let closestDistrict: District | null = null;
            let closestProvince: string | null = null;
            let minDistance = Infinity;

            provinces.forEach(province => {
              const districts = getDistricts(province);
              districts.forEach(district => {
                // Only consider districts with valid (non-zero) coordinates
                if (district.lat !== 0 || district.lon !== 0) {
                  const distance = getDistance(latitude, longitude, district.lat, district.lon);
                  if (distance < minDistance) {
                    minDistance = distance;
                    closestDistrict = district;
                    closestProvince = province;
                  }
                }
              });
            });

            // Set a reasonable threshold for "closest" e.g., 50km
            // This is to prevent matching very distant locations if turkey_locations.json is sparse
            const MAX_ACCEPTABLE_DISTANCE_KM = 75; 

            if (closestDistrict && closestProvince && minDistance <= MAX_ACCEPTABLE_DISTANCE_KM) {
              setStatusMessage(`${closestProvince} / ${closestDistrict.name} için hava durumu yükleniyor...`);
              router.push(`/konum/${encodeURIComponent(closestProvince)}/${encodeURIComponent(closestDistrict.name)}`);
            } else {
              setError(`En yakın bilinen ilçe bulunamadı (Mesafe: ${minDistance > MAX_ACCEPTABLE_DISTANCE_KM ? '>'+MAX_ACCEPTABLE_DISTANCE_KM : minDistance.toFixed(1)} km). Lütfen konum verilerinin doğruluğunu kontrol edin veya manuel arama yapın.`);
              setStatusMessage('En yakın ilçe bulunamadı.');
              setLoading(false);
            }
          },
          (geoError) => {
            let errorMessage = `Konum alınırken hata oluştu: ${geoError.message}`;
            if (geoError.code === geoError.PERMISSION_DENIED) {
                errorMessage = "Konum izni reddedildi. Bu özelliği kullanmak için tarayıcı ayarlarınızdan izin vermelisiniz.";
                localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
            } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
                errorMessage = "Konum bilgisi mevcut değil. GPS veya ağ bağlantınızı kontrol edin.";
            } else if (geoError.code === geoError.TIMEOUT) {
                errorMessage = "Konum alma isteği zaman aşımına uğradı.";
            }
            setError(errorMessage);
            setStatusMessage('Konum alınamadı.');
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 } // Options
        );
      } else {
        setError("Tarayıcınız konum servislerini desteklemiyor.");
        setStatusMessage('Desteklenmiyor.');
        setLoading(false);
      }
    };

    fetchCurrentLocationWeather();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">{statusMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-xl rounded-xl max-w-md mx-auto my-10">
        <CardHeader>
          <div className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-8 h-8" />
            <CardTitle className="text-2xl">Konum Hatası</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">{error}</p>
          {error.includes("ayarlardan") && (
             <Button asChild>
                <Link href="/ayarlar"><Settings className="mr-2 h-4 w-4" /> Ayarlara Git</Link>
             </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/kesfet"><Compass className="mr-2 h-4 w-4" /> Manuel Konum Ara</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // This state should ideally not be reached if redirection works
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <InfoIcon className="h-16 w-16 text-primary mb-4" />
      <p className="text-xl text-muted-foreground">Yönlendiriliyorsunuz...</p>
    </div>
  );
}

    