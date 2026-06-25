import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, MessageCircle, PlusSquare, Bell, Users, LogOut, Zap, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Avatar from '@/components/ui/Avatar';

const NAV_ITEMS = [
  { icon: Home,          label: 'Home',          to: '/feed' },
  { icon: MessageCircle, label: 'Messages',       to: '/messages' },
  { icon: Users,         label: 'Friends',        to: '/friends' },
  { icon: Bell,          label: 'Notifications',  to: '/notifications' },
  { icon: TrendingUp,    label: 'Trending',       to: '/feed' },
];

export default function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const { notificationCount, setCreatePostModalOpen } = useUIStore();
  const navigate = useNavigate();

  return (
    <aside className="sidebar fixed left-0 top-[60px] bottom-0 w-[244px] hidden lg:flex flex-col py-5 z-40">

      {/* Top nav */}
      <div className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <NavLink key={item.to + item.label} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all relative group ${
                isActive ? 'nav-active' : ''
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? '#a78bfa' : '#5c5c8a',
            })}>
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.08))' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                )}

                <div className="relative shrink-0 z-10">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(167,139,250,0.6))' : 'none' }}>
                    <item.icon size={21} />
                  </motion.div>
                  {item.label === 'Notifications' && notificationCount > 0 && (
                    <span className="notif-dot" />
                  )}
                </div>

                <span className="text-sm font-semibold z-10 transition-colors group-hover:text-[#a78bfa]"
                  style={{ color: isActive ? '#a78bfa' : '#a8a8d0' }}>
                  {item.label}
                </span>

                {/* Hover glow */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(124,58,237,0.05)' }} />
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Create Post */}
        <motion.button
          onClick={() => setCreatePostModalOpen(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all group relative mt-1"
          style={{ color: '#5c5c8a' }}>
          <motion.div whileHover={{ scale: 1.1 }}>
            <PlusSquare size={21} />
          </motion.div>
          <span className="text-sm font-semibold text-[#a8a8d0] group-hover:text-[#a78bfa] transition-colors">Create</span>
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(124,58,237,0.05)' }} />
        </motion.button>

        {/* Pro upgrade card */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="mt-4 mx-1 p-4 rounded-2xl relative overflow-hidden cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.08), rgba(236,72,153,0.06))',
            border: '1px solid rgba(124,58,237,0.25)',
          }}>
          {/* Shimmer */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent 60%)' }} />
          <div className="flex items-center gap-2 mb-2 relative">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold" style={{ color: '#c4b5fd' }}>Connectify Pro</span>
          </div>
          <p className="text-[11px] leading-relaxed relative" style={{ color: '#5c5c8a' }}>
            Get verified badge, analytics & exclusive features
          </p>
          <div className="mt-2.5 text-[11px] font-bold relative"
            style={{ color: '#a78bfa' }}>
            Upgrade → free
          </div>
        </motion.div>
      </div>

      {/* Bottom — profile */}
      <div className="px-3 pt-3 space-y-0.5"
        style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <NavLink
          to={profile?.username ? `/profile/${profile.username}` : '/feed'}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all group ${isActive ? 'nav-active' : ''}`
          }
          style={({ isActive }) => ({ color: isActive ? '#a78bfa' : '#a8a8d0' })}>
          <div className="relative shrink-0">
            <div className="story-ring">
              <div className="story-ring-inner">
                <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: '#10b981', borderColor: '#0a0a0f' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#f0f0ff' }}>
              {profile?.username}
            </p>
            <p className="text-[11px] truncate" style={{ color: '#5c5c8a' }}>
              {profile?.full_name || 'View profile'}
            </p>
          </div>
        </NavLink>

        <motion.button
          onClick={async () => { await signOut(); navigate('/'); }}
          whileHover={{ scale: 1.01 }}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-all group"
          style={{ color: '#5c5c8a' }}>
          <LogOut size={18} className="group-hover:text-red-400 transition-colors" />
          <span className="text-sm font-semibold group-hover:text-red-400 transition-colors">Log out</span>
        </motion.button>
      </div>
    </aside>
  );
}
