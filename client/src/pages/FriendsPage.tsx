import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, UserX, Search } from 'lucide-react';
import { friendshipsApi, profilesApi } from '@/lib/api';
import { FriendWithUser, Profile } from '@/types';
import { debounce, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import toast from 'react-hot-toast';

type Tab = 'friends' | 'requests' | 'suggestions';

export default function FriendsPage() {
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<FriendWithUser[]>([]);
  const [requests, setRequests] = useState<Array<{ id: string; requester: Profile }>>([]);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'friends') {
        const { data } = await friendshipsApi.getAll('accepted');
        setFriends(data.friends || []);
      } else if (tab === 'requests') {
        const { data } = await friendshipsApi.getPending();
        setRequests(data.requests || []);
      } else {
        const { data } = await profilesApi.getSuggestions();
        setSuggestions(data.suggestions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = debounce(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await profilesApi.search(q);
    setSearchResults(data.users || []);
  }, 300);

  const handleAccept = async (id: string) => {
    try {
      await friendshipsApi.respond(id, 'accepted');
      setRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success('Friend request accepted!');
    } catch { toast.error('Failed'); }
  };

  const handleReject = async (id: string) => {
    try {
      await friendshipsApi.respond(id, 'rejected');
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch { toast.error('Failed'); }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendshipsApi.sendRequest(userId);
      setSentRequests((prev) => new Set([...prev, userId]));
      toast.success('Request sent!');
    } catch { toast.error('Failed'); }
  };

  const tabs = [
    { value: 'friends' as Tab, label: 'My Friends', icon: Users },
    { value: 'requests' as Tab, label: 'Requests', icon: UserPlus, count: requests.length },
    { value: 'suggestions' as Tab, label: 'Suggestions', icon: UserCheck },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-400" /> Network
      </h1>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search people..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); handleSearch(e.target.value); }}
            className="input-field pl-9 text-sm"
            aria-label="Search people"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-1">
            {searchResults.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/4 transition-colors">
                <Link to={`/profile/${user.username}`}>
                  <Avatar src={user.avatar_url} name={user.full_name || user.username} size="sm" />
                </Link>
                <Link to={`/profile/${user.username}`} className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.full_name || user.username}</p>
                  <p className="text-xs text-slate-500">@{user.username}</p>
                </Link>
                <button
                  onClick={() => handleSendRequest(user.id)}
                  disabled={sentRequests.has(user.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-medium transition-all',
                    sentRequests.has(user.id)
                      ? 'bg-indigo-500/20 text-indigo-400 cursor-default'
                      : 'bg-indigo-gradient text-white hover:shadow-indigo'
                  )}
                >
                  {sentRequests.has(user.id) ? 'Sent' : 'Add'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="glass-card p-1 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-xl transition-all',
              tab === t.value
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count ? (
              <span className="w-4 h-4 bg-indigo-500 rounded-full text-white text-[10px] flex items-center justify-center">
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'friends' ? (
          friends.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">No friends yet. Start by adding people!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map((f, i) => (
                <motion.div
                  key={f.friendshipId}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors"
                >
                  <Link to={`/profile/${f.user.username}`}>
                    <Avatar src={f.user.avatar_url} name={f.user.full_name || f.user.username} size="md" />
                  </Link>
                  <Link to={`/profile/${f.user.username}`} className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{f.user.full_name || f.user.username}</p>
                    <p className="text-xs text-slate-500">@{f.user.username}</p>
                  </Link>
                  <button
                    onClick={async () => {
                      try {
                        await friendshipsApi.remove(f.friendshipId);
                        setFriends(prev => prev.filter(x => x.friendshipId !== f.friendshipId));
                        toast.success('Friend removed');
                      } catch { toast.error('Failed'); }
                    }}
                    className="text-[#9585c5] hover:text-red-400 transition-colors"
                    aria-label="Remove friend"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )
        ) : tab === 'requests' ? (
          requests.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">No pending requests</div>
          ) : (
            <div className="space-y-3">
              {requests.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors"
                >
                  <Link to={`/profile/${r.requester.username}`}>
                    <Avatar src={r.requester.avatar_url} name={r.requester.full_name || r.requester.username} size="md" />
                  </Link>
                  <Link to={`/profile/${r.requester.username}`} className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{r.requester.full_name || r.requester.username}</p>
                    <p className="text-xs text-slate-500">@{r.requester.username}</p>
                  </Link>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(r.id)}
                      className="px-3 py-1.5 bg-indigo-gradient rounded-xl text-xs text-white font-medium hover:shadow-indigo transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(r.id)}
                      className="px-3 py-1.5 glass border border-white/10 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          suggestions.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">No suggestions available</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/4 transition-colors"
                >
                  <Link to={`/profile/${user.username}`}>
                    <Avatar src={user.avatar_url} name={user.full_name || user.username} size="md" />
                  </Link>
                  <Link to={`/profile/${user.username}`} className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.full_name || user.username}</p>
                    <p className="text-xs text-slate-500">@{user.username}</p>
                  </Link>
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sentRequests.has(user.id)}
                    className={cn(
                      'shrink-0 w-8 h-8 flex items-center justify-center rounded-xl transition-all',
                      sentRequests.has(user.id)
                        ? 'bg-indigo-500/20 text-indigo-400 cursor-default'
                        : 'glass hover:bg-indigo-500/20 hover:text-indigo-400 text-slate-400'
                    )}
                    aria-label={`Add ${user.username}`}
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
