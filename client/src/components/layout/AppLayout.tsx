import { Outlet, NavLink } from 'react-router-dom';
import { Home, PlusSquare, Heart, User, Users } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';
import CreatePostModal from '@/components/feed/CreatePostModal';
import AnimatedBackground from '@/components/3d/AnimatedBackground';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const { createPostModalOpen, setCreatePostModalOpen, notificationCount } = useUIStore();
  const { profile } = useAuthStore();

  return (
    <div className="min-h-screen" style={{ background: '#08080f' }}>
      {/* 3D Animated background */}
      <AnimatedBackground />

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
          background: 'rgba(8,8,15,0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(139,92,246,0.15)',
        }}
      >
        <NavLink to="/feed" className={({ isActive }) =>
          `flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#a78bfa]' : 'text-[#6060a0]'}`}>
          <Home size={24} />
        </NavLink>
        <NavLink to="/friends" className={({ isActive }) =>
          `flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#a78bfa]' : 'text-[#6060a0]'}`}>
          <Users size={24} />
        </NavLink>
        <button
          onClick={() => setCreatePostModalOpen(true)}
          className="flex items-center justify-center w-12 h-full text-[#6060a0]"
        >
          <PlusSquare size={24} />
        </button>
        <NavLink to="/notifications" className={({ isActive }) =>
          `relative flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#a78bfa]' : 'text-[#6060a0]'}`}>
          <Heart size={24} />
          {notificationCount > 0 && <span className="notif-dot" />}
        </NavLink>
        <NavLink to={`/profile/${profile?.username}`} className={({ isActive }) =>
          `flex items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#a78bfa]' : 'text-[#6060a0]'}`}>
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
