
export interface StoredNotification {
  id: string;
  type: 'alert' | 'info'; // 'alert' for severe weather, 'info' for general news
  title: string;
  body: string;
  timestamp: string; // ISO string for sorting
  locationName?: string; // e.g., "Ankara / Çankaya"
  link?: string; // e.g., "/konum/Ankara/Çankaya"
  read: boolean;
}
