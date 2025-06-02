
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { StoredNotification } from '@/types/notifications';
import { useLocalStorage } from './useLocalStorage'; // Changed to named import

const STORED_NOTIFICATIONS_KEY = 'havadurumux_all_notifications';
const MAX_NOTIFICATIONS = 50;

export function useStoredNotifications() {
  const [notifications, setNotificationsInternal] = useLocalStorage<StoredNotification[]>(STORED_NOTIFICATIONS_KEY, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addNotification = useCallback((data: Omit<StoredNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: StoredNotification = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
    };

    setNotificationsInternal(prevNotifications => {
      const updatedNotifications = [newNotification, ...prevNotifications];
      return updatedNotifications.slice(0, MAX_NOTIFICATIONS);
    });
  }, [setNotificationsInternal]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotificationsInternal(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, [setNotificationsInternal]);
  
  const toggleNotificationReadStatus = useCallback((id: string) => {
    setNotificationsInternal(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  }, [setNotificationsInternal]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotificationsInternal(prev => prev.map(n => ({ ...n, read: true })));
  }, [setNotificationsInternal]);

  const deleteNotification = useCallback((id: string) => {
    setNotificationsInternal(prev => prev.filter(n => n.id !== id));
  }, [setNotificationsInternal]);

  const clearAllNotifications = useCallback(() => {
    setNotificationsInternal([]);
  }, [setNotificationsInternal]);

  const unreadCount = mounted ? notifications.filter(n => !n.read).length : 0;

  return {
    notifications: mounted ? notifications : [], // Return empty array until mounted to avoid hydration issues
    addNotification,
    markNotificationAsRead,
    toggleNotificationReadStatus,
    markAllNotificationsAsRead,
    deleteNotification,
    clearAllNotifications,
    unreadCount,
    isMounted: mounted,
  };
}
