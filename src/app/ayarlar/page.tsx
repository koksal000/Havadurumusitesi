
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Brush, Bell, Compass, AlertTriangle, InfoIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const NOTIFICATION_ENABLED_KEY = 'havadurumux-notifications-enabled';
const NOTIFICATION_PERMISSION_KEY = 'havadurumux-notification-permission';
const LOCATION_SERVICES_ENABLED_KEY = 'havadurumux-location-services-enabled';
const LOCATION_PERMISSION_KEY = 'havadurumux-location-permission';


export default function AyarlarPage() {
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);


  useEffect(() => {
    // Load saved notification enabled state
    const savedNotificationsEnabled = localStorage.getItem(NOTIFICATION_ENABLED_KEY);
    if (savedNotificationsEnabled) {
      setNotificationsEnabled(JSON.parse(savedNotificationsEnabled));
    }
    // Load saved or current notification permission state
    if (typeof Notification !== 'undefined') {
      const savedNotificationPerm = localStorage.getItem(NOTIFICATION_PERMISSION_KEY) as NotificationPermission | null;
      setNotificationPermission(savedNotificationPerm || Notification.permission);
    }

    // Load saved location services enabled state
    const savedLocationServicesEnabled = localStorage.getItem(LOCATION_SERVICES_ENABLED_KEY);
    if (savedLocationServicesEnabled) {
      setLocationServicesEnabled(JSON.parse(savedLocationServicesEnabled));
    }
    // Load saved location permission state
    const savedLocationPerm = localStorage.getItem(LOCATION_PERMISSION_KEY) as PermissionState | null;
    if (savedLocationPerm) {
        setLocationPermission(savedLocationPerm);
    } else if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then(status => {
            setLocationPermission(status.state);
            localStorage.setItem(LOCATION_PERMISSION_KEY, status.state);
        });
    }
  }, []);

  const handleNotificationToggle = async (checked: boolean) => {
    setNotificationsEnabled(checked);
    localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(checked));

    if (checked) {
      if (typeof Notification !== 'undefined') {
        if (Notification.permission === 'granted') {
          setNotificationPermission('granted');
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
          toast({ title: "Bildirimler Etkin", description: "Hava durumu uyarıları için bildirim alacaksınız." });
        } else if (Notification.permission === 'denied') {
          setNotificationPermission('denied');
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
          toast({
            title: "Bildirim İzni Reddedilmiş",
            description: "Tarayıcı ayarlarından bildirimlere izin vermeniz gerekiyor.",
            variant: "destructive",
          });
          setNotificationsEnabled(false); 
          localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
        } else {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
          if (permission === 'granted') {
            toast({ title: "Bildirim İzni Verildi", description: "Hava durumu uyarıları için bildirim alacaksınız." });
          } else {
            toast({
              title: "Bildirim İzni Verilmedi",
              description: "Önemli hava durumu uyarılarını alamayacaksınız.",
              variant: "destructive",
            });
            setNotificationsEnabled(false); 
            localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
          }
        }
      } else {
        toast({ title: "Bildirimler Desteklenmiyor", description: "Tarayıcınız bildirimleri desteklemiyor.", variant: "destructive" });
        setNotificationsEnabled(false);
        localStorage.setItem(NOTIFICATION_ENABLED_KEY, JSON.stringify(false));
      }
    } else {
      toast({ title: "Bildirimler Devre Dışı", description: "Hava durumu uyarıları almayacaksınız." });
    }
  };

  const handleLocationServicesToggle = async (checked: boolean) => {
    setLocationServicesEnabled(checked);
    localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(checked));

    if (checked) {
        if (navigator.geolocation) {
            if (locationPermission === 'granted') {
                toast({ title: "Konum Servisleri Etkin", description: "Mevcut konumunuz kullanılabilir." });
            } else if (locationPermission === 'denied') {
                toast({
                    title: "Konum İzni Reddedilmiş",
                    description: "Tarayıcı ayarlarından konum iznini vermeniz gerekiyor.",
                    variant: "destructive",
                });
                setLocationServicesEnabled(false);
                localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
            } else { // prompt or unknown
                navigator.geolocation.getCurrentPosition(
                    () => {
                        setLocationPermission('granted');
                        localStorage.setItem(LOCATION_PERMISSION_KEY, 'granted');
                        toast({ title: "Konum İzni Verildi", description: "Mevcut konumunuz kullanılabilir." });
                    },
                    (error) => {
                        setLocationPermission('denied');
                        localStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
                        if (error.code === error.PERMISSION_DENIED) {
                            toast({
                                title: "Konum İzni Reddedildi",
                                description: "Konum servislerini kullanmak için izin vermelisiniz.",
                                variant: "destructive",
                            });
                        } else {
                             toast({
                                title: "Konum Alınamadı",
                                description: `Hata: ${error.message}`,
                                variant: "destructive",
                            });
                        }
                        setLocationServicesEnabled(false);
                        localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
                    }
                );
            }
        } else {
            toast({ title: "Konum Servisleri Desteklenmiyor", description: "Tarayıcınız konum servislerini desteklemiyor.", variant: "destructive" });
            setLocationServicesEnabled(false);
            localStorage.setItem(LOCATION_SERVICES_ENABLED_KEY, JSON.stringify(false));
        }
    } else {
      toast({ title: "Konum Servisleri Devre Dışı", description: "Mevcut konumunuz kullanılmayacak." });
    }
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brush className="w-7 h-7 text-primary" />
            <CardTitle className="text-2xl">Görünüm</CardTitle>
          </div>
          <CardDescription>Uygulamanın görünüm ayarlarını buradan değiştirebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
            <div>
              <Label htmlFor="theme-toggle-label" className="text-base font-medium">Tema Seçimi</Label>
              <p className="text-sm text-muted-foreground">Açık veya koyu tema arasında geçiş yapın.</p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg rounded-xl">
        <CardHeader>
           <div className="flex items-center gap-3">
            <Bell className="w-7 h-7 text-primary" />
            <CardTitle className="text-2xl">Bildirimler ve Konum</CardTitle>
          </div>
          <CardDescription>Uygulama bildirimlerini ve konum servislerini yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
            <div>
              <Label htmlFor="notifications-switch" className="text-base font-medium">Hava Durumu Bildirimleri</Label>
              <p className="text-sm text-muted-foreground">Favori konumlarınız için önemli hava durumu uyarıları alın.</p>
            </div>
            <Switch
              id="notifications-switch"
              checked={notificationsEnabled && notificationPermission === 'granted'}
              onCheckedChange={handleNotificationToggle}
              disabled={notificationPermission === 'denied'}
            />
          </div>
          {notificationPermission === 'denied' && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground bg-destructive/80 rounded-md">
              <AlertTriangle className="w-5 h-5" />
              <p>Tarayıcı bildirimlerine izin vermediniz. Ayarlardan değiştirmediğiniz sürece bildirim alamazsınız.</p>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg shadow-sm">
             <div>
              <Label htmlFor="location-switch" className="text-base font-medium">Konum Servisleri</Label>
              <p className="text-sm text-muted-foreground">Mevcut konumunuza göre hava durumu bilgisi için.</p>
            </div>
            <Switch
              id="location-switch"
              checked={locationServicesEnabled && locationPermission === 'granted'}
              onCheckedChange={handleLocationServicesToggle}
              disabled={locationPermission === 'denied'}
            />
          </div>
           {locationPermission === 'denied' && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive-foreground bg-destructive/80 rounded-md">
              <AlertTriangle className="w-5 h-5" />
              <p>Tarayıcı konum iznini vermediniz. Ayarlardan değiştirmediğiniz sürece mevcut konumunuz kullanılamaz.</p>
            </div>
          )}
           {locationPermission === 'prompt' && locationServicesEnabled && (
            <div className="flex items-center gap-2 p-3 text-sm text-info-foreground bg-info/80 rounded-md">
              <InfoIcon className="w-5 h-5" />
              <p>Tarayıcınız konum izni isteyecektir. Lütfen izin verin.</p>
            </div>
           )}
        </CardContent>
      </Card>
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Diğer Ayarlar</CardTitle>
          <CardDescription>Gelecekte eklenecek diğer uygulama ayarları burada yer alacaktır.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Bu bölüm yapım aşamasındadır.</p>
        </CardContent>
      </Card>
    </div>
  );
}

    