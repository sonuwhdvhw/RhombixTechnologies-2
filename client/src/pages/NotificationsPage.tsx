import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime, notificationMessages } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

type FilterType = 'all' | 'like' | 'comment' | 'friend_request';
const FILTERS: { v: FilterType; label: string }[] = [
  { v: 'all', label: 'All' },
  { v: 'like', label: 'Likes' },
  { v: 'comment', label: 'Comments' },
  { v: 'friend_request', label: 'Requests' },
];

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { setNotificationCount } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchNotifications(); }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getAll(filter === 'all' ? undefined : filter);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationCount(data.unreadCount || 0);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`notifs:${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => { setNotifications(p => [payload.new as Notification, ...p]); setUnreadCount(c => c + 1); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const markAllRead = async () => {
    await notificationsApi.markRead();
    setNotifications(p => p.map(n => ({ ...n, read: true })));
    setUnreadCount(0); setNotificationCount(0);
  };

  const getLink = (n: Notification) => n.post_id ? `/posts/${n.post_id}` : `/profile/${n.actor?.username}`;

  return (
    <div className="max-w-[614px] mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} style={{ color: '#7c3aed' }} />
          <h1 className="text-lg font-bold" style={{ color: '#0f0820' }}>Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)' }}>{unreadCount}</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}>
            <Check size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="g-card p-1 flex gap-1">
        {FILTERS.map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
            style={filter === f.v ? {
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(168,85,247,0.08))',
              color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)',
            } : { color: '#9585c5' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="g-card overflow-hidden divide-y" style={{ borderColor: 'rgba(124,58,237,0.06)' }}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className="skel w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skel h-3 w-48" />
                <div className="skel h-2.5 w-24" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={40} className="mx-auto mb-3" style={{ color: '#ede9fe' }} />
            <p className="text-sm" style={{ color: '#9585c5' }}>No notifications yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div key={n.id}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}>
                <Link to={getLink(n)}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                  style={{ background: !n.read ? 'rgba(124,58,237,0.03)' : 'transparent' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = !n.read ? 'rgba(124,58,237,0.03)' : 'transparent')}>
                  <div className="relative shrink-0">
                    <Avatar src={n.actor?.avatar_url} name={n.actor?.username} size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 text-sm">
                      {n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'friend_request' ? '👋' : n.type === 'friend_accepted' ? '🤝' : '🔔'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: '#0f0820' }}>
                      <span className="font-bold">{n.actor?.full_name || n.actor?.username}</span>
                      {' '}{notificationMessages[n.type]?.(n.actor?.full_name || n.actor?.username || '')
                        .replace(n.actor?.full_name || n.actor?.username || '', '').trim()}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9585c5' }}>{formatRelativeTime(n.created_at)}</p>
                  </div>
                  {n.post?.image_url && (
                    <img src={n.post.image_url} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" />
                  )}
                  {!n.read && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: '#7c3aed' }} />}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
