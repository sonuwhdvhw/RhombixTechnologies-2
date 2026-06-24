import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import AnimatedBackground from '@/components/3d/AnimatedBackground';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, fetchProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validate = () => {
    const er = { email: '', password: '' };
    if (!email) er.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) er.email = 'Invalid email';
    if (!password) er.password = 'Password is required';
    setErrors(er);
    return !er.email && !er.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email! });
        fetchProfile(data.user.id);
      }
      // Small delay so store state settles before PublicRoute checks isAuthenticated
      setTimeout(() => navigate('/feed', { replace: true }), 300);
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message.includes('Invalid') ? 'Incorrect email or password' : 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#08080f' }}>
      <AnimatedBackground />

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" stroke="#fff" strokeWidth="2.5"/>
              <path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-4xl font-black mb-3">
            <span className="brand" style={{ fontSize: 36 }}>Connectify</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#a8a8d0' }}>
            Connect with friends, share your moments, and discover what's happening around the world.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-2">
            {['✨ Real-time feed', '🔥 Trending news', '💬 Live chat', '🌐 Global network'].map(f => (
              <div key={f} className="px-3 py-2 rounded-xl text-xs font-medium" style={{ color: '#a8a8d0', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)' }}>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}>
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" stroke="#fff" strokeWidth="2.5"/>
                <path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="brand">Connectify</span>
          </div>

          {/* Card */}
          <div className="g-card p-7">
            <h2 className="text-2xl font-black text-white mb-1">Welcome back</h2>
            <p className="text-sm mb-6" style={{ color: '#6060a0' }}>
              New here?{' '}
              <Link to="/auth/register" className="font-semibold hover:opacity-80" style={{ color: '#a78bfa' }}>Create account</Link>
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a8d0' }}>Email</label>
                <input type="email" placeholder="you@email.com" value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: '' })); }}
                  className={`c-input${errors.email ? ' err' : ''}`} autoComplete="email" />
                {errors.email && <p className="text-xs mt-1.5" style={{ color: '#ec4899' }}>{errors.email}</p>}
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-xs font-semibold" style={{ color: '#a8a8d0' }}>Password</label>
                  <button type="button" className="text-xs font-semibold hover:opacity-80" style={{ color: '#a78bfa' }}>Forgot?</button>
                </div>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Your password" value={password}
                    onChange={e => { setPassword(e.target.value); setErrors(er => ({ ...er, password: '' })); }}
                    className={`c-input pr-10${errors.password ? ' err' : ''}`} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#6060a0' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1.5" style={{ color: '#ec4899' }}>{errors.password}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-glow w-full h-[44px] mt-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Sign in'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.15)' }} />
              <span className="text-xs font-medium" style={{ color: '#6060a0' }}>OR</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.15)' }} />
            </div>

            <p className="text-center text-sm" style={{ color: '#6060a0' }}>
              Don't have an account?{' '}
              <Link to="/auth/register" className="font-bold hover:opacity-80" style={{ color: '#a78bfa' }}>Sign up free</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
