import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import AnimatedBackground from '@/components/3d/AnimatedBackground';
import toast from 'react-hot-toast';

interface Form { email: string; username: string; full_name: string; password: string; confirmPassword: string; }

function ErrMsg({ msg }: { msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-xs mt-1.5" style={{ color: '#ec4899' }} role="alert">{msg}</motion.p>
      )}
    </AnimatePresence>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser, fetchProfile } = useAuthStore();
  const [form, setForm] = useState<Form>({ email: '', username: '', full_name: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Form>>({});
  const [emailSent, setEmailSent] = useState(false);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const er: Partial<Form> = {};
    if (!form.full_name.trim()) er.full_name = 'Required';
    if (!form.username.trim()) er.username = 'Required';
    else if (form.username.length < 3) er.username = 'Min 3 chars';
    else if (!/^[a-z0-9_.]+$/.test(form.username)) er.username = 'Lowercase letters, numbers, _ and . only';
    if (!form.email) er.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) er.email = 'Invalid email';
    if (!form.password) er.password = 'Required';
    else if (form.password.length < 6) er.password = 'Min 6 characters';
    if (form.password !== form.confirmPassword) er.confirmPassword = "Passwords don't match";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const goToFeed = (userId: string, email: string) => {
      // Manually set user in store so PublicRoute sees isAuthenticated=true immediately
      setUser({ id: userId, email });
      fetchProfile(userId);
      toast.success('Welcome to Connectify! 🎉');
      navigate('/feed', { replace: true });
    };

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { username: form.username.toLowerCase(), full_name: form.full_name } },
      });
      if (error) throw error;

      // Case 1: Session returned immediately (email confirmation OFF)
      if (data.session && data.user) {
        goToFeed(data.user.id, data.user.email!);
        return;
      }

      // Case 2: No session — try signing in right away
      if (data.user) {
        // Duplicate email check
        if (data.user.identities && data.user.identities.length === 0) {
          toast.error('An account with this email already exists.');
          return;
        }

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (!signInError && signInData.session && signInData.user) {
          goToFeed(signInData.user.id, signInData.user.email!);
          return;
        }
      }

      // Case 3: Email confirmation required
      setEmailSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#08080f' }}>
      <AnimatedBackground />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="g-card p-8 w-full max-w-[360px] text-center relative z-10">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>📧</div>
        <h2 className="text-xl font-black text-white mb-2">Check your email</h2>
        <p className="text-sm mb-1" style={{ color: '#a8a8d0' }}>We sent a confirmation link to</p>
        <p className="font-bold mb-5" style={{ color: '#a78bfa' }}>{form.email}</p>
        <div className="p-3 rounded-xl text-left mb-4" style={{ background: 'rgba(245,197,24,0.06)', border: '1px solid rgba(245,197,24,0.2)' }}>
          <p className="text-xs font-bold mb-1" style={{ color: '#f5c518' }}>⚡ Skip email confirmation</p>
          <p className="text-xs leading-relaxed" style={{ color: '#6060a0' }}>
            Supabase Dashboard → Authentication → Settings → Disable "Enable email confirmations"
          </p>
        </div>
        <Link to="/auth/login" className="btn-glow inline-block px-6 py-2 text-sm">Sign in instead</Link>
      </motion.div>
    </div>
  );

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
          <span className="brand" style={{ fontSize: 36, display: 'block', marginBottom: 12 }}>Connectify</span>
          <p className="text-sm leading-relaxed" style={{ color: '#a8a8d0' }}>
            Join millions of people sharing moments and building real connections.
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[360px] py-6">

          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="brand">Connectify</span>
          </div>

          <div className="g-card p-6">
            <h2 className="text-xl font-black text-white mb-1">Create account</h2>
            <p className="text-sm mb-5" style={{ color: '#6060a0' }}>
              Already have one?{' '}
              <Link to="/auth/login" className="font-bold hover:opacity-80" style={{ color: '#a78bfa' }}>Sign in</Link>
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-3">
              {/* Full name */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a8d0' }}>Full name</label>
                <input type="text" placeholder="Your full name" value={form.full_name} onChange={set('full_name')}
                  className={`c-input${errors.full_name ? ' err' : ''}`} autoComplete="name" />
                <ErrMsg msg={errors.full_name} />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a8d0' }}>Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none"
                    style={{ color: '#6060a0', pointerEvents: 'none' }}>@</span>
                  <input type="text" placeholder="username" value={form.username} onChange={set('username')}
                    className={`c-input${errors.username ? ' err' : ''}`}
                    style={{ paddingLeft: '28px' }}
                    autoComplete="username" />
                </div>
                <ErrMsg msg={errors.username} />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a8d0' }}>Email</label>
                <input type="email" placeholder="you@email.com" value={form.email} onChange={set('email')}
                  className={`c-input${errors.email ? ' err' : ''}`} autoComplete="email" />
                <ErrMsg msg={errors.email} />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a8d0' }}>Password</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password}
                    onChange={set('password')}
                    className={`c-input pr-10${errors.password ? ' err' : ''}`} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#6060a0' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <ErrMsg msg={errors.password} />
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#a8a8d0' }}>Confirm password</label>
                <input type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className={`c-input${errors.confirmPassword ? ' err' : ''}`} autoComplete="new-password" />
                <ErrMsg msg={errors.confirmPassword} />
              </div>

              <button type="submit" disabled={loading} className="btn-glow w-full h-[44px] mt-1">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Create account'}
              </button>

              <p className="text-center text-[11px]" style={{ color: '#404060' }}>
                By signing up you agree to our{' '}
                <a href="#" className="hover:underline" style={{ color: '#6060a0' }}>Terms</a> &amp;{' '}
                <a href="#" className="hover:underline" style={{ color: '#6060a0' }}>Privacy Policy</a>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
