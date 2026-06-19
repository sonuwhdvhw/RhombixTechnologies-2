import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { profilesApi, friendshipsApi } from '@/lib/api';
import { Profile } from '@/types';
import Avatar from '@/components/ui/Avatar';

const TRENDING = [
  { tag: '#AI', posts: '42.3K' },
  { tag: '#WebDev', posts: '28.1K' },
  { tag: '#Design', posts: '19.7K' },
  { tag: '#Crypto', posts: '15.2K' },
  { tag: '#Photography', posts: '12.8K' },
];

export default function RightSidebar() {
  const { profile } = useAuthStore();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    profilesApi.getSuggestions()
      .then(({ data }) => setSuggestions(data.suggestions || []))
      .catch(() => {});
  }, []);

  const follow = async (id: string) => {
    try { await friendshipsApi.sendRequest(id); setSent(s => new Set([...s, id])); }
    catch {}
  };

  return (
    <aside className="fixed right-0 top-[60px] bottom-0 w-[300px] hidden xl:flex flex-col px-4 pt-5 overflow-y-auto"
      style={{ background: 'rgba(8,8,15,0.7)', borderLeft: '1px solid rgba(139,92,246,0.08)' }}>

      {/* Current user */}
      {profile && (
        <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 p-3 rounded-xl mb-4 transition-all"
          style={{ background: 'rgba(26,26,46,0.6)', border: '1px solid rgba(139,92,246,0.12)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)')}>
          <div className="profile-ring">
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}&background=6366f1&color=ffffff&size=64&bold=true`}
              className="w-10 h-10 rounded-full object-cover block"
              style={{ border: '2px solid #08080f' }}
              alt={profile.username}
            />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{profile.username}</p>
            <p className="text-xs" style={{ color: '#6060a0' }}>{profile.full_name}</p>
          </div>
        </Link>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#6060a0' }}>
            Suggested for you
          </p>
          <div className="space-y-3">
            {suggestions.slice(0, 5).map((u, i) => (
              <motion.div key={u.id}
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-center justify-between">
                <Link to={`/profile/${u.username}`} className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                    <p className="text-[11px] truncate" style={{ color: '#6060a0' }}>Suggested</p>
                  </div>
                </Link>
                <button onClick={() => follow(u.id)} disabled={sent.has(u.id)}
                  className="flex items-center gap-1 text-xs font-bold ml-2 shrink-0 px-2.5 py-1 rounded-lg transition-all"
                  style={sent.has(u.id) ? {
                    color: '#6060a0', background: 'rgba(26,26,46,0.5)'
                  } : {
                    color: '#a78bfa',
                    background: 'rgba(139,92,246,0.12)',
                    border: '1px solid rgba(139,92,246,0.2)',
                  }}>
                  {sent.has(u.id) ? 'Sent' : <><UserPlus size={11} /> Follow</>}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-[#a78bfa]" />
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6060a0' }}>
            Trending
          </p>
        </div>
        <div className="space-y-2">
          {TRENDING.map((t, i) => (
            <motion.div key={t.tag}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
              className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all"
              style={{ background: 'rgba(26,26,46,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(26,26,46,0.4)')}>
              <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>{t.tag}</span>
              <span className="text-xs" style={{ color: '#6060a0' }}>{t.posts}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <p className="text-[10px] mt-auto pb-4" style={{ color: '#404060' }}>
        © 2025 Connectify · Privacy · Terms
      </p>
    </aside>
  );
}
