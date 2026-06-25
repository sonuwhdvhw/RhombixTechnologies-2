import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { supabase } from '@/lib/supabase';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const LandingPage       = lazy(() => import('@/pages/LandingPage'));
const LoginPage         = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage      = lazy(() => import('@/pages/auth/RegisterPage'));
const FeedPage          = lazy(() => import('@/pages/FeedPage'));
const ProfilePage       = lazy(() => import('@/pages/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const FriendsPage       = lazy(() => import('@/pages/FriendsPage'));
const PostDetailPage    = lazy(() => import('@/pages/PostDetailPage'));
const MessagesPage      = lazy(() => import('@/pages/MessagesPage'));

import AppLayout from '@/components/layout/AppLayout';
import CustomCursor from '@/components/ui/CustomCursor';

function PageLoader() {
  return (
    <div style={{
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#faf8ff', zIndex: 9999,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        border: '3px solid rgba(124,58,237,0.15)',
        borderTopColor: '#7c3aed',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/feed" replace />;
  return <>{children}</>;
};

const FallbackRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  return <Navigate to={isAuthenticated ? '/feed' : '/'} replace />;
};

export default function App() {
  const { setUser, setLoading, fetchProfile } = useAuthStore();
  const { theme } = useUIStore();

  useEffect(() => {
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

    let resolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth event]', event, !!session?.user);

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email! });
          fetchProfile(session.user.id);
          connectSocket(session.user.id);
        } else if (event === 'INITIAL_SESSION') {
          setUser(null);
          disconnectSocket();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        disconnectSocket();
      }
      // USER_UPDATED — ignore

      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    });

    const fallback = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [setUser, setLoading, fetchProfile]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      <CustomCursor />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/auth/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/auth/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/messages/:partnerId" element={<MessagesPage />} />
            </Route>

            <Route path="*" element={<FallbackRoute />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
