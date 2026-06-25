import { Outlet, NavLink } from 'react-router-dom';
import { Home, PlusSquare, Heart, User, Users } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import CreatePostModal from '@/components/feed/CreatePostModal';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const { createPostModalOpen, setCreatePostModalOpen, notificationCount } = useUIStore();
  const { profile } = useAuthStore();

  return (
    <div className="min-h-screen" style={{
      background: '#06070f',
      backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.08), transparent 18%), radial-gradient(circle at 80% 18%, rgba(56,189,248,0.06), transparent 16%), radial-gradient(circle at 50% 85%, rgba(236,72,153,0.05), transparent 20%)',
    }}>
      {/* Ambient accents */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <Navbar />

      <div className="flex pt-[60px]" style={{ position: 'relative', zIndex: 1 }}>
        {/* Left sidebar */}
        <Sidebar />

        {/* Main */}
        <main className="flex-1 min-w-0 lg:ml-[244px] xl:mr-[320px] pb-[60px] lg:pb-0">
          <div className="page-in">
            <Outlet />
          </div>
        </main>

        {/* Right sidebar */}
        <RightSidebar />
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 h-[52px] flex items-center justify-around lg:hidden z-50"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(124,58,237,0.12)',
          boxShadow: '0 -4px 16px rgba(124,58,237,0.06)',
        }}
      >
        <NavLink to="/feed" className={({ isActive }) =>
          `flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#7c3aed]' : 'text-[#9585c5]'}`}>
          <Home size={24} />
        </NavLink>
        <NavLink to="/friends" className={({ isActive }) =>
          `flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#7c3aed]' : 'text-[#9585c5]'}`}>
          <Users size={24} />
        </NavLink>
        <button onClick={() => setCreatePostModalOpen(true)}
          className="flex items-center justify-center w-12 h-full text-[#9585c5]">
          <PlusSquare size={24} />
        </button>
        <NavLink to="/notifications" className={({ isActive }) =>
          `relative flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#7c3aed]' : 'text-[#9585c5]'}`}>
          <Heart size={24} />
          {notificationCount > 0 && <span className="notif-dot" />}
        </NavLink>
        <NavLink to={profile?.username ? `/profile/${profile.username}` : '/feed'} className={({ isActive }) =>
          `flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#7c3aed]' : 'text-[#9585c5]'}`}>
          <User size={22} />
        </NavLink>
      </nav>

      <CreatePostModal
        isOpen={createPostModalOpen}
        onClose={() => setCreatePostModalOpen(false)}
      />
    </div>
  );
}
