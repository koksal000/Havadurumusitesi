
'use client';

import { useState, useEffect } from 'react';
import { useStoredNotifications } from '@/hooks/useStoredNotifications';
import type { StoredNotification } from '@/types/notifications';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Info, BellOff, Trash2, CheckCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function BildirimlerPage() {
  const {
    notifications,
    toggleNotificationReadStatus,
    markAllNotificationsAsRead,
    clearAllNotifications,
    isMounted,
  } = useStoredNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  if (!isMounted) {
    return (
      <div className="flex justify-center items-center h-64">
        <BellOff className="w-12 h-12 text-muted-foreground animate-pulse" />
        <p className="ml-4 text-muted-foreground">Bildirimler yükleniyor...</p>
      </div>
    );
  }
  
  const filteredNotifications = notifications.filter(n => activeTab === 'unread' ? !n.read : true)
                                           .sort((a,b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());


  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Bildirimler</h1>
        <div className="flex gap-2">
           <Button onClick={markAllNotificationsAsRead} variant="outline" size="sm" disabled={notifications.filter(n => !n.read).length === 0}>
            <CheckCheck className="mr-2 h-4 w-4" /> Tümünü Okundu İşaretle
          </Button>
          <Button onClick={clearAllNotifications} variant="destructive" size="sm" disabled={notifications.length === 0}>
            <Trash2 className="mr-2 h-4 w-4" /> Tümünü Temizle
          </Button>
        </div>
      </div>

      <div className="flex border-b">
        <Button
          variant={activeTab === 'all' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className="rounded-b-none"
        >
          Tümü ({notifications.length})
        </Button>
        <Button
          variant={activeTab === 'unread' ? 'secondary' : 'ghost'}
          onClick={() => setActiveTab('unread')}
          className="rounded-b-none"
        >
          Okunmamış ({notifications.filter(n => !n.read).length})
        </Button>
      </div>


      {filteredNotifications.length === 0 ? (
        <Card className="shadow-lg rounded-xl">
          <CardContent className="pt-6 text-center">
            <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {activeTab === 'unread' ? 'Okunmamış bildirim bulunmuyor.' : 'Henüz bildirim yok.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card key={notification.id} className={`shadow-md rounded-lg overflow-hidden ${notification.read ? 'bg-muted/30' : 'bg-card'}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {notification.type === 'alert' ? (
                      <AlertTriangle className="w-6 h-6 text-destructive" />
                    ) : (
                      <Info className="w-6 h-6 text-blue-500" />
                    )}
                    <CardTitle className="text-lg leading-tight">{notification.title}</CardTitle>
                  </div>
                  {!notification.read && <Badge variant="destructive" className="ml-2 text-xs">Yeni</Badge>}
                </div>
                {notification.locationName && (
                   <CardDescription className="text-xs pt-1">
                     Konum: {notification.locationName}
                   </CardDescription>
                )}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground pb-4">
                <p>{notification.body}</p>
              </CardContent>
              <CardFooter className="bg-muted/50 px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
                 <p className="text-muted-foreground">
                    {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true, locale: tr })}
                    <span className="mx-1">·</span>
                    {format(parseISO(notification.timestamp), 'dd MMM HH:mm', { locale: tr })}
                 </p>
                 <div className="flex gap-2">
                    {notification.link && (
                        <Button size="xs" variant="outline" asChild>
                            <Link href={notification.link}><ExternalLink className="mr-1 h-3 w-3"/> Konuma Git</Link>
                        </Button>
                    )}
                    <Button size="xs" variant={notification.read ? "secondary" : "default"} onClick={() => toggleNotificationReadStatus(notification.id)}>
                        {notification.read ? 'Okunmadı İşaretle' : 'Okundu İşaretle'}
                    </Button>
                 </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

