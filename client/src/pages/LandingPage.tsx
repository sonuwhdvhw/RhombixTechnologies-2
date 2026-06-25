import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Globe, Users, MessageCircle, Heart, Star, ChevronDown } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

// ── Animated Counter ────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const id = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 25);
    return () => clearInterval(id);
  }, [inView, to]);
  const fmt = to >= 1_000_000 ? `${(val/1_000_000).toFixed(1)}M` : to >= 1_000 ? `${Math.round(val/1_000)}K` : val;
  return <span ref={ref}>{fmt}{suffix}</span>;
}

// ── Feature Card ────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }: {
  icon: React.ElementType; title: string; desc: string; color: string; delay: number;
}) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative group p-6 rounded-2xl overflow-hidden cursor-default"
      style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.95), rgba(250,248,255,0.9))', border: `1px solid ${color}20`, backdropFilter: 'blur(12px)' }}
      whileHover={{ y: -4, scale: 1.02 }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `radial-gradient(ellipse at top left, ${color}15, transparent 70%)` }} />
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 relative"
        style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon size={22} style={{ color }} />
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ boxShadow: `0 0 16px ${color}40` }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: '#0f0820' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#7060a0' }}>{desc}</p>
    </motion.div>
  );
}

// ── Testimonial ─────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Product Designer', img: 'https://i.pravatar.cc/64?img=1', text: 'Connectify completely changed how I interact online. The interface is stunning and the real-time features are incredible.' },
  { name: 'Marcus Kim', role: 'Software Engineer', img: 'https://i.pravatar.cc/64?img=3', text: 'Finally a platform that feels built by people who care about design. The 3D animations and daily news feed are genius.' },
  { name: 'Aiko Tanaka', role: 'Creative Director', img: 'https://i.pravatar.cc/64?img=5', text: 'Every micro-interaction feels satisfying. The trending feed keeps me updated without switching apps. Love it!' },
];

const FEATURES = [
  { icon: Zap,           title: 'Real-time Everything', desc: 'Instant notifications, live messaging, and feed updates powered by WebSockets.', color: '#6366f1' },
  { icon: Globe,         title: 'Daily Trending Feed',  desc: 'Auto-refreshing news from BBC, CNN, TechCrunch — no more switching apps.', color: '#06b6d4' },
  { icon: Heart,         title: '6 Emoji Reactions',    desc: 'Like, Love, Haha, Wow, Sad, Angry — express yourself with a long press.', color: '#ec4899' },
  { icon: MessageCircle, title: 'Live Chat',             desc: 'Real-time messaging with typing indicators, read receipts, and online status.', color: '#a78bfa' },
  { icon: Shield,        title: 'Privacy First',        desc: 'Row-level security, private accounts, and full content control.', color: '#10b981' },
  { icon: Users,         title: 'Smart Network',        desc: 'Friend suggestions based on mutual connections and shared interests.', color: '#f59e0b' },
];


export default function LandingPage() {
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.3 });

  return (
    <div style={{ background: '#faf8ff', color: '#0f0820', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(124,58,237,0.1)',
        boxShadow: '0 1px 16px rgba(124,58,237,0.06)',
      }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5">
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.5)' }}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
              <path d="M8 20C8 13.373 13.373 8 20 8s12 5.373 12 12-5.373 12-12 12S8 26.627 8 20z" stroke="#fff" strokeWidth="2.5"/>
              <path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Connectify</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3">
          <Link to="/auth/login" style={{ color: '#a8a8d0', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a8a8d0')}>Sign in</Link>
          <Link to="/auth/register" style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
            padding: '8px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            textDecoration: 'none', boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
          }}>Get started</Link>
        </motion.div>
      </nav>


      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', paddingTop: 64, background: 'linear-gradient(180deg, #f9fafb 0%, #eef2ff 45%, #eef2ff 100%)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(124,58,237,0.10), transparent 22%), radial-gradient(circle at 85% 25%, rgba(56,189,248,0.08), transparent 18%), radial-gradient(circle at 50% 75%, rgba(236,72,153,0.06), transparent 20%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(248,250,255,0.40))' }} />
        <div style={{ position: 'absolute', inset: '20% 10%', borderRadius: '30%', background: 'rgba(255,255,255,0.7)', filter: 'blur(80px)' }} />

        {/* Hero content */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
          style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 800, padding: '0 24px' }}>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, marginBottom: 24, background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 8px #7c3aed', display: 'inline-block' }} className="animate-pulse" />
            <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600 }}>Now live — Real-time social platform</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ fontSize: 'clamp(42px,8vw,90px)', fontWeight: 900, lineHeight: 1.0, marginBottom: 24, letterSpacing: '-2px' }}>
            <span style={{ color: '#0f0820' }}>Share Your</span><br />
            <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #0891b2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>World.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            style={{ fontSize: 18, color: '#6050a0', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Connect with friends, share life's moments, and stay updated with the world — all powered by real-time technology.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/auth/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700,
              color: '#fff', textDecoration: 'none',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.5)',
            }}>
              Create free account <ArrowRight size={18} />
            </Link>
            <Link to="/auth/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 14, fontSize: 16, fontWeight: 700,
              color: '#a8a8d0', textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
              Sign in
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', marginTop: 40 }}>
            <div style={{ display: 'flex' }}>
              {[1,2,3,4,5].map(i => (
                <img key={i} src={`https://i.pravatar.cc/32?img=${i+10}`}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #05050f', marginLeft: i > 1 ? -8 : 0 }} alt="" />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(i => <Star key={i} size={12} fill="#f59e0b" style={{ color: '#f59e0b' }} />)}</div>
              <span style={{ fontSize: 13, color: '#6060a0' }}><span style={{ color: '#fff', fontWeight: 700 }}>4.9</span> · Loved by 2,400+ users</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#404060', letterSpacing: 2, textTransform: 'uppercase' }}>Scroll</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown size={18} style={{ color: '#6060a0' }} />
          </motion.div>
        </motion.div>
      </section>


      {/* ── STATS ───────────────────────────────────────────── */}
      <section ref={statsRef} style={{ padding: '80px 24px', borderTop: '1px solid rgba(139,92,246,0.08)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {[
            { to: 2400000, label: 'Active Users', color: '#7c3aed', icon: '👥' },
            { to: 50000000, label: 'Posts Shared', color: '#db2777', icon: '📸' },
            { to: 180, label: 'Countries', color: '#0891b2', icon: '🌍', suffix: '+' },
            { to: 99.9, label: 'Uptime SLA', color: '#059669', icon: '⚡', suffix: '%' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 24 }} animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1 }}
              style={{ textAlign: 'center', padding: '28px 16px', borderRadius: 20, background: '#ffffff', border: `1px solid ${s.color}18`, boxShadow: `0 4px 24px ${s.color}10` }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 36, fontWeight: 900, background: `linear-gradient(135deg, ${s.color}, ${s.color}aa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
                {statsInView && <Counter to={s.to} suffix={s.suffix} />}
              </div>
              <p style={{ fontSize: 13, color: '#9585c5', marginTop: 4 }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
              Why Connectify
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, letterSpacing: -1 }}>
              <span style={{ color: '#fff' }}>Everything you need to</span>{' '}
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>connect</span>
            </motion.h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.08} />)}
          </div>
        </div>
      </section>


      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', background: '#f8f5ff' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, marginBottom: 48 }}>
            <span style={{ color: '#0f0820' }}>Loved by </span>
            <span style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>thousands</span>
          </motion.h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                style={{ padding: 24, borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124,58,237,0.1)', boxShadow: '0 4px 20px rgba(124,58,237,0.07)' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#f59e0b" style={{ color: '#f59e0b' }} />)}
                </div>
                <p style={{ fontSize: 14, color: '#6050a0', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.img} style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(139,92,246,0.4)' }} alt={t.name} />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0f0820' }}>{t.name}</p>
                    <p style={{ fontSize: 12, color: '#9585c5' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', padding: '64px 40px', borderRadius: 32, background: 'linear-gradient(145deg, #f5f0ff, #fdf2f8)', border: '1px solid rgba(124,58,237,0.15)', boxShadow: '0 8px 48px rgba(124,58,237,0.12)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.12)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(236,72,153,0.1)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Ready to join?</p>
            <h2 style={{ fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 16, color: '#0f0820', letterSpacing: -1 }}>
              Start your journey<br />
              <span style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777,#0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>on Connectify today</span>
            </h2>
            <p style={{ fontSize: 16, color: '#7070a0', marginBottom: 36, lineHeight: 1.6 }}>
              Join 2.4M+ people already sharing moments and building connections.
            </p>
            <Link to="/auth/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '16px 40px', borderRadius: 16, fontSize: 17, fontWeight: 800,
              color: '#fff', textDecoration: 'none',
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)',
              boxShadow: '0 8px 40px rgba(99,102,241,0.5)',
            }}>
              Create free account <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ padding: '24px', borderTop: '1px solid rgba(139,92,246,0.08)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 40 40" fill="none"><path d="M14 20l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 13, color: '#404060' }}>© 2025 Connectify. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Help', 'About'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#404060', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
              onMouseLeave={e => (e.currentTarget.style.color = '#404060')}>{l}</a>
          ))}
        </div>
      </footer>

      {/* CSS keyframes */}
      <style>{`
        @keyframes grad-shift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}
