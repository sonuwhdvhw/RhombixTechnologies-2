import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { formatRelativeTime, notificationMessages, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { NotificationSkeleton } from '@/components/ui/SkeletonLoader';

type FilterType = 'all' | 'like' | 'comment' | 'friend_request';

const filters: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'like', label: 'Likes' },
  { value: 'comment', label: 'Comments' },
  { value: 'friend_request', label: 'Requests' },
];

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const { setNotificationCount } = useUIStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationsApi.getAll(filter === 'all' ? undefined : filter);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setNotificationCount(data.unreadCount || 0);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  // Real-time notifications
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
        setUnreadCount((c) => c + 1);
        setNotificationCount(unreadCount + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markAllRead = async () => {
    await notificationsApi.markRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    setNotificationCount(0);
  };

  const getNotificationLink = (n: Notification) => {
    if (n.post_id) return `/posts/${n.post_id}`;
    if (n.actor) return `/profile/${n.actor.username}`;
    return '#';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-indigo-500 rounded-full text-xs text-white font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 glass border border-white/8 rounded-xl hover:text-white transition-colors"
          >
            <Check className="w-3 h-3" /> Mark all read
          </motion.button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="glass-card p-1 flex gap-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-xl transition-all',
              filter === f.value
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="glass-card overflow-hidden divide-y divide-white/5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={getNotificationLink(n)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 hover:bg-white/3 transition-colors',
                    !n.read && 'bg-indigo-500/5'
                  )}
                >
                  {/* Avatar with reaction badge */}
                  <div className="relative shrink-0">
                    <Avatar src={n.actor?.avatar_url} name={n.actor?.username} size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 text-sm">
                      {n.type === 'like' ? '❤️' :
                       n.type === 'comment' ? '💬' :
                       n.type === 'friend_request' ? '👋' :
                       n.type === 'friend_accepted' ? '🤝' : '🔔'}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-white">{n.actor?.full_name || n.actor?.username}</span>
                      {' '}{notificationMessages[n.type]?.('').replace(n.actor?.full_name || '', '').trim()}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>

                  {/* Post thumbnail */}
                  {n.post?.image_url && (
                    <img src={n.post.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  )}

                  {/* Unread dot */}
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" aria-label="Unread" />
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
