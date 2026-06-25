import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, PlusSquare, Bell, MessageCircle,
  LogOut, Settings, User, X
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
  const [searchFocused, setSearchFocused] = useState(false);
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
        <Link to="/feed" className="shrink-0 group">
          <motion.div className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
                boxShadow: '0 0 16px rgba(124,58,237,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
              }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" stroke="#fff" strokeWidth="2.5"/>
                <path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="brand hidden sm:block">Connectify</span>
          </motion.div>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-[280px] relative hidden md:block">
          <motion.div
            animate={{ scale: searchFocused ? 1.01 : 1 }}
            transition={{ duration: 0.15 }}
            className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
              size={14}
              style={{ color: searchFocused ? '#a78bfa' : '#5c5c8a' }} />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setSearchOpen(true); }}
              onFocus={() => { setSearchOpen(true); setSearchFocused(true); }}
              onBlur={() => { setTimeout(() => setSearchOpen(false), 200); setSearchFocused(false); }}
              className="w-full h-[38px] rounded-xl pl-9 pr-9 text-sm outline-none transition-all"
              style={{
                background: searchFocused ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${searchFocused ? 'rgba(124,58,237,0.45)' : 'rgba(139,92,246,0.15)'}`,
                color: '#f0f0ff',
                boxShadow: searchFocused ? '0 0 0 3px rgba(124,58,237,0.1), 0 0 20px rgba(124,58,237,0.08)' : 'none',
                backdropFilter: 'blur(8px)',
              }}
            />
            {searchQ && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => { setSearchQ(''); setSearchRes([]); }}
                style={{ color: '#5c5c8a' }}>
                <X size={12} />
              </button>
            )}
          </motion.div>

          <AnimatePresence>
            {searchOpen && searchRes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
                style={{
                  background: 'rgba(12,12,22,0.97)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03) inset',
                }}>
                <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#5c5c8a' }}>People</p>
                </div>
                {searchRes.slice(0, 6).map((u, i) => (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <Link to={`/profile/${u.username}`}
                      onClick={() => { setSearchQ(''); setSearchOpen(false); }}
                      className="flex items-center gap-3 px-4 py-3 transition-all group"
                      style={{ borderBottom: '1px solid rgba(139,92,246,0.06)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="relative">
                        <Avatar src={u.avatar_url} name={u.full_name || u.username} size="sm" />
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ boxShadow: '0 0 12px rgba(124,58,237,0.4)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#f0f0ff' }}>@{u.username}</p>
                        <p className="text-xs" style={{ color: '#5c5c8a' }}>{u.full_name}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Icons */}
        <nav className="flex items-center gap-0.5">
          {[
            { to: '/feed', icon: Home, label: 'Home' },
            { to: '/messages', icon: MessageCircle, label: 'Messages' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} aria-label={label}
              className={({ isActive }) =>
                `w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${
                  isActive ? 'nav-active' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? '#a78bfa' : '#5c5c8a',
              })}>
              {({ isActive }) => (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Icon size={21} style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(167,139,250,0.6))' : 'none' }} />
                </motion.div>
              )}
            </NavLink>
          ))}

          {/* Create */}
          <motion.button
            onClick={() => setCreatePostModalOpen(true)}
            whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
            className="w-10 h-10 flex items-center justify-center rounded-xl transition-all"
            style={{ color: '#5c5c8a' }}
            aria-label="Create post">
            <PlusSquare size={21} />
          </motion.button>

          {/* Notifications */}
          <NavLink to="/notifications" aria-label="Notifications"
            className={({ isActive }) =>
              `w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${isActive ? 'nav-active' : ''}`
            }
            style={({ isActive }) => ({ color: isActive ? '#a78bfa' : '#5c5c8a' })}>
            {({ isActive }) => (
              <>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Bell size={21} style={{ filter: isActive ? 'drop-shadow(0 0 6px rgba(167,139,250,0.6))' : 'none' }} />
                </motion.div>
                {notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="notif-dot" />
                )}
              </>
            )}
          </NavLink>

          {/* Profile menu */}
          <div ref={menuRef} className="relative ml-1">
            <motion.button
              onClick={() => setMenuOpen(v => !v)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-10 h-10 rounded-xl transition-all relative"
              style={{
                border: menuOpen ? '1.5px solid rgba(124,58,237,0.4)' : '1.5px solid transparent',
                boxShadow: menuOpen ? '0 0 16px rgba(124,58,237,0.2)' : 'none',
              }}
              aria-label="Profile menu" aria-expanded={menuOpen}>
              <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
            </motion.button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 6 }}
                  transition={{ duration: 0.15, ease: [0.22,1,0.36,1] }}
                  className="absolute right-0 top-full mt-2 w-[220px] rounded-2xl overflow-hidden z-50"
                  style={{
                    background: 'rgba(12,12,22,0.97)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
                  }}>
                  {/* Profile header */}
                  <Link to={`/profile/${profile?.username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-4 transition-all group"
                    style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="relative">
                      <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
                      <div className="absolute inset-0 rounded-full"
                        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), transparent)', opacity: 0 }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: '#f0f0ff' }}>@{profile?.username}</p>
                      <p className="text-xs truncate" style={{ color: '#5c5c8a' }}>{profile?.full_name}</p>
                    </div>
                  </Link>

                  {/* Menu items */}
                  {[
                    { to: `/profile/${profile?.username}`, icon: User, label: 'View Profile' },
                    { to: '/friends', icon: Settings, label: 'Friends' },
                  ].map(({ to, icon: Icon, label }) => (
                    <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                      style={{ color: '#a8a8d0', borderBottom: '1px solid rgba(139,92,246,0.06)' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.color = '#f0f0ff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a8a8d0'; }}>
                      <Icon size={15} style={{ color: '#5c5c8a' }} />
                      {label}
                    </Link>
                  ))}

                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all"
                    style={{ color: '#f87171' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <LogOut size={15} /> Log out
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
