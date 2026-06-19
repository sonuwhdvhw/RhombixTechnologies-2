import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, PlusSquare, Heart, MessageCircle,
  LogOut, Settings, User
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { profilesApi } from '@/lib/api';
import { debounce } from '@/lib/utils';
import { Profile } from '@/types';
import Avatar from '@/components/ui/Avatar';

export default function Navbar() {
  const { profile, signOut } = useAuthStore();
  const { notificationCount, setCreatePostModalOpen } = useUIStore();
  const navigate = useNavigate();

  const [searchQ, setSearchQ] = useState('');
  const [searchRes, setSearchRes] = useState<Profile[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const doSearch = debounce(async (q: string) => {
    if (q.length < 2) { setSearchRes([]); return; }
    try {
      const { data } = await profilesApi.search(q);
      setSearchRes(data.users || []);
    } catch { setSearchRes([]); }
  }, 300);

  useEffect(() => { doSearch(searchQ); }, [searchQ]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <header className="navbar fixed top-0 left-0 right-0 z-50">
      <div className="max-w-[975px] mx-auto px-4 h-[60px] flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/feed" className="shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" stroke="#fff" strokeWidth="2.5"/>
                <path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="brand hidden sm:block">Connectify</span>
          </div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-[268px] relative hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: '#6060a0' }} />
            <input
              type="text"
              placeholder="Search"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              className="w-full h-[36px] rounded-xl pl-9 pr-3 text-sm outline-none"
              style={{
                background: 'rgba(26,26,46,0.8)',
                border: '1px solid rgba(139,92,246,0.2)',
                color: '#f0f0ff',
              }}
            />
          </div>

          <AnimatePresence>
            {searchOpen && searchRes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-2xl z-50"
                style={{ background: 'rgba(20,20,40,0.95)', border: '1px solid rgba(139,92,246,0.25)', backdropFilter: 'blur(16px)' }}
              >
                {searchRes.slice(0, 6).map(u => (
                  <Link key={u.id} to={`/profile/${u.username}`}
                    onClick={() => { setSearchQ(''); setSearchOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.08)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#f0f0ff' }}>{u.username}</p>
                      <p className="text-xs" style={{ color: '#6060a0' }}>{u.full_name}</p>
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Icons */}
        <nav className="flex items-center gap-1">
          <NavLink to="/feed" className={({ isActive }) =>
            `w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isActive ? 'nav-active' : 'text-[#6060a0] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.1)]'}`}
            aria-label="Home"><Home size={22} /></NavLink>

          <NavLink to="/messages" className={({ isActive }) =>
            `w-10 h-10 flex items-center justify-center rounded-xl transition-all ${isActive ? 'nav-active' : 'text-[#6060a0] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.1)]'}`}
            aria-label="Messages"><MessageCircle size={22} /></NavLink>

          <button onClick={() => setCreatePostModalOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all text-[#6060a0] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.1)]"
            aria-label="Create post"><PlusSquare size={22} /></button>

          <NavLink to="/notifications" className={({ isActive }) =>
            `w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${isActive ? 'nav-active' : 'text-[#6060a0] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.1)]'}`}
            aria-label="Notifications">
            <Heart size={22} />
            {notificationCount > 0 && <span className="notif-dot" />}
          </NavLink>

          {/* Profile menu */}
          <div ref={menuRef} className="relative ml-1">
            <button onClick={() => setMenuOpen(v => !v)}
              className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-[#1c1c1c] transition-colors"
              aria-label="Profile menu" aria-expanded={menuOpen}>
              <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 w-[200px] rounded-xl overflow-hidden shadow-2xl z-50 border border-[#363636]"
                  style={{ background: '#1c1c1c' }}
                >
                  <Link to={`/profile/${profile?.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#262626] transition-colors border-b border-[#262626]">
                    <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{profile?.username}</p>
                      <p className="text-xs text-[#737373] truncate">{profile?.full_name}</p>
                    </div>
                  </Link>

                  <Link to={`/profile/${profile?.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#262626] transition-colors">
                    <User size={16} className="text-[#a8a8a8]" /> Profile
                  </Link>

                  <Link to="/friends"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-[#262626] transition-colors">
                    <Settings size={16} className="text-[#a8a8a8]" /> Friends
                  </Link>

                  <div className="border-t border-[#262626]" />
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#ff3040] hover:bg-[#262626] transition-colors">
                    <LogOut size={16} /> Log out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>
    </header>
  );
}
