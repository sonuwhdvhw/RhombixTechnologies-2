import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { supabase } from '@/lib/supabase';
import { connectSocket, disconnectSocket } from '@/lib/socket';

// Pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import FeedPage from '@/pages/FeedPage';
import ProfilePage from '@/pages/ProfilePage';
import NotificationsPage from '@/pages/NotificationsPage';
import FriendsPage from '@/pages/FriendsPage';
import PostDetailPage from '@/pages/PostDetailPage';
import MessagesPage from '@/pages/MessagesPage';

// Layout
import AppLayout from '@/components/layout/AppLayout';
import CustomCursor from '@/components/ui/CustomCursor';

// Route guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return <>{children}</>;
};

const FallbackRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return <Navigate to={isAuthenticated ? '/feed' : '/'} replace />;
};

export default function App() {
  const { setUser, setLoading, fetchProfile } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
    // Apply theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const isPlaceholder =
      !import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.VITE_SUPABASE_URL.includes('your-project-id');

    if (isPlaceholder) {
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        fetchProfile(session.user.id);
        connectSocket(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email! });
        fetchProfile(session.user.id);
        connectSocket(session.user.id);
      } else {
        setUser(null);
        disconnectSocket();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, fetchProfile]);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <CustomCursor />
      <AnimatePresence mode="wait">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/posts/:id" element={<PostDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:partnerId" element={<MessagesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<FallbackRoute />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
