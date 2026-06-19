import { NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, PlusSquare, Heart, Users, LogOut, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Avatar from '@/components/ui/Avatar';

const items = [
  { icon: Home, label: 'Home', to: '/feed' },
  { icon: MessageCircle, label: 'Messages', to: '/messages' },
  { icon: Users, label: 'Friends', to: '/friends' },
  { icon: Heart, label: 'Notifications', to: '/notifications' },
];

export default function Sidebar() {
  const { profile, signOut } = useAuthStore();
  const { notificationCount, setCreatePostModalOpen } = useUIStore();
  const navigate = useNavigate();

  return (
    <aside className="sidebar fixed left-0 top-[60px] bottom-0 w-[244px] hidden lg:flex flex-col py-4 z-40">
      <div className="flex-1 px-3 space-y-1">
        {items.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all relative group ${
                isActive
                  ? 'nav-active'
                  : 'text-[#6060a0] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.08)]'
              }`
            }>
            <div className="relative shrink-0">
              <item.icon size={22} />
              {item.label === 'Notifications' && notificationCount > 0 && (
                <span className="notif-dot" />
              )}
            </div>
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}

        {/* Create post */}
        <button onClick={() => setCreatePostModalOpen(true)}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-[#6060a0] hover:text-[#a78bfa] hover:bg-[rgba(139,92,246,0.08)] transition-all">
          <PlusSquare size={22} />
          <span className="text-sm font-medium">Create</span>
        </button>

        {/* Upgrade pill */}
        <div className="mt-4 mx-1 p-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[#a78bfa]" />
            <span className="text-xs font-bold text-[#a78bfa]">Connectify Pro</span>
          </div>
          <p className="text-[11px] text-[#6060a0]">Get verified badge & analytics</p>
        </div>
      </div>

      {/* Profile at bottom */}
      <div className="px-3 pt-3 space-y-1" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
        <NavLink to={`/profile/${profile?.username}`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              isActive ? 'nav-active' : 'text-[#a8a8d0] hover:bg-[rgba(139,92,246,0.08)]'
            }`
          }>
          <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{profile?.username}</p>
            <p className="text-[11px] truncate" style={{ color: '#6060a0' }}>{profile?.full_name}</p>
          </div>
        </NavLink>

        <button onClick={async () => { await signOut(); navigate('/'); }}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all text-[#6060a0] hover:text-red-400 hover:bg-[rgba(239,68,68,0.08)]">
          <LogOut size={18} />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </aside>
  );
}
