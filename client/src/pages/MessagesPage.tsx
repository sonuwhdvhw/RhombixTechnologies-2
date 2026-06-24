import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { messagesApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { supabase } from '@/lib/supabase';
import { Conversation, Message, Profile } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';

function useOnlineUsers() {
  const [online, setOnline] = useState<Set<string>>(new Set());
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on('users:online', (u: string[]) => setOnline(new Set(u)));
    s.on('user:offline', (id: string) => setOnline(p => { const n = new Set(p); n.delete(id); return n; }));
    return () => { s.off('users:online'); s.off('user:offline'); };
  }, []);
  return online;
}

export default function MessagesPage() {
  const { partnerId } = useParams<{ partnerId?: string }>();
  const { user, profile } = useAuthStore();
  const online = useOnlineUsers();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [convsLoading, setConvsLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const scrollBottom = useCallback(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

  useEffect(() => {
    messagesApi.getConversations().then(({ data }) => setConvs(data.conversations || [])).finally(() => setConvsLoading(false));
  }, []);

  useEffect(() => {
    if (!partnerId) return;
    setMsgsLoading(true);
    const c = convs.find(x => x.partnerId === partnerId);
    if (c) setPartner(c.partner);
    messagesApi.getMessages(partnerId).then(({ data }) => { setMsgs(data.messages || []); setTimeout(scrollBottom, 100); }).finally(() => setMsgsLoading(false));
  }, [partnerId, convs.length]);

  useEffect(() => {
    const s = getSocket();
    if (!s || !user) return;
    s.on('message:received', (m: Message) => {
      if (m.sender_id === partnerId || m.receiver_id === partnerId) { setMsgs(p => [...p, m]); setTimeout(scrollBottom, 50); }
      setConvs(p => p.map(c => c.partnerId === m.sender_id ? { ...c, lastMessage: m } : c));
    });
    s.on('message:sent', (m: Message) => {
      // Replace optimistic temp message with real message from server
      setMsgs(p => {
        const hasReal = p.find(x => x.id === m.id);
        if (hasReal) return p;
        // Remove the most recent optimistic message (tmp-*) and add real one
        const withoutOptimistic = p.filter(x => !x.id.startsWith('tmp-'));
        return [...withoutOptimistic, m];
      });
      setTimeout(scrollBottom, 50);
    });
    s.on('typing:start', ({ userId }: { userId: string }) => { if (userId === partnerId) setPartnerTyping(true); });
    s.on('typing:stop', ({ userId }: { userId: string }) => { if (userId === partnerId) setPartnerTyping(false); });
    return () => { s.off('message:received'); s.off('message:sent'); s.off('typing:start'); s.off('typing:stop'); };
  }, [user?.id, partnerId]);

  useEffect(() => {
    if (!user || !partnerId) return;
    const ch = supabase.channel(`dm:${user.id}:${partnerId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
        const m = payload.new as Message;
        if (m.sender_id === partnerId) { setMsgs(p => p.find(x => x.id === m.id) ? p : [...p, m]); setTimeout(scrollBottom, 50); }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, partnerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !partnerId || !user) return;
    setSending(true);
    const opt: Message = { id: `tmp-${Date.now()}`, sender_id: user.id, receiver_id: partnerId, content: newMsg.trim(), read: false, created_at: new Date().toISOString(), sender: profile as Profile };
    setMsgs(p => [...p, opt]); setNewMsg(''); setTimeout(scrollBottom, 50);
    const s = getSocket();
    if (s?.connected) {
      s.emit('message:send', { senderId: user.id, receiverId: partnerId, content: opt.content });
    } else {
      try { const { data } = await messagesApi.send(partnerId, opt.content); setMsgs(p => p.map(m => m.id === opt.id ? data.message : m)); }
      catch { setMsgs(p => p.filter(m => m.id !== opt.id)); }
    }
    setSending(false);
  };

  const handleTyping = (v: string) => {
    setNewMsg(v);
    const s = getSocket();
    if (!s || !user || !partnerId) return;
    s.emit('typing:start', { senderId: user.id, receiverId: partnerId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => s.emit('typing:stop', { senderId: user.id, receiverId: partnerId }), 2000);
  };

  const isOnline = partnerId ? online.has(partnerId) : false;

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', marginLeft: 0 }}>
      {/* Conversations list */}
      <div className={cn('flex flex-col border-r', !partnerId ? 'w-full' : 'w-full md:w-[300px] hidden md:flex')}
        style={{ borderColor: 'rgba(124,58,237,0.1)', background: 'rgba(255,255,255,0.9)' }}>
        <div className="px-4 py-4" style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
          <h1 className="font-bold text-base flex items-center gap-2" style={{ color: '#0f0820' }}>
            <MessageCircle size={18} style={{ color: '#7c3aed' }} /> Messages
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {convsLoading ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="skel w-11 h-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2"><div className="skel h-3 w-28" /><div className="skel h-2.5 w-40" /></div>
            </div>
          )) : convs.length === 0 ? (
            <div className="py-16 text-center"><p className="text-sm" style={{ color: '#9585c5' }}>No conversations yet</p></div>
          ) : convs.map(c => (
            <Link key={c.partnerId} to={`/messages/${c.partnerId}`}
              className="flex items-center gap-3 px-4 py-3 transition-all"
              style={{ background: partnerId === c.partnerId ? 'rgba(124,58,237,0.06)' : 'transparent', borderLeft: partnerId === c.partnerId ? '3px solid #7c3aed' : '3px solid transparent' }}
              onMouseEnter={e => { if (partnerId !== c.partnerId) e.currentTarget.style.background = 'rgba(124,58,237,0.03)'; }}
              onMouseLeave={e => { if (partnerId !== c.partnerId) e.currentTarget.style.background = 'transparent'; }}>
              <div className="relative shrink-0">
                <Avatar src={c.partner.avatar_url} name={c.partner.full_name || c.partner.username} size="md" />
                {online.has(c.partnerId) && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#10b981' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0f0820' }}>{c.partner.full_name || c.partner.username}</p>
                  <span className="text-[11px] shrink-0 ml-2" style={{ color: '#9585c5' }}>{formatRelativeTime(c.lastMessage.created_at)}</span>
                </div>
                <p className="text-xs truncate max-w-[160px]" style={{ color: '#9585c5' }}>
                  {c.lastMessage.sender_id === user?.id && 'You: '}{c.lastMessage.content}
                </p>
              </div>
              {c.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ background: '#7c3aed' }}>{c.unreadCount}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className={cn('flex-1 flex flex-col', !partnerId ? 'hidden md:flex' : 'flex')}
        style={{ background: '#faf8ff' }}>
        {!partnerId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto mb-4" style={{ color: '#ede9fe' }} />
              <p style={{ color: '#9585c5' }}>Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(124,58,237,0.08)', backdropFilter: 'blur(12px)' }}>
              <Link to="/messages" className="md:hidden mr-1" style={{ color: '#9585c5' }}><ArrowLeft size={20} /></Link>
              {partner && (
                <>
                  <div className="relative">
                    <Avatar src={partner.avatar_url} name={partner.full_name || partner.username} size="md" />
                    {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#10b981' }} />}
                  </div>
                  <div>
                    <Link to={`/profile/${partner.username}`}>
                      <p className="text-sm font-bold hover:opacity-70 transition-opacity" style={{ color: '#0f0820' }}>{partner.full_name || partner.username}</p>
                    </Link>
                    <p className="text-xs" style={{ color: partnerTyping ? '#7c3aed' : isOnline ? '#10b981' : '#9585c5' }}>
                      {partnerTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {msgsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={cn('flex gap-2 max-w-[70%]', i % 2 === 0 ? '' : 'ml-auto flex-row-reverse')}>
                    <div className="skel w-6 h-6 rounded-full shrink-0" />
                    <div className={cn('skel h-10 rounded-2xl', i % 3 === 0 ? 'w-48' : 'w-32')} />
                  </div>
                ))
              ) : msgs.length === 0 ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <p className="text-sm text-center" style={{ color: '#9585c5' }}>Start a conversation ✨</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {msgs.map(m => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        className={cn('flex gap-2 items-end max-w-[80%]', mine ? 'ml-auto flex-row-reverse' : '')}>
                        {!mine && <Avatar src={partner?.avatar_url} name={partner?.username} size="xs" />}
                        <div>
                          <div className={mine ? 'bubble-me' : 'bubble-them'}>{m.content}</div>
                          <p className={cn('text-[11px] mt-0.5 px-1', mine ? 'text-right' : '')} style={{ color: '#9585c5' }}>
                            {formatRelativeTime(m.created_at)}{mine && ` ${m.read ? '✓✓' : '✓'}`}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              {/* Typing indicator */}
              <AnimatePresence>
                {partnerTyping && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2">
                    <Avatar src={partner?.avatar_url} name={partner?.username} size="xs" />
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm" style={{ background: '#f5f3ff', border: '1px solid rgba(124,58,237,0.12)' }}>
                      <div className="flex gap-1 items-center">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#a78bfa' }}
                            animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, delay: i*0.1, repeat: Infinity }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.92)', borderTop: '1px solid rgba(124,58,237,0.08)', backdropFilter: 'blur(12px)' }}>
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.username} size="sm" />
                <div className="flex-1 relative">
                  <input type="text" placeholder="Message..." value={newMsg} onChange={e => handleTyping(e.target.value)}
                    className="c-input pr-10" maxLength={1000} aria-label="Type a message" />
                  <button type="submit" disabled={!newMsg.trim() || sending}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-30"
                    style={{ color: '#7c3aed' }}>
                    {sending ? <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(124,58,237,0.2)', borderTopColor: '#7c3aed' }} />
                      : <Send size={16} />}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
