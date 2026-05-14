import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export async function sendNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read'>) {
  // Store in database
  const { data, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      action_url: notification.action_url
    }])
    .select();
  
  if (!error && data) {
    // Send push notification if supported and permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/pwa-192x192.png'
      });
    }
  }
  
  return data?.[0];
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  
  return data || [];
}

export async function markAsRead(notificationId: string) {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
}

export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Schedule expiry notifications
export async function checkExpiringDocuments() {
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('expiry_alert_sent', false)
    .not('expiry_date', 'is', null);
  
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  for (const doc of documents || []) {
    const expiryDate = new Date(doc.expiry_date);
    if (expiryDate <= thirtyDaysFromNow && expiryDate >= today) {
      await sendNotification({
        user_id: doc.created_by,
        title: 'Document Expiring Soon',
        message: `${doc.name} expires on ${doc.expiry_date}`,
        type: 'warning',
        action_url: `/modules/document-management`
      });
      
      await supabase
        .from('documents')
        .update({ expiry_alert_sent: true })
        .eq('id', doc.id);
    }
  }
}
